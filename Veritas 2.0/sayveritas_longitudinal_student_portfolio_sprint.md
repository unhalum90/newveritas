# SayVeritas Longitudinal Student Portfolio (Multi-year Evidence, Curation, Reflection, Export Packs) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Create a student-centered **oral evidence portfolio** that persists across courses/years and supports conferences, audits, and program impact:
- **Longitudinal portfolio** across years and classes
- **Curated “best evidence” artifacts** (teacher and/or student selected)
- **Reflection layer** (student goal + self-rating, optional)
- **Exportable portfolio packs** (PDF/ZIP) for parent conferences, ELL/IEP meetings, accreditation artifacts

Non-goals (for this release):
- Public-facing share links (privacy risk; can be added later with strict controls)
- College admissions-style portfolios
- Complex competency-based pathways engine (we’ll keep data model compatible)

## REVIEW NOTES
- Student feedback pages already show per-assessment evidence (audio, transcript, rubric scores, teacher comment), but there is no cross-assessment portfolio timeline, curation, or export pack.

---

## Epic
**As a teacher, student, and school leader**, I want an organized, defensible portfolio of oral evidence over time so progress is visible, conferences are easier, and evidence can be reused for compliance and reporting.

---

## Key Decisions & Guardrails
- Portfolio is **tenant-scoped** by default; optional cross-tenant portability is out of scope.
- Portfolio displays **evidence artifacts** from attempts:
  - audio (and follow-up audio if used)
  - transcripts (if stored)
  - rubric snapshot + scores
  - teacher feedback
- Curation is **non-destructive**:
  - selecting an artifact for portfolio does not alter the underlying attempt.
- Privacy controls:
  - student can view their own portfolio if enabled by tenant policy.
  - exports are access-controlled and time-limited.

---

## User Stories

### Story 1 — Portfolio home (student + teacher)
**As a Student**, I can view my portfolio timeline and see my progress across time.
**As a Teacher**, I can view a student’s portfolio to support coaching and conferences.

**Acceptance Criteria**
- Portfolio shows:
  - timeline of evidence items (by date)
  - tags: standard(s), rubric dimension(s), course/class, assignment title
  - performance level/score summary
- Filters:
  - by standard
  - by course/class
  - by time window (semester/year)
- Evidence cards link to full Evidence Trail view (from Integrity Suite).

Role-based access:
- Students: only their own portfolio (if enabled).
- Teachers: students in their classes (and optionally historical view if tenant allows).
- Admins: within scope (school/district).

---

### Story 2 — Curate “Best Evidence” (teacher and/or student)
**As a Teacher**, I can mark an attempt as “Best Evidence” for a standard/dimension so it can be reused later.
**As a Student**, I can propose evidence for inclusion (optional policy).

**Acceptance Criteria**
- “Add to Portfolio” action available on attempt evidence page:
  - select portfolio category (Standard, Dimension, “Speaking sample”)
  - add a short annotation (“Why this matters”)
  - choose visibility (teacher-only vs student-visible) based on policy
- Portfolio supports pinning:
  - up to N items per standard (configurable; default 1–3)
- Curation changes are logged (who added/removed, when, reason optional).

---

### Story 3 — Portfolio categories and structure (admin configurable)
**As a School/District Admin**, I can configure portfolio categories so it matches local expectations (ELL, IEP meetings, accreditation).

**Acceptance Criteria**
- Tenant can configure:
  - default categories (Standards, Dimensions, “Milestones”)
  - max pinned items per category
  - whether student can self-curate
  - whether reflections are enabled
- Settings are role-gated and audit logged.

---

### Story 4 — Reflection layer (student)
**As a Student**, I can set a goal and self-rate before/after an assessment so progress is more visible and metacognition improves.

**Acceptance Criteria**
- Reflection prompts are configurable at tenant level:
  - “My goal for this assessment was…"
  - self-rating on 1–4 scale for 1–2 dimensions (optional)
  - “What I’ll do next time…"
- Reflection capture points:
  - pre-assessment (optional)
  - post-assessment (optional)
- Reflections are visible:
  - to student and teacher (default)
  - optionally to admin
- Reflections are exportable in portfolio packs.
- Student reflection editing rules:
  - editable for 24 hours or until teacher locks (policy).

---

### Story 5 — Conference-ready portfolio pack export (teacher/admin)
**As a Teacher or Admin**, I can export a clean portfolio pack for meetings so we can review evidence efficiently.

**Acceptance Criteria**
- Export types:
  - **Portfolio Summary PDF** (v1)
  - **Evidence Pack ZIP** (v1.5) with PDFs + audio files (policy-based)
- Export scope selection:
  - time range (semester/year)
  - standards included (optional)
  - include reflections (toggle)
  - include audio/transcripts (toggle; policy-based)
- Export is asynchronous and produces a time-limited download link.
- Export creation + download are logged in audit events.

---

### Story 6 — Data retention interaction (policy compliance)
**As a District Admin**, I can ensure portfolio pins do not violate retention policy.

**Acceptance Criteria**
- If an evidence item is scheduled for deletion due to retention:
  - UI warns: “This pinned evidence will expire on DATE unless legal hold is applied.”
  - Admin can apply legal hold (if enabled) or extend retention for portfolio evidence (policy decision).
- Export respects retention:
  - does not include deleted assets
  - clearly indicates missing assets when applicable.

---

## Technical Approach (implementation notes)

### Portfolio architecture
- Portfolio is a **curation layer** on top of attempts/evidence.
- Core objects:
  - `portfolio_items` pointing to `attempt_id` (and optionally a specific media object within an attempt)
  - `portfolio_annotations`
  - `portfolio_settings` (tenant policy)
  - `reflections` linked to assignment attempts or portfolio items

### Data model sketch (Supabase/Postgres)
- `portfolio_settings (tenant_id, student_access_enabled, student_curation_enabled, reflections_enabled, max_pins_per_standard, categories_json, created_at, updated_at)`
- `portfolio_items (id, tenant_id, student_id, attempt_id, category_type, category_key, pinned, visibility, annotation_text, created_by, created_at, removed_at, removed_by)`
  - `category_type`: standard | dimension | milestone
  - `category_key`: e.g., “WIDA.SPEAK.3” or “clarity”
  - `visibility`: teacher_only | student_visible | admin_only (optional)
- `portfolio_item_events (id, portfolio_item_id, event_type, actor_user_id, payload_json, created_at)`
- `reflections (id, tenant_id, student_id, attempt_id, phase, reflection_json, created_at, updated_at, locked_at)`
  - `phase`: pre | post
- Reuse:
  - attempts, media, transcripts, scores, evidence trail views
  - dsar/export job runner + secure download links

### Permissions model
- Enforce via RLS + app-layer checks:
  - student can read only their `portfolio_items` when enabled
  - teacher can read within roster scope
  - admin can read within tenant/school scope

### Export strategy
- PDF summary includes:
  - student identifier (policy-driven)
  - timeline highlights
  - pinned items grouped by category
  - reflections (if included)
  - rubric snapshots (condensed) + score trend
- ZIP pack includes:
  - portfolio_summary.pdf
  - per-item evidence pdfs (attempt evidence summary)
  - audio files if allowed

---

## Sprint Plan (3 sprints)

### Sprint 1 — Portfolio foundations (view + pinning)
**Goal:** Teachers (and optionally students) can view portfolio timeline and pin evidence.

**Deliverables**
- DB schema + RLS for portfolio_settings, portfolio_items, reflections (placeholder).
- Portfolio Home UI:
  - timeline list
  - filters (standard/course/date)
- “Add to Portfolio” action on Evidence Trail page:
  - category selection
  - pinned toggle
  - annotation
  - visibility (based on settings)
- Portfolio settings UI (admin):
  - enable student access (off by default)
  - enable student curation (off by default)
  - category defaults and max pins

**Engineering Tasks**
- Migrations + RLS policies.
- Implement portfolio query endpoints (by student).
- Implement UI components for timeline and pinned grouping.
- Integrate add/remove actions with audit events.
- QA: scope checks for teacher vs admin vs student.

**Exit Criteria**
- Teacher can pin an evidence item and it appears in portfolio grouped by standard.
- Pinned limits enforced.
- Audit events show who curated what.

---

### Sprint 2 — Reflection layer (pre/post) + policy locking
**Goal:** Students can reflect; teachers can use reflections for coaching and conferences.

**Deliverables**
- Reflection prompts configuration (tenant-level):
  - default prompts + toggle for pre/post
- Student reflection capture UI:
  - pre-assessment (optional prompt page)
  - post-assessment (after submission)
- Reflection display in:
  - attempt evidence page
  - portfolio item detail drawer
- Locking rules implemented:
  - 24h edit window OR teacher lock (configurable)

**Engineering Tasks**
- Implement reflections table and CRUD with locking.
- Implement prompts config UI and storage.
- Implement student reflection UI and teacher view.
- QA: ensure reflections do not block assessment submission if disabled.

**Exit Criteria**
- A student completes an assessment and adds a post-reflection.
- Teacher can view reflection alongside evidence.
- Edits are prevented after lock window.

---

### Sprint 3 — Export packs + retention interactions
**Goal:** Make portfolio usable in real meetings and compliant with retention.

**Deliverables**
- Portfolio Export job:
  - summary PDF (v1)
  - optional ZIP with evidence + audio (policy-based)
- Export UI:
  - select date range
  - select included categories/standards
  - toggles (reflections/audio)
- Retention warnings on pinned items:
  - show upcoming expiry dates
  - quick link to apply legal hold (if enabled)
- Audit events for export creation and download.

**Engineering Tasks**
- Implement export job worker (reuse DSAR job framework).
- Implement PDF template for portfolio summary.
- Implement bundling logic and secure storage paths.
- Implement retention check queries and UI warnings.
- Load testing: large portfolios and long audio.

**Exit Criteria**
- Teacher can export a semester portfolio summary PDF within a few minutes.
- Export respects policy toggles and retention status is communicated.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Portfolio timeline and filters work for permitted roles.
- Teachers can curate/pin evidence with annotations and categories.
- Reflection capture works when enabled and follows locking rules.
- Export packs generate downloadable artifacts with correct scope and policy toggles.
- Retention interactions warn appropriately and do not break exports.

### Security & Privacy
- Portfolio access is role-gated and tenant-scoped (RLS enforced).
- Student access is disabled by default and must be explicitly enabled.
- Exports are time-limited, access-controlled, and logged.
- DSAR/anonymization compatibility:
  - anonymized users’ portfolios do not leak PII.

### Quality
- Automated tests cover:
  - portfolio permission rules
  - pin limit enforcement
  - export job creation and download authorization
- Observability:
  - export job failures visible to admin/teacher
- Documentation:
  - “Using portfolios for conferences” teacher guide
  - privacy notes for admins

### UX
- Teachers can locate “best evidence” quickly via pinned grouping.
- Reflections are lightweight and non-intrusive when enabled.

---

## Test Checklist (minimum)
- ✅ Teacher pins attempt to portfolio with annotation → shows in portfolio home
- ✅ Student access disabled by default; enabling allows student to view only their own portfolio
- ✅ Student completes post-reflection → teacher sees reflection in evidence view
- ✅ Export portfolio summary PDF → correct categories and date range included
- ✅ Retention warning shows for pinned item nearing deletion; export handles missing assets gracefully
