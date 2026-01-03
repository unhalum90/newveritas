# SayVeritas Enterprise SSO + SCIM — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Implement **Enterprise Identity & Provisioning** for school/district customers:
- **SSO**: SAML 2.0 and/or OIDC login for staff (teachers/admins) via district IdP (Google Workspace, Microsoft Entra ID/Azure AD, Okta, etc.).
- **SCIM 2.0**: automated user provisioning/deprovisioning and group/role assignment from the district directory.
- **RBAC integration**: mapping IdP/SCIM groups → SayVeritas roles (Teacher, School Admin, District Admin, Auditor).
- **Auditability**: logs for authentication and provisioning events (who/what/when).

Non-goals (for this first release):
- Student SSO/provisioning (staff only).
- Deep LMS/SIS integrations (rostering, grade passback).

## REVIEW NOTES
- No SSO/SCIM config or endpoints implemented yet; only `classes.access_mode` includes an `sso` option labeled "future."

---

## Epic
**As a district IT admin**, I want to connect my identity provider to SayVeritas so staff can sign in with district accounts and users are automatically provisioned/deprovisioned, reducing manual account work and improving security.

---

## User Stories

### Story 1 — Configure SSO connection (district admin)
**As a District Admin**, I can create and manage an SSO connection for my district so staff can authenticate using district credentials.

**Acceptance Criteria**
- District Admin can enable/disable SSO per district/tenant.
- Supports **IdP metadata** configuration:
  - SAML: Entity ID, SSO URL, X.509 cert, NameID format (email).
  - OIDC: issuer, client_id, client_secret, redirect URIs.
- Supports **domain allowlist** (e.g., `@district.org`) to prevent wrong-domain access.
- Supports **test mode**:
  - Validate config, perform test login, show clear error messages.
- Supports **fallback login** for break-glass (district admin + internal password/magic link) and can be restricted to specific accounts.

**Notes**
- Prefer isolating SSO per `tenant_id` (district) to avoid cross-tenant access.

---

### Story 2 — SSO login flow (staff user)
**As a Teacher or Admin**, I can sign in with district SSO and land in the correct workspace without additional account setup.

**Acceptance Criteria**
- If user exists, SSO logs them in and routes to last-used workspace (or tenant default).
- If user does not exist but domain matches allowlist:
  - If **SCIM is enabled**, user creation must be SCIM-driven (no auto-create), and UI shows “Ask IT to provision your account.”
  - If SCIM is not enabled, optional “Just-in-Time (JIT) user creation” can be enabled for this tenant.
- Prevent account takeover:
  - Email address must match IdP claim (SAML NameID / OIDC email claim).
  - If email already exists under a different tenant, deny and instruct to contact support.

---

### Story 3 — SCIM: user provisioning & deprovisioning (IT admin)
**As a District IT admin**, I can provision and deprovision staff accounts automatically via SCIM so access is accurate and timely.

**Acceptance Criteria**
- SCIM endpoints implemented (SCIM 2.0):
  - `GET /Users`, `POST /Users`, `PATCH /Users`, `DELETE /Users` (or soft-delete/deactivate).
  - `GET /Groups`, `POST /Groups`, `PATCH /Groups`, `DELETE /Groups`.
- Supports **active/inactive** handling:
  - When user is deactivated (`active=false`), access is revoked immediately.
  - Preserve assessment data (no destructive deletes).
- Idempotency:
  - Repeated SCIM calls do not create duplicates.
- Error handling:
  - Proper SCIM error codes/messages for invalid payloads, conflicts, missing resources.
- Security:
  - SCIM authentication via bearer token per tenant (rotatable), stored securely.

---

### Story 4 — Group → role mapping (district admin)
**As a District Admin**, I can map SCIM groups (or IdP claims) to SayVeritas roles so staff receive correct permissions automatically.

**Acceptance Criteria**
- Admin UI: map one or more external groups to each internal role.
- Supports priority rules (e.g., District Admin overrides Teacher).
- Supports default role if no group matched (optional).
- Role assignment changes on next SCIM sync event or next login (depending on integration path).

---

### Story 5 — Audit logs and observability (security/ops)
**As a Security/IT admin**, I can see who signed in and what provisioning changes occurred to support troubleshooting and compliance.

**Acceptance Criteria**
- Log events (at minimum):
  - SSO connection created/updated/disabled
  - Login success/failure + reason
  - SCIM user created/updated/deactivated
  - SCIM group created/updated/deleted
  - Role assignment changes
- Logs are tenant-scoped and filterable by date, actor, event type.
- Export logs (CSV) for enterprise customers (optional but recommended).

---

## Technical Approach (implementation notes)
This section is intentionally implementation-oriented for the dev team.

### Recommended architecture
- Introduce an **Enterprise Identity** module:
  - `tenants`
  - `sso_connections`
  - `scim_tokens`
  - `external_groups`
  - `role_mappings`
  - `audit_events`

### Auth integration options
- **Option A (fastest):** use an enterprise identity broker (WorkOS, Auth0, Azure AD app registrations) for SSO + SCIM.
- **Option B (more custom):** implement SAML/OIDC and SCIM directly.
- Decision can be made by dev lead; sprint plan assumes Option A first, but can be adapted.

### Data model sketch (Supabase/Postgres)
- `tenants (id, name, ...)`
- `sso_connections (id, tenant_id, type, config_json, domains[], enabled, jit_enabled, created_at, updated_at)`
- `scim_tokens (id, tenant_id, token_hash, last_rotated_at, enabled)`
- `external_groups (id, tenant_id, external_id, display_name)`
- `role_mappings (id, tenant_id, external_group_id, role)`
- `users (id, tenant_id, email, role, status, external_idp_id, external_scim_id, ...)`
- `audit_events (id, tenant_id, actor_user_id, event_type, payload_json, created_at)`

### Security constraints (must)
- Tenant isolation enforced via RLS.
- SCIM token stored hashed; only show last 4 chars on UI.
- Strict domain allowlist + claim validation.
- Break-glass accounts restricted (explicit allowlist per tenant).

---

## Sprint Plan (3 sprints)

### Sprint 1 — Foundations + SSO (Admin-configurable)
**Goal:** A district can configure SSO and staff can sign in via IdP.

**Deliverables**
- DB schema + RLS policies for enterprise identity tables.
- Admin UI (tenant settings):
  - create/update/disable SSO connection
  - domain allowlist
  - test mode validation
  - JIT toggle (off by default)
- SSO login integration:
  - redirect flows, callback handlers, session creation
  - claim mapping (email, name)
- Basic audit events:
  - SSO connection changes
  - login success/failure

**Engineering Tasks**
- Create migration scripts for new tables.
- Implement tenant-scoped admin settings routes/components.
- Implement SSO handshake (SAML or OIDC) and callback endpoints.
- Implement “SSO required” enforcement for tenant when enabled.
- Add structured logging + `audit_events` writes.
- QA: staging tenant with test IdP, regression test standard login.

**Exit Criteria**
- At least one tenant can login end-to-end via SSO in staging.
- No cross-tenant access possible via mis-typed email/domain.
- Audit events written for key actions.

---

### Sprint 2 — SCIM provisioning (Users + Deprovision)
**Goal:** IT admin can provision/deprovision staff automatically; app reflects access changes reliably.

**Deliverables**
- SCIM token issuance/rotation UI (tenant admin only).
- SCIM endpoints for Users:
  - create, update, deactivate
- User lifecycle handling:
  - deactivated users cannot login
  - data retained
- Expanded audit events:
  - user created/updated/deactivated

**Engineering Tasks**
- Implement SCIM auth middleware (tenant token).
- Implement `/scim/v2/Users` endpoints with idempotency.
- Map SCIM user attributes → internal user model.
- Add background safety:
  - rate limits (basic)
  - payload validation
- QA with SCIM client simulator or vendor test harness.

**Exit Criteria**
- Creating user via SCIM results in a usable account.
- Deactivating via SCIM blocks login within 1 minute.
- No duplicates from repeated SCIM calls.

---

### Sprint 3 — Groups/role mapping + Admin polish
**Goal:** Groups drive roles; admins can troubleshoot and operations looks enterprise-ready.

**Deliverables**
- SCIM endpoints for Groups + group membership updates.
- Admin UI for:
  - viewing external groups
  - mapping groups → roles
  - default role behavior
- Audit log viewer with filters + CSV export (optional).
- Documentation for district IT (setup guide: Entra/Google/Okta).

**Engineering Tasks**
- Implement `/scim/v2/Groups` endpoints and membership PATCH logic.
- Role assignment resolver (priority rules).
- Add “Provisioning status” page:
  - last SCIM event time
  - last error
  - active user count
- Finalize audit log UI + export.
- Hardening: better error messages, edge cases, load testing for bursts.

**Exit Criteria**
- Changing group membership updates roles correctly.
- Admin can view who has what role and why (group mapping evidence).
- Setup docs enable an IT admin to complete integration without developer support.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- SSO works for at least one major IdP in staging end-to-end (login + logout).
- SCIM can create/update/deactivate users; deactivated users lose access immediately.
- Group mappings apply roles deterministically and are tenant-scoped.
- Break-glass access exists and is restricted to explicit accounts.

### Security & Compliance
- Tenant isolation verified with RLS + automated tests.
- Domain allowlist and claim validation prevents wrong-tenant logins.
- SCIM tokens are hashed and rotatable; rotation invalidates old tokens.
- Audit logs recorded for all identity/provisioning events.
- No sensitive secrets are ever exposed in UI or logs.

### Quality
- Automated tests:
  - unit tests for claim mapping and role resolution
  - integration tests for SCIM endpoints
- Observability:
  - structured logs for auth/provisioning failures
  - alertable error surface (at minimum, admin-visible “last error”)
- Documentation:
  - district IT setup guide
  - internal runbook for support troubleshooting

### UX
- Admin UI clearly communicates:
  - SSO enabled/disabled state
  - whether JIT is allowed
  - SCIM status and last sync
  - who to contact when login fails

---

## Test Checklist (minimum)
- ✅ SSO login success with correct domain
- ✅ SSO login rejected for non-allowed domain
- ✅ Existing user logs in and lands in correct tenant
- ✅ SCIM creates user → user can login (SSO)
- ✅ SCIM deactivates user → user cannot login
- ✅ SCIM updates name/email (if allowed) → reflected in app
- ✅ Group membership change → role updated
- ✅ Audit events created for all above
