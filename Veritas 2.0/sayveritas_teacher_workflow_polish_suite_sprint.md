# SayVeritas Teacher Workflow Polish Suite (Feedback Snippets, Voice Feedback, Smart Sampling, Exceptions) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Add “premium feel” workflow accelerators that drive adoption and reduce teacher friction:
- **Feedback snippet library** (by rubric dimension; reusable, customizable)
- **Voice feedback shortcuts** (quick audio comments, optional)
- **Smart sampling for coaching/admin QA** (representative evidence selection)
- **Exception handling UX** (noise, missing audio, re-submits, late policies)

Non-goals (for this release):
- Full instructional coaching platform
- AI-generated grades as the final authority (keep teacher in control)
- Complex multi-rater moderation workflows (can be later)

## REVIEW NOTES
- Teacher results/scoring UI supports rubric scores, text feedback (`teacher_comment`), release to students, and CSV export.
- Grace restart + integrity flags exist for student attempts (restart events, integrity events) but no teacher-driven resubmit workflow or late policy rules yet.
- No feedback snippet library, voice feedback, or smart sampling features found.

---

## Epic
**As a teacher and school leader**, I want fast, consistent feedback and clean exception handling so oral assessment is sustainable at scale and quality stays high.

---

## User Stories

## A) Feedback Snippet Library

### Story A1 — Personal snippet library (teacher)
**As a Teacher**, I can create and reuse feedback snippets so I can give consistent feedback quickly.

**Acceptance Criteria**
- Teacher can create snippets with:
  - title
  - body text (multi-line)
  - tags (rubric dimension, standard, “pronunciation”, “evidence”, etc.)
  - language (if multilingual app)
- Snippets can be:
  - personal (default)
  - shared to school library (if permitted)
- Snippets support variables:
  - `{student_first_name}` (optional)
  - `{assignment_title}`
- Snippets can be searched and filtered during scoring.

---

### Story A2 — Dimension-linked quick insert (scoring UI)
**As a Teacher**, I can insert a snippet directly from the rubric dimension panel so feedback is aligned to scoring.

**Acceptance Criteria**
- In scoring UI, each rubric dimension has a “Add feedback” area with:
  - quick snippet suggestions tagged to that dimension
  - one-click insert into the feedback field
- Teacher can edit inserted text before saving.
- System stores:
  - final feedback text
  - optional “dimension feedback” structure (v1.5) vs single overall feedback (v1).

---

### Story A3 — School/district shared snippet packs (admin)
**As a School Admin**, I can publish shared snippet packs so teachers have consistent language and expectations.

**Acceptance Criteria**
- Admin can create “Snippet Pack”:
  - name
  - target course/grade tags
  - included snippets
- Packs can be assigned to:
  - whole school
  - departments (optional v2)
- Teachers can adopt a pack and customize their personal copies.
- Versioning:
  - updating a pack publishes v2; teachers are notified and can opt-in to updates (no forced overwrite).

---

## B) Voice Feedback Shortcuts

### Story B1 — Quick audio feedback (teacher)
**As a Teacher**, I can record a short voice feedback clip to save time and add warmth/personalization.

**Acceptance Criteria**
- Teacher can record audio feedback in scoring UI:
  - max duration configurable (e.g., 30–60s)
  - waveform + re-record
- Audio feedback is stored and linked to the attempt evidence.
- Student can play audio feedback (if student portal enabled).
- Policy controls:
  - tenant can disable audio feedback
  - retention policy applies to teacher feedback audio.

---

### Story B2 — “Feedback macros” combining text + audio (optional)
**As a Teacher**, I can attach a snippet and optionally add a short audio note to clarify the next step.

**Acceptance Criteria**
- Teacher inserts snippet, then optionally records audio, and saves both.
- UI indicates both are present.
- Export evidence pack includes both (policy-based).

---

## C) Smart Sampling for Coaching / QA

### Story C1 — Generate representative sample set (admin/coach)
**As a School Admin or Coach**, I can generate a representative sample of attempts for a class/teacher to review quality and consistency without reviewing everything.

**Acceptance Criteria**
- Admin selects scope:
  - teacher, class, date range, assignment
- System generates sample set based on rules (v1):
  - include a mix of high/mid/low scores
  - include a mix of standards/dimensions (if tagged)
  - include revised scores (if any) as a separate bucket
- Sample size configurable (e.g., 10–30).
- Admin can lock the sample set and assign to a coach/reviewer.
- Student identity visibility respects anonymity setting (optional).

---

### Story C2 — Coaching review workflow (coach)
**As a Coach/Reviewer**, I can review the sample set, leave notes, and mark items for discussion.

**Acceptance Criteria**
- Reviewer can:
  - listen to audio
  - view transcript (if present)
  - view rubric + teacher feedback
  - leave a private note per item
  - tag as “exemplar” or “needs discussion”
- Notes are visible to:
  - the teacher (optional toggle)
  - admins (default)
- Reviewer progress tracking: completed/remaining.

---

## D) Exception Handling UX

### Story D1 — Audio quality detection + student guidance (system)
**As the system**, I detect common recording issues and guide the student to fix them before submission.

**Acceptance Criteria**
- Pre-submit checks (v1):
  - recording too quiet (below threshold)
  - recording too short (below minimum duration)
  - no audio track detected
- Student sees clear guidance:
  - “Move closer to the mic”
  - “Try again in a quieter place”
- Teacher sees flags on attempt if quality is poor despite submission.

---

### Story D2 — Missing/failed upload recovery (student)
**As a Student**, if an upload fails, I can retry without losing my recording.

**Acceptance Criteria**
- Recording is buffered locally until upload success confirmed.
- If upload fails, student sees retry button and progress.
- If app closes mid-upload, student can resume within a short window (best-effort v1).

---

### Story D3 — Re-submit / retake workflow (teacher)
**As a Teacher**, I can request a re-submit with a reason and optionally allow a retake window.

**Acceptance Criteria**
- Teacher can request resubmit:
  - choose reason (noise, off-topic, technical issue, incomplete)
  - optional message
  - deadline for resubmit
- Student sees resubmit request and can submit a new attempt version.
- Attempt history preserved:
  - original attempt remains accessible but marked “superseded”
- Reporting rules:
  - latest attempt counts by default
  - ability to view history.

---

### Story D4 — Late policy rules (assignment-level)
**As a Teacher**, I can set late policy rules so workflows are consistent without manual exceptions.

**Acceptance Criteria**
- Assignment can define:
  - due date
  - grace period
  - accept late submissions (yes/no)
  - late penalty (optional; if used, must be transparent in reporting)
- UI clearly labels attempts as “late” with timestamps.
- Policy can be overridden by admins (role-gated) with audit log.

---

## Technical Approach (implementation notes)

### Data model sketch (Supabase/Postgres)
- Snippets:
  - `feedback_snippets (id, tenant_id, owner_user_id, scope, title, body, tags_json, language, created_at, updated_at)`
  - `snippet_packs (id, tenant_id, scope, name, version_num, created_by, published_at)`
  - `snippet_pack_items (pack_id, snippet_id)`
- Voice feedback:
  - `attempt_feedback_audio (id, attempt_id, storage_path, duration_ms, created_at)`
- Coaching sampling:
  - `sample_sets (id, tenant_id, scope_json, rules_json, created_by, assigned_to, status, created_at)`
  - `sample_set_items (sample_set_id, attempt_id, bucket, created_at)`
  - `sample_set_notes (id, sample_set_item_id, author_user_id, note_text, tags_json, created_at)`
- Exceptions:
  - `attempt_flags (id, attempt_id, flag_type, severity, payload_json, created_at)`
  - `resubmit_requests (id, attempt_id, requested_by, reason, message, due_at, status, created_at)`
  - `late_policies (assignment_version_id, due_at, grace_minutes, accept_late, penalty_json)`
- Reuse `audit_events` for key changes.

### Implementation considerations
- Snippets should be cached client-side for fast search.
- Voice feedback uses same storage pipeline as student audio.
- Sampling rules can start heuristic-based; later evolve to configurable strategies.
- Exception detection should avoid heavy ML; use simple signal checks (duration, amplitude).

---

## Sprint Plan (3 sprints)

### Sprint 1 — Snippets v1 + Exception flags
**Goal:** Immediate teacher speed gains and clearer handling of common audio issues.

**Deliverables**
- Teacher personal snippet CRUD + search.
- Scoring UI quick insert by dimension tags.
- Attempt flags:
  - too quiet
  - too short
  - no audio
- Teacher UI indicators for flagged attempts.

**Engineering Tasks**
- Implement snippet tables + RLS + UI.
- Add snippet search/indexing on client.
- Integrate snippet picker into scoring UI.
- Implement audio analysis signals at recording time (client) and/or server validation.
- Add attempt_flags storage and teacher display.
- QA: scoring flow remains fast.

**Exit Criteria**
- Teacher can add snippets and insert in one click while scoring.
- Flagged attempts are visible and explainable.

---

### Sprint 2 — Voice feedback + Resubmit workflow
**Goal:** Add high-touch feedback and clean remediation paths.

**Deliverables**
- Teacher audio feedback recording and playback.
- Resubmit request flow:
  - reason + message + deadline
  - student resubmits new attempt
  - attempt history preserved
- Reporting uses latest attempt by default; history view exists.

**Engineering Tasks**
- Implement audio feedback component and storage.
- Implement resubmit_requests table and UI for teacher/student.
- Implement attempt versioning for resubmits (link attempts via `supersedes_attempt_id` or similar).
- Update reporting queries to respect “latest counts” rule.
- Audit logging for resubmits and overrides.

**Exit Criteria**
- Teacher can request resubmit and student can submit a replacement attempt.
- Teacher can leave voice feedback and student can play it (if enabled).

---

### Sprint 3 — Shared snippet packs + Smart sampling
**Goal:** Admin-level standardization and scalable coaching/QA workflows.

**Deliverables**
- Admin snippet packs:
  - publish v1, update to v2
  - teacher opt-in updates (no overwrite)
- Sample set generator (v1 heuristic):
  - high/mid/low buckets
  - revised scores bucket
- Reviewer workflow:
  - notes per item
  - tags (exemplar/needs discussion)
- Export sample set list (CSV) for meetings (optional).

**Engineering Tasks**
- Implement snippet_packs versioning and assignment logic.
- Implement sample set rule engine and item selection queries.
- Build reviewer UI for sample sets and notes.
- Add permissions and optional anonymity toggles.
- Performance testing for selecting samples at scale.

**Exit Criteria**
- Admin can publish a snippet pack and teachers can adopt it.
- A coach can review a generated sample set and leave notes.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Teachers can create/search/insert snippets during scoring.
- Voice feedback works end-to-end when enabled.
- Flagging identifies common audio issues and is visible to teachers.
- Resubmission workflow preserves history and updates reporting appropriately.
- Admins can publish snippet packs and coaches can review smart samples.

### Security & Privacy
- All data is tenant-scoped and role-gated via RLS.
- Student-facing features respect tenant policy toggles.
- Audio feedback and sample sets respect retention and export rules.
- Audit events cover:
  - pack publish/update
  - resubmit request/override
  - sample set assignment (recommended)

### Quality
- Automated tests cover:
  - snippet insertion and pack opt-in logic
  - resubmit attempt linking and “latest counts” reporting rule
  - sampling selection rules for a test dataset
- Observability:
  - upload failures and retry events logged
  - audio flag generation tracked for false positives
- Documentation:
  - teacher guide for snippets/voice feedback
  - admin guide for snippet packs and coaching samples

### UX
- Scoring remains fast: snippet picker loads instantly and doesn’t block playback.
- Student resubmit experience is clear and low-stress.

---

## Test Checklist (minimum)
- ✅ Create snippet → insert while scoring → edit before saving → persists on attempt
- ✅ Publish snippet pack → teacher opts in → pack updates to v2 → teacher can opt into update without overwriting custom edits
- ✅ Flag too-quiet attempt and display warning to teacher
- ✅ Teacher requests resubmit → student submits replacement → reporting uses latest by default
- ✅ Teacher records voice feedback → student plays it (if enabled)
- ✅ Generate sample set for a teacher → reviewer leaves notes and tags items
