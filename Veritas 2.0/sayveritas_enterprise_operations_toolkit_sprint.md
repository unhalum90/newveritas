# SayVeritas Enterprise Operations Toolkit (Deployment, Onboarding, Implementation Health, Support Runbooks) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Create the operational layer districts expect so rollout is predictable and supportable:
- **District deployment checklist + rollout modes** (pilot → scale)
- **In-app IT/Admin onboarding** (SSO/SCIM, rostering, policies, integrations)
- **Implementation health dashboard** (adoption, usage, risk flags, completion status)
- **Support runbooks + guided diagnostics** (self-serve troubleshooting + support context)

Non-goals (for this release):
- Full professional services project management suite
- Automated ticket routing into every ITSM (we’ll start with structured support requests)
- Advanced in-app training courses (we’ll provide guided onboarding steps and quick videos/links)

## REVIEW NOTES
- Teacher onboarding flow and teacher tour are implemented (multi-step onboarding, guided tour).
- Teacher dashboard provides quick stats and recent activity; help/support page exists with contact link.
- Platform admin support + logs pages exist (support queue, integrity events, system logs), but no district rollout checklist or implementation health dashboard yet.

---

## Epic
**As a district leader and IT/admin team**, I need a clear rollout path and visibility into implementation health so adoption is successful, support load is low, and renewals are easy.

---

## Core Principles
- “Enterprise” experience = **predictability** + **visibility** + **repeatability**.
- Every step should answer:
  - What’s done?
  - What’s next?
  - What’s blocked and why?
- Health dashboard should focus on **actionable** metrics, not vanity charts.

---

## User Stories

## A) Deployment Checklist + Rollout Modes

### Story A1 — Rollout modes (district admin)
**As a District Admin**, I can choose a rollout mode so the system and dashboards match our implementation approach.

**Acceptance Criteria**
- Rollout modes:
  - Pilot (1–3 schools or selected teachers)
  - Phased (school-by-school)
  - Full district launch
- Mode determines default health metrics and onboarding steps (e.g., pilot focuses on early activation, full launch on coverage).
- Mode can be changed later (audited).

---

### Story A2 — Deployment checklist (district admin)
**As a District Admin**, I can follow a deployment checklist so I don’t miss critical setup items.

**Acceptance Criteria**
Checklist includes:
1) Confirm tenant setup (schools, admins)
2) Configure SSO/SCIM (if used)
3) Connect rostering (Clever/ClassLink) or manual import
4) Configure policies (retention, subgroup reporting, practice mode, etc.)
5) LMS integration (Classroom/Teams/Canvas)
6) Pilot: assign first assessment template
7) Review initial results + adjust
8) Scale: invite/activate teachers
9) Month 1 health check
10) Month 3 impact snapshot

Each item has:
- status (not started / in progress / complete / blocked)
- owner role suggestion
- “how-to” link
- last updated timestamp

---

## B) In-app IT/Admin Onboarding (Guided Setup)

### Story B1 — Admin onboarding wizard (district admin)
**As a District Admin**, I can complete a guided setup wizard that walks me through identity, rostering, and policies.

**Acceptance Criteria**
- Wizard is role-gated and tenant-scoped.
- Wizard steps:
  - Add admin contacts
  - Choose rollout mode
  - Configure SSO/SCIM (link to module; show status)
  - Connect rostering provider (status)
  - Configure retention policies (status)
  - Configure integrations (LMS/SIS exports; status)
  - Invite pilot teachers / activate rostered teachers
- Each step has:
  - “Start” action
  - “Mark complete” only when system validates completion (where possible)
- Wizard can be resumed and shared with other admins (multi-admin coordination).

---

### Story B2 — “Implementation status” banners (admins/teachers)
**As an Admin**, I can see banners prompting next steps when key configuration is missing so we avoid silent failure.

**Acceptance Criteria**
- If SSO enabled but rostering not connected → show banner with next action.
- If teachers active but no assignments created → “Create first assessment” banner.
- If high failure rate uploads → show “Recording diagnostics” banner.
- Banners are dismissible and track dismissal per user.

---

## C) Implementation Health Dashboard

### Story C1 — Health overview (district admin)
**As a District Admin**, I can see adoption and usage health indicators so I can intervene early.

**Acceptance Criteria**
Dashboard includes (v1):
- Activation:
  - % teachers activated (logged in last 14 days)
  - # schools onboarded (if multi-school)
- Usage:
  - assessments assigned (last 7/30 days)
  - submissions completed
  - scoring completion rate (submitted vs scored)
- Quality/Risk flags:
  - high upload failure rate
  - high resubmit requests
  - low standards coverage (if required standards configured)
- Implementation checklist completion percentage
- “Top blockers” list (e.g., no rostering, no LMS mapping)

All metrics are filterable by school (district admins).

---

### Story C2 — Teacher adoption view (school admin)
**As a School Admin**, I can see which teachers are not active so I can support them.

**Acceptance Criteria**
- Lists teachers with:
  - last login
  - # assignments created
  - # submissions received
  - # scored
- Flags teachers who need outreach:
  - not logged in
  - created no assignments
  - long scoring backlog
- Export list for follow-up (CSV).

---

### Story C3 — “Implementation health score” (simple, explainable)
**As a district leader**, I can see a single health indicator with contributing factors so the status is immediately clear.

**Acceptance Criteria**
- Health score is a weighted index (0–100) built from:
  - activation rate
  - usage rate
  - scoring timeliness
  - failure rate
  - checklist completion
- UI shows top 3 drivers of score and recommended actions.
- Score is not shown to teachers by default (admin-only).

---

## D) Support Runbooks + Guided Diagnostics

### Story D1 — In-app diagnostics panel (admin/support)
**As an Admin**, I can run guided diagnostics so issues can be resolved quickly or escalated with context.

**Acceptance Criteria**
Diagnostics include:
- Identity check:
  - SSO status
  - last login errors
- Rostering check:
  - last sync status
  - error counts and top errors
- Recording check:
  - upload failure rate (last 7 days)
  - common error messages
- Reporting check:
  - last aggregation status (if reporting pipeline exists)

Panel provides:
- “Copy diagnostic summary” button for support.
- Links to relevant fix actions.

---

### Story D2 — Support request with structured context (teacher/admin)
**As a user**, I can submit a support request that includes structured diagnostics so support resolution is faster.

**Acceptance Criteria**
- Support request form includes:
  - category, severity, description
  - optional screenshot upload
  - auto-attaches context:
    - tenant_id, user_id
    - browser/device info
    - last 50 relevant errors (scoped)
    - feature flags/policies enabled
- Creates a support event log entry and audit event.
- Confirmation message includes tracking ID (internal reference).

---

### Story D3 — Internal runbook + playbooks (support team)
**As support/ops**, we have internal runbooks for common issues to ensure consistent, fast resolution.

**Acceptance Criteria**
- Runbooks stored in repo or internal docs:
  - SSO misconfig, SCIM conflicts
  - rostering sync failures
  - recording/upload failures
  - reporting discrepancies
  - invoice/PO issues
- Each runbook includes:
  - symptoms
  - checks
  - resolution steps
  - escalation criteria
- Runbooks reference diagnostic panel outputs.

---

## Technical Approach (implementation notes)

### Data model sketch (Supabase/Postgres)
- `rollout_settings (tenant_id, mode, pilot_school_ids_json, updated_by, updated_at)`
- `deployment_checklist_items (id, tenant_id, item_key, status, owner_role, blocked_reason, updated_by, updated_at)`
- `onboarding_progress (tenant_id, current_step, completed_steps_json, updated_at)`
- `health_metrics_daily (tenant_id, school_id, metrics_json, computed_at)`
- `health_score_daily (tenant_id, school_id, score, drivers_json, computed_at)`
- `support_requests (id, tenant_id, requester_user_id, category, severity, description, context_json, status, created_at)`
- Reuse:
  - `sync_runs`, `sync_errors`, `audit_events`, reporting facts

### Metrics computation
- Compute daily (scheduled job) and cache results for fast dashboards.
- Keep raw event tables as source; store computed summaries in `health_metrics_daily`.

### Health score weights (example; tune later)
- activation 25%
- usage 25%
- scoring timeliness 20%
- failure rate 15%
- checklist completion 15%
Expose weights internally, not in UI (v1).

---

## Sprint Plan (3 sprints)

### Sprint 1 — Checklist + Rollout mode + Onboarding wizard skeleton
**Goal:** Give admins a clear, guided path to launch.

**Deliverables**
- Rollout mode selection + storage.
- Deployment checklist UI with statuses and help links.
- Onboarding wizard skeleton that links to existing modules and validates completion where possible.
- Basic “missing setup” banners.

**Engineering Tasks**
- Implement rollout settings + checklist tables + RLS.
- Build checklist UI and wizard framework.
- Implement validation hooks (SSO configured? rostering connected? policies set?).
- Add banner rules and dismissal tracking.

**Exit Criteria**
- A district admin can see exactly what’s left to set up and in what order.
- Wizard can be resumed and reflects current state accurately.

---

### Sprint 2 — Health dashboards (v1) + adoption lists
**Goal:** Provide actionable implementation visibility for district and school admins.

**Deliverables**
- Daily health metrics job + cached tables.
- District Health Overview dashboard.
- School Admin “Teacher adoption” list with filters and CSV export.
- “Top blockers” and “recommended next steps” panels.

**Engineering Tasks**
- Define metrics queries and build scheduled computation.
- Build dashboard pages and role-based scoping.
- Implement adoption list + exports.
- Performance optimization for multi-school districts.

**Exit Criteria**
- Admin can identify inactive teachers and scoring backlogs quickly.
- Metrics load fast and match underlying data.

---

### Sprint 3 — Diagnostics panel + structured support + health score
**Goal:** Reduce support burden and make escalations high-signal.

**Deliverables**
- Diagnostics panel with copyable summaries.
- Support request form that attaches context automatically.
- Internal runbook templates and initial set of runbooks.
- Health score (0–100) with drivers and action recommendations.

**Engineering Tasks**
- Implement diagnostics queries pulling from auth logs, sync logs, upload failure logs, reporting status.
- Build support request flow and storage.
- Implement health score computation and “drivers” extraction logic.
- Create runbook docs and link them to diagnostics outputs.

**Exit Criteria**
- A support request includes enough context to reproduce/troubleshoot without multiple emails.
- Health score provides accurate directionality and doesn’t produce misleading results.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- District admins can select rollout mode and track deployment via checklist.
- Onboarding wizard guides admins through required setup and reflects real system status.
- Health dashboard provides actionable adoption/usage/risk metrics.
- Diagnostics panel surfaces common failure points with copyable summaries.
- Support request includes structured context and produces trackable records.

### Security & Privacy
- All operational dashboards and diagnostics are tenant-scoped and role-gated.
- Diagnostics avoid exposing student PII; use aggregates and scoped error snippets.
- Support request context is minimized to what’s necessary and follows retention rules.
- All admin actions (mode changes, checklist edits) are audit logged.

### Quality
- Automated tests cover:
  - checklist state transitions
  - metrics computation for sample datasets
  - role-based visibility (teacher vs school admin vs district admin)
- Observability:
  - scheduled jobs failures visible to admins
  - dashboards handle missing data gracefully
- Documentation:
  - district deployment guide
  - internal support runbook set

### UX
- Admin sees “what’s next” clearly with minimal clicks.
- Health dashboard uses plain language and recommended actions, not just charts.

---

## Test Checklist (minimum)
- ✅ Set rollout mode → checklist updates and wizard reflects correct steps
- ✅ Connect rostering/SSO → wizard marks steps complete automatically
- ✅ Health dashboard shows activation/usage/scoring backlog accurately
- ✅ Diagnostics panel identifies last sync error and upload failure rate
- ✅ Submit support request → includes context_json + tracking ID and is audit logged
