**For Dev Team: Four Critical Pre-Launch Features**

Status Snapshot
- Practice Mode Toggle: Implemented (v1)
- Grace Restart Toggle: Implemented (v1)
- Bloom's Level Dropdown: Implemented (v1)
- Use Template Option: Implemented (seed templates)

---

## 1. Practice Mode Toggle (General Info Step)

**What It Is:**
A simple on/off toggle that marks an assessment as "practice only" - no scores recorded, no grade impact, students can retry.

**Status:** Implemented (v1)

**Where It Goes:**
General Info (Step 2), below student instructions, above subject selection.

```
Student Instructions: [text area]

□ Practice Mode
  This assessment is for practice only. Student responses will not be scored
  or recorded in gradebook. Students can complete multiple times.

Subject: [dropdown]
```

**Technical Behavior:**
- **When ON:**
  - Assessment submissions don't create gradebook entries
  - Teacher dashboard shows submissions but no scores (or scores marked "Practice - Not Recorded")
  - Students can submit unlimited times (no "already submitted" block)
  - Analytics track completion but don't calculate averages with graded assessments
  - Badge/label on assessment card: "Practice Mode"

- **When OFF (default):**
  - Normal graded assessment flow
  - One submission per student (unless teacher manually resets)
  - Scores recorded in gradebook

**Database Field:**
```
assessments table:
is_practice_mode BOOLEAN DEFAULT FALSE
```

**UI Labels:**
- Builder: "Practice Mode" (toggle)
- Student view: "Practice Assessment" (badge)
- Teacher dashboard: "Practice" (label on card + in results table)

**Why This Matters:**
Teachers need this for Week 1-2 of implementation (per Implementation Guide). Without it, they either skip scaffolding or manually delete grades later. This is our competitive advantage - "scaffolded entry point."

---

## 2. Grace Restart Toggle (Integrity Shields Section)

**What It Is:**
Allows students ONE chance to restart assessment if they demonstrate clear unpreparedness (long pause before starting OR completely off-topic answer). Full spec in `/mnt/project/restart-feature-dev-spec.md`.

**Status:** Implemented (v1)

**Where It Goes:**
Integrity Shields section, as a new toggle alongside existing shields.

```
Integrity Shields

□ Pausing Guardrail
□ Focus Monitor  
□ Dynamic Shuffle
□ Grace Restart
  Students can restart once if they pause 10+ seconds before speaking
  or submit a clearly off-topic answer. They receive a different question
  on restart.

Academic Integrity Pledge...
```

**Technical Behavior:**
- **When ENABLED:**
  - Student pauses ≥10 seconds before first word → modal appears: "Need more time?" with Restart/Continue options
  - Student submits response → AI evaluates if completely off-topic → if yes, modal: "Double-check your answer?" with Restart/Submit Anyway options
  - If student chooses Restart:
    - Log event to `assessment_restart_events` table (see spec)
    - Assessment marked incomplete, student can return later
    - When they return, serve DIFFERENT question variant (if available)
    - Only ONE restart per student per assessment (second attempt is final)
  - Teacher dashboard shows which students used restart + reason (pause/off-topic)

- **When DISABLED (default):**
  - No restart option
  - Students must complete in one attempt

**Database Requirements:**
(See full schema in restart spec document)

```
assessment_integrity table:
allow_grace_restart BOOLEAN DEFAULT FALSE

New table:
assessment_restart_events
- student_id, assessment_id, restart_reason, 
  original_question_variant_id, new_question_variant_id, 
  restarted_at, etc.
```

**AI Integration:**
Off-topic detection uses the OpenAI model configured by `OPENAI_OFF_TOPIC_MODEL` (threshold >0.85).

**Implementation Note:**
Current restart flow restarts the attempt with the same question bank (no variant swap yet).

**Why This Matters:**
Formative assessment context where students shouldn't be penalized for bad timing. Competitive differentiation - shows we care about learning, not just surveillance. Reduces student anxiety, increases completion rates.

**Reference:** Full implementation details in `/mnt/project/restart-feature-dev-spec.md`

---

## 3. Bloom's Level Dropdown (Per Question)

**What It Is:**
A dropdown per question allowing teacher to tag cognitive demand level. Helps teachers scaffold complexity and provides data on assessment design quality.

**Status:** Implemented (v1)

**Where It Goes:**
Questions (Step 4), as new field for each question, between question text and question type.

```
Question 1

Question Text: [text area]

Bloom's Taxonomy Level: [dropdown]
  - Remember (recall facts)
  - Understand (explain concepts)  
  - Apply (use in new context)
  - Analyze (examine relationships)
  - Evaluate (judge/defend)
  - Create (synthesize new ideas)
  ℹ️ Hover: "Helps you scaffold complexity. Week 1 assessments should
     be Remember/Understand. Week 4 can be Evaluate/Create."

Question Type: [dropdown]
```

**Technical Behavior:**
- **Required field** (can default to "Understand" but teacher should review)
- Stored per question
- Teacher dashboard shows average Bloom's level for assessment
- Analytics can track: "Are teachers scaffolding over time?" (Week 1 avg = 2, Week 4 avg = 5)
- AI question generation should accept Bloom's level as parameter: "Generate 3 questions at Apply level about photosynthesis"

**Database Field:**
```
questions table:
blooms_level VARCHAR(20) CHECK (blooms_level IN 
  ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'))
```

**Display/Reporting:**
- Builder: Shows level per question
- Assessment card: "3 questions (Avg: Apply level)"
- Teacher dashboard: "Assessment complexity: Moderate" (calculated from average)
- Admin dashboard: Track Bloom's progression across assessments

**Why This Matters:**
Teachers fail at oral assessment when they skip scaffolding. This field makes cognitive demand VISIBLE and helps them design progressive difficulty. Also provides data for our implementation research: "Teachers using Bloom's tagging had 40% higher student success rates."

**Reference:** Scaffolding principles in `/mnt/project/pedagogical-alignment-guide.md`

---

## 4. "Use Template" Option (Start Step)

**What It Is:**
Pre-built question templates organized by subject, Bloom's level, and grade band. Teachers can select template, customize, and publish - reduces "blank page anxiety."

**Status:** Implemented (seed templates)

**Where It Goes:**
Start (Step 1), as fourth authoring mode option.

```
Start Your Assessment

Choose how to begin:

○ Start from scratch
  Build questions manually

○ Upload PDF  
  Extract questions from document

○ Generate with AI
  Describe what you want to assess

○ Use a template
  Browse pre-built questions by subject

[Continue]
```

**When Selected → Template Browser UI:**

```
Choose a Template

Filter by:
Subject: [All ▼]  Bloom's Level: [All ▼]  Grade Band: [All ▼]

Results (24 templates):

┌─────────────────────────────────────────┐
│ American Revolution - Causes            │
│ History • Grades 9-12 • Analyze level  │
│ 4 questions • Created by SayVeritas     │
│ [Preview] [Use This Template]           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Photosynthesis - Basic Understanding    │
│ Science • Grades 6-8 • Understand level│
│ 3 questions • Created by SayVeritas     │
│ [Preview] [Use This Template]           │
└─────────────────────────────────────────┘

[When "Use This Template" clicked]
→ Copies template questions into new draft assessment
→ Teacher can edit all fields before publishing
→ Template attribution stored but not displayed to students
```

**Technical Implementation:**

**New table:**
```
assessment_templates
- id, title, subject, blooms_level_avg, grade_band,
  created_by (system/teacher), is_public, 
  questions (JSON), rubrics (JSON), created_at

questions_from_template
- question_id, source_template_id (for analytics)
```

**Behavior:**
1. **Launch with 20-30 system templates** covering common subjects
2. Template selection copies questions into new draft (not linked - teacher can modify freely)
3. Track in analytics: "40% of assessments started from templates" (shows feature value)
4. Coming soon state should display a badge or disabled option until templates are ready
4. **Future enhancement (v1.1):** Teachers can save their own assessments as templates, share within department

**Template Quality Standards:**
Each template must include:
- Title + description
- Subject + Bloom's level + grade band tags
- 3-5 questions with clear prompts
- Both rubrics (Reasoning + Evidence) pre-configured
- Student instructions
- Suggested recording limits
- Optional: Recommended integrity shields

**Why This Matters:**
Teachers new to oral assessment need examples to understand what "good" looks like. Without templates, they either:
- Abandon tool (too intimidating)
- Create poor-quality questions (then blame tool when students struggle)
- Spend 2+ hours building first assessment (unsustainable)

Templates reduce time-to-first-assessment from 2 hours → 20 minutes. Shows we support teachers, not just sell them software.

---

## Summary for Product Prioritization

**Effort Estimates:**
1. **Practice Mode:** Low (1-2 days) - simple toggle + database field + UI badges
2. **Bloom's Dropdown:** Low (2-3 days) - dropdown + validation + basic reporting
3. **Grace Restart:** High (2-3 weeks) - complex logic, AI integration, multiple tables (see full spec)
4. **Templates:** Medium (1 week) - new table, browser UI, seed 20-30 templates

**Launch Sequence Recommendation:**
- **Week 1:** Practice Mode + Bloom's Dropdown (low-hanging, high-impact)
- **Week 2:** Templates (requires creating quality seed content)
- **Week 3-4:** Grace Restart (most complex, but not blocking for basic use)

**Must-Have for Public Launch:**
- Practice Mode (enables scaffolding narrative)
- Bloom's Dropdown (supports "any difficulty" claim)

**Can Ship in v1.1:**
- Templates (helpful but not blocking)
- Grace Restart (formative assessment enhancement)

**Questions for Eric:**
1. Should we delay public launch 2-3 weeks to include all four? Or ship with just Practice Mode + Bloom's?
2. How many templates do we need for launch? Subject coverage priorities?
