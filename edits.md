Highest-priority changes (to make it pilot-ready and reduce failure modes)

1) Require an explicit “Learning Target / Unit Context”

Right now the StudyLab creation has “Topic/Title” + optional focus. Add a required field:
	•	Learning Target / Unit / Chapter (short, structured)
This is your main control against irrelevant questions and hallucinated specificity.

2) Add hard session boundaries (cost + pedagogy + expectations)

In the StudyLab creation screen, add 2–3 toggles with sane defaults:
	•	Max turns (e.g., 6)
	•	Target time (e.g., 3–5 minutes)
	•	Difficulty / scaffolding level (Supportive / Standard / Challenge)

3) Make artifact capture a first-class step in StudyLab

Your chat screenshots imply the AI “saw notes,” but the flow shown doesn’t confirm the artifact is attached.
	•	Add “Notes/Artifact required” toggle (default ON for teacher-assigned sessions)
	•	Show artifact thumbnail pinned in the chat header (tap to view)

4) Add a “confidence / anchor” mechanism (trust)

When referencing notes, the AI should cite what it saw:
	•	“I can see the words ‘isosceles’ and ‘2 sides same length’…”
If confidence is low, it should ask the student to highlight or type the key term before proceeding.

5) Add progress + exit controls in chat

Small UI additions that materially improve completion rates:
	•	“Turn 2 of 6” (or time remaining)
	•	“End session” + “Save summary”
	•	A post-session card: Strengths / Next steps / 2 prompts to retry