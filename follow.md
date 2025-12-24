# Sprint Plan: Socratic Follow-Ups + Academic Integrity
**Product:** SayVeritas  
**Sprint Duration:** 2 weeks  
**Target Completion:** January 10, 2026 (Ready for Endicott beta)

---

## Epic: Socratic Follow-Up System

**Goal:** Enable AI to ask adaptive follow-up questions based on student's initial response, revealing depth of understanding beyond surface-level answers.

**Success Metrics:**
- Professors can enable/disable Socratic mode per assessment
- Follow-up questions are contextually relevant to initial response
- Students complete 3-part conversation (initial + 2 follow-ups) successfully
- Teacher sees full conversation thread with holistic scoring
- Cost per assessment < $0.10 (within budget)

---

## User Stories: Socratic Follow-Ups

### SV-301: Teacher Enables Socratic Mode
**As a** professor  
**I want** to enable follow-up questions for my assessment  
**So that** I can test depth of understanding, not just recall

**Acceptance Criteria:**
- [ ] Assessment settings page has "Socratic Follow-Ups" toggle section
- [ ] When enabled, shows configuration options:
  - Number of follow-ups: [1 or 2] (radio buttons)
  - Key concepts field (textarea, comma-separated)
  - Follow-up style: [Mixed / Gaps Only / Challenge Reasoning] (dropdown)
  - Time limit per follow-up: [30s / 60s / 90s] (dropdown)
- [ ] Help tooltip explains: "AI will ask follow-up questions based on student's response to probe understanding"
- [ ] Settings save to assessment draft
- [ ] Toggle defaults to OFF (teachers opt-in)
- [ ] Shows estimated time: "This assessment will take ~5-8 minutes per student"

**Story Points:** 5

---

### SV-302: AI Generates First Follow-Up Question
**As a** system  
**I want** to analyze student's initial response and generate relevant follow-up  
**So that** I can probe gaps or test reasoning

**Acceptance Criteria:**
- [ ] After student completes initial response, system:
  - Transcribes audio via Whisper API
  - Calls GPT-4o with follow-up generation prompt
  - Receives follow-up question text (20-40 words)
  - Stores follow-up in database
- [ ] Follow-up generation prompt includes:
  - Original question
  - Key concepts (from teacher settings)
  - Student's transcript
  - Follow-up style preference
  - Current follow-up number (1 or 2)
- [ ] GPT-4o temperature set to 0.7 (balanced creativity)
- [ ] Max tokens: 100 (keep questions concise)
- [ ] Timeout: 15 seconds (fail gracefully if API slow)
- [ ] Generation time logged for performance monitoring

**Technical Notes:**
```typescript
const SOCRATIC_PROMPT = `You are conducting a Socratic oral examination.

Original question: {original_question}
Key concepts: {key_concepts}
Student response: {student_transcript}
Follow-up style: {style}

Generate ONE follow-up question that:
1. Probes a gap in their response OR tests depth of reasoning
2. Is answerable based on course content
3. Is concise (20-40 words)
4. Escalates complexity (asks for analysis/synthesis, not more facts)

Question types:
- Gap probe: "You mentioned X but not Y. How does Y relate?"
- Challenge: "You said X, but what about [counterexample]?"
- Synthesis: "How does this connect to [concept]?"

Generate follow-up question only, no preamble.`;
```

**Story Points:** 13

---

### SV-303: Student Sees Follow-Up Question
**As a** student  
**I want** to see the follow-up question after my initial response  
**So that** I can demonstrate deeper understanding

**Acceptance Criteria:**
- [ ] After submitting initial response, student sees:
  - Loading state: "Analyzing your response..." (spinner, 5-10 seconds)
  - Success state: Transition to follow-up question screen
- [ ] Follow-up screen displays:
  - Progress indicator: "Question 2 of 3" (or "Question 2 of 2" if single follow-up)
  - Encouragement text: "Great start! Now let's go deeper..."
  - Follow-up question text (clear typography, easy to read)
  - Timer countdown (if time limit set)
  - [Record Answer] button (same as initial)
- [ ] Audio recording works identically to initial response
- [ ] Student can play back their recording before submitting
- [ ] Submit button sends audio to backend
- [ ] Can't skip follow-up (required to complete assessment)

**Story Points:** 8

---

### SV-304: AI Generates Second Follow-Up (If Enabled)
**As a** system  
**I want** to generate a second follow-up based on both previous responses  
**So that** I can test synthesis and evaluation skills

**Acceptance Criteria:**
- [ ] If teacher enabled 2 follow-ups:
  - After student submits first follow-up response
  - System transcribes via Whisper
  - Calls GPT-4o with enhanced context:
    - Original question
    - Initial response + first follow-up Q&A
    - Key concepts
    - Instruction: "Go deeper - test synthesis or evaluation"
  - Receives second follow-up question
- [ ] Second follow-up should:
  - Build on conversation so far
  - Ask for synthesis (connect concepts) OR evaluation (take position and defend)
  - NOT repeat previous questions
- [ ] Student sees same UI as SV-303 but with "Question 3 of 3"
- [ ] Second follow-up has shorter time limit (default 60s vs 90s for first)

**Story Points:** 8

---

### SV-305: Holistic Scoring of Full Conversation
**As a** system  
**I want** to score the entire conversation thread holistically  
**So that** teachers get accurate assessment of student understanding

**Acceptance Criteria:**
- [ ] After all responses collected, system calls GPT-4o for final scoring
- [ ] Scoring prompt includes:
  - All Q&A pairs (initial + follow-ups)
  - Teacher's rubric
  - Key concepts
  - Instruction: "Score holistically considering full conversation"
- [ ] Response structure:
```json
{
  "initial_response": {
    "depth": 7,
    "accuracy": 8,
    "concept_coverage": 6,
    "score": 7.0
  },
  "follow_ups": {
    "gap_addressing": 8,
    "reasoning": 7,
    "synthesis": 6,
    "score": 7.0
  },
  "overall": {
    "understanding": 7.5,
    "confidence": 0.85,
    "flag_for_review": false,
    "explanation": "Student demonstrated solid understanding with good reasoning under probing. Initial response missed economic impacts but addressed well in follow-ups."
  }
}
```
- [ ] Final score calculation: (initial_score × 0.6) + (followups_score × 0.4)
- [ ] Confidence < 0.7 automatically flags for teacher review
- [ ] All scores stored in database

**Story Points:** 13

---

### SV-306: Teacher Views Conversation Thread
**As a** professor  
**I want** to see the full conversation between AI and student  
**So that** I can understand their reasoning process and validate scoring

**Acceptance Criteria:**
- [ ] Teacher review page shows conversation format:
```
┌────────────────────────────────────────────┐
│ Student: Jane Doe                          │
│ Assessment: Treaty of Versailles Impact    │
│ Mode: Socratic (2 follow-ups)             │
│ Overall Score: 7.5/10 [Edit]             │
└────────────────────────────────────────────┘

Question 1 (Initial)
"Explain how the Treaty of Versailles contributed to WWII"

Student Response (1:34 duration)
[▶ Play Audio] [Show Transcript ▼]

Transcript:
"The Treaty of Versailles imposed harsh reparations on 
Germany after WWI, which devastated their economy..."

AI Score: 7/10
- Depth: 7/10
- Accuracy: 8/10  
- Concept Coverage: 6/10
- Note: Missed economic impacts and Article 231

───────────────────────────────────────────

Question 2 (Follow-up 1)
"You mentioned reparations but not Article 231. How did 
the war guilt clause contribute to German resentment?"

Student Response (0:52 duration)
[▶ Play Audio] [Show Transcript ▼]

AI Score: 8/10
- Gap Addressing: 8/10
- Reasoning: 7/10

───────────────────────────────────────────

Question 3 (Follow-up 2)
"How does economic devastation and national humiliation 
connect to the rise of fascism in 1930s Germany?"

Student Response (1:12 duration)
[▶ Play Audio] [Show Transcript ▼]

AI Score: 7/10
- Synthesis: 6/10
- Evaluation: 8/10

───────────────────────────────────────────

Overall Assessment: 7.5/10

AI Explanation:
"Student demonstrated solid foundational understanding 
with good reasoning. Initial response missed key economic 
impacts but addressed well when prompted..."

[Override Score] [Add Teacher Comment] [Approve Score]
```

- [ ] Can play each audio segment independently
- [ ] Transcripts are collapsible (show/hide)
- [ ] Can override final score with reason
- [ ] Teacher comments saved to conversation record
- [ ] Total time visible (sum of all response times)

**Story Points:** 13

---

### SV-307: Error Handling & Edge Cases
**As a** system  
**I want** to handle failures gracefully  
**So that** students aren't blocked by technical issues

**Acceptance Criteria:**

**If follow-up generation fails:**
- [ ] System logs error
- [ ] Falls back to generic follow-up: "Can you explain your reasoning in more detail?"
- [ ] Student sees message: "AI question generation taking longer than expected. Proceeding with standard follow-up."
- [ ] Teacher sees note: "Auto-generated follow-up used (API timeout)"

**If follow-up generation returns gibberish:**
- [ ] Validation check: Question must be 10-100 words, end with "?"
- [ ] If invalid, retry once with stricter prompt
- [ ] If still invalid, use fallback generic question
- [ ] Log for improvement

**If student audio fails to upload:**
- [ ] Show error: "Upload failed. Check your connection and try again."
- [ ] [Retry] button re-attempts upload
- [ ] Audio stored locally until successful upload
- [ ] After 3 failed attempts, allow "Skip this follow-up" with note to teacher

**If Whisper transcription fails:**
- [ ] Retry once automatically
- [ ] If fails again, flag for manual teacher review
- [ ] Teacher sees: "Transcription unavailable - review audio manually"
- [ ] No AI score provided (teacher must score)

**Story Points:** 8

---

### SV-308: Performance Optimization
**As a** system  
**I want** to minimize latency between responses  
**So that** students don't lose engagement waiting

**Acceptance Criteria:**
- [ ] Target latency: < 10 seconds from student submit to follow-up display
- [ ] Parallel processing where possible:
  - Whisper transcription + GPT follow-up gen happen in parallel with audio upload
  - Start processing as soon as audio upload begins (stream processing)
- [ ] Progress indicators show what's happening:
  - "Uploading audio..." (0-2 seconds)
  - "Analyzing your response..." (2-8 seconds)
  - "Generating next question..." (8-10 seconds)
- [ ] Use GPT-4o-mini for follow-up generation if GPT-4o too slow (test both)
- [ ] Cache common follow-up patterns (if same initial response seen multiple times)
- [ ] Monitor API response times in production
- [ ] Alert if P95 latency > 15 seconds

**Story Points:** 5

---

## User Stories: Academic Integrity Pledge

### SV-401: Academic Integrity Pledge Modal
**As a** professor  
**I want** students to acknowledge academic integrity expectations  
**So that** they understand assessment is proctored and cheating is prohibited

**Acceptance Criteria:**
- [ ] Before student can start assessment, blocking modal appears
- [ ] Modal cannot be dismissed without accepting (no X button, no click-outside-to-close)
- [ ] Modal displays:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         📋 Academic Integrity Pledge            │
│                                                 │
│  Before beginning this assessment, please       │
│  confirm you understand these expectations:     │
│                                                 │
│  ✓ I have prepared for this assessment by      │
│    reviewing course materials                   │
│                                                 │
│  ✓ I will complete this assessment              │
│    independently without assistance             │
│                                                 │
│  ✓ I will not use notes, textbooks, or online  │
│    resources during the assessment              │
│                                                 │
│  ✓ I will not share questions or my responses  │
│    with other students                          │
│                                                 │
│  ✓ I understand this assessment uses AI to     │
│    verify my understanding through oral         │
│    responses                                    │
│                                                 │
│  ✓ I understand violations of academic         │
│    integrity will be reported to my instructor  │
│                                                 │
│  By clicking "I Agree," I acknowledge that I    │
│  have read and will comply with these           │
│  expectations.                                  │
│                                                 │
│     [I Do Not Agree]    [I Agree and Begin]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

- [ ] "I Do Not Agree" button returns to student dashboard with message: "You must accept the Academic Integrity Pledge to begin this assessment. Contact your instructor if you have questions."
- [ ] "I Agree and Begin" button:
  - Logs acceptance to database
  - Records timestamp
  - Stores student IP address (for audit)
  - Proceeds to assessment
- [ ] Acceptance record stored in `assessment_attempts` table:
```sql
assessment_attempts {
  ...
  integrity_pledge_accepted_at TIMESTAMP,
  integrity_pledge_ip_address VARCHAR(45),
  integrity_pledge_version VARCHAR(10) -- in case we update pledge text
}
```
- [ ] Pledge text is configurable per teacher (optional custom text)
- [ ] Default pledge text provided but teacher can edit

**Story Points:** 5

---

### SV-402: Teacher Configures Pledge (Optional)
**As a** professor  
**I want** to customize the integrity pledge  
**So that** it matches my course policies

**Acceptance Criteria:**
- [ ] Assessment settings has "Academic Integrity Pledge" section
- [ ] Toggle: "Require integrity pledge" (default: ON for higher ed, OFF for K-12)
- [ ] If enabled, shows:
  - Textarea with default pledge text (editable)
  - Character limit: 500 words
  - Preview button shows modal as students will see it
  - "Use Default" button restores original text
- [ ] Custom pledge text saves with assessment
- [ ] If teacher disables pledge, students proceed directly to assessment (no modal)
- [ ] Recommended: "We strongly recommend keeping the integrity pledge enabled for all assessments"

**Story Points:** 3

---

### SV-403: Pledge Audit Trail for Teachers
**As a** professor  
**I want** to see which students accepted the pledge  
**So that** I can verify compliance if needed

**Acceptance Criteria:**
- [ ] Teacher assessment results page shows column:
  - "Pledge Accepted" with ✓ or ✗
  - Timestamp when accepted (hover for full date/time)
  - IP address (hidden by default, click to reveal)
- [ ] Export to CSV includes:
  - Student name
  - Pledge accepted (Yes/No)
  - Acceptance timestamp
  - IP address
- [ ] If student attempts assessment without accepting:
  - System blocks (shouldn't be possible, but defensive)
  - Teacher sees: "Did not accept pledge - assessment incomplete"
- [ ] If integrity pledge was disabled for assessment:
  - Column shows "N/A (Pledge not required)"

**Story Points:** 3

---

### SV-404: Pledge Persistence (Don't Re-show)
**As a** student  
**I want** to accept the pledge once per assessment  
**So that** I'm not annoyed by seeing it repeatedly

**Acceptance Criteria:**
- [ ] Student sees pledge ONCE per assessment attempt
- [ ] If they start assessment, exit, and return:
  - Pledge does NOT re-appear
  - They go directly to assessment
  - Previous acceptance still valid
- [ ] If they complete assessment and want to retry:
  - Pledge re-appears (new attempt = new pledge)
- [ ] If teacher changes pledge text after student accepted old version:
  - Student must accept new version
  - System detects pledge_version mismatch
  - Shows message: "The integrity pledge has been updated. Please review and accept."

**Story Points:** 3

---

## Database Schema Changes

```sql
-- Add to assessments table
ALTER TABLE assessments ADD COLUMN socratic_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE assessments ADD COLUMN socratic_follow_ups INT DEFAULT 1; -- 1 or 2
ALTER TABLE assessments ADD COLUMN socratic_key_concepts TEXT[]; -- array of strings
ALTER TABLE assessments ADD COLUMN socratic_style VARCHAR(20) DEFAULT 'mixed'; -- 'mixed', 'gaps', 'challenge'
ALTER TABLE assessments ADD COLUMN socratic_time_per_followup INT DEFAULT 60; -- seconds

ALTER TABLE assessments ADD COLUMN integrity_pledge_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE assessments ADD COLUMN integrity_pledge_text TEXT; -- custom pledge, null = use default
ALTER TABLE assessments ADD COLUMN integrity_pledge_version VARCHAR(10) DEFAULT 'v1.0';

-- New table for conversation threads
CREATE TABLE assessment_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
  
  -- Initial exchange
  initial_question TEXT NOT NULL,
  initial_audio_url TEXT,
  initial_transcript TEXT,
  initial_duration_seconds INT,
  initial_score JSONB, -- {depth, accuracy, concept_coverage, score}
  
  -- Follow-up exchanges
  follow_ups JSONB[], -- array of {question, audio_url, transcript, duration, score}
  
  -- Final assessment
  final_score DECIMAL(4,2),
  final_explanation TEXT,
  ai_confidence DECIMAL(3,2),
  flag_for_review BOOLEAN DEFAULT FALSE,
  
  -- Teacher override
  teacher_override_score DECIMAL(4,2),
  teacher_comment TEXT,
  teacher_reviewed_at TIMESTAMP,
  
  -- Metadata
  total_time_seconds INT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_attempt ON assessment_conversations(attempt_id);

-- Add to student_attempts table
ALTER TABLE student_attempts ADD COLUMN integrity_pledge_accepted_at TIMESTAMP;
ALTER TABLE student_attempts ADD COLUMN integrity_pledge_ip_address VARCHAR(45);
ALTER TABLE student_attempts ADD COLUMN integrity_pledge_version VARCHAR(10);
ALTER TABLE student_attempts ADD COLUMN conversation_id UUID REFERENCES assessment_conversations(id);
```

---

## API Endpoints

### Generate Follow-Up Question

```typescript
POST /api/assessments/:id/conversations/:conversationId/generate-followup

Request Body:
{
  "followUpNumber": 1 | 2,
  "previousTranscripts": [
    {
      "question": "Explain how...",
      "response": "Student said..."
    }
  ],
  "keyConcepts": ["concept1", "concept2"],
  "style": "mixed" | "gaps" | "challenge"
}

Response:
{
  "followUpQuestion": "You mentioned X but not Y. How does Y relate?",
  "generationTimeMs": 3420,
  "fallbackUsed": false
}

Error Response (timeout):
{
  "error": "generation_timeout",
  "followUpQuestion": "Can you explain your reasoning in more detail?", // generic fallback
  "fallbackUsed": true
}
```

### Submit Follow-Up Response

```typescript
POST /api/assessments/:id/conversations/:conversationId/followup-response

Request Body (multipart/form-data):
{
  "followUpNumber": 1 | 2,
  "audioFile": File,
  "durationSeconds": 67
}

Response:
{
  "transcribed": true,
  "transcript": "Article 231 was known as...",
  "nextStep": "followup_2" | "scoring",
  "nextQuestion": "How does this connect to..." // if nextStep = followup_2
}
```

### Finalize Conversation Scoring

```typescript
POST /api/assessments/:id/conversations/:conversationId/finalize

Response:
{
  "finalScore": 7.5,
  "scoreBreakdown": {
    "initial": { "depth": 7, "accuracy": 8, "conceptCoverage": 6 },
    "followUps": { "gapAddressing": 8, "reasoning": 7, "synthesis": 6 }
  },
  "explanation": "Student demonstrated solid understanding...",
  "confidence": 0.85,
  "flagForReview": false
}
```

---

## Definition of Done

### For All Socratic Stories

**Functionality:**
- [ ] Full conversation flow works end-to-end (initial + follow-ups + scoring)
- [ ] Follow-up questions are contextually relevant (tested with 10 sample responses)
- [ ] Scoring considers full conversation, not just initial response
- [ ] Teacher can view complete conversation thread with all audio/transcripts
- [ ] Error handling graceful for all failure scenarios (API timeout, bad audio, etc.)

**UI/UX:**
- [ ] Student sees clear progress indicators (Question 2 of 3)
- [ ] Loading states show what's happening ("Analyzing your response...")
- [ ] Success confirmations after each step
- [ ] Mobile-responsive (tested on iOS + Android)
- [ ] Accessible (keyboard navigation, screen reader friendly)

**Performance:**
- [ ] Latency < 10 seconds from student submit to follow-up display (P95)
- [ ] Cost per 3-part conversation < $0.10
- [ ] No memory leaks during multi-turn conversations
- [ ] Handles 20 concurrent students without degradation

**Teacher Experience:**
- [ ] Can enable/disable Socratic mode easily
- [ ] Configuration options are intuitive
- [ ] Review interface clearly shows conversation flow
- [ ] Can override scores with explanation
- [ ] Export includes full conversation data

**Data & Security:**
- [ ] All audio files stored securely
- [ ] Transcripts saved to database
- [ ] Full conversation thread preserved for audit
- [ ] Teacher override audit trail maintained
- [ ] No data loss if student exits mid-conversation

**Documentation:**
- [ ] Teacher guide: "How to Use Socratic Follow-Ups"
- [ ] Student guide: "What to Expect in Multi-Part Assessments"
- [ ] API documentation for follow-up generation
- [ ] Error handling documentation for support team

**Testing:**
- [ ] Unit tests for follow-up generation logic
- [ ] Integration tests for full conversation flow
- [ ] Load test: 50 concurrent conversations
- [ ] Edge case tests (API failures, bad audio, timeouts)
- [ ] User acceptance testing with 5 professors

---

### For Academic Integrity Pledge Stories

**Functionality:**
- [ ] Modal appears before every first attempt at assessment
- [ ] Cannot be dismissed without accepting
- [ ] Acceptance logged to database with timestamp + IP
- [ ] Teachers can view acceptance audit trail
- [ ] Custom pledge text works if teacher edits
- [ ] Pledge doesn't re-appear on same attempt (but does on new attempts)

**UI/UX:**
- [ ] Modal is clearly readable (typography, spacing)
- [ ] Checkbox items are scannable (not wall of text)
- [ ] "I Agree" button is obvious primary action
- [ ] "I Do Not Agree" shows helpful message
- [ ] Works on mobile (responsive modal)

**Teacher Experience:**
- [ ] Can enable/disable pledge requirement
- [ ] Can customize pledge text with preview
- [ ] Can see which students accepted in results view
- [ ] Export includes pledge acceptance data

**Compliance:**
- [ ] Meets typical university honor code requirements
- [ ] Language is clear and enforceable
- [ ] Audit trail sufficient for academic integrity investigations
- [ ] IP address stored per institution policy (check privacy requirements)

**Testing:**
- [ ] Test accept flow (proceeds to assessment)
- [ ] Test decline flow (returns to dashboard)
- [ ] Test return-to-assessment flow (no re-prompt)
- [ ] Test new attempt flow (re-prompt)
- [ ] Test custom pledge text display
- [ ] Test audit trail export

---

## Testing Matrix

### Socratic Follow-Up Scenarios

**Scenario 1: Strong Initial Response**
- Initial response scores 9/10
- Follow-up should test novel application (not just clarify)
- Expected: Synthesis or evaluation question

**Scenario 2: Weak Initial Response**
- Initial response scores 4/10
- Follow-up should clarify/give second chance (not punish)
- Expected: "Can you elaborate on what you meant by..."

**Scenario 3: Partial Initial Response**
- Initial response scores 6/10, missed key concept
- Follow-up should probe the gap
- Expected: "You mentioned X but not Y. How does Y relate?"

**Scenario 4: Contradictory Initial Response**
- Initial response contains logical inconsistency
- Follow-up should challenge reasoning
- Expected: "You said X, but what about [counterexample]?"

**Scenario 5: API Timeout**
- OpenAI API takes >15 seconds
- System should use fallback question
- Expected: Generic "Explain your reasoning further"

### Academic Integrity Scenarios

**Scenario 1: First-Time Student**
- Student never taken assessment before
- Should see pledge modal
- Accept → proceeds to assessment
- Decline → returns to dashboard

**Scenario 2: Returning Student (Same Attempt)**
- Student started assessment, exited, returned
- Should NOT see pledge again
- Goes directly to assessment

**Scenario 3: New Attempt**
- Student completed assessment, starts new attempt
- Should see pledge again (new attempt = new pledge)
- Must accept again

**Scenario 4: Updated Pledge**
- Teacher changed pledge text after student accepted old version
- Student returns to assessment
- Should see updated pledge with note
- Must accept new version

---

## Cost Analysis

### Per-Assessment Cost Breakdown

**Single-Question Assessment:**
- Whisper: $0.006/min × 1.5 min = $0.009
- GPT-4o scoring: ~$0.01
- **Total: $0.019 per student**

**Socratic Assessment (2 follow-ups):**
- Whisper: $0.006/min × 3.5 min = $0.021
- GPT-4o follow-up gen #1: ~$0.008
- GPT-4o follow-up gen #2: ~$0.01
- GPT-4o final scoring: ~$0.015
- **Total: $0.054 per student**

**Break-even analysis:**
- 100 students × $0.054 = $5.40 cost
- Charge €12/student = €1,200 revenue
- Gross margin: 99.5%

**Acceptable.**

---

## Performance Benchmarks

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Follow-up generation time | < 8 seconds (P95) | > 12 seconds |
| Transcription time | < 5 seconds (P95) | > 10 seconds |
| Total latency (submit → next question) | < 10 seconds (P95) | > 15 seconds |
| Final scoring time | < 8 seconds | > 12 seconds |
| Conversation completion rate | > 90% | < 85% |
| API error rate | < 1% | > 3% |
| Cost per assessment | < $0.10 | > $0.15 |

---

## Launch Readiness Checklist

### Before Endicott Beta (Jan 20)

**Technical:**
- [ ] Socratic mode functional for 2 follow-ups
- [ ] Academic integrity pledge working
- [ ] All error scenarios handled gracefully
- [ ] Mobile tested on real devices
- [ ] Load tested with 20 concurrent users

**Content:**
- [ ] Default pledge text finalized and reviewed
- [ ] Teacher guide written: "Using Socratic Follow-Ups"
- [ ] Student guide written: "Multi-Part Assessments"
- [ ] Sample assessment created for demo

**Monitoring:**
- [ ] Logging in place for all API calls
- [ ] Performance metrics tracked
- [ ] Error alerting configured
- [ ] Cost monitoring dashboard

**Support:**
- [ ] Support email prominently displayed
- [ ] FAQ page covers common questions
- [ ] Known issues documented
- [ ] Escalation path defined (beta = direct to Eric)

---

## Risk Mitigation

### High-Risk Items

**Risk 1: Follow-up questions are irrelevant/confusing**
- **Probability:** Medium
- **Impact:** High (breaks user trust)
- **Mitigation:**
  - Test with 20+ sample responses before launch
  - Include "Report unclear question" button
  - Manual review of first 50 follow-ups generated
  - Iterate prompts based on feedback

**Risk 2: API costs spiral during beta**
- **Probability:** Low
- **Impact:** Medium (budget concern)
- **Mitigation:**
  - Set hard limit: $500/month API budget
  - Alert at $400
  - Rate limit: 100 assessments/day during beta
  - Monitor cost per assessment daily

**Risk 3: Students frustrated by multi-turn format**
- **Probability:** Medium
- **Impact:** Medium (adoption resistance)
- **Mitigation:**
  - Clear upfront communication: "Expect 2-3 questions"
  - Time estimates shown: "~5-8 minutes total"
  - Progress indicators throughout
  - Collect feedback: "How was the assessment experience?"

**Risk 4: Teachers find it too complex to set up**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Simple defaults (1 follow-up, Mixed style)
  - "Use Recommended Settings" button
  - Video walkthrough for setup
  - Offer to set up first assessment for them

---

## Success Criteria for Beta

**By February 28 (6 weeks of beta):**

**Usage:**
- [ ] 5+ professors actively using Socratic mode
- [ ] 200+ student conversations completed
- [ ] 90%+ conversation completion rate (students finish all parts)

**Quality:**
- [ ] Follow-up questions rated relevant by teachers (>4/5 avg)
- [ ] < 5% of assessments require full teacher override
- [ ] < 3% error rate (API failures, transcription issues)

**Feedback:**
- [ ] Professors rate feature 4+/5 on usefulness
- [ ] Students rate experience 3.5+/5 (acceptable for beta)
- [ ] At least 2 professors provide testimonial quote

**Technical:**
- [ ] Latency maintains < 12 seconds (P95)
- [ ] Cost stays < $0.08 per assessment
- [ ] Zero data loss incidents

**If criteria met:** Public launch for higher ed in March  
**If not met:** Extend beta, iterate based on feedback

---

## Post-Launch Iteration Plan

**Immediate (first 2 weeks):**
- Monitor error rates and latency
- Collect professor feedback via weekly calls
- Fix critical bugs within 24 hours
- Tune follow-up generation prompts

**Short-term (weeks 3-6):**
- Add requested features from feedback
- Improve follow-up question quality based on patterns
- Optimize for cost (try GPT-4o-mini for follow-ups if quality acceptable)
- Build analytics dashboard for teachers

**Medium-term (Q2 2026):**
- Add adaptive branching (0-3 follow-ups based on response quality)
- Subject-specific follow-up styles (History vs Science vs Literature)
- Student self-reflection prompt after conversation
- Integration with LMS gradebooks

---

**Document Version:** 1.0  
**Created:** December 19, 2025  
**Next Review:** January 10, 2026 (after implementation, before Endicott beta)