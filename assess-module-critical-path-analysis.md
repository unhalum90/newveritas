# Assess Module (Summative Assessment) - Critical Path Analysis

**Date:** January 7, 2026  
**Module:** Summative Assessment (`/student/assessments/[id]`)

---

## Executive Summary

This document analyzes the current sequence for the Assess Module's audio recording flow and identifies what services are on the critical path. The goal is to determine what can be moved off-path and what can be precomputed to improve student experience.

---

## Current Sequence: Audio Upload → STT → Follow-up → Summary

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT ASSESSMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
 │   RECORD    │────▶│ AUDIO UPLOAD │────▶│  STT + AI     │────▶│   SUBMIT    │
 │   PHASE     │     │              │     │  PROCESSING   │     │   PHASE     │
 └─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
       │                    │                    │                     │
       ▼                    ▼                    ▼                     ▼
  beginRecording()    POST /responses       (CRITICAL PATH)      POST /submit
  (MediaRecorder)     recorder.onstop()     in onstop handler   scoreSubmission()
                                                                 (background)
```

---

## Critical Path Analysis (Per Question)

### Synchronous Operations on Audio Upload

The following operations block the student from proceeding after recording each question. These occur in `/api/student/submissions/[id]/responses/route.ts`:

| Step | Operation | Service | Code Location | Blocking? | Latency Estimate |
|------|-----------|---------|---------------|-----------|------------------|
| 1 | Auth + Validation | Supabase | route.ts L77-170 | ✅ Yes | ~50-100ms |
| 2 | **Audio Upload to Storage** | Supabase Storage | route.ts L243-247 | ✅ Yes | ~200-500ms |
| 3 | **STT (Transcription)** | OpenAI Whisper | route.ts L253-263 | ✅ Yes* | **~2-5s** |
| 4 | **Follow-up Generation** | OpenAI GPT-4o-mini | route.ts L265-275 | ✅ Yes* | **~1-3s** |
| 5 | **Off-Topic Detection** | OpenAI GPT-4o-mini | route.ts L295-307 | ✅ Yes** | **~1-2s** |
| 6 | DB Insert | Supabase | route.ts L325-339 | ✅ Yes | ~50-100ms |
| 7 | Update followup question | Supabase | route.ts L341-350 | ✅ Yes | ~50ms |
| 8 | Return response to client | - | route.ts L367-373 | ✅ Yes | - |

*\* Only when `shouldGenerateFollowup` is true (audio-followup question type)*  
*\*\* Only when `canEvaluateRestart` is true (grace restart enabled)*

### Total Critical Path Latency

**~4-10 seconds per question** (when audio-followup is enabled)

---

## Services on Critical Path

```
                    ┌──────────────────────────────────────────┐
                    │          CRITICAL PATH SERVICES          │
                    │        (Blocks student progression)      │
                    └──────────────────────────────────────────┘

    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   SUPABASE      │   │   OPENAI        │   │   OPENAI        │
    │   STORAGE       │   │   WHISPER       │   │   GPT-4o-mini   │
    │   (Upload)      │   │   (STT)         │   │   (Follow-up)   │
    └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
             │                     │                     │
             │    ~200-500ms       │      ~2-5s          │     ~1-3s
             │                     │                     │
             └─────────────────────┴─────────────────────┘
                                   │
                                   ▼
                         (optional, for grace restart)
                    ┌─────────────────────────────────────┐
                    │   OPENAI GPT-4o-mini (Off-Topic)   │
                    │            ~1-2s                    │
                    └─────────────────────────────────────┘
```

### Service Breakdown

| Service | Purpose | API Endpoint | Model |
|---------|---------|--------------|-------|
| Supabase Storage | Audio file storage | `storage.upload()` | N/A |
| OpenAI Whisper | Speech-to-text transcription | `/v1/audio/transcriptions` | `whisper-1` |
| OpenAI GPT-4o-mini | Follow-up question generation | `/v1/chat/completions` | `gpt-4o-mini-2024-07-18` |
| OpenAI GPT-4o-mini | Off-topic detection | `/v1/chat/completions` | `gpt-4o-mini-2024-07-18` |

---

## Submit Phase (Already Off Critical Path)

When the student submits, `scoreSubmission()` runs **asynchronously** in the background via `lib/scoring/submission.ts`:

| Step | Operation | Service | Blocking Student? |
|------|-----------|---------|-------------------|
| 1 | Re-transcribe (if missing) | OpenAI Whisper | ❌ No |
| 2 | Score with GPT | OpenAI GPT-4/5 | ❌ No |
| 3 | Optional Gemini review | Gemini | ❌ No |
| 4 | Reconcile scores | Local | ❌ No |
| 5 | Store scores | Supabase | ❌ No |

**✅ This is already properly off the critical path** – the student sees "Submitted" immediately.

---

## Recommendations

### 1. Move Off Critical Path (Async Queue / Background Job)

| Item | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **STT (Transcription)** | Synchronous, blocks student | Move to background queue. Store audio immediately, return to student, transcribe async | 🔴 High |
| **Follow-up Generation** | Synchronous, blocks student | Move to background job. Poll from client or use WebSocket/SSE | 🔴 High |
| **Off-Topic Detection** | Synchronous, blocks student | Move to background. Surface restart hint via polling | 🟡 Medium |

### 2. Already Optimized (No Changes Needed)

| Item | Status |
|------|--------|
| Question text loading | ✅ Loaded per-question efficiently |
| Rubric instructions | ✅ Loaded at scoring time, not on critical path |
| Fallback follow-up question | ✅ Already hardcoded: *"Tell me one more detail about your reasoning."* |
| Scoring after submit | ✅ Already runs in background |

### 3. Proposed Optimistic UI Pattern

```
                    ┌──────────────────────────────────────────┐
                    │          PROPOSED OPTIMISTIC FLOW        │
                    └──────────────────────────────────────────┘

    Student records → UI shows "Processing..." → Move to next question
                            ↓
                    [Background: Upload → STT → Follow-up → Off-topic]
                            ↓
                    Client polls or WebSocket pushes follow-up prompt
                            ↓
                    Student records follow-up when ready
```

---

## Implementation Quick Wins

### Code Changes Required

1. **Return immediately after storage upload** (line 247) with a `processing: true` flag
2. **Queue the AI calls** (lines 253-308) via:
   - Supabase Edge Functions
   - Inngest
   - Simple job table with worker
3. **Client polls `/api/student/submissions/[id]/responses`** every 1-2s until `ai_followup_question` is populated
4. **Fallback timeout**: If transcription takes >10s, use the default follow-up

### Expected Improvement

| Metric | Current | Projected |
|--------|---------|-----------|
| Time to proceed after recording | 4-10s | <1s |
| Perceived latency | High | Low (with spinner) |
| Student frustration | Higher on slow connections | Minimal |

---

## Key Files Referenced

| File | Purpose |
|------|---------|
| `src/app/student/assessments/[id]/student-assessment-client.tsx` | Client-side assessment UI |
| `src/app/api/student/submissions/[id]/responses/route.ts` | Audio upload + AI processing |
| `src/app/api/student/submissions/[id]/submit/route.ts` | Submission handler |
| `src/lib/scoring/submission.ts` | Background scoring logic |
| `src/lib/ai/audio-followup.ts` | STT + Follow-up generation |
| `src/lib/ai/off-topic.ts` | Off-topic detection |

---

## Next Steps

1. Review this analysis with the engineering team
2. Decide on background job infrastructure (Edge Functions, Inngest, etc.)
3. Implement optimistic UI pattern
4. Add polling/WebSocket for follow-up delivery
5. Test with production-like latencies

---

*Generated from codebase analysis on January 7, 2026*


Follow up - edits

Read /mnt/data/assess-module-critical-path-analysis.md. The direction in the doc is correct: the “herky jerky” feeling comes from keeping upload → STT → follow-up generation on the same synchronous request/UX path. The fix is a system setup where the UI can advance immediately and the follow-up arrives asynchronously, reliably, and quickly.

Recommended system setup for smooth summative follow-ups

Target UX (turn-based, but feels continuous)
	•	Student finishes speaking → immediate advance to “Processing / Next question ready”
	•	Follow-up appears 1–4 seconds later (streamed text), without blocking navigation
	•	If follow-up is slow, the student is still not stuck (they can continue; you can enforce “follow-up required before submit” later if needed)

Architecture

Components
	1.	Client (Next.js)

	•	Records audio
	•	Uploads audio to Supabase Storage
	•	Writes a DB record immediately (response_turn with status = processing)
	•	Subscribes to DB changes (Supabase Realtime) or polls

	2.	API route / Edge Function (fast)

	•	Validates attempt + permissions
	•	Creates a “job” row and returns immediately (processing: true)

	3.	Background worker / job runner

	•	Inngest (recommended) or Supabase Edge Functions + queue pattern
	•	Runs:
	•	STT
	•	Follow-up selection + generation (deterministic types, capped)
	•	Optional integrity/off-topic checks
	•	Writes results back to DB and triggers realtime update

	4.	Realtime delivery

	•	Supabase Realtime subscription on response_turns or question_attempts
	•	When status flips to ready, client renders follow-up card instantly

Data model (minimum)

You likely already have parts of this; the key is “turn + job status.”
	•	question_attempts
	•	id, assessment_attempt_id, question_id, state
	•	followup_required boolean
	•	followup_max int (e.g., 2)
	•	response_turns
	•	id, question_attempt_id, turn_index
	•	audio_path, transcript
	•	role = student|ai
	•	status = processing|ready|error
	•	followup_type, evidence_quote (for AI follow-up turns)
	•	ai_jobs
	•	id, response_turn_id, job_type (stt, followup)
	•	status, attempts, started_at, finished_at, error

Critical: make jobs idempotent (if a request retries, it should not create duplicate turns).

Critical-path cuts (what must be async)

Move off the blocking path:
	•	STT
	•	Follow-up generation
	•	Off-topic detection
	•	Any scoring/summaries

Keep on the fast path:
	•	Storage upload
	•	Insert response_turn record (processing)
	•	Return to UI

Follow-up engine that is fast and defensible

To get both low latency and higher-ed credibility:

Deterministic follow-up types (whitelist)

clarify | justify | transfer | counterexample | citation_check

Required structured output

Force the model to return:
	•	followup_type
	•	evidence_quote (verbatim from transcript)
	•	followup_question (<= 1–2 sentences)

If it cannot produce an evidence_quote, it must fall back to a neutral clarifier.

Precompute candidates (reduces latency further)

At question reveal, generate 3–6 generic follow-up candidates (no transcript yet) and store them.
After STT finishes, run a tiny “select + tailor” step using the transcript.

Latency hiding (so it doesn’t feel jerky)
	•	Stream the follow-up text as it’s generated (even if it’s short)
	•	Show a predictable state:
	•	“Generating follow-up (1/2)…”
	•	If it takes too long (e.g., >6–8s), show a safe fallback follow-up immediately (your doc mentions you already have one)

Reliability: refresh/tab close behavior

For summative, assume refresh happens.
	•	Persist each completed turn immediately.
	•	On reload, resume from last_completed_turn.
	•	If refresh happens mid-recording, only that in-progress audio is lost.

Minimal “done” criteria for the setup
	•	After a student submits an answer, the UI unblocks in <300ms after upload completes.
	•	Follow-up arrives asynchronously and renders without page reload.
	•	Follow-up is always one of the allowed types and always includes a transcript quote (or uses safe fallback).
	•	Jobs retry safely without duplicating turns.

