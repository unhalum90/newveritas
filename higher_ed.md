For higher ed, the bar for “summative” is not flexibility; it’s defensibility: validity, reliability, integrity, and an audit trail. The safest way to get there is to treat Veritas Assess as a structured “viva” engine (with controlled branching), not an open-ended StudyLab chat.

Modalities you need in place

Minimum viable for higher ed summative:
	1.	Voice response (required)

	•	Timed, one-shot per question (or capped retries with logging)
	•	Transcript stored with timestamps

	2.	Artifact submission (optional but high-value)

	•	PDF/image upload (paper notes, problem set, lab work, outline)
	•	“Artifact defense” questions that point to specific parts of the artifact

	3.	Source / citation modality (often required)

	•	A short text box per response for:
	•	cited sources (page #, DOI, URL, course reading)
	•	definitions, formulas, references
This matters in humanities/social sciences and any research-based prompt.

	4.	Video (optional, but increasingly expected)

	•	Not mandatory, but institutions may request it for identity/integrity.
	•	If you don’t do full video, at least support: “record audio + camera still at start” as a lightweight alternative.

Structure that makes it “summative”

1) Exam blueprint with constrained degrees of freedom

A summative assessment object should be explicit:
	•	Learning outcomes (even if not “standards”)
	•	Prompt set (question bank + selection rules)
	•	Allowed resources (none / notes / open book / specified readings)
	•	Timing rules (per question + total)
	•	Attempt rules (one-shot / retake policy)
	•	Rubric (fixed dimensions + anchors)

Key point: for higher ed, you want repeatability. Same exam structure across students; variability only where intentional (randomized prompt selection).

2) Controlled conditions and integrity settings

You don’t need heavy proctoring to be credible, but you need clear controls:
	•	Time window (open/close dates)
	•	Duration once started (cannot pause indefinitely)
	•	Question reveal policy (one at a time; no backtracking if desired)
	•	Randomization (from a bank; shuffle per student)
	•	Answer-length caps (e.g., 90–180 seconds per response)
	•	Disallowed assistance statement + student attestation at start/end
	•	Optional integrity features:
	•	IP/device logging
	•	plagiarism/similarity checks on transcripts (if you choose)
	•	“follow-up verification” prompts (see below)

3) Socratic follow-ups that are reliable enough for grading

Higher ed follow-ups can’t feel like freeform tutoring. They need to function like an oral examiner:

Requirement: a deterministic follow-up framework
For each core question, define 2–4 follow-up types the system can select from:
	•	Clarify: define terms; restate claim precisely
	•	Justify: “why?” “what evidence supports that?”
	•	Counterexample/edge case: “when would this fail?”
	•	Transfer: apply concept to a new scenario
	•	Method check: “walk me through your steps”
	•	Citation check: “which reading supports that claim?”

Hard cap: max follow-ups per question (e.g., 2).
Triggering: follow-ups should be triggered by rubric gaps/low confidence flags, not by improvisation.

4) Rubric + anchors (this is what makes grading defensible)

A higher ed rubric should include:
	•	Dimensions (typically 3–6): accuracy, argumentation, evidence/citation, structure/clarity, application/transfer, discipline-specific conventions
	•	Level descriptors (0–3/0–4) that are measurable
	•	Anchor examples (short exemplars for each level)

Even if AI provides a provisional score, you want:
	•	teacher override
	•	reason codes (“missing evidence,” “definition imprecise,” etc.)

5) Evidence pack and audit trail

For each student attempt, the system should produce a single “evidence pack”:
	•	Prompt(s) + any follow-ups asked
	•	Audio files + transcript
	•	Artifact(s) submitted
	•	Timing logs (started, each question timestamp, submitted)
	•	Scoring outputs (rubric levels + reason codes + confidence)
	•	Teacher adjustments (what changed, by whom, when)

This is what makes it acceptable in grade disputes.

6) Grading workflow for higher ed reality

Higher ed often needs:
	•	second-marker / moderation support (optional, but plan for it)
	•	blind marking option
	•	export to LMS gradebook and/or CSV
	•	regrade workflow + comments

A practical “Higher Ed Summative” configuration (minimum that will hold up)

Veritas Assess: Viva Lite
	•	3 core questions selected from a bank
	•	2 follow-ups max per question from defined types above
	•	2 minutes per core response, 1 minute per follow-up
	•	Allowed resources: “course notes + assigned readings only”
	•	Citation box required for 2 of 3 questions
	•	Rubric: Argument, Evidence, Accuracy, Transfer (0–4) with anchors
	•	Evidence pack generated automatically

This will feel like a legitimate oral exam without becoming a proctoring product.

What to test next (because you called it out)

To validate the “Socratic follow-ups” for higher ed, test these failure modes specifically:
	•	Student gives a fluent but shallow answer → does the follow-up force evidence/precision?
	•	Student gives partially correct answer → does it diagnose what is missing without teaching?
	•	Student tries to dodge (“I’m not sure”) → does it probe in a way that still produces gradable evidence?
	•	Student gives confident wrong answer → does it challenge with a counterexample/transfer prompt?

If the follow-up engine passes those, it will work for higher ed summative.