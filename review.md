# SayVeritas — Assessment-Level Analysis (Class Report) Master Spec
**Feature name:** Assessment Analysis Report (AAR)  
**Also known as:** Class Analysis Report (CAR)  
**Primary user:** Teacher (and optionally instructional coach / department lead)  
**Scope (V1):** Single assessment → class-level patterns + action suggestions, grounded in evidence

---

## 1) Why this exists
SayVeritas already saves teacher time through consistent per-student scoring. The AAR adds the second “unfair advantage”: converting *a full class of oral responses* into **instructional intelligence** that helps teachers:
- See **what to reteach**, not just who struggled
- Detect **misconceptions** and reasoning gaps quickly
- Evaluate **prompt quality** and rubric alignment
- Turn findings into **immediate, teacher-controlled actions**
- Export/share results for PLCs, coaching, and documentation

**North star:** Prefer actionable patterns over clever summaries. Always show the “why” and the evidence. Keep a clear line between measured (scores, distributions) and inferred (themes, misconceptions). When in doubt, label uncertainty and recommend collecting more data.

---

## 2) Pedagogical & safety guardrails (non-negotiable)
### 2.1 Formative-first (not judgment-first)
- The report is **formative** by default (reteach targets, next-steps).
- Avoid ranking students publicly; emphasize instructional moves.

### 2.2 Evidence-linked credibility
- Any inferred claim must include **evidence references** (transcript excerpt IDs + audio timestamps).
- Teachers must be able to click “View evidence” to verify.

### 2.3 No “emotion from voice” inference
- Do **not** infer emotion, motivation, attitude, or intent from prosody/tone.
- Replace “sentiment analysis” language with **Engagement & Uncertainty Indicators (content-based)** (see §6.4).

### 2.4 Bias & fairness
- Guard against accent, dialect, and multilingual interference being misread as “low ability.”
- If ASR confidence is low or language mixing is high, show a **data quality warning** and downweight LLM inference.

### 2.5 Insufficient data thresholds
- < 8 responses: **metrics only**, no LLM claims.
- 8–14: LLM enabled, but **low-confidence default** + stronger warnings.
- 15+: full report.

---

## 3) V1 user stories
1) **Generate report**  
As a teacher, after scoring submissions, I click “Generate Assessment Report” to see class-level patterns.

2) **Verify insights**  
As a teacher, I can open the evidence behind an insight (excerpt + audio clip) before acting.

3) **Take action**  
As a teacher, I can accept/customize/dismiss suggested actions and optionally create follow-up tasks.

4) **Export/share**  
As a teacher, I can export a PDF (and later share with PLC/admin with privacy controls).

---

## 4) UX requirements (teacher-facing)
### 4.1 Staged reveal (recommended)
**Phase A (fast):** Basic metrics render quickly (deterministic).  
**Phase B (slower):** Advanced insights appear when LLM completes.

**UX flow:**
1. Teacher clicks **Generate Report**
2. Within ~10 seconds: “Basic metrics ready” + visible dashboard
3. Within ~45–60 seconds: “Advanced insights ready” + refresh/auto-update

### 4.2 Scan time
- Report should be scannable in **3–5 minutes**.
- Default expanded sections: **Misconceptions** and **Suggested Actions**.

### 4.3 Clear separation of “Measured” vs “Suggested”
UI labels:
- **Measured:** distributions, rates, averages (deterministic)
- **Inferred insights:** LLM claims with confidence + evidence links
- **Suggested actions:** clearly marked as suggestions; teacher can accept/customize/dismiss

### 4.4 Privacy-by-design
- Student names display based on permission context.
- Default report uses **pseudonyms** (e.g., Student A, Student B) with optional teacher-only reveal.

---

## 5) Data model & storage (backend)
> This master spec merges both specs. Implementations can keep the existing `class_analysis_reports` naming or migrate to a more general `assessment_analysis_reports`.

### 5.1 Tables
#### A) `assessment_analysis_reports` (or `class_analysis_reports`)
Core fields:
- `id` (uuid)
- `assessment_id`, `teacher_id`, `class_id`
- `generated_at`
- `status` (processing|complete|failed)
- `student_count`, `completion_rate`
- Summary metrics: `avg_reasoning_score`, `avg_evidence_score`, `avg_response_length_seconds`
- JSONB payloads:
  - `data_quality`
  - `rubric_distributions`
  - `misconceptions`
  - `reasoning_patterns`
  - `evidence_patterns`
  - `engagement_indicators` (content-based)
  - `question_effectiveness`
  - `suggested_actions`
  - `evidence_index` (or separate table)
- `raw_ai_analysis` (text) for audit
- `processing_time_seconds`, `ai_model_version`

#### B) `assessments` updates
- `has_class_report` boolean
- `latest_report_id` uuid FK
- `scores_last_modified_at` timestamp (to warn on stale report)

#### C) Evidence indexing (recommended)
Option 1 (simpler): JSONB field `evidence_index` in the report.  
Option 2 (scalable): Separate table `report_evidence_refs` to support fast lookup and UI drill-down.

### 5.2 Evidence reference object (canonical)
```json
{
  "claim_id": "misconception_1",
  "evidence_refs": [
    {
      "submission_id": "uuid",
      "excerpt_id": "ex_004",
      "start_ms": 12000,
      "end_ms": 19500,
      "transcript_text": "…",
      "asr_confidence": 0.92
    }
  ]
}
```

---

## 6) Deterministic analytics layer (Phase A — always runs)
These metrics are explainable, fast, and safe. They also **prime** the LLM with reliable signals.

### 6.1 Coverage & completion
- completion rate
- missing submissions list
- average response length (and distribution)
- transcript quality (mean ASR confidence, missing transcript rate)

### 6.2 Rubric distributions
Per-criterion:
- mean/median
- % at each level
- “watch list” criteria (e.g., >30% below threshold)

### 6.3 Item analysis (question effectiveness proxies)
- **Item difficulty**: normalized mean score (0–1)
- **Item discrimination**: correlation between item score and total score (or overall rubric aggregate)
- Flags:
  - difficulty > 0.90 → too easy
  - difficulty < 0.30 → too hard
  - discrimination < 0.20 → not differentiating

### 6.4 Engagement & uncertainty indicators (content-based)
Replace “sentiment” with observable transcript signals:
- Hedging/uncertainty markers frequency (“I think”, “maybe”, “not sure”)
- Off-topic rate (semantic similarity to prompt below threshold)
- Very short responses (below minimum seconds/words)
- Self-reported confidence (if collected explicitly)

**Explicit note shown in UI:** Indicators inferred from transcript content only, not voice tone.

---

## 7) LLM synthesis layer (Phase B — runs after Phase A passes thresholds)
### 7.1 Inputs
- Assessment metadata (prompt, rubric, standards tags)
- Deterministic metrics (Phase A output)
- Student-level artifacts (transcripts, rubric scores, optional teacher notes)
- Evidence chunks (excerpted, not full raw if token pressure)

### 7.2 Outputs (must be structured JSON + validated)
1) **Misconceptions (2–5 max)**  
Each includes: description, prevalence, root cause hypothesis, confidence, evidence refs, and “teacher-friendly explanation”.

2) **Reasoning & evidence patterns**  
How students justify claims, common missing steps, citation specificity, etc.

3) **Question effectiveness narrative**  
Interpret deterministic psychometric proxies + propose revisions.

4) **Suggested actions (teacher-controlled)**  
- Whole-class reteach move(s)
- Small-group interventions
- Extension/enrichment prompts
- Follow-up assessment idea

### 7.3 Constraints on LLM behavior
- No student-level sensitive inferences (motivation, emotion, medical).
- Do not name students unless explicitly permitted; default to pseudonyms.
- Do not create claims without evidence refs.
- If <20% prevalence, do not label as “common misconception” (unless teacher toggles “include smaller patterns”).

### 7.4 Confidence rubric (simple and visible)
- **High:** multiple evidence refs + strong deterministic alignment
- **Medium:** evidence refs present but borderline prevalence/quality
- **Low:** limited evidence or transcript confidence issues

---

## 8) APIs & processing pipeline
### 8.1 Endpoints
- `POST /api/assessments/:id/generate-report` (202 accepted)
- `GET /api/assessment-reports/:reportId` (status + payload)
- `GET /api/assessment-reports/:reportId/export-pdf`
- Optional: `POST /api/assessment-reports/:reportId/regenerate`

### 8.2 Job steps
1) Aggregate submissions and scoring artifacts
2) Run Phase A deterministic analytics
3) Apply data-quality thresholds and decide whether Phase B runs
4) If Phase B runs:
   - build prompt with Phase A summary + excerpts
   - run LLM
   - validate schema
   - attach evidence refs
5) Store report + update assessment pointers

### 8.3 Failure modes & fallbacks
- LLM fails: Phase A still shown + “Advanced insights unavailable; regenerate”
- Low response count: show metrics only + warnings
- Stale report: show banner if scores changed post-generation

---

## 9) UI sections (V1)
> Default expanded: Misconceptions + Suggested Actions

### 9.1 Summary header
- Data quality badge (GOOD / LIMITED)
- Completion rate
- Average scores
- “Generate/Regenerate” controls
- Export PDF

### 9.2 Measured metrics
- Rubric distributions (simple charts)
- Response length distribution
- Transcript quality indicators

### 9.3 Misconceptions (evidence-linked)
Card format:
- Claim
- Prevalence
- Confidence
- **View evidence** (opens excerpt list + audio clips)
- Optional: standard tag

### 9.4 Reasoning & evidence patterns
- What strong answers did
- Most common missing elements
- Citation specificity patterns

### 9.5 Engagement & uncertainty indicators (content-based)
- Only transcript-based proxies with explanatory note

### 9.6 Question effectiveness
- Difficulty/discrimination + interpretation
- Prompt/rubric revision suggestion

### 9.7 Suggested actions (teacher-controlled)
Each action has:
- Suggested action text
- Estimated time (optional)
- Buttons: **Accept** / **Customize** / **Dismiss**
- (V1) Accept saves to a “Teacher Notes” area; (V1.1) Accept can create follow-up assignment template.

---

## 10) Exports (PDF)
- Professional printable format (A4/Letter configurable)
- Page 1: executive summary + top misconceptions + top actions
- Page 2+: detailed sections
- Footer: generated date + confidentiality note

Implementation: server-side HTML → PDF rendering; cache generated PDF for 24h.

---

## 11) Human-in-the-loop feedback (planned V1.1)
Per claim:
- “Accurate” / “Inaccurate” / “Partially”
- Optional note: “What’s wrong?”
Store as structured feedback for prompt refinement and evaluation.

Schema now (so adding UI later is easy):
- `report_claim_feedback` table with `report_id`, `claim_id`, `rating`, `note`, `created_at`, `teacher_id`

---

## 12) Rollout plan & sprints
### Sprint 1 — Foundation (metrics + schema + basic UI)
**Deliver:**
- DB tables + migrations
- Phase A deterministic metrics service
- Generate/report endpoints (processing status)
- Basic report UI: summary + measured metrics + data quality badge
- Stale report banner (scores updated)

**DoD:**
- Generate report for 1 assessment end-to-end (metrics only) in <15s for 30 students
- Data quality thresholds enforced
- Unit + integration tests for pipeline

### Sprint 2 — LLM insights + evidence drill-down
**Deliver:**
- Phase B LLM synthesis with structured JSON schema validation
- Evidence linking + excerpt index
- Misconception cards with “View evidence” drill-down (transcript + audio timestamps)
- Suggested actions section with accept/customize/dismiss (stored as teacher notes)

**DoD:**
- All LLM claims include evidence refs
- LLM disabled for <8 responses
- Report generation completes in <60s for 30 students (typical)

### Sprint 3 — Polish + export + operational hardening
**Deliver:**
- PDF export + caching
- Regenerate flow + versioning
- Monitoring dashboards (latency, failures, cost)
- Feature flag + pilot release tooling

**DoD:**
- PDF export matches UI content and is printable
- Regeneration creates new version; old version retained
- Error states are actionable and logged

---

## 13) Open questions (decide during implementation)
1) What’s the canonical “total score” for discrimination: rubric sum, weighted sum, or teacher-defined?
2) How do we chunk transcripts for evidence excerpts (sentence-based, semantic segmentation, or ASR time-aligned segments)?
3) Do we support multilingual transcripts within one assessment? If yes, how do we label/handle code-switching?
4) What permissions model for coaches/admins viewing reports across teachers/classes?

---

## Appendix A — Canonical structured output schema (outline)
Top-level:
- `data_quality`
- `summary_metrics`
- `rubric_distributions`
- `misconceptions[]` (each has `claim_id`, `claim`, `prevalence`, `confidence`, `evidence_refs[]`)
- `reasoning_patterns`
- `evidence_patterns`
- `engagement_indicators`
- `question_effectiveness`
- `suggested_actions[]`
