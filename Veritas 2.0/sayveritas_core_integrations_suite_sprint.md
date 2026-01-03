# SayVeritas Core Integrations Suite (Rostering, LMS, SIS Exports, District Data) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Ship the integration set that determines district adoption and renewal:
- **Rostering** via Clever/ClassLink (students + teachers) with nightly sync and exception handling
- **LMS integrations** (Google Classroom + Microsoft Teams for Education as v1; Canvas as v1.5)
  - push assignments
  - return feedback links (and optionally scores)
- **SIS-grade exports** (saved templates/mappings for common SIS import formats; standards-based gradebook exports)
- Optional enterprise: **event stream/webhooks** for district data warehouses

Non-goals (for this release):
- Full bi-directional grade passback for every LMS/SIS
- Real-time sync for every object (nightly + on-demand sync is acceptable in v1)
- Managing district identity here (handled by SSO/SCIM epic)

## REVIEW NOTES
- No Clever/ClassLink, LMS, SIS, or webhook integrations found in code; classes include an `access_mode` enum with an `sso (future)` placeholder only.

---

## Epic
**As a district IT and instructional leader**, I need SayVeritas to fit existing systems (rostering, LMS, SIS) so teachers don’t do duplicate work and deployment scales.

---

## Integration Principles
- **One source of truth for rosters** (Clever/ClassLink) where possible.
- **Clear ownership**:
  - Rostering owns Students, Classes, Enrollments.
  - LMS owns assignment distribution and student entry points.
  - SIS exports handle grade ingestion where automation is not feasible.
- **Auditability + troubleshooting**:
  - every sync has a status, error log, and last successful timestamp.
- **Privacy & least privilege**:
  - request minimal OAuth scopes
  - do not ingest more student demographics than needed (optional, off by default)

---

## User Stories

## A) Rostering (Clever/ClassLink)

### Story A1 — Connect rostering provider (district admin)
**As a District Admin**, I can connect Clever or ClassLink so teachers/classes/students are created automatically.

**Acceptance Criteria**
- Admin can choose provider: Clever or ClassLink.
- OAuth (or supported auth method) connects and stores tenant-scoped credentials securely.
- Admin can configure:
  - which schools to sync (subset selection)
  - which grade bands/courses (optional)
  - whether to sync student emails (optional)
- Shows “connection status” and “last sync” timestamp.

---

### Story A2 — Nightly sync + on-demand sync (system)
**As the system**, I sync rosters nightly and allow an admin to run an on-demand sync for troubleshooting.

**Acceptance Criteria**
- Nightly scheduled sync runs per tenant.
- On-demand “Run sync now” button for admins.
- Sync imports/updates:
  - schools (if applicable)
  - teachers
  - students
  - classes
  - enrollments
- Deprovisioning rules:
  - removed enrollment → student removed from class
  - removed student/teacher → account deactivated (policy-driven; preserve evidence)
- Sync is idempotent; no duplicates on repeated runs.

---

### Story A3 — Exception handling UI (admin)
**As an Admin**, I can resolve roster conflicts and view sync errors quickly.

**Acceptance Criteria**
- “Rostering Health” page shows:
  - last sync status (success/partial/fail)
  - errors with details and suggested fixes
  - unmatched users (“email exists but external ID differs”)
- Conflict resolution tools:
  - link external user to existing internal user
  - ignore record (with reason)
- Audit events recorded for conflict resolutions.

---

## B) LMS Integrations (Google Classroom, Microsoft Teams; optional Canvas)

### Story B1 — Connect LMS provider (teacher or admin)
**As a Teacher (or Admin)**, I can connect my LMS account so I can distribute assignments to students where they already work.

**Acceptance Criteria**
- Teacher connects via OAuth.
- The system lists available classes/courses from LMS and allows mapping to SayVeritas classes.
- The system shows connection status and allows disconnect/reconnect.
- Scopes are minimal and clearly explained.

---

### Story B2 — Push assignment link to LMS
**As a Teacher**, I can push a SayVeritas assignment to my LMS course so students have a single click entry point.

**Acceptance Criteria**
- From assignment page, teacher selects:
  - LMS course
  - due date (optional)
  - instructions (optional)
- System creates an LMS assignment/post containing:
  - assignment title
  - deep link to SayVeritas assignment attempt page
  - instructions text
- Supports re-posting and updating due date (where LMS allows).

---

### Story B3 — Return results link (and optionally score) to LMS
**As a Teacher**, I can return a feedback link to the LMS so students can review evidence and teacher comments.

**Acceptance Criteria**
- After scoring, teacher can “Return to LMS”:
  - posts comment with link to evidence trail
  - optional: posts a score if mapping exists (v1.5)
- Batch return supports returning for a whole class with one action.
- Privacy: links require authentication unless district explicitly allows otherwise.

---

## C) SIS Exports (gradebook + standards)

### Story C1 — Create export templates (admin)
**As an Admin**, I can define saved export templates so teachers don’t struggle with SIS CSV formats.

**Acceptance Criteria**
- Admin can create templates with:
  - SIS name (PowerSchool, Infinite Campus, Aspen, Skyward, etc.)
  - column mapping (student ID, assignment name, score, standard code, date)
  - delimiter and encoding options
- Templates can be district-wide and optionally school-specific.
- Teachers can choose a template when exporting.

---

### Story C2 — Export class scores and standards evidence (teacher)
**As a Teacher**, I can export scores for a class in the correct SIS format quickly.

**Acceptance Criteria**
- Export options:
  - by assignment
  - by date range
  - latest score vs all attempts
  - include standard codes (toggle)
- Exports generate CSV file with chosen template.
- Export is logged in audit events (who exported what, when).

---

## D) District data warehouse hooks (optional enterprise)

### Story D1 — Event stream/webhooks (district IT)
**As a District IT admin**, I can receive events when assessments are completed/scored so we can integrate with our data warehouse.

**Acceptance Criteria**
- Tenant can configure webhook endpoint(s) + secret.
- Events emitted:
  - attempt_submitted
  - attempt_scored
  - score_revised
  - assignment_published
- Payload is tenant-scoped and excludes unnecessary PII by default.
- Delivery:
  - retries with backoff
  - dead-letter queue (v1 simple table)
- Admin can view last 50 webhook deliveries and errors.

---

## Technical Approach (implementation notes)

### Integration hub module
- Centralize integrations in `integrations` module:
  - providers, credentials, mappings, sync logs, error logs

### Data model sketch (Supabase/Postgres)
- `integration_connections (id, tenant_id, type, provider, status, credentials_encrypted, created_at, updated_at)`
- `integration_mappings (id, tenant_id, provider, external_id, internal_id, mapping_type, created_at)`
  - mapping_type: class, user, student, teacher
- `sync_runs (id, tenant_id, provider, started_at, ended_at, status, summary_json, error_count)`
- `sync_errors (id, sync_run_id, severity, entity_type, external_id, message, payload_json)`
- `sis_export_templates (id, tenant_id, scope, name, mapping_json, delimiter, encoding)`
- `webhook_endpoints (id, tenant_id, url, secret_hash, enabled, event_types_json)`
- `webhook_deliveries (id, endpoint_id, event_type, status, attempts, last_error, created_at)`
- Reuse `audit_events`

### Credential security
- Store OAuth tokens encrypted (or via secrets manager).
- Rotate/refresh tokens via provider refresh flows.
- Never expose raw tokens in UI/logs.

### Sync strategy
- Nightly sync via scheduled job per tenant.
- Sync in phases:
  1) schools/classes
  2) users
  3) enrollments
- Idempotent upserts keyed by provider external IDs.

### LMS deep linking
- Use signed deep links containing:
  - assignment_version_id
  - class_id
  - student_id (resolved at runtime)
- Require authentication before accessing recording flow.

---

## Sprint Plan (4 sprints)  *(integrations are large; 4 sprints is realistic)*

### Sprint 1 — Integration foundations + Rostering connect
**Goal:** Connect Clever/ClassLink and run first sync in staging.

**Deliverables**
- Integration connections framework + credential storage.
- Clever or ClassLink connection flow (choose one first; ship second next sprint if needed).
- Initial roster import for:
  - teachers, students, classes, enrollments
- Sync run logs + basic admin “last sync” status.

**Engineering Tasks**
- Build connection UI and OAuth handshake.
- Implement provider API client and import mapper.
- Implement upsert logic and idempotency.
- Create sync_runs and sync_errors logging.
- QA with sandbox district data.

**Exit Criteria**
- A tenant can connect provider and import a full roster without duplicates.
- Last sync status and error count are visible.

---

### Sprint 2 — Rostering hardening + Exception handling UI
**Goal:** Make rostering production-safe and supportable.

**Deliverables**
- Nightly scheduled sync + on-demand sync.
- Deprovisioning policies (enrollment removed, user removed).
- Rostering Health page:
  - error list
  - conflict detection
  - link external user to internal user tool

**Engineering Tasks**
- Implement scheduler and safe retries.
- Implement conflict detection rules (email collisions, external ID mismatch).
- Build admin UI tools for resolution with audit logging.
- Performance testing on large rosters.

**Exit Criteria**
- Admin can resolve common conflicts without developer help.
- Sync is stable across multiple runs and large datasets.

---

### Sprint 3 — LMS v1: Google Classroom push + feedback return
**Goal:** Teachers can distribute assignments and return evidence links via LMS.

**Deliverables**
- Google Classroom OAuth connection + class mapping.
- “Push to Classroom” action from assignment page.
- “Return feedback link” action after scoring (individual + batch).
- Connection status UI and disconnect.

**Engineering Tasks**
- Implement Classroom API client and mapping.
- Build UI for selecting course and posting assignment.
- Implement secure deep links and redirect handling.
- Implement batch return and rate limit handling.

**Exit Criteria**
- A Classroom teacher can push an assignment and students access it successfully.
- Teacher can return evidence links post-scoring.

---

### Sprint 4 — SIS exports + (optional) Teams + webhook hooks
**Goal:** Provide fallback interoperability for districts not using LMS grade passback.

**Deliverables**
- SIS export templates (admin) + teacher export flow.
- Standards evidence included optionally.
- Optional:
  - Microsoft Teams integration (post link)
  - webhooks/event stream for enterprise tenants

**Engineering Tasks**
- Build template builder UI and CSV generator.
- Implement export audit logging.
- If Teams included: OAuth + posting flow.
- If webhooks included: endpoint config + delivery queue + UI log.

**Exit Criteria**
- Teachers can export in district’s chosen format with minimal effort.
- District admins can standardize export formats via templates.
- Optional enterprise hooks function with retries and visibility.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Rostering can import and update teachers/students/classes/enrollments reliably.
- Nightly + on-demand sync exists and is observable.
- LMS can push assignments as deep links and return feedback links.
- SIS exports are configurable via templates and produce correct CSVs.
- (If enabled) Webhooks deliver events with retries and admin visibility.

### Security & Privacy
- All integration data is tenant-scoped and protected by RLS.
- OAuth credentials are encrypted; secrets are never exposed.
- Least-privilege scopes used and documented.
- Deep links require authentication and do not expose PII.

### Quality
- Automated tests cover:
  - idempotent roster sync (no duplicates)
  - conflict detection rules
  - CSV export correctness for sample templates
- Observability:
  - sync_runs and sync_errors show actionable diagnostics
  - integration failures are surfaced in admin UI
- Documentation:
  - district IT setup guides (Clever/ClassLink + Classroom)
  - internal troubleshooting runbook

### UX
- Admins can see connection status and errors quickly.
- Teachers can push and return from a single, obvious place in the UI.

---

## Test Checklist (minimum)
- ✅ Connect rostering provider → import roster → run again → no duplicates
- ✅ Enrollment removed in provider → removed from class in SayVeritas
- ✅ Admin views Rostering Health → resolves a conflict → audit logged
- ✅ Teacher connects Classroom → maps course → pushes assignment link
- ✅ Student clicks link → authenticates → lands on correct assessment
- ✅ Teacher returns evidence link (single + batch)
- ✅ Export CSV using template → file matches expected column mapping
