# SayVeritas Reliability + Procurement (SLA, Status, Enterprise Billing) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Create an enterprise-ready **Reliability & Procurement** layer that removes buying friction and increases confidence:
- **Public status page** + incident history
- **In-product uptime/SLA reporting** for tenant admins (basic)
- **Support & incident workflows** (runbooks + contact routing)
- **Enterprise billing**: Purchase Orders, invoicing, multi-school rollups, renewals, usage caps/alerts

Non-goals (for this release):
- Full ITSM ticketing system replacement (we’ll integrate later if needed)
- Complex revenue recognition automation
- Multi-currency tax/VAT logic beyond what current payments stack handles (this is a procurement workflow layer)

## REVIEW NOTES
- Platform admin "System Logs" and "Support Queue" pages exist (system_logs/admin_audit_trail/support_tickets references), providing partial incident/support visibility.
- No public status page, SLA tiers, or billing/procurement workflows found.

---

## Epic
**As a district procurement/IT leader**, I need predictable reliability and procurement-friendly billing so SayVeritas can be purchased, renewed, and trusted at scale.

---

## User Stories

### Story 1 — Public Status Page (Ops)
**As a user or IT admin**, I can view a status page showing current system health and incident history so I can trust availability claims and troubleshoot quickly.

**Acceptance Criteria**
- Public URL accessible without login.
- Shows component-level status (at minimum):
  - Web app
  - API
  - Audio upload/processing
  - Reporting
- Shows incident timeline with:
  - start/end time
  - impact level
  - brief summary
  - post-incident notes (optional)
- Supports maintenance windows announcements.

Implementation note:
- Can be implemented via external provider (Statuspage, Better Stack, Instatus) OR a minimal internal status page backed by a simple table.

---

### Story 2 — Tenant Admin Uptime View (School/District admin)
**As a District Admin**, I can see uptime metrics and recent incidents relevant to my tenant to support internal reporting.

**Acceptance Criteria**
- In-product “Reliability” panel visible to District Admin/Auditor roles.
- Shows:
  - last 30/90 days uptime (global)
  - last incidents list with links to status page entries
  - optional: “tenant-specific incidents” if available (initially global is acceptable)
- Clear explanation of calculation and limitations (“platform-wide uptime”).

---

### Story 3 — SLA Tier + Support Routing (Enterprise)
**As an enterprise customer**, I can have an SLA tier that defines response targets and dedicated support routing.

**Acceptance Criteria**
- Tenant setting: SLA tier (None, Standard, Enterprise).
- SLA tier controls:
  - support response target labels (e.g., 1 business day vs 4 hours)
  - visible support contact method (email, form, phone optional)
- Support requests generated from in-app form include:
  - tenant_id, user_id, environment metadata
  - category (login, recording, reporting, billing)
  - severity (P1–P4)
- Support request creation emits an audit event.

Non-goal:
- Automated on-call paging (can be later).

---

### Story 4 — Purchase Order (PO) billing workflow
**As a procurement officer**, I can buy SayVeritas with a PO and receive an invoice rather than using a credit card.

**Acceptance Criteria**
- Tenant can be marked “Invoice/PO Billing” with:
  - billing contact(s)
  - PO number
  - billing address
  - renewal date
  - invoice schedule (annual, semi-annual)
- System can generate an invoice record (PDF or structured) with:
  - vendor details
  - customer details
  - line items (licenses, add-ons)
  - due date
  - amount and currency
- Admin can download invoice and see paid/unpaid status (manually updated in v1 is acceptable).
- All billing artifacts are tenant-scoped.

Implementation note:
- “Paid” status can be toggled by internal admin in v1.

---

### Story 5 — Multi-school rollups (District dashboard)
**As a District Admin**, I can see usage and licensing across multiple schools under one district contract.

**Acceptance Criteria**
- District tenant can link multiple “school workspaces” (or sub-tenants).
- Rollup dashboard shows:
  - active staff users by school
  - assessment volume by school (last 30/90 days)
  - storage usage estimates (optional)
- Filterable by school, date range, role.

---

### Story 6 — Usage caps + alerting (cost control)
**As a District Admin**, I can set usage caps and receive alerts so costs remain predictable.

**Acceptance Criteria**
- Configurable caps per tenant:
  - maximum active staff users
  - monthly assessment volume (optional)
  - storage budget (optional)
- Alerts:
  - at 80% and 100% thresholds
  - in-app notification + email to billing contacts
- On cap reached, behavior is configurable:
  - soft cap (warn only)
  - hard cap (block new assignments / new users)
- All cap events logged in audit events.

---

## Technical Approach (implementation notes)

### Recommended architecture
- Create a **billing_ops** module (tenant-scoped) separate from payments processor:
  - stores procurement metadata, invoices, renewal dates, caps
- Status page can be external; store link and incident IDs in DB for in-app display.

### Data model sketch (Supabase/Postgres)
- `status_incidents (id, external_id, title, status, started_at, ended_at, impact, url)` (optional if we ingest incidents)
- `sla_tiers (id, name, p1_target, p2_target, ...)` (or enum)
- `tenant_billing_profiles (id, tenant_id, billing_mode, billing_contacts_json, po_number, billing_address_json, renewal_date, invoice_schedule, created_at, updated_at)`
- `invoices (id, tenant_id, invoice_number, issue_date, due_date, currency, amount, status, pdf_url, line_items_json)`
- `district_school_links (district_tenant_id, school_tenant_id)`
- `usage_caps (id, tenant_id, cap_type, cap_value, threshold_80_sent_at, threshold_100_sent_at, enforcement_mode)`
- `audit_events` (reuse)

### Implementation principles
- Procurement workflows must be **auditable** and **exportable**.
- Keep v1 flexible: store “invoice pdf” as generated file OR simple template.
- Do not block core product flows unless hard cap is enabled.

---

## Sprint Plan (3 sprints)

### Sprint 1 — Status + Reliability Surface
**Goal:** Visible reliability trust signals: status page + in-product panel.

**Deliverables**
- Public status page (external provider or minimal internal).
- Incident list surfaced in-product (link out is acceptable).
- “Reliability” panel for District Admin/Auditor:
  - uptime statement (static v1, measured v2)
  - recent incidents list
  - maintenance notices

**Engineering Tasks**
- Choose status provider OR implement minimal internal status page.
- If external:
  - store status URL and incident feed endpoint
  - implement ingestion job (optional)
- Build Reliability UI panel.
- Add audit events for maintenance notice changes (if editable).

**Exit Criteria**
- Anyone can access status page URL and see current state.
- District Admin can view reliability panel and click to incident details.

---

### Sprint 2 — PO Billing + Invoice Records
**Goal:** Enable districts to buy via PO and manage invoice artifacts.

**Deliverables**
- Tenant billing profile UI:
  - billing mode (card vs invoice/PO)
  - contacts, PO number, address, renewal date
- Invoice record creation UI (internal admin or district admin depending on workflow).
- Invoice PDF generation (template-based) or stored upload.
- Invoice list + download in tenant admin area.
- Audit events for invoice creation/updates.

**Engineering Tasks**
- Implement billing profile table + RLS.
- Build admin UI forms for billing profiles and invoices.
- Implement PDF generation template (if chosen) using server-side function OR upload workflow.
- Implement invoice numbering logic (tenant + year sequence).
- QA: tenant-scoped access and invoice downloads.

**Exit Criteria**
- A district tenant can be set to PO mode and has an invoice record downloadable.
- Audit logs reflect invoice creation and status changes.

---

### Sprint 3 — District rollups + caps/alerts
**Goal:** District-level oversight plus predictable cost controls.

**Deliverables**
- District ↔ school linking UI (internal admin first; district admin optional).
- District rollup dashboard:
  - usage by school
  - active users by role
  - assessment volume by date
- Caps & alerts:
  - configure caps
  - threshold notifications (in-app + email)
  - enforcement behavior for hard caps

**Engineering Tasks**
- Implement district-school link model and permissions.
- Implement rollup queries (materialized views optional).
- Implement notification system (email + in-app).
- Implement cap checks in critical actions:
  - creating assignment
  - adding user
- Add audit events for cap threshold and enforcement actions.
- Load/performance testing for rollups.

**Exit Criteria**
- District admin can see rollups across linked schools.
- Caps trigger alerts at 80% and enforce at 100% when hard cap is set.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Status page exists and is accurate; incidents have clear timestamps.
- In-product reliability panel is visible to correct roles and links to incident history.
- PO billing profile supports procurement-required fields.
- Invoice records are downloadable and tenant-scoped.
- District rollups compute correctly across linked schools.
- Caps and alerts behave according to configuration.

### Security & Auditability
- All procurement/billing/reliability actions are tenant-scoped.
- Invoices and billing data are protected by RLS and role checks.
- All invoice changes, cap events, and SLA changes create audit events.
- Email alerts go only to verified billing contacts for the tenant.

### Quality
- Automated tests cover:
  - invoice numbering rules
  - tenant scoping for billing downloads
  - cap enforcement logic
- Observability:
  - failures in invoice generation or email alerting are logged and admin-visible.
- Documentation:
  - procurement quick-start (“how to buy with PO”)
  - internal support playbook for invoices/caps.

---

## Test Checklist (minimum)
- ✅ Status page loads publicly and shows correct component states
- ✅ In-product reliability panel loads and links to incident history
- ✅ Create billing profile in PO mode and generate invoice record
- ✅ Invoice PDF download works and is tenant-scoped
- ✅ District rollup displays correct totals across schools
- ✅ Caps trigger 80% alert and enforce at 100% when configured
