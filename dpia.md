# Data Protection Impact Assessment (DPIA)

**Template version:** 20180209  
**Template revision:** v0.3  

This template is an example of how you can record your DPIA process and outcome.  
It follows the process set out in DPIA guidance and should be read alongside:
- DPIA guidance
- Criteria for an acceptable DPIA set out in European guidelines on DPIAs

You should begin completing this template at the start of any major project involving
the use of personal data, or when making a significant change to an existing process.
Final outcomes should be integrated back into the project plan.

---

## Step 1: Identify the Need for a DPIA

Veritas is an AI-powered oracy assessment platform that records students' verbal responses to assess reasoning and evidence.

**Aims:**
- Automate teacher marking for oral assessments.
- Provide real-time safeguarding through mental health "crisis detection."
- Improve student outcomes through Socratic AI feedback.

**Processing involves:**
- **Children's Data**: Processing PII and educational records for minors.
- **Biometric Data**: Capturing audio recordings of student voices. *Note: Audio recordings are not used for biometric identification or authentication purposes, and no voiceprints or speaker recognition profiles are generated.*
- **AI Processing**: Using Large Language Models (Gemini, OpenAI) for automated evaluation and transcription.
- **Sensitive Contexts**: Analyzing speech for indicators of self-harm or suicide (Crisis Detection).

**DPIA Need:** Mandatory under UK GDPR due to processing children's data at scale and using novel AI technologies for automated decision-making and safeguarding. Processing is designed in line with the ICO Children's Code principles, prioritising data minimisation, transparency, and the best interests of the child.

---

## Step 2: Describe the Processing

### Nature of the Processing
- **Collection**: Students record audio via the web browser. Audio is temporarily buffered as base64 and then uploaded to Supabase Storage.
- **Storage**: Highly structured relational data in Supabase (PostgreSQL). Audio stored in dedicated S3-compatible buckets.
- **AI Pipeline**: Audio is sent to OpenAI Whisper or Gemini for transcription. Transcripts are then processed by Gemini-1.5-Flash (or similar) for scoring and crisis detection.
- **Sharing**: Audio/Transcripts are shared with OpenAI and Google via secure API calls. No data is used for model training by these providers (Enterprise API terms).
- **Deletion**: Audio is retained for a maximum of 30–90 days, and may be deleted sooner following teacher review or safeguarding triage, based on school-specific retention policies.

### Scope of the Processing
- **Nature**: Educational performance data, audio recordings, and special category "Safeguarding" data (mental health keywords).
- **Volume**: Potentially thousands of students per school district across multiple UK academies.
- **Frequency**: Regular formative use (weekly or bi-weekly).
- **Retention**: Audio (30-90 days), Transcripts/Scores (active academic year + 1).
- **Individuals**: School children (Key Stages 1-4) and teachers.

### Context of the Processing
- **Relationship**: School/Teacher to Student (trusted educational environment).
- **Individual Control**: Students are presented with an "Audio Consent" and "Academic Integrity Pledge" before starting assessments.
- **Vulnerability**: Children are involved, requiring higher protection levels.
- **Technology**: Novel use of Agentic AI to probe reasoning in real-time.
- **Concerns**: Potential for AI bias in scoring or "false negatives" in crisis detection.

### Purpose of the Processing
- **Goals**: Provide immediate, actionable feedback to students and reduce teacher administrative burden.
- **Benefits**: Early intervention for students needing support; consistent oracy benchmarking across classes.

---

## Step 3: Consultation Process

### Consultation with Individuals (Data Subjects):
Direct consultation with students was not undertaken due to age, power imbalance, and safeguarding considerations. Instead, transparency is ensured through:
- **Student-facing explanations**: Provided prior to recording via the Audio Consent and Academic Integrity Pledge.
- **School Privacy Notices**: Incorporating SayVeritas processing details into official school documentation.
- **Parental Channels**: Access provided via school data protection channels where applicable.

### Internal Stakeholders Consulted:
- **Product Owner**: Assessment & Safeguarding Features.
- **Technical Lead**: AI pipeline, data storage, retention.
- **Safeguarding Lead / DSL advisor**: Crisis detection design assumptions and triage workflows.
- **Legal/Data Protection advisor**: UK GDPR alignment and DPIA verification.

### Processor Consultation:
OpenAI and Google are engaged as sub-processors under enterprise/API terms. Data Processing Agreements (DPAs) specify:
- No training on submitted data.
- API-only processing (ephemeral in many states).
- Regional data handling controls where available.

### Security & Technical Consultation:
Supabase security model reviewed, focusing on:
- Row Level Security (RLS) and logical tenant isolation.
- Role-based access controls (RBAC).
- Encryption in transit (TLS) and at rest (AES-256).

### Outcome:
Consultation confirmed that risks are understood, mitigations are proportionate, and processing can proceed with ongoing review.

---

## Step 4: Assess Necessity and Proportionality

- **Lawful Basis**: 
    - **Public Task (Article 6(1)(e))**: Where deployed by maintained schools, academies, or local authorities.
    - **Legitimate Interests (Article 6(1)(f))**: Where deployed by independent schools, with a Legitimate Interests Assessment (LIA) completed.
- **Special Category Data (Safeguarding)**:
    - **Article 9(2)(g)**: Substantial Public Interest.
    - **DPA 2018 Schedule 1, Part 2, paragraph 18**: (Safeguarding of children).
    - **Safeguarding Boundary**: Crisis detection operates as a support signal only and does not replace school safeguarding procedures, professional judgment, or statutory reporting obligations.
- **Automated Decision-Making (ADM)**: The system does not make solely automated decisions with legal or similarly significant effects (as per Article 22). All assessment outcomes and safeguarding alerts are subject to human review by teachers or designated safeguarding staff.
- **Proportionality**: AI evaluation is the only scalable way to provide instant feedback for verbal oracy at the class level.
- **Data Minimisation**:
    - Audio is deleted shortly after review.
    - AI providers (Google/OpenAI) are accessed via standard API (Zero Data Retention where feasible).
    - Database fields use `data_classification` tags (e.g., 'personal', 'educational', 'anonymous') for differentiated handling.
- **Accuracy**: Integrity events monitor for "slow start" or "long pauses" to ensure AI scoring is based on high-quality audio capture.
- **Rights**: Students/Schools can revoke consent or request data deletion via the dashboard interfaces.
- **Safeguards**: Supabase Row Level Security (RLS) ensures that school data is cryptographically and logically isolated.

---

## Step 5: Identify and Assess Risks

| Risk Description | Likelihood of Harm | Severity of Harm | Overall Risk |
|------------------|------------------|-----------------|--------------|
| **AI Bias/Accuracy**: AI scores are unfair to students with certain accents or speech patterns. | Possible | Significant | Medium |
| **Safeguarding Failure**: Crisis detection fails to trigger a "False Negative" for a genuine risk. | Remote | Severe (mitigated by non-reliance on AI-only determination) | Medium |
| **Unauthorized Access**: PII or audio recordings are accessed by unauthorized users due to system vulnerability. | Remote | Severe | Low |
| **Data Retention Overstay**: Student audio data is kept indefinitely beyond the 30-90 day policy. | Possible | Minimal | Low |
| **Automated Decision Impact**: Students/parents feel distressed by AI-generated feedback without human oversight. | Possible | Significant | Medium |

---

## Step 6: Identify Measures to Reduce Risk

| Risk | Measures to Reduce or Eliminate Risk | Effect on Risk | Residual Risk | Measure Approved |
|------|------------------------------------|---------------|---------------|------------------|
| AI Bias | Provide **Teacher Overrides** for every AI score; use confidence markers for teachers. | Reduced | Low | Yes |
| Safeguarding Failure | Implement multi-keyword matching and immediate teacher email alerts for manual triage. | Reduced | Low | Yes |
| Unauthorized Access | Use **Supabase Row Level Security (RLS)** and hardened API routes; regular security audits. | Reduced | Low | Yes |
| Data Retention | Implement automated background workers to prune audio files based on `retention_days` settings. | Reduced | Low | Yes |
| Automated Decision Impact | Transparency: Inform students that "AI is a learning aid, not the final judge"; maintain human-in-the-loop. | Reduced | Low | Yes |

---

## Step 7: Sign Off and Record Outcomes

| Item | Name / Date | Notes |
|-----|------------|-------|
| Measures approved by | Product Owner – Q1 2026 | Integrate actions into project plan with dates and responsibilities. |
| Residual risks approved by | Senior Responsible Owner (SRO) | Risks accepted as proportionate within an educational context. |
| DPO advice provided | External DPO – Q1 2026 | Advice on compliance, mitigation, and whether processing can proceed. |
| Summary of DPO advice | Initial draft verified as compliant with UK GDPR and ICO AI guidance. | No requirement to consult ICO based on current mitigations. |
| DPO advice accepted or overruled by | SRO | Advice accepted. |
| Consultation responses reviewed by | Product Owner | Continued transparency and student explainability confirmed. |
| DPIA kept under review by | DPO (Annual Review) | DPO should review ongoing compliance and minor feature updates. |

---