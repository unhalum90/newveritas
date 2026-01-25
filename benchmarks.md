# UK Oracy Benchmarks — Dev Team Implementation Brief
Source: Voice 21 – *The Oracy Benchmarks* (2019)  [oai_citation:0‡Benchmarks-report-FINAL.pdf](sediment://file_00000000811471f4aa86d4eb7eeb6439)

## 1. Core Concept (Why this matters technically)
UK oracy expectations are **explicit, assessable, and school-accountable**.
Any AI assessment tool must support:
- Ongoing formative capture of spoken reasoning
- Reflection and feedback cycles
- Evidence for leadership-level accountability (Ofsted, governors, trusts)

This is not “speech practice.”  
It is **observable, improvable, reportable learning**.

---

## 2. Canonical Oracy Framework (Non-optional model alignment)

All assessment, feedback, and reporting must map to **four strands**:

### A. Physical
- Voice: pace, tone, clarity, projection
- Body language: eye contact, posture, gesture

### B. Linguistic
- Vocabulary choice
- Grammar & register
- Rhetorical techniques (metaphor, emphasis, etc.)

### C. Cognitive
- Reasoning (giving reasons, evaluating ideas)
- Structure (organising talk)
- Clarifying & summarising
- Self-regulation (focus, time management)

### D. Social & Emotional
- Turn-taking
- Listening & responding
- Audience awareness
- Confidence in speaking

**Dev implication**
- Rubrics must be multi-dimensional (not a single score)
- Feedback objects must reference strand + subskill
- Models must tolerate partial mastery (progression, not pass/fail)

---

## 3. Teacher Benchmarks → Feature Requirements

### Benchmark 1: Sets High Expectations for Oracy
**Requires**
- Explicit success criteria for talk
- Scaffolded prompts
- Accountability for quality (not just participation)

**Features**
- Teacher-configurable talk criteria
- Prompt libraries (sentence stems, reasoning prompts)
- Quality indicators beyond transcript length

---

### Benchmark 2: Values Every Voice
**Requires**
- Inclusion of quieter / EAL / SLCN students
- Recognition of listening as well as speaking

**Features**
- Participation balance indicators
- Wait-time / preparation modes
- Non-penalising hesitation handling

---

### Benchmark 3: Teaches Oracy Explicitly
**Requires**
- Oracy taught as a skill, not assumed
- Planned progression across tasks

**Features**
- Skill-tagged assignments
- Strand-specific practice modes
- Reusable oracy task templates

---

### Benchmark 4: Harnesses Oracy to Elevate Learning
**Requires**
- Subject-specific talk (maths, science, history, etc.)
- Reasoning, not recall

**Features**
- Subject-aware prompt logic
- Evidence-based follow-up questions
- Multimodal inputs (text + image + artefact explanation)

---

### Benchmark 5: Appraises Progress in Oracy
**Requires**
- Reflection cycles
- Peer + teacher feedback
- Use of recordings over time

**Features**
- Recording storage & replay
- Comparative attempts (baseline → latest)
- Reflection prompts tied to rubric deltas

---

## 4. School Benchmarks → Platform-Level Requirements

### A. Leadership & Vision
**Requires**
- Named Oracy Lead
- Whole-school strategy evidence

**Features**
- Role-based dashboards (SLT vs teacher)
- School-wide oracy metrics
- Exportable evidence packs

---

### B. Culture of Oracy
**Requires**
- Oracy visible beyond lessons
- Low-stakes to high-stakes progression

**Features**
- Event-based assessments (assemblies, presentations)
- Multiple context tagging (lesson, showcase, project)

---

### C. Curriculum Progression
**Requires**
- Sequential skill development
- Age-appropriate expectations

**Features**
- Year/Key Stage mappings
- Progression ladders by strand
- Cross-subject continuity

---

### D. Accountability & Inspection Readiness
**Requires**
- Evidence of impact
- Continuous improvement loop

**Features**
- Longitudinal reporting
- Cohort comparisons
- Student voice artifacts
- Inspection-ready exports (PDF/CSV)

---

## 5. Assessment Reality Check (Critical Insight)
Voice 21 explicitly notes:
> Oracy is harder to capture than written work; recording helps, but interpretation matters.

**This validates SayVeritas’ core advantage**:
- AI-mediated 1:1 dialogue
- Scalable reasoning capture
- Time feasibility teachers do not have manually

---

## 6. Non-Negotiable Constraints
- Oracy Benchmarks **cannot be resold or rebranded**
- Must be **aligned to**, not embedded as proprietary IP
- Attribution required in documentation and alignment materials

---

## 7. Bottom Line for Engineering
If the platform cannot:
- Show *progress over time*
- Explain *why a student improved*
- Produce *credible evidence for school leaders*

…it will **not** be adopted seriously in the UK.

SayVeritas is already architecturally aligned.
This document defines what must be **surfaced, labeled, and reported**.