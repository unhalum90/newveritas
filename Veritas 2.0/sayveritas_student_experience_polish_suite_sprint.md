# SayVeritas Student Experience Polish Suite (Practice Mode, Exemplars, Mobile-first Recording, Resilience) — Dev Stories, Sprint Plan, Definition of Done

## Scope (What we’re building)
Make the student side feel “premium” and reduce submission failures:
- **Practice mode** (ungraded; same rubrics; safe repetition)
- **Exemplar library** (teacher-approved samples by level; student-visible)
- **Mobile-first recording UX** (mic checks, clear re-record, low bandwidth)
- **Resilience features** (offline buffering, upload retry, device troubleshooting)

Non-goals (for this release):
- Gamification economy (XP/streaks) beyond minimal practice encouragement
- Social sharing
- Fully offline assessments (we will support resilient capture + retry)

## REVIEW NOTES
- Practice mode exists (`is_practice_mode` toggle in builder, student practice flow, practice dashboard + practice feedback gating).
- Student recording flow includes auto-recording, timer/limit, error messaging, and evidence upload support; recording chunks are buffered client-side during capture.
- No exemplar library UI, mic check, or offline retry/resume workflows found.

---

## Epic
**As a student**, I want a smooth recording experience with examples and practice so I feel confident, submit successfully, and understand what quality looks like.

---

## Student Experience Guardrails
- Practice mode is clearly labeled **“Not graded”** and is separated from graded assignments.
- Student privacy and school policy controls must exist:
  - exemplars can be student-visible only when enabled
  - practice data retention may be shorter than graded evidence
- UX must minimize cognitive load:
  - one primary action per screen (Record / Stop / Submit)

---

## User Stories

## A) Practice Mode

### Story A1 — Practice version of an assignment (teacher)
**As a Teacher**, I can enable a practice version of an assignment so students can rehearse with the same rubric before grading.

**Acceptance Criteria**
- Assignment builder includes toggle:
  - “Enable Practice Mode” (default off)
- Practice mode settings:
  - max practice attempts per student (optional)
  - practice attempt retention (days; defaults to short)
  - whether teacher can view practice attempts (policy toggle)
- Practice link is distinct from graded link and clearly labeled.

---

### Story A2 — Student practice flow (student)
**As a Student**, I can practice the prompt, record, and see feedback without it affecting my grade.

**Acceptance Criteria**
- Student sees “Practice” banner and “Not graded” message.
- Student can:
  - record attempt
  - re-record
  - submit practice attempt
- Feedback provided (choose based on current app capabilities):
  - playback + transcript (if available)
  - rubric self-check checklist (v1) and/or teacher-visible but unscored (v1.5)
- Practice attempts do not appear in official reporting by default.

---

### Story A3 — Practice to graded transition (student)
**As a Student**, after practicing, I can switch to the graded attempt with confidence.

**Acceptance Criteria**
- After completing practice, UI offers:
  - “Start graded attempt” button
  - shows due date and expectations
- Students can compare practice vs graded (optional, teacher-controlled):
  - side-by-side playback (v2)

---

## B) Exemplar Library

### Story B1 — Teacher adds exemplars (teacher/admin)
**As a Teacher**, I can attach exemplar responses at different performance levels so students understand expectations.

**Acceptance Criteria**
- Exemplars can be attached to:
  - an assignment
  - a standard
  - a rubric dimension (preferred)
- Exemplar types:
  - audio (preferred)
  - text transcript (optional)
- Each exemplar has:
  - level tag (e.g., 1–4)
  - short note (“What makes this level strong”)
- Visibility controls:
  - teacher-only
  - student-visible

---

### Story B2 — Student views exemplars (student)
**As a Student**, I can listen to exemplars before recording so I know what good sounds like.

**Acceptance Criteria**
- On assignment page, student sees “Examples” section (if enabled):
  - grouped by level
  - short guidance notes
- Exemplars play reliably on mobile.
- No download link is presented (reduce redistribution risk).

---

## C) Mobile-first Recording UX

### Story C1 — Mic check + device guidance (student)
**As a Student**, I can run a quick mic check so I don’t submit unusable audio.

**Acceptance Criteria**
- Before first recording (or when issues detected), show mic check:
  - permission prompt guidance
  - input level meter
  - “Speak now” test
  - confirmation: “We can hear you”
- Provides device-specific troubleshooting tips:
  - iOS Safari mic permissions
  - Chromebook mic selection
- Teachers can optionally require mic check before submission (tenant setting).

---

### Story C2 — Clear recording states and re-record (student)
**As a Student**, I can easily understand when I’m recording and re-record without confusion.

**Acceptance Criteria**
- Recording UI shows:
  - prominent timer
  - clear Record/Stop states
  - confirm dialog before discarding a recording
- Re-record flow is simple:
  - “Re-record” → confirm → start again
- Minimum duration enforcement (configurable).

---

## D) Resilience & Failure Reduction

### Story D1 — Offline buffering + upload retry (student)
**As a Student**, if my connection drops, my recording is not lost and I can retry upload.

**Acceptance Criteria**
- Recording is stored locally (browser storage) until upload completes.
- If upload fails:
  - show error with retry
  - show progress on retry
- If app reloads within a short window:
  - detect pending recording and offer “Resume upload” (best-effort)
- Timeouts and failures are logged for support.

---

### Story D2 — Low bandwidth mode (system)
**As the system**, I adapt uploads to low bandwidth environments to reduce failures.

**Acceptance Criteria**
- If network is slow:
  - upload in chunks (if storage pipeline supports)
  - show “This may take longer” guidance
- Optional: offer lower bitrate recording profile on mobile (policy toggle).
- Student can cancel upload safely and retry later within retention window.

---

## Technical Approach (implementation notes)

### Data model sketch (Supabase/Postgres)
- Practice:
  - `practice_settings (assignment_version_id, enabled, max_attempts, retention_days, teacher_visibility)`
  - `practice_attempts (id, tenant_id, student_id, assignment_version_id, status, submitted_at)`
  - `practice_media (id, practice_attempt_id, storage_path, duration_ms, created_at)`
- Exemplars:
  - `exemplars (id, tenant_id, scope_type, scope_id, level, note, visibility, storage_path, transcript_text, created_by, created_at)`
  - `scope_type`: assignment | standard | dimension
- Recording resilience:
  - client-side: IndexedDB/localStorage keys for pending uploads
  - server-side: `upload_sessions (id, user_id, status, bytes_uploaded, created_at, updated_at)` (optional)
- Flags/logs:
  - reuse `attempt_flags` or create `recording_issues` logs for failures

### Separation of graded vs practice
- Practice attempts stored separately from official attempts to avoid accidental inclusion in reports.
- Reporting layer explicitly excludes practice data unless an admin toggles inclusion for research purposes.

### Retention policy integration
- Practice retention defaults shorter (e.g., 7–14 days).
- Exemplars follow teacher/admin retention policies (often longer).

---

## Sprint Plan (3 sprints)

### Sprint 1 — Practice mode v1 + recording UX improvements
**Goal:** Students can practice safely; recording UI is clearer and more reliable.

**Deliverables**
- Practice mode toggle + settings in assignment builder.
- Student practice flow (record → re-record → submit) with “Not graded” banner.
- Improved recording UI states:
  - timer, confirm discard, min duration
- Practice attempts stored and viewable to teacher if enabled (basic list view).

**Engineering Tasks**
- Implement practice tables + RLS.
- Duplicate/branch assessment flow to create practice attempts.
- Add visual labeling and ensure separation from grading/reporting.
- QA on mobile browsers (iOS Safari + Chromebook).

**Exit Criteria**
- A student can complete multiple practice attempts without affecting grades.
- Teacher can optionally see practice attempts list if enabled.

---

### Sprint 2 — Exemplars v1 + mic check
**Goal:** Students understand expectations and avoid technical failures.

**Deliverables**
- Teacher exemplar creation UI (audio upload/record + level tag + note).
- Student exemplar viewing UI on assignment page.
- Mic check flow with level meter and troubleshooting tips.
- Optional “require mic check” tenant setting.

**Engineering Tasks**
- Implement exemplars table + UI.
- Implement playback components optimized for mobile.
- Implement mic check screen and permission troubleshooting copy.
- QA: permissions across browsers; exemplar playback reliability.

**Exit Criteria**
- Teachers can publish exemplars and students can play them.
- Mic check reduces “no audio” submissions in testing.

---

### Sprint 3 — Resilience: buffering + retry + low bandwidth mode
**Goal:** Prevent lost work and reduce upload failures in real classrooms.

**Deliverables**
- Local buffering of recordings until upload success.
- Retry flow with progress.
- Resume upload after reload (best-effort).
- Low bandwidth adaptations:
  - chunked upload (if supported)
  - optional lower bitrate profile
- Support diagnostics:
  - log failure reasons and device/network metadata for admins/support.

**Engineering Tasks**
- Implement client-side persistence (IndexedDB recommended).
- Implement robust upload state machine with retries/backoff.
- Add upload diagnostics logging (tenant-scoped).
- Load testing for many concurrent uploads.

**Exit Criteria**
- Students can recover from a failed upload without re-recording.
- Support can see meaningful error logs to troubleshoot.

---

## Definition of Done (DoD)
A story is “done” only when all of the following are true:

### Functional
- Practice mode exists, is clearly labeled, and is isolated from graded workflows.
- Exemplars can be created and viewed with level tags and guidance notes.
- Recording UX is clear with safe re-record and minimum duration rules.
- Upload resilience prevents common “lost recording” scenarios.

### Security & Privacy
- Student access respects tenant policy toggles.
- Exemplars and practice attempts are tenant-scoped and role-gated via RLS.
- Practice retention defaults short and is configurable.
- Recording diagnostics avoid unnecessary PII; device metadata is minimal and justified.

### Quality
- Automated tests cover:
  - practice vs graded separation in reporting queries
  - exemplar visibility rules
  - upload retry state transitions (unit tests)
- Observability:
  - upload failures are logged and viewable to support/admins
- Documentation:
  - student help article: “How to record successfully”
  - teacher help: “Using practice mode and exemplars”

### UX
- Mobile experience is smooth:
  - microphone permissions handled gracefully
  - clear recording states
  - retry does not feel punitive

---

## Test Checklist (minimum)
- ✅ Enable practice mode → student completes practice → graded report unaffected
- ✅ Teacher adds exemplar at level 3 → student sees and plays it
- ✅ Student runs mic check → permissions granted → meter responds
- ✅ Simulate upload failure → retry succeeds without re-record
- ✅ Reload mid-upload → “Resume upload” appears (best-effort)
