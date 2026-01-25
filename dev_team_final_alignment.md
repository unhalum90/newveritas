Below is a one-page internal memo you can drop into Notion, email, or a doc for sign-off.
It is written as a product owner decision memo, not a discussion paper.

⸻

Internal Memo — Speak Britain (UK Oracy Build)

Product: SayVeritas
Initiative: UK Oracy Platform (“Speak Britain”)
Date: insert date
Audience: Engineering, Product, Design
Status: Decisions confirmed — proceed to build

⸻

Purpose

This memo confirms key product, architectural, and positioning decisions required to move forward with the UK Oracy build. These decisions unblock development and ensure the platform is inspection-safe, procurement-ready, and aligned with UK educational expectations.

⸻

Strategic Positioning (Non-Negotiable)

SayVeritas UK will be positioned as an:

Oracy Evidence Platform
— not a grading tool, judgement system, or inspection predictor.

The platform:
	•	Curates evidence
	•	Surfaces patterns
	•	Supports teacher and school judgement
It does not grade pupils, predict outcomes, or replace professional judgement.

This positioning must be reflected consistently in:
	•	UI language
	•	Reporting outputs
	•	Documentation
	•	Sales and onboarding flows

⸻

Confirmed Product Decisions

1. Deployment Model

Decision: UK functionality will be implemented via tenant-level configuration, not a separate deployment.

Implications
	•	Single codebase
	•	Jurisdiction handled at school/tenant level (jurisdiction = "UK")
	•	UK experience surfaced via /uk path or locale toggle
	•	UK data residency handled at infrastructure level

This avoids premature legal, DPIA, and ops complexity while remaining future-proof.

⸻

2. Voice 21 Alignment

Decision: Independent alignment to the published Voice 21 Oracy Framework.
No formal partnership is implied.

Implementation rules
	•	Use language: “Aligned to the Voice 21 Oracy Framework”
	•	Maintain internal mapping artifacts
	•	Attribute publicly where required
	•	Do not embed proprietary framework language verbatim in UI
	•	Do not use Voice 21 branding in-product

This approach is legally safe and partnership-compatible later.

⸻

3. MIS Integrations (SIMS / Arbor)

Decision: Architecturally aware, implementation deferred to V2.

Now
	•	Clean internal identifiers
	•	MIS-safe student metadata structures
	•	No hard-coded assumptions

Later
	•	Connectors and sync logic

MIS integration is not required for pilots or early traction.

⸻

4. British Voice AI (TTS)

Decision: MVP ships with existing TTS voices.
British accents (RP, Estuary) are a fast-follow, not a blocker.

Constraints
	•	Accent neutrality for analysis is mandatory
	•	TTS affects practice UX, not assessment validity
	•	Voice selection must be clearly labelled

⸻

Build Scope Confirmation (MVP)

Approved for implementation:
	•	UK Key Stage localisation (KS1–KS5)
	•	Oracy strand profiles (Physical, Linguistic, Cognitive, Social)
	•	Strand-based markers (no scores)
	•	Longitudinal progression tracking
	•	60-second teacher insight summaries
	•	Editable, inspection-ready evidence packs
	•	Trust layer disclaimers throughout product

Deferred to V2:
	•	MIS integrations
	•	Group talk analytics
	•	MAT-level rollups
	•	Automated disadvantage gap analytics
	•	Peer feedback workflows

⸻

Language & Trust Guardrails (Critical)

The following terms must not appear in UK locale:
	•	score
	•	grade
	•	predict
	•	judge
	•	ranking

Approved replacements:
	•	marker
	•	indicator
	•	descriptor
	•	evidence
	•	progression

All UK reporting must remain narrative-first and editable.

⸻

Risk Management

Primary risks (framework interpretation, misuse for inspection claims, EAL bias) are mitigated by:
	•	Independent mapping documentation
	•	Persistent disclaimers in exports
	•	Separation of reasoning analysis from language proficiency
	•	Human-in-the-loop framing throughout

⸻

Approval & Next Steps

This memo confirms:
	•	Architecture approach
	•	Alignment strategy
	•	MVP scope
	•	Language constraints

Engineering is cleared to proceed immediately with:
	1.	Database migrations
	2.	Oracy strand engine
	3.	Evidence pack generation
	4.	UK UI localisation

⸻

Bottom line:
Proceed as designed. Build evidence infrastructure, not judgement machinery.