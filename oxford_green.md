# SayVeritas — Oxford Rubric “All Green” Sprint Plan (Dev Team)

**Objective:** Ship the minimum product + documentation changes required to credibly score **Green** on the Oxford Rubric dimensions: **Safety, Efficacy, Accountability, Transparency, Agency**.

**Primary deliverables:** (1) Public assurance pages + homepage updates, (2) Privacy policy + retention/subprocessor accuracy, (3) In-app accountability/agency controls (override, audit log, appeals workflow).

---

## Guiding principles

- **Accuracy over aspiration:** Website and policy must match real system behavior (retention, subprocessors, regions, AI usage).
- **Human-in-the-loop:** Teachers retain final judgement; any AI-supported outputs are reviewable and overrideable.
- **Minimize data:** Default retention and storage must be conservative and configurable for schools.
- **Procurement-ready:** Each claim must be backed by a linkable page and/or downloadable “assurance pack.”

---

## Scope and assumptions

### In scope
- New public pages (AI Safety & Governance; Evidence & Outcomes; AI Use & Limitations)
- Homepage blocks and CTAs linking to those pages
- Privacy policy updates to reflect actual retention and student pseudonymity model
- Subprocessor/transfer transparency table (procurement-friendly)
- In-app: teacher override + reason capture, audit log, appeals/review flow
- In-app: admin/teacher controls that support agency (toggle visibility of AI support, require teacher review)

### Out of scope (for now)
- External certification, formal third-party audit, SOC2/ISO
- High-stakes proctoring claims (“exam security” beyond UI supports)
- Direct-to-consumer under-13 accounts (COPPA parental consent flow)

### Dependencies (confirm current facts)
- Actual audio/transcript retention values and where configured
- Current subprocessor list and DPAs/SCCs status (Cloudflare, OpenAI, SpeechAce, LemonSqueezy, MailerLite, etc.)
- Whether OpenAI is used in SayVeritas (and for what exact functions)

---

# Sprint 1 (1–2 weeks): Public assurance + homepage alignment (Transparency/Safety lift)

## Sprint goal
Make SayVeritas procurement-ready by shipping public pages that clearly explain: **what AI does/doesn’t do, safeguarding posture, limitations, and governance/incident pathways**.

### Ticket 1.1 — New page: “AI Safety & Governance”
**User story:** As a district leader/tech director, I need clear, linkable assurance that the system is safe, governed, and has incident processes so I can approve use.

**Requirements**
- Sections (short, scannable):
  1. Educational purpose & approved use cases
  2. Human responsibility (teacher final judgement)
  3. Safeguards (data minimization, permissions, access controls)
  4. Incident reporting & response (how to report; what happens; timelines; logging)
  5. Escalation route (school → vendor)
  6. Age-appropriate defaults (no open-ended student chat; no advertising)
  7. Data retention options summary (link to policy)
  8. “Request our DPIA / assurance pack” (email link)

**Acceptance criteria**
- Page is live, linked in header/footer and from homepage.
- Language is plain and non-legal; no proctoring/security over-claims.
- Includes explicit “AI is not the evaluator; teacher is.”

---

### Ticket 1.2 — New page: “How AI is used (and not used)”
**User story:** As a teacher/student/parent, I need to understand when AI runs, what it outputs, and its limitations.

**Requirements**
- Bulleted list:
  - When AI runs (e.g., transcription, rubric-aligned scoring support, feedback drafting) — confirm exact list
  - What it does NOT do (no autonomous final grades; no certification)
  - Known limitations (speech recognition errors, accent/dialect, noise, rubric probability)
  - Teacher review/override statement
  - Data use promise (no training on customer content; no advertising)

**Acceptance criteria**
- Page includes a “limitations” section that is honest and specific.
- Linked from homepage and product UI (e.g., “About AI feedback”).

---

### Ticket 1.3 — Homepage updates (block + footer links)
**User story:** As a buyer, I want immediate clarity on AI use, teacher control, and evidence.

**Requirements**
- Add homepage block: “AI that supports judgement, not replaces it.”
- Add 4–6 bullets: human-in-the-loop; reviewable evidence; no advertising; limitation transparency; appeals/override.
- Add CTAs:
  - “Read our AI Safety & Governance”
  - “See evidence & outcomes”
  - “Privacy & data practices”

**Acceptance criteria**
- Homepage provides clear AI disclosure without requiring privacy policy reading.
- Links verified and crawlable.

---

### Ticket 1.4 — “Evidence & Outcomes” mini-page
**User story:** As a school leader, I need a measurable evaluation approach to justify adoption.

**Requirements**
- Include a 30-day evaluation protocol:
  - Speaking minutes per student/week
  - Attempts per student/week
  - Teacher time saved (minutes per student per assessment)
  - Growth trend (rubric score deltas; teacher moderation notes)
- Include “What we will not claim” (no certification; context-dependent outcomes)
- Add a downloadable 1-page evaluation worksheet (Markdown or PDF)

**Acceptance criteria**
- Metrics are measurable using existing logging (or specify Sprint 2 instrumentation gaps).
- Page is linked from homepage and governance page.

---

### Sprint 1 Definition of Done
- All pages live in production
- Homepage updated and links present in footer/nav
- Content reviewed for accuracy against actual system behavior
- Optional: analytics events for page views + CTA clicks

---

# Sprint 2 (1–2 weeks): Privacy policy accuracy + subprocessor clarity (Safety/Transparency to Green)

## Sprint goal
Remove procurement blockers by aligning privacy policy to reality and making subprocessors/retention scannable.

### Ticket 2.1 — Privacy policy corrections (SayVeritas)
**User story:** As a compliance reviewer, I need the policy to match actual retention, processing, and roles.

**Requirements**
- Explicit retention table:
  - Audio retention
  - Transcripts retention (if stored)
  - Derived scores/feedback retention
  - Logs retention
- Clarify student identity model:
  - teacher-created student accounts
  - pseudonymous identifiers / no required real-name login
- Clarify controller/processor roles:
  - school is typically controller; vendor processor
- Add “Automated decision-making” section:
  - no high-stakes automated decisions; teacher final judgement
- Add “How to request deletion/export” steps (school-authorized flows)

**Acceptance criteria**
- Retention statements match configuration in code (verify in settings/env).
- Language is consistent with product reality (no generic placeholders).
- Contact and rights sections accurate for EU/US contexts.

---

### Ticket 2.2 — Public subprocessor + transfer safeguards table
**User story:** As a district procurement officer, I need to see vendors, purposes, data categories, region, and transfer safeguards.

**Requirements**
- Public table:
  - Vendor name
  - Purpose
  - Data categories processed
  - Primary region(s)
  - Safeguards (DPA/SCC/adequacy where applicable)
- Link from Privacy Policy and AI Safety page.

**Acceptance criteria**
- Table includes only vendors actually used.
- Transfer mechanism field is accurate to contracts in place.

---

### Ticket 2.3 — Retention controls (config + UI if not already)
**User story:** As an admin, I need the ability to configure retention for my institution.

**Requirements**
- Confirm existing retention controls; if missing, add:
  - Organization-level retention setting for audio/transcripts
  - Conservative defaults
  - “Delete all student data” tool (admin-only)
- Ensure deletes propagate to storage, DB references, and caches.

**Acceptance criteria**
- Setting exists, test-covered, and reflects in behavior within 24 hours (or immediate).
- Audit log records bulk deletions (if audit log exists; otherwise record internally and add in Sprint 3).

---

### Sprint 2 Definition of Done
- Updated privacy policy deployed
- Public subprocessor table deployed
- Retention controls verified in staging and production
- Internal checklist: “facts verified” signed off (dev + founder)

---

# Sprint 3 (1–2 weeks): In-app Accountability & Agency (Accountability/Agency to Green)

## Sprint goal
Ship the minimum in-app workflows that prove human oversight, contestability, and teacher control.

### Ticket 3.1 — Teacher override + reason capture
**User story:** As a teacher, I need to override AI-supported rubric results and record why.

**Requirements**
- Any AI-supported score/feedback is editable by teacher
- Override requires a reason (dropdown + optional note)
  - Examples: accent/dialect, mic noise, speech impediment/accommodation, off-task response, other
- UI clearly indicates “Teacher-adjusted”

**Acceptance criteria**
- Overrides persist; original AI output preserved for audit.
- Export/reporting reflects final teacher judgement.

---

### Ticket 3.2 — Audit log (assessment evidence trail)
**User story:** As an admin, I need an audit trail for changes affecting assessment outcomes.

**Requirements**
- Immutable log entries for:
  - AI output generated (timestamp, version)
  - Teacher override (before/after, reason, user)
  - Student review request (Ticket 3.3)
  - Deletions (single and bulk)
- Admin view + export (CSV)

**Acceptance criteria**
- Log is queryable by class, student, assignment, date range.
- Access restricted to authorized staff (RLS/permissions).

---

### Ticket 3.3 — Student “Request review” workflow (lightweight)
**User story:** As a student, I can request teacher review if I believe output is inaccurate.

**Requirements**
- Button: “Request review”
- Student enters short note (optional)
- Teacher queue shows pending review items
- Teacher marks: Reviewed / Updated / No change + note
- Recorded in audit log

**Acceptance criteria**
- Workflow works end-to-end and is permissioned.
- No direct student-to-AI chat is required for this.

---

### Ticket 3.4 — Agency controls (teacher/admin toggles)
**User story:** As a teacher/admin, I can control how AI support appears to students.

**Requirements (choose based on product reality)**
- Hide AI score from students (teacher-only)
- Require teacher review before student sees AI feedback
- Disable feedback text generation; keep transcript only
- Limit attempts or require a reflection step before retry

**Acceptance criteria**
- Toggles enforced across UI and API.
- Conservative defaults for minors.

---

### Sprint 3 Definition of Done
- Override, audit log, and review workflow in production
- Permissions tested (teacher/admin/student)
- Documentation updated to reference these features

---

## QA / Test plan (all sprints)

- Automated tests:
  - Retention deletion jobs + storage removal
  - Audit log immutability
  - Permission boundaries (RLS)
- Manual tests:
  - Student cannot self-register
  - Teacher-issued login works without real names
  - Public pages match real vendor list and regions
- Content verification:
  - Every public claim maps to a real feature/config

---

## Release checklist (Oxford “Green” readiness)

- [ ] AI Safety & Governance page live and accurate  
- [ ] AI Use & Limitations page live and accurate  
- [ ] Evidence & Outcomes page live with measurable protocol  
- [ ] Privacy policy retention table matches code settings  
- [ ] Subprocessor table accurate and up to date  
- [ ] Teacher override + audit log + review workflow shipped  
- [ ] No proctoring/security over-claims remain  
- [ ] No direct-to-consumer under-13 sign-up path exists  
