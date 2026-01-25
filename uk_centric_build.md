Below is a clean, execution-ready package you can hand directly to the dev team.
It assumes the architectural decision is already made: single codebase, hard UK locale at workspace (school) creation.

⸻

PRD: UK-Specific Workspace (SayVeritas – Oracy First)

1. Problem Statement

SayVeritas currently reflects a US-centric assessment culture (rubrics, scores, grades) even after Voice 21 oracy alignment. This creates friction for UK schools where:
	•	assessment is descriptor- and narrative-driven
	•	oracy is evidenced, not graded
	•	inspection safety and language precision are non-negotiable

UK schools require a hard UK workspace mode that reshapes:
	•	assessment tools
	•	AI outputs
	•	UI copy
	•	reporting defaults
without forking the product or codebase.

⸻

2. Goal

Deliver a UK-specific workspace experience that:
	•	Enforces UK assessment semantics by default
	•	Aligns with Voice 21 oracy expectations
	•	Is inspection-safe (Ofsted/KCSIE-aware)
	•	Requires zero per-assessment configuration by teachers

⸻

3. Non-Goals
	•	❌ No new AI models
	•	❌ No MIS integrations (V2)
	•	❌ No external accreditation claims
	•	❌ No UK-only code fork or deployment

⸻

4. Core Concept: UK Workspace Mode

A UK workspace is created when a school selects Country = United Kingdom at onboarding.

This sets:

school.locale = "UK"

This value:
	•	is immutable post-creation (admin-only override)
	•	drives global defaults
	•	cannot be disabled by individual teachers

⸻

5. Functional Requirements

5.1 Workspace Creation

At school creation:
	•	Country selector includes UK
	•	Selecting UK:
	•	locks locale to UK
	•	applies UK defaults across the platform
	•	hides US-only configuration options

⸻

5.2 Assessment Experience (UK Mode)

Defaults (non-overridable)
	•	Numeric scores: disabled
	•	Letter grades: disabled
	•	Rubric language: hidden
	•	Oracy strands: enabled
	•	Narrative feedback: primary output

Terminology Changes

US	UK
Score	Indicator / Evidence
Rubric	Progression / Markers
Grade	Descriptor
Mastery	Developing / Secure
Objective met	Evidence observed


⸻

5.3 AI Output Rules (UK Mode)

AI responses must:
	•	Avoid judgement language (“weak”, “poor”, “low score”)
	•	Use observational phrasing
	•	Separate:
	•	subject learning evidence
	•	oracy indicators
	•	Frame feedback as:
	•	“What was observed”
	•	“What this suggests”
	•	“Possible next teaching move”

⸻

5.4 Reporting & Export

UK workspaces must:
	•	Default to editable narrative reports
	•	Include mandatory disclaimers:
	•	“Does not grade pupils”
	•	“Does not replace teacher judgement”
	•	“Does not predict inspection outcomes”
	•	Support:
	•	class insight summaries
	•	longitudinal evidence (baseline → latest)

⸻

5.5 UX Guardrails

In UK mode:
	•	Teachers cannot re-enable scores
	•	Students never see numeric evaluations
	•	Sales/demo mode respects locale
	•	All exports remain editable

⸻

6. Success Criteria
	•	UK teachers can create and run assessments without encountering US terminology
	•	Voice 21-aligned oracy feedback feels native, not bolted on
	•	Reports are inspection-safe without additional editing
	•	No regression for US workspaces

⸻

User Stories

Epic: UK Workspace Mode

⸻

Story 1: UK Workspace Creation

As a school administrator
I want to select the UK during onboarding
So that the platform reflects UK assessment expectations automatically

Acceptance Criteria
	•	UK appears as a selectable country
	•	Workspace locale is set to UK
	•	Locale cannot be changed by teachers

⸻

Story 2: UK Assessment Defaults

As a UK teacher
I want assessments to avoid scores and grades by default
So that feedback aligns with UK pedagogy and inspection expectations

Acceptance Criteria
	•	No numeric scores visible
	•	Descriptors replace grades
	•	Oracy strands visible by default

⸻

Story 3: UK AI Feedback Language

As a UK teacher
I want AI feedback to describe evidence, not judge performance
So that it supports teaching rather than ranking students

Acceptance Criteria
	•	AI output uses observational language
	•	Feedback references indicators, not scores
	•	No predictive or comparative phrasing

⸻

Story 4: Inspection-Safe Reporting

As a senior leader
I want reports that are narrative and editable
So that they can be safely used for inspection evidence

Acceptance Criteria
	•	Reports are editable
	•	Mandatory disclaimers included
	•	No automated judgements presented as final

⸻

Sprint Plan (1 Sprint – 2 Weeks)

Sprint Goal

Deliver a fully functional UK-specific workspace that reshapes assessment, AI output, and reporting without codebase duplication.

⸻

Sprint Backlog

1. Data & Config
	•	Add school.locale (if not finalised)
	•	Enforce immutability after creation
	•	Migration for existing UK pilot schools

⸻

2. UI & Copy
	•	Locale-based copy switch
	•	Hide score-related UI in UK mode
	•	Replace terminology across:
	•	dashboards
	•	assessments
	•	reports
	•	exports

⸻

3. AI Prompt Layer
	•	UK-specific prompt variants
	•	Replace judgement language
	•	Ensure strand-based observational output

⸻

4. Reporting
	•	UK report templates
	•	Disclaimer injection
	•	Editable narrative sections

⸻

5. QA & Verification
	•	UK workspace end-to-end test
	•	Regression test for US workspaces
	•	Demo script validation (UK vs US)

⸻

Definition of Done (DoD)

A UK Workspace is DONE when:

Functional
	•	UK locale is enforced at workspace level
	•	No scores or grades appear anywhere in UK mode
	•	Oracy strands are integrated by default

UX
	•	All visible language aligns with UK norms
	•	Teachers cannot accidentally expose US-style grading
	•	Students receive feedback without numeric evaluation

AI
	•	Outputs are observational and narrative
	•	No judgement or prediction language appears
	•	Subject learning + oracy evidence are clearly separated

Reporting
	•	Reports are editable
	•	Disclaimers are present and persistent
	•	Exports are inspection-safe

Quality
	•	No impact on US workspaces
	•	No duplicated code paths
	•	Dev team signs off that locale logic is centralized

⸻

Final Note (Strategic)

This PRD does not create a “UK product.”
It creates a UK assessment culture mode inside SayVeritas.

That distinction is what keeps:
	•	maintenance sane
	•	trust high
	•	Voice 21 alignment credible

If you want next, I can:
	•	convert this into a dev-ticket breakdown
	•	produce a demo checklist for UK pilots
	•	or write the internal justification memo for why this architecture choice matters