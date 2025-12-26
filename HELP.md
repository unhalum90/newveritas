# SayVeritas Help Docs (V1)

This guide is written for end users of the SayVeritas web app.

- **Teachers**: create classes, add students, build/publish assessments, review results.
- **Students**: sign in, take assessments, record audio, submit.
- **School admins**: manage school-level access (bulk teacher onboarding, access control).

If you’re blocked and can’t find your issue, use the **Troubleshooting** section at the end.

---

## Teacher Guide

### 1) Create your account and sign in

1. Go to `/login`.
2. Sign in with your teacher email/password.
3. If prompted, complete onboarding.

### 2) Create a class

1. Go to `/classes`.
2. Click **Create Class**.
3. Name the class and choose access mode (code-based is the default).

### 3) Add students (and distribute access)

You can add students either manually or by CSV (depending on what’s enabled in your build).

**Manual add**
1. Open a class from `/classes`.
2. Enter student first/last name (email optional).
3. Click **Add Student**.

**Share the student login**
- Students sign in from `/student/login`.
- Each student uses their assigned code (and sets a password on first login, if prompted).

### 4) Create an assessment

1. Go to `/assessments`.
2. Click **New Assessment**.
3. Choose a class.
4. Choose how you want to build:
   - **Start from scratch** (manual authoring)
   - **Generate with AI** (creates a draft you can edit)
   - **Upload existing material (PDF)** (extracts text for drafting; scanned PDFs may not work)

### 5) Builder steps (edit, then publish)

The builder walks you through the draft. Depending on your build, you’ll see some or all of:
- **General info** (title, subject, instructions)
- **Visual asset** (optional; you can skip if your assessment doesn’t require an image)
- **Questions** (typically 1–5 questions)
- **Rubrics** (Reasoning + Evidence)
- **Integrity settings** (recording limit, timers, monitoring, pledge if enabled)

When ready:
1. Click **Save Draft** as needed while building.
2. Click **Publish to Class** when you’re ready for students to see it.

Notes:
- Publishing makes it available to students; if you don’t see a redirect after publish, check `/assessments` to confirm it’s listed as published.
- If you need to revise after publishing, your current build may restrict editing (by design). If so, duplicate the assessment or create a new draft.

### 6) Review submissions and scoring

1. Go to `/assessments`.
2. Open an assessment and click **Results** (example route: `/assessments/:id/results`).
3. Select a student submission to review:
   - audio playback (teacher view)
   - transcript (if enabled)
   - Reasoning/Evidence scoring + justification

If something looks wrong:
- Use **Re-score** (if available) to re-run scoring on a submission.

---

## Student Guide

### 1) First-time sign in

1. Go to `/student/login`.
2. Enter the code provided by your teacher.
3. If prompted, create a password (this protects your code for future logins).

If you can’t sign in, contact your teacher to confirm your code.

### 2) Take an assessment (sequential / no preview)

Assessments are designed to reduce cheating:
- You don’t see all questions up front.
- You answer one question at a time.
- No going back.

Recommended flow:
1. From your student dashboard (`/student`), open the assessment.
2. Click **Start Assessment**.
3. If you see an integrity pledge, read it and accept to continue.
4. Read the question and record your response.
5. Submit (auto-submit or a submit button, depending on the build).
6. Move to the next question until finished.

### 3) Recording tips

- Use Chrome or Safari and allow microphone access when prompted.
- Use headphones to reduce background noise.
- Speak clearly and pause briefly before you start talking (helps the recording start cleanly).

---

## School Admin Guide

School admin features depend on what your deployment has enabled, but the intended flow is:

### 1) Register a school admin account

1. Go to `/schools/register`.
2. Enter your school and admin details.
3. Verify your email if prompted.

### 2) Manage teachers

1. Go to `/schools/admin`.
2. Open **Teachers**.
3. Add teachers:
   - **Bulk upload (CSV)** when available
   - **Manual add** for one-off teacher accounts

Typical actions:
- Edit teacher profile fields
- Disable/enable teacher access
- Reset teacher credentials (if enabled)

### 3) Manage students (optional, if enabled)

Some deployments allow school admins to bulk upload students and assign them to teachers/classes.

---

## Troubleshooting

### Login / access issues

**I sign in but I’m sent back to `/login`**
- Hard refresh the page.
- In a private/incognito window, sign in again.
- If it persists, your session may be blocked by browser settings/extensions (try disabling strict tracking blockers for localhost).

**My teacher dashboard says I have no classes, but I created classes earlier**
- You may be signed into a different account than the one that created the class.
- You may be connected to a different Supabase project/environment than before.

### Student recording issues

**Microphone prompt never appears**
- In your browser site settings, allow microphone access for the site.
- Try a different browser (Chrome recommended).
- Ensure no other tab/app is using the microphone.

**Audio is silent or very quiet**
- Check the OS input device (System Settings → Sound → Input).
- Try unplugging/replugging the mic/headset.
- Move closer to the mic and reduce background noise.

### Assessment flow issues

**I can’t proceed because an image is required**
- Some questions can require evidence upload. Ask your teacher whether the question expects an image.
- If the UI should allow skipping, the teacher should set that question’s “Evidence upload” to Optional/Disabled (if available in your build).

### PDF upload issues (teacher)

**PDF upload fails or extracts nothing**
- Scanned PDFs often contain images, not selectable text. If so, convert with OCR and try again.
- Try exporting the PDF again (some PDFs have unusual encoding).
- Try a smaller PDF (very large files may time out).

### Scoring issues (teacher)

**Transcript says “pending” for a long time**
- Wait ~1–2 minutes, then refresh results.
- If a **Re-score** button exists, click it.
- If scoring is still stuck, contact an admin (there may be a background scoring job that needs to run).

**Scores are missing but transcripts exist**
- This typically means transcription succeeded but scoring failed.
- Re-score the submission if available.

### AI generation issues (teacher)

**AI draft generation fails**
- This is usually a provider issue (model access, billing, missing server config) or an output-format mismatch.
- Try again with a shorter prompt and fewer requested questions.
- If it still fails, fall back to manual authoring and notify support with the assessment ID and timestamp.

---

## Support

If you’re blocked:
- Capture a screenshot of the error.
- Copy the URL you’re on.
- Note what you clicked right before it failed.

Then send those details to your support contact.

