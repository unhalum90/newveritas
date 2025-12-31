# Pre-Launch Test Plan

Goal: verify the site is secure, key user flows are clear, and core features work end-to-end before launch.

## Environments
- Staging (production-like Supabase + email provider configured).
- Local dev (for quick UI checks and regression review).
- Optional: production smoke test after deploy.

## Critical User Flows (Manual)
- [ ] Landing page loads, CTA buttons route correctly, and no student self-signup options are shown.
- [ ] Teacher signup: select "Classroom Teacher", create account with password, reach onboarding.
- [ ] Teacher signup: select "Classroom Teacher", request magic link, complete sign-in via email.
- [ ] School admin signup: select "School Admin", create account, reach school setup at `/schools/register?resume=1`.
- [ ] School admin signup: magic link flow works and routes to `/schools/register?resume=1`.
- [ ] Teacher login (password) routes to `/dashboard`; school admin login routes to `/schools/admin`.
- [ ] Logout returns to login and requires re-authentication.

## Role Access and Redirects
- [ ] Teacher cannot access `/schools/admin` or `/admin`.
- [ ] School admin cannot access `/dashboard` or `/admin`.
- [ ] Platform admin cannot access student pages.
- [ ] Student cannot access teacher or admin pages.
- [ ] Direct URL access to restricted pages returns correct redirect (not a blank page).

## School Admin Workflows
- [ ] Create school in setup wizard; verify a school + workspace are created.
- [ ] Add teacher via single add flow.
- [ ] Bulk upload teachers via CSV; verify accounts appear in list.
- [ ] New teacher can log in and complete onboarding.

## Teacher Onboarding
- [ ] Steps 1-3 complete without errors.
- [ ] Onboarding does not re-trigger after completion.
- [ ] Workspace is attached after onboarding; dashboard is accessible.

## Classroom and Student Management
- [ ] Create class.
- [ ] Add students manually and by CSV.
- [ ] Student codes are generated and usable.
- [ ] Deactivate student and confirm access is blocked.

## Student Activation + Login
- [ ] Activation link works for new student.
- [ ] Password setup works on first login.
- [ ] Student can log in, see assigned assessments only.
- [ ] Student cannot access any teacher/admin pages.

## Assessment Builder
- [ ] Manual build flow works.
- [ ] AI generate flow works (if OpenAI key present).
- [ ] PDF upload flow works and extracts questions.
- [ ] Template flow loads templates and applies to draft.
- [ ] Practice mode toggle persists and shows labels.
- [ ] Bloom's level dropdown saves per question.
- [ ] Evidence upload settings save (optional/required).
- [ ] Audio follow-up and evidence follow-up question types function.
- [ ] Integrity toggles save (pause, focus, shuffle, grace restart).

## Assessment Delivery (Student)
- [ ] Student can start assessment and record answers.
- [ ] Sequential question enforcement works.
- [ ] Evidence-required questions enforce upload before recording.
- [ ] Grace restart flow appears when triggered and only once.
- [ ] Practice assessment allows resubmission and does not block.

## Scoring + Feedback
- [ ] Submissions auto-score (non-practice) and appear in results.
- [ ] Reasoning/Evidence scores render for teacher.
- [ ] Teacher can release verified feedback.
- [ ] Student feedback page shows audio, evidence, and readable text.

## Admin Dashboards
- [ ] Platform admin dashboard loads without console errors.
- [ ] Security flags list renders with unique keys.
- [ ] Support queue and logs load (if tables exist).

## Security + Data Isolation
- [ ] API calls for another user's data return 401/403.
- [ ] Teacher only sees students in own workspace.
- [ ] School admin only sees teachers in own school.
- [ ] Evidence and audio files are not publicly accessible without signed URL.
- [ ] Magic link cannot create student accounts.

## UX + Accessibility
- [ ] Contrast is readable (light/dark surfaces).
- [ ] Forms can be completed with keyboard only.
- [ ] Errors are clear and actionable.
- [ ] Mobile layouts do not overflow or hide buttons.

## Performance + Reliability
- [ ] Landing page and login pages load in < 2s on fast connection.
- [ ] Audio upload completes under expected limits.
- [ ] No critical console errors in core flows.

## Terminal Checks
Run in repo root:
- `npm run lint`
- `npm run build`

Optional (if you want a quick local smoke run):
- `npm run dev` and verify core flows above in the browser.

## Post-Launch Monitoring (Quick Checks)
- [ ] Login/signup error rate low (check Supabase auth logs).
- [ ] Scoring jobs complete without errors (check admin logs).
- [ ] Storage buckets have expected files and size growth.
