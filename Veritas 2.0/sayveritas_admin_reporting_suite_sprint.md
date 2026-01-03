# SayVeritas Admin Reporting Suite (Standards Rollups, Growth, Action Lists) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Upgrade reporting from class-level to **school/district leadership-grade analytics** that drives action:
- **Standards mastery rollups** (student → class → school → district)
- **Growth views** (first vs latest; dimension-level growth)
- **Actionable intervention lists** (who needs help, what skill, what evidence)
- **Subgroup/cohort filters** (only if allowed by tenant policy; privacy-safe defaults)

Non-goals (for this release):
- Predictive analytics / risk scoring
- State reporting exports for every jurisdiction (we’ll build extensible export templates instead)
- Student-level demographic ingestion unless already present (privacy risk; keep optional)

## REVIEW NOTES
- Class-level assessment reports are already implemented (generation + display of rubric distributions, question effectiveness, suggested actions, evidence index).
- CSV export of assessment results exists on the assessment results page.
- `rubric_standards` exists in schema and is returned by the assessment API, but no standards-tagging UI or admin rollups are present.

---

## Epic
**As a school or district leader**, I want clear, trustworthy oral assessment reporting by standard and growth so I can make instructional decisions and justify program impact with evidence.

---

## Key Concepts & Guardrails
- Reporting must be **tenant-scoped**, **role-gated**, and **privacy-aware**.
- Standards are tagged at **assignment build time** (and optionally at rubric-dimension level).
- Reporting is built on **attempt snapshots**:
  - Uses latest score by default
  - Can optionally show “all attempts” trend
- Subgroup reporting is disabled by default unless the district explicitly enables it and data exists.

---

## User Stories

### Story 1 — Standards tagging (assignment builder)
**As a Teacher**, I can tag an assignment (and optionally rubric dimensions) to standards so results aggregate meaningfully.

**Acceptance Criteria**
- Assignment builder supports selecting:
  - standards framework (e.g., state, CEFR/WIDA if relevant)
  - one or more standards codes
- Optional: tag rubric dimensions to standards (v1.5).
- Standards selection is saved in the immutable assignment version snapshot (aligns with integrity suite).
- UI prevents publishing without standards only if tenant policy requires it (toggle: “standards required”).

---

### Story 2 — Standards mastery rollups (admin view)
**As a School or District Admin**, I can view mastery by standard across classes and schools.

**Acceptance Criteria**
- Reporting page supports drill-down hierarchy:
  - District → School → Teacher/Class → Student → Attempt evidence
- For each standard, show:
  - distribution of performance levels (based on rubric scale mapping)
  - average and median (with caution label)
  - count of students assessed
  - last assessment date
- Filters:
  - date range
  - grade band/course tag (if available)
  - school (district admins only)
- Clicking a standard drills into:
  - top contributing assignments
  - dimension breakdown (if dimension tagged)

---

### Story 3 — Growth views (student + cohort)
**As an Admin or Teacher**, I can see growth over time to demonstrate progress and identify stagnation.

**Acceptance Criteria**
- Growth view for:
  - a single student (teacher sees their students; admins see all within scope)
  - cohort/class (aggregated)
- Default growth metric:
  - **first attempt vs latest attempt** for the same standard (or same rubric dimension)
- Provide:
  - absolute change (points)
  - percent of students improving
  - median growth
- Show confidence caveats:
  - “Only X attempts available” warnings.
- Ability to toggle:
  - latest score only vs all attempts trend line (v1.5).

---

### Story 4 — Actionable intervention lists (what to do next)
**As a School leader**, I can generate lists of students needing support by skill so interventions are clear and immediate.

**Acceptance Criteria**
- “Action Lists” page produces ranked lists:
  - Students below threshold in a selected standard
  - Students with low scores in a specific rubric dimension (e.g., Clarity)
  - Students with no recent evidence for required standards (coverage gaps)
- Each list item includes:
  - student identifier (per privacy policy)
  - current level/score
  - last evidence date
  - quick link to evidence trail (attempt panel)
  - recommended next action:
    - “Assign follow-up practice” (if practice mode exists later)
    - “Re-assess with assignment X” (suggestion)
- Export:
  - CSV for intervention meetings (teacher/admin scope).

---

### Story 5 — Coverage reporting (program completeness)
**As an Admin**, I can see which required standards have been assessed and where gaps exist.

**Acceptance Criteria**
- “Coverage” dashboard shows:
  - required standards list (tenant-configurable)
  - percent coverage by school/class
  - “not yet assessed” standards
- Filters:
  - course/grade band
  - time window (semester/year)
- Recommended actions:
  - “Create assessment for uncovered standard” quick-start link (template).

---

### Story 6 — Subgroup/cohort reporting (privacy-safe)
**As a District Admin**, I can filter results by subgroup when enabled so we can monitor equity and targeted supports.

**Acceptance Criteria**
- Subgroup reporting is **disabled by default**.
- Enabling requires:
  - admin toggle + acknowledgement (privacy policy message)
  - minimum n-size suppression (e.g., hide results where n < 10)
- Supports cohort filters if data exists:
  - grade level
  - school
  - program flags (ELL/IEP) only if district provides and enables
- Audit event recorded when subgroup reporting is enabled/disabled.

---

## Technical Approach (implementation notes)

### Reporting architecture
- Prefer a **reporting schema** with pre-aggregations for performance at scale.
- Use materialized views or incremental aggregation tables to avoid expensive queries on every page load.
- Store a “reporting fact” row per scored attempt:
  - tenant_id
  - school_id (if modeled)
  - teacher_id
  - class_id
  - student_id (or anonymized key depending on policy)
  - assignment_version_id
  - standards_codes[]
  - rubric_dimension_scores
  - overall_score
  - scored_at
  - attempt_submitted_at
  - is_revised flag

### Data model additions (illustrative)
- `assignment_standards (assignment_version_id, standard_code)` (or store in `assignment_versions.prompt_json`/metadata)
- `required_standards (tenant_id, framework, standard_code, required_for_tags_json)`
- `reporting_facts_attempts (...)`
- `reporting_rollups_standards_daily (...)` (optional)
- `reporting_settings (tenant_id, standards_required, subgroup_enabled, min_group_size)`

### Score normalization
- If rubrics differ, define a normalized “performance level” mapping:
  - map rubric scale to 1–4 (or 1–5) mastery bands for rollups
- Store both raw score and normalized band.

### Privacy enforcement
- Enforce minimum group size suppression at query layer.
- Provide pseudonymous student keys for district-level views if required.

---

## Sprint Plan (3 sprints)

### Sprint 1 — Standards tagging + reporting facts foundation
**Goal:** Ensure all scored attempts can roll up by standard reliably.

**Deliverables**
- Standards tagging in assignment builder (assignment-version scoped).
- DB schema for required standards and reporting settings.
- “Reporting facts” pipeline:
  - create/update fact rows on scoring events and score revisions
- Basic admin report page:
  - standards list with counts and averages (simple)

**Engineering Tasks**
- Implement standards selector UI and persist in assignment version metadata.
- Implement reporting fact writer (trigger on score create/revision).
- Add reporting settings (standards required toggle).
- Build initial “Standards Overview” page for admins.
- QA: confirm facts reflect revisions and correct version scoping.

**Exit Criteria**
- A scored attempt appears under the correct standard(s) in admin view.
- Updates to a score update reporting facts within 1 minute.

---

### Sprint 2 — Rollups + Drill-down hierarchy
**Goal:** Leaders can go district → school → class → student evidence.

**Deliverables**
- Rollup views:
  - district and school dashboards
  - filter by date range and school
- Drill-down pages:
  - standard → contributing assignments → student list → evidence panel
- Coverage dashboard v1 (required standards list + percent coverage).

**Engineering Tasks**
- Implement rollup queries (materialized views optional).
- Implement drill-down navigation and permission checks.
- Implement required standards table and coverage computation.
- Performance testing with realistic dataset sizes.
- Add CSV export for standard-level lists.

**Exit Criteria**
- Admin can trace any metric back to evidence in 3–4 clicks.
- Coverage gaps are accurate for selected filters.

---

### Sprint 3 — Growth views + Action lists + Subgroup controls
**Goal:** Turn reporting into actions and program impact narratives.

**Deliverables**
- Growth view:
  - student-level first vs latest
  - cohort median growth
- Action Lists page with exports.
- Subgroup reporting toggle + min-n suppression (if data available).
- Explanatory tooltips and “data caveats” microcopy.

**Engineering Tasks**
- Implement growth computation logic (per standard and/or per dimension).
- Implement action list generator queries and UI.
- Implement subgroup settings, suppression logic, and audit events.
- QA: ensure teachers only see their scope; admins see within theirs.
- Add snapshots or caching for performance.

**Exit Criteria**
- A leader can generate a list of “students needing support in standard X” and export it.
- Growth metrics are consistent and explainable.
- Subgroup suppression prevents small-n leakage.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Standards tagging is stored on immutable assignment versions and used in reporting.
- Admin reporting supports rollups and drill-down to evidence.
- Growth views and action lists work for permitted scopes.
- Coverage reporting identifies gaps against required standards lists.
- Subgroup reporting is off by default and enforces min-n suppression when enabled.

### Security & Privacy
- All reporting is tenant-scoped and role-gated.
- Teachers cannot see other teachers’ students/classes unless explicitly permitted.
- Student identifiers respect privacy settings (name vs ID vs pseudonym).
- Subgroup reporting logs enable/disable events and blocks small-n leakage.

### Quality
- Automated tests cover:
  - reporting facts creation on score/revision
  - rollup query correctness for sample datasets
  - min-n suppression logic
- Observability:
  - reporting pipeline failures surfaced to admin
  - slow queries monitored and optimized
- Documentation:
  - “How standards rollups work” admin guide
  - “Interpreting growth metrics” guide

### UX
- Reports include clear explanations and “data caveats” where needed.
- Drill-down flows are intuitive and consistent.

---

## Test Checklist (minimum)
- ✅ Assignment tagged to standards → student completes → score appears in standard rollup
- ✅ Score revised → rollups update and revision flag shows
- ✅ Coverage dashboard shows uncovered standards for a school
- ✅ Growth view shows first vs latest for a student on a standard
- ✅ Action list exports correct students below threshold
- ✅ Subgroup reporting suppressed when n < configured minimum
