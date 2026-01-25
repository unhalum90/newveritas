# Quarterly Safety Audit Checklist

This audit is designed to prevent "anthropomorphization creep" and ensure that the AI components of SayVeritas remain tools for assessment rather than digital companions.

## Audit Schedule
*   **Frequency:** Every 90 days.
*   **Auditor:** Rotating among the product team.

## Audit Items

### AI Prompts & Language
- [ ] **No "I" Statements:** Ensure AI prompts across all systems (`evidence.ts`, `audio-followup.ts`, etc.) do not use "I", "me", or "my".
- [ ] **Professional Tone:** Verify the AI acts as a "scoring system" or "analysis tool", not a "tutor" or "friend".
- [ ] **No Personality:** Ensure the AI does not express opinions, preferences, or emotions.

### UI & UX
- [ ] **Component Labels:** Check that headers and labels avoid anthropomorphic terms (e.g., "AI Analysis" not "What the AI Thinks").
- [ ] **Feedback Messages:** Review student-facing messages to ensure they are functional and direct.
- [ ] **Privacy Interstitials:** Confirm the 30-day recurring privacy notice is still functioning on both mobile and web.

### Technical Controls
- [ ] **Time Limits:** Verify that the 10-minute assessment timeout (SayVeritas) and daily limits (PhonemeLab) are enforced.
- [ ] **Crisis Detection:** Run a suite of test "crisis" inputs to ensure the keyword detection and notification system are active.
- [ ] **Engagement Monitoring:** Check the Oversight Dashboard to ensure "Protracted Interactions" are being correctly flagged.

## Audit Log
| Date | Auditor | Findings | Remediation Action | Status |
|------|---------|----------|--------------------|--------|
| 2026-01-20 | Eric Chamberlin | Initial audit completed during UK roll-out | N/A | [x] |
