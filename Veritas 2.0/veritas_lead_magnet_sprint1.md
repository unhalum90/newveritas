# Veritas Lead Magnet: “Upload an Assessment → Get Veritas Oral Versions”
Sprint package: User Story + Sprint Plan + Definition of Done (DoD)

Owner: Product  
Team: Full‑stack (Next.js) + AI/prompting + UX + QA  
Target: Public lead magnet page (no login required) that converts teachers into email leads and Veritas trials.

---

## 1) Primary User Story

### User story
As a teacher, I want to upload or paste my existing assessment so that I receive several Veritas-ready oral assessment versions (prompts + rubric suggestions) aligned to my original intent, so I can improve integrity and reduce grading time without redesigning my whole unit.

### Success criteria (product)
- Teachers can submit an assessment in < 2 minutes.
- System returns a high-quality “conversion kit” that is specific to the uploaded assessment (not generic).
- Teacher must provide an email to receive the full kit (lead capture).
- Teacher can copy prompts/rubric to clipboard.
- Clear privacy guidance: assessment-only; no student identifiers; retention policy.

### Non-goals (for Sprint 1)
- No classroom roster / student accounts
- No direct LMS integration
- No paid gating
- No multi-assessment “packs”
- No teacher dashboard (optional lightweight admin view only)

---

## 2) Functional Requirements (MVP)

### Inputs
Teachers can submit **one** assessment via:
1) Paste text into a box  
2) Upload PDF  
3) Upload DOCX

Optional (but recommended) metadata fields:
- Subject (dropdown + “Other”)
- Grade band (Elem / Middle / HS / Higher Ed)
- Time per student (1–2 min, 3–5 min, 6–8 min)
- Goal (Integrity check / Reasoning / Fluency / Content mastery)

### Processing
- Extract and normalize assessment text.
- Detect assessment type(s): MCQ, short answer, essay prompt, worksheet, lab report, DBQ, etc.
- Generate a **Conversion Kit** (see outputs) with consistent structure and quality.

### Outputs (Conversion Kit)
Minimum output sections (always included):
1) **Quick diagnosis** (what the original assessment is measuring)
2) **5 Veritas oral versions** (varied formats)
3) **Ready-to-use prompts** (teacher copy/paste)
4) **Rubric suggestion** (criteria + 4-level descriptors)
5) **Integrity upgrades** (follow-up questions to confirm authorship)
6) **Time & grading guidance** (approx. minutes/student, what teacher reviews)

### Lead capture
- Show a preview (e.g., 1 full oral version + partial diagnosis).
- Require email to unlock/send full kit.
- Send full kit via email as a formatted HTML email + optional PDF/attachment (Sprint 1: HTML email only).

### CTAs
- Primary: “Start a free Veritas trial” (or “Create a Veritas assessment”)
- Secondary: “Book a 15-min demo”

### Privacy & compliance UX (must-have)
- Inline notice: “Upload the assessment only. Do not include student names or student work.”
- Link to privacy policy.
- Data retention statement (e.g., delete file after X days; Sprint 1 can be 7 days).
- Ability to request deletion (Sprint 1: support email + reference ID).

---

## 3) Acceptance Criteria (Given/When/Then)

### A) Paste flow
- Given I am on the lead magnet page  
  When I paste assessment text and submit  
  Then I see a preview result within 60 seconds (typical) and can enter email to receive full kit.

### B) PDF upload flow
- Given I upload a PDF under the size limit  
  When I submit  
  Then the system extracts text, generates preview, and sends full kit to email after I confirm.

### C) DOCX upload flow
- Given I upload a DOCX under the size limit  
  When I submit  
  Then the system extracts text, generates preview, and sends full kit to email after I confirm.

### D) Email capture
- Given I see the preview  
  When I enter a valid email and click “Send me the full kit”  
  Then I receive the full kit email within 2 minutes and the page shows “Sent” with a reference ID.

### E) Output quality (minimum bar)
- Given any assessment with at least 150 words of content  
  When the kit is generated  
  Then at least 3 of 5 oral versions must explicitly reference concepts or question types from the original assessment (e.g., “Your Q4…” or “Your essay prompt about…”).

### F) Safety / privacy
- Given I attempt to upload text that includes likely student identifiers (emails, phone numbers)  
  When I submit  
  Then the UI warns me to remove identifiers before proceeding (soft block acceptable in Sprint 1).

### G) Reliability
- Given the AI generation fails or times out  
  When I submit  
  Then I get a helpful error message and can retry without re-entering metadata.

---

## 4) Technical Design (Sprint 1 scope)

### Frontend (Next.js)
- Public route: `/veritas/assessment-converter`  
- Components:
  - Upload/paste form + metadata
  - Preview renderer
  - Email capture modal/section
  - “Copy to clipboard” buttons
  - Status + reference ID

### Backend (API routes / server actions)
- `POST /api/lead-magnet/submit`
  - accepts: text or file, metadata
  - returns: `submission_id`, `preview_payload`
- `POST /api/lead-magnet/send`
  - accepts: `submission_id`, `email`
  - returns: success status
- `GET /api/lead-magnet/status?id=...` (optional polling)

### Storage & Data
- Supabase tables (suggested)
  - `lead_magnet_submissions`
    - id (uuid), created_at
    - source_type (paste|pdf|docx)
    - raw_text (text) *or stored file ref*
    - extracted_text (text)
    - metadata (jsonb)
    - preview_payload (jsonb)
    - full_payload (jsonb)
    - status (queued|preview_ready|sent|failed)
    - error (text)
    - retention_delete_at (timestamptz)
  - `lead_magnet_leads`
    - id, created_at
    - submission_id (fk)
    - email (text)
    - consent_marketing (bool, default false)
    - utm (jsonb)
- Files (optional Sprint 1):
  - Store uploaded PDFs/DOCX in Supabase Storage with a 7-day retention.

### AI / Prompting
- Deterministic structure:
  - 1) Classification prompt → assessment type + key skills
  - 2) Generation prompt → conversion kit JSON schema
  - 3) Render layer → preview + email formatting
- Output schema (required):
  - `diagnosis`
  - `oral_versions[]` (exactly 5)
  - `prompts[]`
  - `rubric`
  - `integrity_followups[]`
  - `timing_and_grading`

### Email
- Transactional provider (existing stack): send via your current provider (e.g., MailerLite API) or SMTP.
- Email content:
  - Short intro + sections with headings
  - Copy-friendly formatting
  - Link back to Veritas CTA

### Analytics
Track events (PostHog/GA/etc.):
- `leadmagnet_view`
- `leadmagnet_submit_started`
- `leadmagnet_preview_shown`
- `leadmagnet_email_submitted`
- `leadmagnet_email_sent`
- `leadmagnet_cta_clicked`

---

## 5) Sprint Plan (1 sprint, 5–7 working days)

### Day 1 — UX + scaffolding + schema
- Finalize page layout wireframe (simple)
- Create Supabase tables + RLS
- Add public route + basic form
- Define JSON output schema & prompt templates

### Day 2 — File ingest + extraction
- Implement PDF text extraction
- Implement DOCX extraction
- Add size limits, MIME checks
- Normalize text pipeline (strip headers/footers, collapse whitespace)

### Day 3 — AI generation (preview + full kit)
- Implement classification call
- Implement kit generation call returning JSON
- Generate preview subset
- Save preview/full payloads to DB

### Day 4 — Email send + lead capture
- Implement email capture step
- Send full kit via email
- Update status + reference ID
- Add spam protections (basic rate limit + honeypot)

### Day 5 — QA + polish + instrumentation
- End-to-end testing (paste/pdf/docx)
- Improve error states + retries
- Add analytics events
- Add privacy copy, deletion/retention copy
- Launch checklist + deploy

### Stretch (if time)
- Soft PII detection warnings
- Admin viewer for recent submissions/leads
- PDF attachment export of the kit

---

## 6) Definition of Done (DoD)

### Product DoD
- Public page is live and accessible.
- Teacher can submit via paste, PDF, and DOCX.
- Preview loads and is readable on mobile and desktop.
- Email capture sends full kit successfully.
- Copy buttons work for prompts/rubric.
- Privacy warning + retention statement present.
- CTAs to Veritas trial/demo present.

### Engineering DoD
- Code merged to main with review.
- Database migrations applied and documented.
- Error handling for extraction + AI failures implemented.
- Rate limiting in place (at least per-IP per-hour).
- Logs include submission_id for debugging.
- No P0 security issues (file type validation, upload limits).

### QA DoD
- Test matrix completed:
  - Paste: short/medium/long text
  - PDF: text-based PDF (not scanned)
  - DOCX: common formatting
  - Failure modes: empty input, oversized file, AI timeout
- Cross-browser: Chrome/Safari (desktop + iOS)
- Email deliverability spot-check (Gmail + Outlook)

### Analytics DoD
- All required events firing.
- Conversion funnel can be measured from view → submit → email → CTA click.

---

## 7) Test Cases (minimum)

1) Paste 500–1,500 words → preview under 60s → email sends full kit
2) Upload 2–5 page PDF with MCQs → correct extraction → kit references “multiple choice” format
3) Upload DOCX with essay prompt → kit includes oral thesis defense + rubric includes “Claim/Evidence/Reasoning”
4) AI failure (simulate) → retry works without losing input
5) Rate limit triggers after N attempts → friendly message
6) Email entered invalid → validation prevents send
7) Mobile layout: preview readable; copy buttons usable

---

## 8) Risks & Mitigations

- **Scanned PDFs** (no text layer): Sprint 1 does not OCR. Mitigation: detect low text extraction and tell user to paste text or upload DOCX.
- **Generic AI outputs**: enforce JSON schema + require referencing original content via prompt constraints and post-checks.
- **Abuse/spam**: rate limiting + honeypot + CAPTCHA optional (stretch).
- **Privacy**: warnings + retention + internal access controls.

---

## 9) Deliverables Checklist

- [ ] `/veritas/assessment-converter` page shipped
- [ ] API endpoints shipped
- [ ] Supabase tables + RLS
- [ ] PDF/DOCX extractors
- [ ] Prompt templates + JSON schema validation
- [ ] Email send integration
- [ ] Event tracking
- [ ] Basic rate limiting
- [ ] Documentation: env vars + runbook

---

## 10) Follow-on Sprint (next logical increment)
- “One-click import into Veritas” (create a Veritas assessment draft from kit)
- OCR support for scanned PDFs
- Teacher dashboard history + regenerate
- Role-specific kits (ELA/Science/Math presets)
- School-level lead routing (district outreach tagging)
