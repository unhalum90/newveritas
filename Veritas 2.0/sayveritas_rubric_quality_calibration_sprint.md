# SayVeritas Rubric Quality at Scale (District Library, Calibration, Inter-Rater Reliability) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Add district-level features that ensure scoring consistency and reduce variance across teachers:
- **District Rubric Library** (templates, required dimensions, exemplars)
- **Calibration Mode** (shared sample scoring, variance dashboards)
- **Inter-Rater Reliability (IRR) reporting** (simple, explainable metrics + drift flags)

Non-goals (for this release):
- Advanced psychometrics suite
- Automated AI scoring as the official grade (this stays teacher-controlled)
- Full certification of raters (can be later)

## REVIEW NOTES
- Rubric creation is already supported in the assessment builder; rubric scores are used in scoring and reports.
- `rubric_standards` mapping exists in schema and assessment API responses, but no district rubric library UI.
- Assessment validation checks for missing/invalid rubrics are implemented.

---

## Epic
**As a district assessment leader**, I want teachers using consistent rubrics and scoring similarly so results are comparable, defensible, and useful for district reporting.

---

## User Stories

### Story 1 — District rubric library (district admin)
**As a District Admin**, I can create and manage a library of approved rubrics so teachers have high-quality, standardized options.

**Acceptance Criteria**
- District Admin can create/edit/publish **District Rubrics** with:
  - title, subject/course tags, grade band tags
  - rubric dimensions + descriptors + scoring scale
  - “Required dimensions” toggle per dimension
- District Admin can set rubric visibility:
  - district-wide
  - specific schools
  - specific departments (optional v2)
- Teachers can browse and copy district rubrics into their own assignment builder.
- Versioning:
  - district rubric edits create new versions; published versions remain immutable for existing attempts (align with Integrity Suite if implemented).

---

### Story 2 — Exemplar attachment to rubric dimensions (district admin/teacher)
**As a District Admin or Teacher**, I can attach exemplars to rubric dimensions so teachers and students understand what “proficient” sounds like.

**Acceptance Criteria**
- Exemplar types:
  - text examples (v1)
  - audio exemplars (v2 if storage/UX ready)
- Exemplars can be tagged by performance level (e.g., 1–4).
- Teachers can view exemplars while scoring.
- Optional: teachers can enable student-facing exemplars for practice mode (future, not required here).

---

### Story 3 — Calibration session creation (district/school admin)
**As a District or School Admin**, I can create a calibration session with sample attempts so multiple teachers score the same work.

**Acceptance Criteria**
- Admin can create Calibration Session with:
  - title, rubric version, date range, participating teachers
  - a set of 5–20 sample attempts (audio + transcript if available)
- Session can be “anonymous”:
  - hides student identity
  - optionally hides teacher-of-record
- Teachers receive notification and can complete calibration asynchronously.
- Each teacher submits scores per sample attempt using the rubric UI (same as normal scoring flow).

---

### Story 4 — Calibration scoring UI (teacher)
**As a Teacher**, I can score calibration samples quickly with the same rubric interface used in real assessments.

**Acceptance Criteria**
- Calibration samples appear in a dedicated “Calibration” queue.
- Teacher can:
  - play audio
  - view transcript (if available)
  - score dimensions
  - submit scores
- Teacher can pause and resume.
- Completion status and remaining samples are visible.

---

### Story 5 — Variance dashboard (admin)
**As an Admin**, I can see where scoring varies by dimension and by teacher so I can target coaching and improve consistency.

**Acceptance Criteria**
- Dashboard shows:
  - agreement/variance summary for each sample (overall)
  - variance by rubric dimension (which dimensions drift most)
  - teacher-by-teacher comparison against group median
- Flags:
  - “High variance” samples (above threshold)
  - “Drift” teachers (consistently above/below median)
- Admin can drill down to:
  - see distributions for a sample
  - compare dimension scoring across raters (no student identity shown)

---

### Story 6 — IRR metrics (simple + explainable)
**As a district leader**, I can view understandable reliability metrics to report on consistency without needing a statistics background.

**Acceptance Criteria**
Provide at least two v1 metrics:
- **Percent exact agreement** (same score)
- **Percent within-1 agreement** (within one point on the scale)

Optional v1.5 metrics:
- Krippendorff’s alpha or ICC (only if team is comfortable, but keep v1 simple)

UI must include:
- plain-language explanation of what each metric means
- recommended interpretation bands (e.g., “good / needs improvement”)
- caution that calibration samples and context affect metrics

---

## Technical Approach (implementation notes)

### Recommended architecture
- Calibration sessions are tenant-scoped and reference **rubric versions** + **sample attempts**.
- Calibration scores are stored separately from real scores to avoid contaminating student records.
- Metrics computed via backend job to support scale.

### Data model sketch (Supabase/Postgres)
- `district_rubrics (id, tenant_id, title, tags_json, created_by, created_at)`
- `district_rubric_versions (id, district_rubric_id, version_num, rubric_json, published_at)`
- `rubric_exemplars (id, rubric_version_id, dimension_key, level, exemplar_type, content, storage_path, created_at)`
- `calibration_sessions (id, tenant_id, title, rubric_version_id, is_anonymous, starts_at, ends_at, created_by)`
- `calibration_participants (session_id, user_id, status, started_at, completed_at)`
- `calibration_samples (session_id, attempt_id)`  // attempt references audio/transcript
- `calibration_scores (id, session_id, attempt_id, scorer_user_id, dimension_scores_json, overall_score, submitted_at)`
- `calibration_metrics (session_id, computed_at, metrics_json)`
- `audit_events` (reuse; calibration created/closed, etc.)

### Metric computation approach (v1)
For each sample attempt and each dimension:
- Compute median score across raters
- Compute:
  - exact agreement rate
  - within-1 agreement rate
Also compute session-level rollups:
- overall exact/within-1 agreement
- dimension-level exact/within-1

Thresholds (configurable):
- High variance sample: within-1 < X% (e.g., 70%)
- Drift teacher: average deviation from median > Y (e.g., 0.7)

---

## Sprint Plan (3 sprints)

### Sprint 1 — District Rubric Library (Versioned)
**Goal:** District publishes approved rubrics; teachers can adopt them.

**Deliverables**
- DB tables + RLS for district rubrics + versions.
- Admin UI:
  - create/edit rubric
  - publish new version
  - set required dimensions
- Teacher UI:
  - browse district library
  - copy into assignment builder (creates a local rubric version snapshot)
- Audit events for rubric publish/updates.

**Engineering Tasks**
- Migrations and RLS policies.
- Build rubric library pages (district admin and teacher views).
- Implement “copy rubric” flow into assignment builder.
- Add version labels and publish state.
- QA: ensure edits don’t retroactively change assignments already using a version.

**Exit Criteria**
- District admin can publish rubric v1 and later publish v2.
- Teachers can use v1 without being affected by future edits.

---

### Sprint 2 — Calibration Sessions + Teacher Scoring
**Goal:** Teachers can score shared samples under a rubric and submit results.

**Deliverables**
- Calibration session creation UI (admin):
  - choose rubric version
  - pick sample attempts
  - choose teachers
  - set anonymous mode
- Teacher calibration queue UI and scoring flow.
- Store calibration scores separately from real scores.
- Basic progress tracking per participant.

**Engineering Tasks**
- Implement calibration session tables and permissions.
- Build session creation and participant assignment.
- Build teacher scoring queue and submission endpoints.
- Add notifications (in-app; email optional) when session assigned.
- QA: anonymous mode and permissions.

**Exit Criteria**
- A calibration session with 10 samples can be completed by multiple teachers.
- Scores are stored and retrievable for metric computation.

---

### Sprint 3 — Metrics + Variance Dashboard + Drift Flags
**Goal:** Admin sees scoring reliability and can identify variance by dimension/teacher.

**Deliverables**
- Backend metric computation job (on session close or scheduled).
- Admin dashboard:
  - session overview metrics
  - dimension variance view
  - teacher drift view
  - sample-level distributions and flags
- Plain-language explanations embedded in UI.
- CSV export of metrics (optional but useful).

**Engineering Tasks**
- Implement metric computation and store `calibration_metrics`.
- Build dashboard UI with filters and drill-downs.
- Add thresholds and flagging logic.
- Performance testing with many sessions/samples.
- Add audit events for session close + metric recompute.

**Exit Criteria**
- Admin can identify:
  - which dimensions drift most
  - which teachers diverge from group median
  - which samples are ambiguous/high variance
- Metrics are stable and explainable to non-technical leaders.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- District rubric library supports versioning and publishing.
- Teachers can adopt district rubrics without being affected by later edits.
- Calibration sessions can be assigned, completed, and tracked.
- Admin variance dashboard displays reliable metrics and flags.

### Security & Privacy
- Calibration sessions are tenant-scoped and role-gated.
- Anonymous mode hides student/teacher-of-record identifiers where configured.
- Calibration scores do not affect student grades or normal reports.
- Audit events recorded for rubric publishing and calibration session lifecycle actions.

### Quality
- Automated tests cover:
  - rubric version immutability
  - calibration score submission and retrieval
  - metric computation correctness (sample datasets)
- Observability:
  - metric job failures are visible to admin and logged
- Documentation:
  - “How to run calibration” district guide
  - internal support runbook

### UX
- Teachers can complete calibration with minimal clicks.
- Admin dashboard uses plain language and avoids statistics jargon.

---

## Test Checklist (minimum)
- ✅ Publish district rubric v1 → teacher copies into assignment builder → later publish v2 → teacher assignment remains on v1
- ✅ Create calibration session with anonymous mode → teachers complete scoring → admin sees aggregate results with no student identity
- ✅ Metrics computed and displayed:
  - exact agreement
  - within-1 agreement
- ✅ Drift and high-variance flags appear when thresholds are crossed
