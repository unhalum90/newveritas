# SayVeritas Assessment Integrity Suite (Follow-ups, Versioning, Evidence Trail) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Add an “Assessment Integrity” layer that improves defensibility and reduces disputes **without surveillance**:
- **Follow-up question engine** (teacher-authored micro follow-ups; optional auto-insert rules)
- **Prompt + rubric versioning and locking** (immutable once students start; edits create new versions)
- **Evidence trail per score** (audio + transcript + rubric mapping + feedback + timestamps; exportable)

Non-goals (for this release):
- Automated proctoring / webcam monitoring
- AI-based plagiarism detection
- High-stakes exam security features (secure browser, etc.)

## REVIEW NOTES
- Assessment integrity settings are live in the builder (pause threshold, tab switch monitor, shuffle questions, recording limit, grace restart, pledge).
- Integrity pledge acceptance gates student recording/submit flows; integrity events are logged and surfaced in admin support views.
- Follow-up question types exist (audio/evidence follow-up) with AI-generated follow-up prompts and student UI.
- Evidence trail is partially implemented via assessment results + student feedback pages (audio, transcripts, evidence images, rubric scores, teacher comment) and CSV export; no assignment version locking or score revision log yet.

---

## Epic
**As a teacher and school leader**, I need oral assessment results that are consistent, explainable, and defensible so grading disputes decrease and reporting is credible.

---

## User Stories

### Story 1 — Follow-up question bank (teacher)
**As a Teacher**, I can author and manage follow-up questions tied to rubric dimensions so I can probe student understanding consistently.

**Acceptance Criteria**
- Teacher can create a **Follow-up Set** with:
  - title, description, optional grade/course tags
  - 3–10 follow-up questions
  - each question optionally tagged to a rubric dimension (e.g., Evidence, Clarity, Reasoning)
- Follow-up question types:
  - text prompt (v1)
  - optional: audio prompt attachment (v2)
- Teacher can reuse sets across assignments.
- Versioning: editing a Follow-up Set that’s already used creates a new version (or duplicates automatically).

---

### Story 2 — Follow-up insertion rules (assignment builder)
**As a Teacher**, I can choose how and when follow-up questions appear during an assessment so it fits the pedagogy and time constraints.

**Acceptance Criteria**
Assignment builder includes a Follow-up section with options:
- **Off**
- **Manual**: teacher chooses follow-up live during review (teacher listens → selects a follow-up for reattempt)
- **Auto-insert (simple rules)**:
  - insert 1 follow-up after initial response
  - OR insert follow-up only if score is below threshold for a tagged dimension (requires scoring step order)
- Teacher can choose:
  - number of follow-ups (0–2 for v1 recommended)
  - random vs fixed order
  - time limit per follow-up (optional)
- Student experience is clear: “Follow-up question 1 of 1” with a short countdown if enabled.

---

### Story 3 — Prompt + rubric locking (immutability)
**As a teacher/admin**, I want the prompt and rubric used for scoring to be immutable once students start so results are defensible.

**Acceptance Criteria**
- Once the first student starts an assignment attempt, the system **locks**:
  - assignment prompt content
  - attached rubric (and rubric definitions)
  - follow-up rules (if enabled)
- Any edit after lock creates:
  - a **new assignment version** OR a cloned assignment with incremented version label (e.g., v2)
- Students attempting the original assignment continue on v1; new attempts (after publish of v2) use v2.
- UI clearly shows version label to teachers/admins.

---

### Story 4 — Evidence trail per attempt (defensible record)
**As a Teacher or Admin**, I can view a complete evidence trail that explains how a score was produced.

**Acceptance Criteria**
For each student attempt, provide an “Evidence” panel showing:
- Audio recording(s) (initial + follow-ups if used)
- Transcript(s) (if available)
- Rubric dimensions + scores + rubric descriptors used
- Teacher feedback (text and/or audio if supported)
- Timestamps:
  - attempt submitted
  - scored
  - any re-score event
- **Score change log**:
  - who changed the score
  - when
  - reason (required for edits after initial scoring)
- Export options:
  - PDF summary (v1) OR
  - JSON/CSV bundle (v2)

---

### Story 5 — Re-score workflow with reason capture (admin/teacher)
**As a Teacher or School Admin**, I can adjust a score while preserving a transparent audit trail for compliance and dispute resolution.

**Acceptance Criteria**
- Editing a submitted score requires:
  - selecting a reason (dropdown) + optional notes
- System records a score revision entry:
  - previous score values by dimension + overall
  - new values
  - actor + timestamp
  - reason + notes
- Reporting defaults:
  - uses latest score
  - includes a flag if revised (filterable)

---

## Technical Approach (implementation notes)

### Recommended architecture
- Make assignment content **versioned entities**:
  - `assignments` (logical container)
  - `assignment_versions` (immutable snapshot used by attempts)
- Add follow-up as a versioned attachment:
  - `followup_sets` + `followup_set_versions`
- Attempts reference immutable versions:
  - `attempts.assignment_version_id`
  - `attempts.followup_set_version_id` (nullable)
- Evidence trail is assembled from attempt + scoring + revision logs + media objects.

### Data model sketch (Supabase/Postgres)
- `assignments (id, tenant_id, title, created_by, created_at)`
- `assignment_versions (id, assignment_id, version_num, prompt_json, rubric_version_id, followup_rules_json, locked_at, published_at)`
- `followup_sets (id, tenant_id, title, created_by, created_at)`
- `followup_set_versions (id, followup_set_id, version_num, questions_json, created_at)`
- `attempts (id, tenant_id, student_id, assignment_version_id, status, submitted_at)`
- `attempt_media (id, attempt_id, kind, storage_path, duration_ms, created_at)`  // kind: initial, followup_1, ...
- `scores (id, attempt_id, rubric_version_id, dimension_scores_json, overall_score, scored_by, scored_at)`
- `score_revisions (id, attempt_id, previous_json, new_json, reason, notes, actor_user_id, created_at)`
- `audit_events` (reuse; add event types for version publish, score edit)

### Locking strategy
- Lock occurs on **first attempt creation** or first “Start assessment” event.
- After lock, editing the assignment creates a new `assignment_version` with `version_num+1`.
- Publishing determines which version is active for new attempts.

### Export strategy (v1)
- PDF summary generated server-side for a single attempt evidence pack:
  - student identifier (district policy: name or anonymized ID)
  - assignment version label
  - rubric snapshot summary
  - scores + feedback
  - links/IDs to audio (embed audio only if policy allows)

---

## Sprint Plan (3 sprints)

### Sprint 1 — Versioning + Locking Foundations
**Goal:** Assignments and rubrics become immutable snapshots once students begin.

**Deliverables**
- DB schema for `assignment_versions` and references in `attempts`.
- Locking behavior implemented:
  - lock on first attempt start
  - UI indicates locked status
- “Edit creates new version” workflow:
  - create v2 from v1
  - version labels in UI (v1, v2)
- Audit events for:
  - version created/published
  - lock triggered

**Engineering Tasks**
- Migrations + RLS updates.
- Refactor assignment builder to save into `assignment_versions`.
- Update attempt creation to reference the current published version.
- Add UI components for version listing and publish selection.
- Regression tests: existing assignments migrated safely.

**Exit Criteria**
- A teacher cannot silently change a prompt/rubric for an in-progress assignment.
- New version can be created and published without breaking existing attempts.

---

### Sprint 2 — Follow-up Engine (Manual + Simple Auto)
**Goal:** Teachers can attach follow-up sets and deliver follow-ups reliably.

**Deliverables**
- Follow-up set CRUD + versioning.
- Assignment builder follow-up configuration:
  - Off / Manual / Auto-insert (simple)
- Student flow supports follow-up prompts and recording.
- Attempts store follow-up media and link to follow-up set version.

**Engineering Tasks**
- Implement follow-up set tables + UI.
- Implement follow-up rendering in assessment flow.
- Implement “Auto-insert after response” rule (v1) and/or “below threshold” (v1.5).
- Persist follow-up recordings and metadata.
- QA: timing, re-record, mobile behavior.

**Exit Criteria**
- A student completes an assessment with 1 follow-up and both recordings are stored and viewable.
- Follow-up set edits do not change past attempts (versioning works).

---

### Sprint 3 — Evidence Trail + Score Revision Log + Export
**Goal:** Results are defensible with a complete evidence trail and revision transparency.

**Deliverables**
- Evidence panel for each attempt:
  - audio + transcript links
  - rubric snapshot + dimension scores
  - feedback + timestamps
- Score revision workflow:
  - reason capture
  - revision history display
- Export:
  - v1 PDF “Evidence Pack” for an attempt (or structured export if PDF is already in stack)
- Audit events for score edits.

**Engineering Tasks**
- Implement `score_revisions` and UI.
- Build evidence panel UI (teacher + admin views).
- Implement PDF generation or export pipeline.
- Add permissions:
  - who can revise scores
  - who can export evidence packs
- Performance checks: evidence page loads quickly with media.

**Exit Criteria**
- Score edits create a visible revision log with reasons.
- Evidence pack export is usable for a parent meeting or grade dispute.
- Admins can confirm the prompt/rubric used for any attempt via version label.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Assignment content (prompt, rubric, follow-ups) is immutable for attempts once lock triggers.
- Edits create new versions; past attempts always reference the original snapshot.
- Follow-up delivery works end-to-end and stores separate recordings.
- Evidence trail shows all relevant artifacts and timestamps.
- Score revisions require reason capture and are visible in history.

### Security & Auditability
- All versions/attempts are tenant-scoped and protected by RLS.
- “Who changed what” is recorded:
  - assignment version publish/lock
  - score edits
  - exports (optional but recommended)
- Export permissions are role-checked (Teacher vs School Admin vs District Admin).

### Quality
- Automated tests cover:
  - version lock behavior
  - attempt references to immutable versions
  - score revision creation and retrieval
- Observability:
  - errors in follow-up flow are logged with context
  - export failures are visible to admin
- Backwards compatibility:
  - existing assignments migrate safely (no broken attempts).

### UX
- Teachers clearly see:
  - version label
  - locked state
  - what will happen if they edit (creates v2)
- Students understand follow-up steps and completion state.

---

## Test Checklist (minimum)
- ✅ Create assignment v1; start student attempt → assignment locks
- ✅ Edit assignment after lock → creates v2; v1 attempts remain unchanged
- ✅ Attach follow-up set; student completes initial + follow-up recordings
- ✅ Teacher views evidence panel and sees both recordings + rubric snapshot
- ✅ Teacher revises score with reason → revision log visible; reporting uses latest score
- ✅ Export evidence pack generates and reflects correct version label and artifacts
