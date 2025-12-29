Below is a developer-facing compliance document you can hand directly to your dev team. It is written to be practical, auditable, and implementation-oriented, not legal theory. It assumes your stack (Next.js, Supabase, Vercel, AI APIs) and the SayVeritas / PhonemeLab context (education, voice data, minors possible).

⸻

Compliance Requirements – GDPR + U.S. Federal Laws

Applies to: SayVeritas, PhonemeLab, and related Chamberlin Innovations apps
Audience: Engineering, Product, DevOps
Purpose: Define required technical, data, and process controls for legal compliance

⸻

1. Regulatory Scope (What Applies)

1.1 GDPR (EU / EEA users)

Applies because:
	•	Users are in the EU (teachers, students)
	•	Personal data is processed
	•	Audio recordings = biometric-adjacent personal data

1.2 U.S. Federal Education & Privacy Laws

Applies because:
	•	Apps may be used in K-12 or higher-ed contexts
	•	Student data is processed on behalf of schools

Key laws:
	•	FERPA – student educational records
	•	COPPA – children under 13 (if applicable)
	•	State privacy laws (CCPA/CPRA etc.) → design once, comply broadly

Assumption: School-based usage = “school official” exception under FERPA, but only if controls are implemented correctly.

⸻

2. Data Classification (Must Be Explicit in Code)

Every stored field must fall into one of these buckets:

2.1 Personal Data
	•	Name, email
	•	User IDs
	•	IP address (logs)
	•	Teacher comments

2.2 Student Educational Records (High Sensitivity)
	•	Assessment results
	•	Scores, rubrics
	•	Feedback tied to a student

2.3 Audio / Voice Data (Very High Sensitivity)
	•	Raw audio recordings
	•	Transcripts
	•	Pronunciation scoring artifacts

2.4 Operational / Anonymous Data
	•	Usage counts
	•	Performance metrics
	•	Aggregated analytics (non-identifiable)

Dev Requirement:
Each table must include:

data_classification: personal | educational | audio | anonymous


⸻

3. Lawful Basis for Processing (GDPR)

3.1 Required Legal Bases

Your apps must support at least one of the following per user:
	•	Contract – teacher or school account
	•	Legitimate interest – analytics (strictly limited)
	•	Consent – audio recording, AI processing

3.2 Implementation Requirements
	•	Explicit consent checkbox before first audio recording
	•	Consent timestamp stored per user
	•	Consent revocation must stop processing immediately

consent_audio BOOLEAN
consent_audio_at TIMESTAMP
consent_revoked_at TIMESTAMP NULL


⸻

4. Data Minimization (Critical)

Required Rules
	•	Do not store raw audio longer than necessary
	•	Do not store transcripts unless pedagogically required
	•	Do not reuse student data to train models

Defaults (Strongly Recommended)

Data Type	Retention
Raw audio	Auto-delete after scoring (or ≤30 days)
Transcripts	Optional, teacher-controlled
Scores	Retained per school policy
Logs	30–90 days

Retention must be configurable per school.

⸻

5. Data Subject Rights (GDPR Articles 12–23)

Your system must support:

5.1 Right of Access
	•	Export all data for a user/student
	•	Machine-readable (JSON/CSV)

5.2 Right to Rectification
	•	Teachers can correct metadata
	•	Scores should be annotated, not overwritten

5.3 Right to Erasure (“Right to be Forgotten”)
	•	Hard delete audio + transcripts
	•	Soft delete scores only if legally allowed
	•	Cascade delete across all tables

5.4 Right to Restrict Processing
	•	Disable further assessments
	•	Preserve records without new processing

Dev Requirement:
Admin endpoint for:

GET /export-user
POST /delete-user
POST /restrict-user


⸻

6. FERPA Compliance (U.S. Education)

6.1 School Official Exception

To qualify:
	•	App acts only on school instructions
	•	No independent use of student data
	•	No marketing to students
	•	No resale or secondary use

6.2 Required Controls
	•	School owns student data
	•	Teacher/admin controls student accounts
	•	Students cannot create independent accounts without school approval

6.3 Auditability
	•	Every access to student records logged
	•	Admin export available on request

⸻

7. COPPA (Children Under 13)

If under-13 users are possible:
	•	Account creation must be teacher-initiated
	•	No direct student consent flows
	•	No behavioral tracking
	•	No advertising

Simplest Safe Rule:

Treat all students as COPPA-covered.

⸻

8. AI & Third-Party Processing

8.1 Data Processing Agreements (DPAs)

Required with:
	•	OpenAI / Gemini / speech scoring APIs
	•	Supabase
	•	Vercel

8.2 Technical Safeguards
	•	Use API settings that disable training on your data
	•	Strip identifiers before sending to AI where possible
	•	Never send names, emails, or student IDs in prompts

8.3 AI Transparency

Teachers must be told:
	•	AI assists scoring
	•	AI is not sole decision-maker
	•	Human review is possible

⸻

9. Security Requirements (Non-Negotiable)

9.1 Access Control
	•	Role-based access (teacher / admin / student)
	•	Row Level Security (Supabase RLS)
	•	No shared credentials

9.2 Encryption
	•	TLS in transit
	•	Encryption at rest (Supabase default)
	•	Audio files in private buckets only

9.3 Logging
	•	Auth events
	•	Data access events
	•	Admin actions

Logs must never contain raw audio or transcripts.

⸻

10. Breach Response

Required Capabilities
	•	Detect unauthorized access
	•	Identify affected users
	•	Notify within:
	•	72 hours (GDPR)
	•	School district timelines (FERPA contracts)

Dev Requirement

Maintain:

incident_log
breach_response_playbook.md


⸻

11. Documentation & UX Requirements

Must Exist Publicly
	•	Privacy Policy
	•	Data Processing Addendum (for schools)
	•	Cookie notice (if applicable)

Must Exist In-App
	•	Clear explanation before recording audio
	•	Student-friendly integrity + privacy notice
	•	Teacher controls for data retention

⸻

12. What NOT To Do (High Risk)
	•	❌ Reuse student data across schools
	•	❌ Train AI models on recordings
	•	❌ Claim “AI grading is objective” or “fully automated”
	•	❌ Store audio indefinitely by default
	•	❌ Hide consent inside Terms of Service

⸻

13. Recommended Next Dev Tasks
	1.	Add data_classification to all tables
	2.	Implement consent tracking for audio
	3.	Build admin export/delete endpoints
	4.	Add per-school retention settings
	5.	Finalize DPA templates
	6.	Run internal data-flow mapping exercise

⸻

Implementation Status (Engineering)

Done
	•	data_classification added to all tables in supabase/schema.sql
	•	Student audio consent tracking (consent_audio, consent_audio_at, consent_revoked_at)
	•	Student restriction flag (students.disabled) enforced in student APIs
	•	Consent UI modal (student assessment flow) and API endpoint (POST /api/student/consent)
	•	Cookie notice banner (site-wide)
	•	Admin data-rights endpoints:
		•	GET /api/admin/export-user
		•	POST /api/admin/delete-user
		•	POST /api/admin/restrict-user
	•	Per-school retention settings added to schools table (retention_audio_days, retention_transcript_days, retention_log_days)

Pending / Follow-up
	•	Retention enforcement jobs (auto-delete audio/transcripts/logs by school policy)
	•	Audit log of student record access (FERPA 6.3)
	•	Incident log + breach_response_playbook.md
	•	DPA templates and school-facing privacy documents
	•	AI prompt scrubbing to ensure no identifiers in model inputs (verify per call site)

⸻

14. Positioning Note (Important)

Compliance is not just legal protection — it is a sales asset:
	•	Reduces district friction
	•	Builds admin trust
	•	Differentiates from “AI-first” competitors

⸻

If you want next:
	•	I can turn this into a checklist for sprint planning
	•	Or a school-facing compliance summary
	•	Or a data-flow diagram (system → AI → storage → deletion)
