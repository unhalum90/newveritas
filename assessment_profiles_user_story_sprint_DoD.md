# SayVeritas — Assessment Profiles (Level-Based Builder Configuration)
*(User story, sprint plan, and Definition of Done — v1)*

## Feature Overview
Add an **Assessment Profile** selection in Builder Step 1 (Start) that drives:
1) **Defaults** (auto-populate settings)
2) **Visibility** (show/hide/expand sections and fields)
3) **Constraints** (prevent invalid configurations per level/profile)

Goal: Keep the builder **universal** (K–12 through Higher Ed) while making downstream configuration **level-appropriate and defensible** (especially for higher-ed summative viva).

---

## User Story

### US-AP-01 — Level/Profile-based Builder Configuration
**As a teacher (or course instructor)**, I want to select an **Assessment Profile** at the start of the builder so that the builder automatically adapts its settings, options, and guardrails to match the needs of my grade band/context (e.g., K–6 formative, 7–12 summative, Higher Ed viva), enabling fast setup and reducing misconfiguration risk.

#### Acceptance Criteria
1. **Profile selection**
   - Builder Step 1 includes a required field: **Assessment Profile**.
   - At minimum includes:
     - K–6 Formative (Portfolio)
     - 7–12 Formative (Capture + Defend)
     - 7–12 Summative (Oral Checkpoint)
     - Higher Ed Viva (Summative)
     - (Optional) Language Proficiency

2. **Defaults applied**
   - Upon selecting a profile, the builder auto-populates downstream defaults (where fields exist), including:
     - timing rules (per question / total)
     - attempt rules (one-shot vs retries)
     - follow-up caps (0/1/2)
     - proctor vs coaching persona (if applicable)
     - artifact requirements (on/off)
     - citation requirements (none/some/all)
     - rubric template (default rubric for profile)

3. **Visibility rules**
   - Profile controls which sections/fields are visible and/or expanded by default:
     - K–6: hides advanced integrity controls by default
     - 7–12: shows integrity + rubric; Bloom/standards optional
     - Higher Ed: shows integrity + deterministic follow-up policy + citations + evidence pack

4. **Constraint enforcement**
   - Profile defines allowed values and required fields; the UI prevents invalid states.
   - Example for Higher Ed Viva:
     - If AI follow-ups enabled, must use deterministic follow-up types + cap.
     - Evidence pack toggle cannot be disabled (or warns + requires explicit override).
     - Citation requirement can be enforced per exam or per question.

5. **Override model**
   - Teachers can override defaults via “Advanced” controls (if enabled by product).
   - System records `profile_modified=true` when any override deviates from profile defaults (for audit).

6. **Persistence**
   - Selected profile is saved with the assessment and persists across draft edits and publishes.

7. **Preview coherence**
   - Student preview reflects the applied settings (timers, attempt limits, follow-up caps, citation prompts, artifact requirements).

---

## Sprint (2 weeks) — Assessment Profiles v1

### Sprint Goal
Ship a production-ready **Assessment Profile** system that updates builder defaults/visibility/constraints and persists to created assessments.

### Scope (MVP v1)
- Profile selector in Step 1
- Profile config objects (defaults/visibility/constraints)
- UI wiring to apply profiles across builder steps
- Constraint validation in UI + server
- Persistence to DB and audit fields

---

## Sprint Backlog

### Epic A — Data model + profile configs
**A1. Add DB fields**
- Add `assessment_profile_id` to assessments table (or equivalent).
- Add `profile_modified boolean` (default false).
- Add `profile_version` (string/int) for future changes without breaking old drafts.

**A2. Define profile config schema (code)**
Create a single schema that includes:
- `id`, `label`, `description`
- `defaults`: key/value pairs for builder settings
- `visibility`: panels/fields show/hide + expanded_by_default
- `constraints`: allowed values, min/max, required flags, conditional rules

**A3. Seed baseline profiles**
Implement the minimum set:
- K–6 Formative (Portfolio)
- 7–12 Formative (Capture + Defend)
- 7–12 Summative (Oral Checkpoint)
- Higher Ed Viva (Summative)

Deliverable: `profiles.ts/json` with typed validation.

---

### Epic B — Builder Step 1 UX + profile banner
**B1. Profile selector UI**
- Required dropdown or card selector in Step 1 (Start).
- Show a short 1-line summary under the selector (“Higher Ed Viva: one-shot, capped follow-ups, evidence pack enabled.”).

**B2. Profile banner**
- After selection, show a persistent banner at top of builder:
  - Profile name + summary
  - “Advanced settings” link (if overrides allowed)

---

### Epic C — Apply defaults downstream
**C1. Default application mechanism**
- When profile is selected:
  - Apply defaults to builder state only for unset values (or explicitly reset when changing profiles).
  - If changing profile on an existing draft, show a warning: “Changing profile may update settings.”

**C2. Cross-step integration**
Update builder steps to read from a centralized builder state:
- General Info
- Assets
- Questions
- Rubrics
- Preview
Ensure defaults appear immediately (timers, attempts, follow-ups, rubric selection, etc.)

---

### Epic D — Visibility rules
**D1. Conditional rendering**
- Implement show/hide and expand/collapse rules per profile.
- Examples:
  - Hide “Evidence Pack” section except for Higher Ed.
  - Collapse “Integrity” for K–6 by default.
  - Hide Bloom/Standards for Higher Ed (or rename label) per profile config.

**D2. UX consistency**
- Hidden sections must not block publishing if they are irrelevant for profile.
- If hidden section contains required settings (Higher Ed), keep it visible.

---

### Epic E — Constraints + validation (UI + server)
**E1. UI constraints**
- Disable invalid option combinations in dropdowns and toggles.
- Inline validation messages when constraints are violated.

**E2. Server-side validation**
- On save draft and publish, validate assessment config against profile constraints.
- Return clear validation errors for UI display.

**E3. Deterministic follow-up constraints (Higher Ed)**
- If AI follow-up enabled:
  - Require follow-up types whitelist
  - Require follow-up cap ≤ profile max
  - Require “evidence_quote required” flag for follow-ups (if implemented)

---

### Epic F — Override tracking + audit
**F1. Detect overrides**
- If teacher changes a value away from profile default, set `profile_modified=true`.

**F2. Store override diff (optional but recommended)**
- Store JSON diff of overridden keys to facilitate debugging/support:
  - `profile_override_keys: string[]` or `profile_override_diff jsonb`

---

### Epic G — QA + regression coverage
**G1. Test matrix**
- Create a test checklist for each profile:
  - Defaults applied
  - Visibility correct
  - Constraints enforced
  - Can save draft
  - Can publish
  - Student preview matches rules

**G2. Unit tests**
- Profile schema validation
- Constraint evaluation rules
- Server-side validation response formatting

---

## Definition of Done (DoD)

### Functional
- Builder Step 1 requires selecting an **Assessment Profile**.
- Selecting a profile correctly:
  - applies defaults
  - updates visibility
  - enforces constraints
- Profile selection persists to the saved assessment draft and published assessment.
- Student preview reflects the selected profile’s rules.

### Reliability / UX
- Switching profiles on a draft shows a warning and behaves predictably (defined in spec).
- Validation errors are human-readable and point to the field needing changes.
- No profile causes a blocked publish unless constraints are actually violated.

### Security / Data Integrity
- Server-side validation prevents saving/publishing invalid configurations (no “UI-only” enforcement).
- DB schema updated with `assessment_profile_id`, `profile_modified`, `profile_version`.

### Test Coverage
- Automated tests for:
  - profile config schema validity
  - constraint evaluation
  - server validation responses
- Manual QA completed for all baseline profiles across:
  - desktop Chrome
  - iOS Safari (at least smoke tests)

### Deliverables
- Profile config schema + seeded profiles
- Builder UI changes (Step 1 selector + profile banner)
- Downstream defaults/visibility/constraints integrated across builder steps
- Validation logic on server
- QA checklist completed and documented

---

## Notes (Implementation Guidance)
- Implement profiles as **configuration**, not hardcoded branching logic.
- Prefer a single `applyProfile(profile, state)` function that returns:
  - `newState`
  - `visibilityModel`
  - `constraintModel`
- Add `profile_version` to allow future profile changes without breaking older drafts.
