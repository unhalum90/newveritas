# SayVeritas — Formative “Capture + Defend” Module
*(User story, sprint plan, and Definition of Done — v1)*

## Purpose
Create a lightweight formative workflow (middle/high school “Seesaw-like”) that lets teachers quickly collect learning evidence from handwritten notes/whiteboards and assess understanding via brief student oral explanation. This complements SayVeritas’ more structured, summative assessment builder.

## Problem this solves
- Teachers want **fast, low-friction formative checks** without building a full summative assessment (intro, standards tags, multi-question sets).
- Students produce handwritten thinking (paper/stylus) but schools lack a **consistent way to capture + verify** understanding.
- Schools need a bridge from daily practice → summative oral assessments.

## Product concept (MVP)
A new **Formative Activity** type:
- Teacher creates a “Capture + Defend” activity in < 60 seconds
- Student submits:
  1) **Artifact capture** (photo scan / PDF / image upload; optionally from stylus export)
  2) **Short voice explanation** (60–120 seconds) guided by prompts
- Teacher reviews in a streamlined inbox, scores with a micro-rubric, optionally gives quick feedback

---

## User Stories

### US-1 (Teacher) — Create a formative activity fast
**As a teacher**, I want to create a formative activity in under a minute with minimal required fields, **so that** I can run quick learning checks frequently without administrative overhead.

**Acceptance criteria**
- Teacher can create an activity with only:
  - Title (required)
  - Due date/time (optional)
  - Prompt template (optional; defaults provided)
  - Micro-rubric selection (optional; default rubric exists)
- Teacher can assign to:
  - A class/section (existing SayVeritas grouping)
  - Or a list of students (if supported today)
- No standards tagging, multi-question builder, or lengthy intro required
- Activity is visible in student dashboard immediately

### US-2 (Student) — Submit artifact + oral defense
**As a student**, I want to upload/scan my handwritten notes (or export from a stylus app) and record a short explanation, **so that** my teacher can see both my work and my understanding.

**Acceptance criteria**
- Student can upload at least one artifact:
  - Image (jpg/png/heic) and/or PDF
  - Up to a defined size limit (configurable)
- Student can record audio in-browser (mobile + desktop)
- Student sees a clear time expectation (e.g., 60–120 seconds) and prompt checklist
- Student can review and re-record before final submit
- After submit, student sees confirmation and submission timestamp

### US-3 (Teacher) — Review quickly and score consistently
**As a teacher**, I want an inbox-style review screen for formative submissions, **so that** I can score and respond quickly with consistent criteria.

**Acceptance criteria**
- Teacher can open a submission and view:
  - Artifact preview (image/PDF)
  - Audio playback
  - Auto-transcription (if Whisper already exists; otherwise marked “Phase 2”)
- Teacher can score using a micro-rubric (0–3 or 1–4 scale) with one-click selection
- Teacher can leave feedback:
  - Quick comment (text) (MVP)
  - Optional audio feedback (Phase 2 if not already supported)
- Teacher can mark “Needs resubmission” (optional MVP; otherwise “comment only”)
- Teacher can filter submissions by: class, activity, status (unreviewed/reviewed), student

### US-4 (Admin/Teacher Lead) — Formative analytics (lightweight)
**As a teacher leader/admin**, I want lightweight usage metrics, **so that** I can see adoption and impact without heavy reporting.

**Acceptance criteria**
- Basic counters:
  - Activities created (per teacher)
  - Submissions received (per class/activity)
  - Review completion rate
- Export CSV (optional if export exists elsewhere)

---

## Scope: MVP vs Later

### In MVP
- New **Formative Activity** type with minimal creation UI
- Student artifact upload (image/PDF) + audio recording
- Teacher review inbox + micro-rubric scoring + text feedback
- Storage + permissions + audit trail (created/assigned/submitted/reviewed timestamps)

### Explicitly NOT in MVP (Phase 2+)
- Standards tagging
- Multi-question sequencing
- Rich rubric builder (beyond selecting from a few templates)
- Peer feedback, parent feed, likes/comments (Seesaw-style social layer)
- Advanced analytics dashboards
- Automatic concept extraction from notes (AI vision), unless already present

---

## Sprint Plan (1 sprint, 2 weeks)
**Sprint goal:** Ship an MVP Formative module end-to-end for one class: create → submit → review → score.

### Sprint Backlog (Epics + Tasks)

#### Epic A — Data model + permissions (Supabase)
1. **DB tables**
   - `formative_activities`
   - `formative_assignments` (activity ↔ class/section)
   - `formative_submissions`
   - `formative_submission_files`
   - `formative_scores`
   - `formative_feedback` (teacher comment)
2. **RLS policies**
   - Teachers: CRUD their activities; read submissions for their assigned classes
   - Students: read assigned activities; create/read own submissions
   - Admins (if role exists): read all in org/school scope
3. **Storage buckets**
   - `formative-artifacts` (images/pdfs)
   - `formative-audio` (student recordings)
4. **Signed URL strategy** for secure file access

**Deliverables:** migrations, RLS tests, storage config

#### Epic B — Teacher: Create/assign UI
1. New “Formative” entry point in teacher dashboard
2. Create form (minimal fields)
3. Assign to class/section (reuse existing class picker)
4. Prompt templates (selectable defaults)
5. Publish activity

**Deliverables:** working teacher flow with validation and success states

#### Epic C — Student: Submit UI (artifact + audio)
1. Activity detail view with prompt checklist
2. Artifact upload:
   - Camera capture on mobile (native file input)
   - PDF upload
   - Preview before submit
3. Audio recorder:
   - Record / pause / stop
   - Playback
   - Re-record
4. Submit transaction:
   - Upload files
   - Create submission record
   - Confirmation state

**Deliverables:** reliable submit on mobile Safari + Chrome

#### Epic D — Teacher: Review + scoring
1. Inbox list for an activity:
   - student name, submitted at, status
2. Submission detail:
   - artifact viewer
   - audio playback
3. Micro-rubric scoring UI:
   - default rubric (e.g., Accuracy, Reasoning, Clarity, Transfer)
4. Feedback comment box + “Mark reviewed”

**Deliverables:** teacher can process submissions quickly (<= 30s each)

#### Epic E — Quality + instrumentation
1. Error handling (upload failures, audio permission issues)
2. Basic analytics events:
   - activity_created
   - submission_created
   - submission_reviewed
3. Unit/integration tests (critical paths)
4. Minimal docs for internal use (how to run a “Capture + Defend” routine)

---

## Definition of Done (MVP)

### Functional
- Teacher can create and assign a formative activity with minimal required fields
- Student can submit at least one artifact (image/PDF) and one audio recording
- Teacher can view artifact + audio, score with micro-rubric, and leave a text comment
- Status states exist and are accurate: **Assigned → Submitted → Reviewed**
- Submissions are time-stamped and linked correctly to student, class, and activity

### UX / Reliability
- Works on:
  - iOS Safari (current)
  - Chrome (desktop + mobile)
- Audio permission flow is clear; user receives actionable error messages
- Uploads are resilient (retry or clear failure messaging)
- Teacher review screen supports efficient navigation between submissions

### Security / Compliance
- RLS enforced for every table (verified by tests)
- Students cannot access other students’ submissions
- Files stored privately; served via signed URLs with expiration
- Audit fields present: `created_at`, `updated_at`, `submitted_at`, `reviewed_at`, `reviewed_by`

### Performance
- Submission detail loads in < 2 seconds for typical artifact sizes
- Teacher inbox paginates (no unbounded lists)
- File size limits enforced client + server side

### QA / Testing
- Automated tests for:
  - RLS policies (teacher/student access)
  - Submission create flow (DB + storage metadata)
- Manual QA checklist completed on iOS Safari and Chrome

### Documentation
- Short internal doc:
  - How to create a formative activity
  - Recommended prompt templates
  - Micro-rubric definition and scoring guidance

---

## Default Prompt Templates (MVP)
1. **One-sentence summary:** “Summarize these notes in one sentence.”
2. **Explain the relationship:** “Explain how concept A connects to concept B.”
3. **New example:** “Use these notes to solve one new example.”
4. **Misconception check:** “What’s one likely misunderstanding, and why?”

---

## Default Micro-Rubric (MVP)
Score each 0–3 (or 1–4), with optional overall score:
- **Accuracy** (facts/procedure correct)
- **Reasoning** (explains why/how, not just what)
- **Clarity** (organized explanation, uses key terms)
- **Transfer** (applies to a new example)

---

## Notes on architecture
- Implement as a **separate module/modal** in product navigation (Formative vs Summative) to preserve the simplicity of the formative flow.
- Reuse shared components where possible (classes, rosters, auth, storage helpers, audio recorder, transcription pipeline if already present).
