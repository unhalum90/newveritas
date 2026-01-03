# SayVeritas Compliance + Trust Admin Center — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Build an **enterprise-grade Compliance + Trust layer** that enables districts/schools to adopt SayVeritas with confidence and reduces procurement friction.

This deliverable includes:
- **Data Privacy Admin Center** (GDPR/FERPA workflows)
- **Data retention + deletion controls**
- **Security & trust artifacts** surfaced in-product (what IT/procurement expects)
- **Accessibility baseline** (WCAG-aligned UX foundations)

Non-goals (for this release):
- Full GRC automation platform
- Student-parent consent management (can be a later module if needed)
- Formal certification (SOC 2 / ISO 27001) — we prepare foundations and artifacts

## REVIEW NOTES
- Platform-admin DSAR endpoints exist for export (`/api/admin/export-user`) and delete (`/api/admin/delete-user`) of student data (JSON output + storage cleanup).
- Retention defaults live on `schools` (`retention_audio_days`, `retention_transcript_days`, `retention_log_days`), but there is no admin UI or scheduler yet.
- Trust artifacts exist as static docs/pages (`security.md`, privacy policy), plus platform admin logs/support pages for audit/ops context.

---

## Epic
**As a district compliance/IT lead**, I want clear privacy controls, retention rules, and auditability so SayVeritas can be approved, deployed, and defended during audits with minimal back-and-forth.

---

## User Stories

### Story 1 — Privacy Admin Center home (district admin)
**As a District Admin**, I can access a single “Privacy & Compliance” area that explains what data exists and provides export/delete/retention actions.

**Acceptance Criteria**
- Visible only to authorized roles (District Admin, Auditor).
- Shows a “Data map” summary:
  - user accounts
  - audio recordings
  - transcripts (if applicable)
  - rubric scores/feedback
  - audit logs
- Provides quick actions:
  - Export user data (DSAR)
  - Delete/anonymize user data (DSAR)
  - Configure retention policy
  - Download/print DPA + subprocessor list
- Shows last 10 compliance actions (who did what, when).

---

### Story 2 — DSAR export (single user)
**As a District Admin**, I can export all data associated with a user to satisfy a data access request.

**Acceptance Criteria**
- Export by user (search by email / user ID).
- Export includes (tenant-scoped):
  - profile details
  - assignments attempted/created (as relevant)
  - audio file references (or zipped audio if allowed by policy)
  - transcripts (if stored)
  - rubric results and teacher feedback
  - timestamps and metadata
- Export runs asynchronously and produces a downloadable archive.
- Admin receives a clear completion state + error state.
- Export is logged in audit logs (event type, actor, target user, timestamp).

Implementation note:
- Provide two export modes:
  - **Metadata only** (default for strict policies)
  - **Include audio** (toggle if district permits)

---

### Story 3 — DSAR delete/anonymize (single user)
**As a District Admin**, I can delete or anonymize a user’s personal data while preserving aggregate reporting and academic records as required.

**Acceptance Criteria**
- Two options per request:
  1) **Deactivate + anonymize PII** (recommended default)
  2) **Hard delete** (only if tenant policy allows and data model supports it safely)
- Anonymize replaces:
  - name → “Deleted User ####”
  - email → hashed placeholder
  - external IDs → removed
- Academic evidence handling is policy-driven:
  - audio/transcripts removed if policy requires
  - rubric scores retained as de-identified evidence if permitted
- Action requires confirmation step and reason capture.
- Action logged in audit logs with actor + reason + scope.
- User cannot log in after action.

---

### Story 4 — Retention policy controls (tenant-level)
**As a District Admin**, I can define retention rules for recordings and transcripts so storage and privacy match district policy.

**Acceptance Criteria**
- Configurable at tenant level:
  - Audio retention duration (e.g., 30/90/180/365 days, custom)
  - Transcript retention duration (if stored separately)
  - Audit log retention duration (longer by default)
- Policy supports “legal hold” override (freeze deletion for a subset of classes/users, admin-only).
- Automated deletion job runs on schedule and produces deletion audit events.
- UI shows:
  - current policy
  - upcoming deletion counts (preview)
  - last deletion run status

---

### Story 5 — Trust Center artifacts (procurement-ready)
**As a district IT/procurement stakeholder**, I can quickly view and download key trust information needed for approval.

**Acceptance Criteria**
- In-product Trust Center includes:
  - subprocessor list (name, purpose, data categories)
  - data residency notes (where primary systems are hosted)
  - security controls summary (encryption, access control, backups)
  - incident response overview (high-level)
  - contact for security questions
- District Admin can download a **single PDF bundle** (or zipped docs) containing:
  - DPA template (or links)
  - subprocessor list
  - security overview
  - accessibility statement (if available)
- All items are tenant-agnostic except where policy differs (e.g., retention).

---

### Story 6 — Accessibility baseline (WCAG-aligned essentials)
**As a student or teacher using assistive technology**, I can complete core flows with keyboard navigation and readable UI.

**Acceptance Criteria**
- Keyboard navigation works across:
  - login
  - assignment list
  - recording flow
  - rubric/feedback review
- Semantic landmarks and labels added to key components.
- Color contrast issues resolved for core pages.
- Captions/transcripts:
  - If transcripts are shown, they must be screen-reader accessible.
- Accessibility issues tracked via a checklist and signed off for “core flows”.

---

## Technical Approach (implementation notes)

### Recommended architecture
- New module: `compliance_center`
  - DSAR job queue + downloadable artifacts
  - retention scheduler (cron/edge scheduled task)
  - “trust center” content store (versioned)
  - audit events (reuse existing audit_events from SSO work)

### Data model sketch (Supabase/Postgres)
- `retention_policies (id, tenant_id, audio_days, transcript_days, audit_days, created_at, updated_at)`
- `legal_holds (id, tenant_id, scope_type, scope_id, reason, created_by, created_at, released_at)`
- `dsar_jobs (id, tenant_id, job_type, target_user_id, status, result_url, error, requested_by, requested_at, completed_at)`
- `trust_documents (id, doc_type, version, content_url, updated_at)`
- `audit_events` (reuse; add event types for DSAR/retention)

### Storage handling
- Exports written to a secure storage bucket path scoped by tenant and job ID.
- Presigned URL with short TTL for download.
- DSAR exports auto-expire (e.g., 7–14 days) and are logged when downloaded.

### Deletion strategy (safe by default)
- Default to **anonymization + deactivation** rather than destructive deletes.
- For audio/transcripts:
  - delete storage objects
  - preserve de-identified result rows if policy allows
- Ensure deletion jobs are idempotent.

---

## Sprint Plan (3 sprints)

### Sprint 1 — Privacy Center + Retention foundations
**Goal:** Admin can see the compliance center and configure retention; automated deletions start safely.

**Deliverables**
- DB tables + RLS for retention policies, legal holds, dsar_jobs.
- Privacy & Compliance UI shell:
  - data map summary
  - retention policy editor
  - “recent actions” list (from audit events)
- Scheduled retention deletion job (audio/transcripts) with preview counts.
- Audit events for policy changes + deletion runs.

**Engineering Tasks**
- Create migrations + RLS policies.
- Implement retention editor UI with validation.
- Implement scheduled job runner (daily) + dry-run preview.
- Implement deletion logic for storage objects + DB metadata updates.
- Add audit events and admin-facing “last run status”.

**Exit Criteria**
- Tenant can set retention policy.
- Job runs in staging and deletes eligible audio objects safely.
- Legal hold prevents deletion for scoped items.

---

### Sprint 2 — DSAR export + delete/anonymize
**Goal:** Admin can fulfill access and deletion requests with clear records and minimal risk.

**Deliverables**
- DSAR export job:
  - metadata-only export (phase 1)
  - optional include-audio (phase 2 if feasible in sprint)
- DSAR anonymize/deactivate workflow:
  - confirmation + reason capture
  - storage deletion for user-owned artifacts (policy-based)
- Job status UI:
  - queued/running/completed/failed
  - download with expiring link
- Audit events for all DSAR actions.

**Engineering Tasks**
- Implement DSAR job worker and packaging (zip).
- Implement anonymization function (DB + storage).
- Implement admin UI for DSAR request submission and status.
- Add safeguards:
  - role checks
  - rate limits
  - double confirmation for destructive actions
- QA scenarios for edge cases (shared artifacts, cross-class references).

**Exit Criteria**
- Export completes successfully for a real tenant dataset.
- Anonymize blocks login and removes PII.
- All actions are audit logged with actor + target.

---

### Sprint 3 — Trust Center + Accessibility baseline
**Goal:** Procurement-ready artifacts exist in-product; core flows meet accessibility essentials.

**Deliverables**
- Trust Center page with downloadable bundle.
- Subprocessor list + security overview content structure (versioned).
- “Data residency” and “incident response overview” text surfaced.
- Accessibility remediation for core flows + checklist sign-off.

**Engineering Tasks**
- Implement trust document storage/versioning.
- Build UI for Trust Center with download bundle action.
- Add a lightweight internal admin tool to update trust content (optional).
- Run accessibility audit (manual + automated checks) on core flows.
- Fix issues and document accessibility statement for v1.

**Exit Criteria**
- Trust Center can be shown to an IT director and answers 80% of first-pass procurement questions.
- Keyboard-only user can complete core flows.
- Accessibility checklist stored and signed off internally.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Privacy & Compliance Center is accessible to District Admin/Auditor roles only.
- Retention policies are enforceable and deletions are automated with legal hold support.
- DSAR workflows produce export artifacts and/or anonymize users reliably.
- Trust Center provides current subprocessor/security artifacts and downloadable bundle.

### Security & Privacy
- All actions are tenant-scoped and enforced by RLS.
- DSAR exports are time-limited and access-controlled (presigned URLs).
- Deletion/anonymization is idempotent and does not break reporting.
- Every compliance action is written to `audit_events` with actor, target, and reason (where applicable).

### Quality
- Automated tests:
  - retention selection logic
  - anonymization function
  - DSAR export job generation (happy path + failure path)
- Observability:
  - admin-visible job status
  - structured logs for failures
- Documentation:
  - district-facing “How to request export/delete”
  - internal runbook for support

### Accessibility
- Core flows pass keyboard navigation checks and have proper labels/semantics.
- Known accessibility issues are tracked; “core flows” checklist is complete.

---

## Test Checklist (minimum)
- ✅ Set retention policy and confirm deletion job respects it
- ✅ Legal hold prevents deletion for scoped class/user
- ✅ DSAR export generates archive and expires link after TTL
- ✅ DSAR anonymize removes PII and prevents login
- ✅ Audit logs contain all actions with correct scoping
- ✅ Keyboard-only navigation through login and assignment flows works
