# SayVeritas Feature Spec: "Restart if Unprepared"
**Feature Name:** Grace Period Restart  
**Created:** December 27, 2025  
**Target Delivery:** January 15, 2026 (before CVA/Endicott beta)  
**Priority:** HIGH  
**Estimated Dev Time:** 2-3 weeks

---

## Overview

Allow students to restart an assessment one time if they demonstrate they are clearly unprepared (long pause before starting OR completely off-topic answer). This supports formative learning while maintaining assessment integrity through strict guardrails.

**Key Principles:**
- Student-facing, supportive messaging (not punitive)
- Teacher-controlled via assessment settings (opt-in)
- Limited to 1 restart per student per assessment
- Different question served on restart
- Full transparency in teacher dashboard

---

## User Stories

### US-1: Teacher Enables Feature
**As a** teacher  
**I want** to allow students to restart if they're clearly unprepared  
**So that** students can demonstrate their actual understanding when ready, not fail due to bad timing

**Acceptance Criteria:**
- [ ] Teacher sees "Allow Grace Period Restart" toggle in assessment creation/edit
- [ ] Help text explains what this does
- [ ] Default state: OFF (teacher must explicitly enable)
- [ ] Setting saved with assessment configuration
- [ ] Teacher can enable/disable at any time before students complete

---

### US-2: Student Gets Grace Period (Long Pause)
**As a** student  
**I want** the option to restart if I pause too long at the beginning  
**So that** I can review the material and come back when I'm ready

**Acceptance Criteria:**
- [ ] If student pauses ≥10 seconds before speaking first word, trigger grace period
- [ ] If student pauses ≥6 seconds before speaking first word, log an integrity flag but allow them to continue
- [ ] Student sees supportive message with two options: continue or restart
- [ ] If student chooses restart, assessment ends without submission
- [ ] Student can return later and gets new question from pool
- [ ] Student can only restart once per assessment (second attempt is final)

---

### US-3: Student Gets Grace Period (Off-Topic Answer)
**As a** student  
**I want** the option to restart if my answer is completely off-topic  
**So that** I don't waste a submission when I'm clearly unprepared

**Acceptance Criteria:**
- [ ] After student submits response, AI evaluates if answer is "completely off-topic"
- [ ] If off-topic, student sees message with two options: submit anyway or restart
- [ ] If student chooses restart, response is not submitted to teacher (if a submission record exists, it is marked abandoned)
- [ ] Student can return later and gets new question from pool
- [ ] Student can only restart once per assessment

---

### US-4: Teacher Reviews Restart Data
**As a** teacher  
**I want** to see which students restarted and why  
**So that** I can identify students who may need additional support

**Acceptance Criteria:**
- [ ] Teacher dashboard shows restart events per student
- [ ] Data includes: student name, restart reason (pause/off-topic), timestamp
- [ ] Flag students who restart >50% of assessments (may indicate chronic unpreparedness)
- [ ] Teacher can filter submissions by "restarted" vs "first attempt"

---

## Technical Specification

### Database Schema Changes

#### New Table: `assessment_restart_events`
```sql
CREATE TABLE assessment_restart_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  question_id UUID REFERENCES assessment_questions(id), -- which question they abandoned
  restart_reason VARCHAR(50) NOT NULL, -- 'long_pause' | 'off_topic'
  pause_duration_seconds INT, -- if reason = long_pause
  original_response_text TEXT, -- if reason = off_topic (for debugging)
  restarted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  new_question_id UUID REFERENCES assessment_questions(id), -- question served on restart
  
  UNIQUE(student_id, assessment_id) -- only one restart per student per assessment
);

CREATE INDEX idx_restart_events_student ON assessment_restart_events(student_id);
CREATE INDEX idx_restart_events_assessment ON assessment_restart_events(assessment_id);
```

#### Update Table: `assessments`
```sql
ALTER TABLE assessments 
ADD COLUMN allow_grace_restart BOOLEAN DEFAULT FALSE;
```

#### Update Table: `submissions`
```sql
ALTER TABLE submissions
ADD COLUMN is_restart_attempt BOOLEAN DEFAULT FALSE,
ADD COLUMN previous_restart_event_id UUID REFERENCES assessment_restart_events(id);
```

---

## Feature Logic & Flows

### Flow 1: Long Pause Detection

#### Student Experience:
1. Student clicks "Start Assessment"
2. Question displays
3. Student sees "Record your response" button
4. **System starts timer when question first displays**
5. **Timer continues until student speaks first word**
6. If timer reaches 6 seconds without speech:
   - Log integrity flag: "slow start" (student continues)
7. If timer reaches 10 seconds without speech:
   - Pause recording (if started)
   - Display modal: "Need More Time?"

**Modal Content:**
```
It looks like you might need more time to prepare.

You have two options:

[Restart with a New Question]
- You can continue now or return later
- You'll receive a different question when you restart
- This is a one-time option

[Continue with This Assessment]
- Your current question will remain
- Timer will resume from where you left off

What would you like to do?
```

8. If student clicks "Review Material":
   - Log restart event to database (reason: 'long_pause')
   - Restart immediately with a new question (same session)
   - Student can also leave and resume later if needed
   - Assessment status: "In Progress (Restart Used)"

9. If student clicks "Continue":
   - Resume recording
   - No restart logged
   - Continue normal flow

#### Technical Implementation:

**Frontend (JavaScript/TypeScript):**
```javascript
// Pseudo-code
let questionDisplayTime = null;
let firstWordSpokenTime = null;
let pauseTimer = null;

// When question displays
function onQuestionDisplay() {
  questionDisplayTime = Date.now();
  pauseTimer = setTimeout(() => {
    if (!firstWordSpokenTime) {
      showGracePeriodModal('long_pause');
    }
  }, 10000); // 10 seconds
}

// When student starts speaking (detected via audio input)
function onFirstWordDetected() {
  firstWordSpokenTime = Date.now();
  clearTimeout(pauseTimer);
  // Continue normal recording
}

// Modal handler
function showGracePeriodModal(reason) {
  // Display modal with options
  // Option 1: Restart → call API to log restart event
  // Option 2: Continue → resume assessment
}
```

**Backend API Endpoint:**
```
POST /api/assessments/{assessment_id}/restart

Request Body:
{
  "student_id": "uuid",
  "question_id": "uuid",
  "restart_reason": "long_pause",
  "pause_duration_seconds": 10
}

Response:
{
  "success": true,
  "restart_event_id": "uuid",
  "message": "You can return to this assessment later with a new question"
}

Business Logic:
1. Check if student already has restart event for this assessment
   - If yes: return error "Restart already used"
2. Check if assessment allows grace restart
   - If no: return error "Feature not enabled"
3. Create restart event record
4. If a submission record exists, mark it abandoned (and hide from teacher views)
5. Return success
```

---

### Flow 2: Off-Topic Answer Detection

#### Student Experience:
1. Student completes recording
2. Student clicks "Submit"
3. **System sends audio + question to AI for evaluation**
4. **AI determines if answer is completely off-topic**
5. If off-topic detected:
   - Do NOT submit to teacher yet
   - Display modal: "Double-Check Your Answer"

**Modal Content:**
```
Your response doesn't seem to address the question asked.

Original Question: [Display question text]

You have two options:

[Restart with a New Question]
- This response will not be submitted
- Continue now or return later
- This is a one-time option

[Submit This Response Anyway]
- Your teacher will review your response
- This will be your final submission

What would you like to do?
```

6. If student clicks "Review Material":
   - Log restart event (reason: 'off_topic')
   - Do NOT submit to teacher; mark any in-progress submission as abandoned
   - Restart immediately with a new question (same session) or return later
   - Assessment status: "In Progress (Restart Used)"

7. If student clicks "Submit Anyway":
   - Normal submission flow
   - Teacher sees response with note: "Student chose to submit after off-topic warning"

#### AI Off-Topic Detection Logic

**Prompt Template:**
```
You are evaluating whether a student's oral response addresses the question asked.

QUESTION: {question_text}

STUDENT RESPONSE: {transcribed_audio}

Determine if the response is COMPLETELY OFF-TOPIC.

A response is "completely off-topic" ONLY if:
1. It mentions nothing related to the question's subject matter, OR
2. It is nonsense/gibberish, OR
3. It is blank/silent, OR
4. It explicitly states the student doesn't know/isn't prepared

A response is NOT off-topic if:
- Student attempts to answer but gets details wrong (that's for teacher to grade)
- Student is nervous and rambling but touches on relevant concepts
- Student's answer is weak but shows some attempt at the topic

Return ONLY a JSON response:
{
  "is_off_topic": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

ONLY mark is_off_topic=true if confidence >0.85 AND clearly meets criteria.
```

**Backend Implementation:**
```javascript
// Pseudo-code
async function evaluateResponse(questionText, audioTranscription) {
  const aiResponse = await callAI({
    prompt: buildOffTopicPrompt(questionText, audioTranscription),
    model: 'claude-sonnet-4-20250514'
  });
  
  const result = JSON.parse(aiResponse);
  
  // Only trigger grace period if high confidence
  if (result.is_off_topic && result.confidence > 0.85) {
    return {
      shouldOfferRestart: true,
      reason: result.reason
    };
  }
  
  return {
    shouldOfferRestart: false
  };
}
```

**API Endpoint:**
```
POST /api/submissions/{submission_id}/evaluate-before-submit

Request Body:
{
  "student_id": "uuid",
  "assessment_id": "uuid",
  "question_id": "uuid",
  "audio_transcription": "string",
  "question_text": "string"
}

Response (if off-topic):
{
  "is_off_topic": true,
  "should_offer_restart": true,
  "reason": "Response does not address the Civil War question"
}

Response (if on-topic):
{
  "is_off_topic": false,
  "should_offer_restart": false
}

Business Logic:
1. Call AI evaluation function
2. If off-topic detected:
   - Do NOT publish to teacher yet
   - Return flag to frontend
3. Frontend shows modal
4. Student decides: restart OR submit anyway
```

---

### Flow 3: Returning After Restart

#### Student Experience:
1. Student returns to assessment (same day or later)
2. System checks: has student used restart for this assessment?
3. If YES (this is their second attempt):
   - Display warning: "This is your final attempt"
   - No restart option available this time
   - Question rotation: serve different question variant
4. Student completes assessment normally
5. Submission marked as `is_restart_attempt = true`

#### Technical Implementation:

**When Student Clicks "Start Assessment" (2nd time):**
```javascript
// Backend API
GET /api/assessments/{assessment_id}/status?student_id={student_id}

Response:
{
  "assessment_id": "uuid",
  "student_id": "uuid",
  "has_used_restart": true,
  "restart_event": {
    "reason": "long_pause",
    "restarted_at": "2026-01-15T10:30:00Z"
  },
  "is_final_attempt": true,
  "question_id": "uuid-different-from-first-attempt"
}

Business Logic:
1. Check assessment_restart_events table for this student + assessment
2. If restart event exists:
   - Mark as final attempt
   - Select NEW question variant (different from original)
   - Ensure student cannot restart again
3. Return status to frontend
```

**Frontend Display:**
```
[Yellow Banner at top of assessment]
⚠️ This is your final attempt for this assessment. 
The grace period restart has already been used.

[Question displays]
[Normal assessment flow - no restart option]
```

---

### Flow 4: Question Rotation on Restart

**Requirement:** Student must receive a DIFFERENT question on restart.

**Implementation:**
```sql
-- When selecting question for restart attempt
SELECT q.id, q.question_text
FROM assessment_questions q
WHERE q.assessment_id = {assessment_id}
  AND q.id != (
    SELECT question_id
    FROM assessment_restart_events
    WHERE student_id = {student_id}
      AND assessment_id = {assessment_id}
  )
ORDER BY RANDOM()
LIMIT 1;
```

**Edge Case:** What if there's only 1 question in the bank?
- Teacher gets warning when enabling grace restart on single-question assessments
- System allows restart but serves same question (logged as warning)
- Recommendation: Require ≥2 questions in bank to enable grace restart

---

## Teacher Settings UI

### Assessment Creation/Edit Page

**Location:** In "Advanced Settings" section

**UI Component:**
```
┌─────────────────────────────────────────────────┐
│ Academic Integrity & Support                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ ☐ Allow Grace Period Restart                   │
│                                                 │
│   Give students one chance to restart if they  │
│   are clearly unprepared:                      │
│   • Pause for 10+ seconds before starting      │
│   • Submit a completely off-topic answer       │
│                                                 │
│   Best for: Formative assessments, practice    │
│   Not recommended for: Graded exams, finals    │
│                                                 │
│   [Learn More] ← links to help article         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Validation:**
- If teacher enables this but question bank has <2 questions:
  - Show warning: "⚠️ Grace restart works best with 2+ question variants to ensure students get different questions. Add more variants or students may see the same question."
  - Allow saving but log warning

---

## Teacher Dashboard

### Viewing Restart Data

**Location:** Assessment results page

**Additional Columns in Student List:**
```
┌──────────────┬────────┬─────────┬──────────────┬─────────┐
│ Student Name │ Score  │ Status  │ Restart Used │ Details │
├──────────────┼────────┼─────────┼──────────────┼─────────┤
│ Sarah M.     │ 85%    │ ✓       │ Yes (Pause)  │ [View]  │
│ James K.     │ 92%    │ ✓       │ No           │ [View]  │
│ Alex P.      │ --     │ Pending │ Yes (Off-top)│ [View]  │
└──────────────┴────────┴─────────┴──────────────┴─────────┘
```

**Filter Options:**
```
Show: [All Students ▼]
      - All Students
      - Used Restart Only
      - First Attempt Only
      - Pending After Restart
```

**Detail View (When Teacher Clicks [View]):**
```
┌─────────────────────────────────────────────────┐
│ Sarah Martinez - Assessment Results             │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🔄 Student used grace restart                   │
│                                                 │
│ First Attempt:                                  │
│ • Started: Jan 15, 10:30 AM                    │
│ • Reason: Paused 10 seconds before speaking    │
│ • Question: [Variant A text]                   │
│ • Student chose to review material             │
│                                                 │
│ Second Attempt (Final):                         │
│ • Submitted: Jan 15, 2:45 PM                   │
│ • Question: [Variant B text]                   │
│ • Score: 85%                                   │
│ • [Play Audio] [View Transcript]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Aggregate Analytics:**
```
┌─────────────────────────────────────────────────┐
│ Restart Summary                                 │
├─────────────────────────────────────────────────┤
│ • 3 of 24 students (12.5%) used grace restart  │
│ • Reasons:                                      │
│   - Long pause: 2 students                     │
│   - Off-topic: 1 student                       │
│ • Average score after restart: 82%             │
│ • Average score first attempt: 87%             │
└─────────────────────────────────────────────────┘
```

**Flag High-Restart Students:**
If student restarts >50% of assessments:
```
⚠️ Alex P. has restarted 3 of 4 recent assessments.
Consider checking in - they may need additional support.
```

---

## Student Experience UI

### Dashboard View (After Restart)

**Assessment Status:**
```
┌─────────────────────────────────────────────────┐
│ Your Assessments                                │
├─────────────────────────────────────────────────┤
│ Civil War Causes                                │
│ Status: In Progress (Restart Used)              │
│ Restarted: Jan 15, 10:30 AM                    │
│                                                 │
│ [Resume Assessment]                             │
│                                                 │
│ Note: This is your final attempt. The grace    │
│ restart has been used.                         │
└─────────────────────────────────────────────────┘
```

### During Assessment

**Grace Period Modal (Long Pause):**
```
┌─────────────────────────────────────────────────┐
│           Need More Time to Prepare?            │
├─────────────────────────────────────────────────┤
│                                                 │
│ It looks like you might need more time with    │
│ the material.                                   │
│                                                 │
│ You have two options:                           │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │  Restart with a New Question            │    │
│ │                                         │    │
│ │  • Continue now or return later         │    │
│ │  • Get a different question             │    │
│ │  • One-time option                      │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │  Continue with This Assessment          │    │
│ │                                         │    │
│ │  • Current question stays the same      │    │
│ │  • Timer resumes                        │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Grace Period Modal (Off-Topic):**
```
┌─────────────────────────────────────────────────┐
│        Double-Check Your Response               │
├─────────────────────────────────────────────────┤
│                                                 │
│ Your response doesn't seem to address the      │
│ question asked.                                 │
│                                                 │
│ Question: What were the primary causes of the  │
│ US Civil War?                                   │
│                                                 │
│ You have two options:                           │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │  Restart with a New Question            │    │
│ │                                         │    │
│ │  • This won't be submitted              │    │
│ │  • Continue now or return later         │    │
│ │  • One-time option                      │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │  Submit This Response Anyway            │    │
│ │                                         │    │
│ │  • Teacher will review                  │    │
│ │  • This is your final submission        │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Second Attempt Warning Banner:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ This is your final attempt                   │
│ The grace restart has already been used.        │
└─────────────────────────────────────────────────┘

[Question displays below]
```

---

## Edge Cases & Guardrails

### Edge Case 1: Student Already Restarted
**Scenario:** Student tries to restart a second time

**Behavior:**
- System checks `assessment_restart_events` table
- Finds existing restart for this student+assessment
- Returns error: "Grace restart already used"
- Student must complete current attempt

---

### Edge Case 2: Only 1 Question in Bank
**Scenario:** Teacher enables grace restart but assessment has single question

**Behavior:**
- Teacher sees warning during setup
- Feature still works but student gets SAME question on restart
- Logged to analytics for teacher review
- Not ideal but doesn't break feature

**Recommendation in UI:**
"⚠️ Add at least 2 question variants for best results with grace restart"

---

### Edge Case 3: Student Never Returns After Restart
**Scenario:** Student restarts but never completes assessment

**Behavior:**
- Assessment shows as "In Progress (Restart Used)"
- Teacher dashboard shows: "Restarted but not completed"
- Teacher can manually mark as incomplete or send reminder
- Doesn't affect other students

---

### Edge Case 4: Assessment Edited After Restart
**Scenario:** Student restarts, then teacher edits assessment settings

**Behavior:**
- Changes to question bank apply to restart attempt
- If teacher disables grace restart after student uses it:
  - Student's restart still honored (already logged)
  - New students cannot use feature

---

### Edge Case 5: AI Falsely Detects Off-Topic
**Scenario:** AI thinks on-topic answer is off-topic

**Mitigation:**
- High confidence threshold (>0.85) reduces false positives
- Student can ALWAYS choose "Submit Anyway"
- Teacher sees note: "Student submitted after off-topic detection"
- Teacher makes final judgment on quality

---

### Edge Case 6: Technical Failure Mid-Assessment
**Scenario:** Browser crash, connection loss during assessment

**Behavior:**
- System tracks session state
- On return, student sees: "Resume where you left off OR restart"
- Technical restart doesn't count against grace restart limit
- Separate flag: `technical_interruption` vs `grace_restart`

---

## Testing Requirements

### Unit Tests

**Test: Long Pause Detection**
```javascript
describe('Long Pause Detection', () => {
  it('should trigger grace modal after 10 seconds without speech', () => {
    // Mock: Question displays at T=0
    // Mock: No audio input detected
    // Assert: Modal appears at T=10s
  });
  
  it('should NOT trigger if student speaks within 10 seconds', () => {
    // Mock: Question displays at T=0
    // Mock: Audio input at T=5s
    // Assert: No modal, normal recording continues
  });
  
  it('should cancel timer if student clicks continue', () => {
    // Mock: Modal appears
    // User clicks "Continue"
    // Assert: Timer cleared, recording resumes
  });
});
```

**Test: Off-Topic Detection**
```javascript
describe('Off-Topic Detection', () => {
  it('should flag completely unrelated response', async () => {
    const question = "What caused the Civil War?";
    const response = "I like pizza and video games.";
    const result = await evaluateResponse(question, response);
    expect(result.is_off_topic).toBe(true);
  });
  
  it('should NOT flag weak but on-topic response', async () => {
    const question = "What caused the Civil War?";
    const response = "Um, I think it was about states and slavery maybe?";
    const result = await evaluateResponse(question, response);
    expect(result.is_off_topic).toBe(false);
  });
});
```

**Test: Restart Limit**
```javascript
describe('Restart Limits', () => {
  it('should allow first restart', async () => {
    // Student has no restart events
    const result = await attemptRestart(studentId, assessmentId);
    expect(result.success).toBe(true);
  });
  
  it('should block second restart', async () => {
    // Student already has restart event
    const result = await attemptRestart(studentId, assessmentId);
    expect(result.error).toBe('Restart already used');
  });
});
```

### Integration Tests

**Test: Full Restart Flow (Pause)**
1. Create assessment with grace restart enabled
2. Student starts assessment
3. Wait 10 seconds without speaking
4. Modal appears
5. Student clicks "Review Material"
6. Restart logged to database
7. Student returns
8. Different question served
9. Student completes successfully
10. Teacher sees restart in dashboard

**Test: Full Restart Flow (Off-Topic)**
1. Create assessment with grace restart enabled
2. Student records completely off-topic response
3. Submit button clicked
4. AI evaluation runs
5. Modal appears
6. Student clicks "Restart"
7. Response NOT submitted
8. Student returns with new question
9. Completes successfully

**Test: Question Rotation**
1. Create assessment with 3 question variants
2. Student gets Variant A
3. Student restarts
4. Verify student gets Variant B or C (not A)

### User Acceptance Testing

**Scenario 1: Formative Assessment**
- Teacher enables grace restart
- 5 students take assessment
- 1-2 students use restart
- Teacher reviews restart data
- Verify: Students succeeded on second attempt

**Scenario 2: Summative Assessment**
- Teacher disables grace restart (default)
- Students cannot restart
- All submissions final
- Verify: No restart option appears

**Scenario 3: Student Experience**
- Student pauses too long
- Sees supportive modal (not punitive)
- Chooses to restart
- Returns and completes successfully
- Verify: Student feels supported, not punished

---

## Launch Configuration

### Feature Flags

**Server-Side Flag:**
```javascript
FEATURE_FLAGS = {
  grace_restart_enabled: true, // Master kill switch
  grace_restart_slow_start_flag_seconds: 6,
  grace_restart_pause_threshold_seconds: 10,
  grace_restart_ai_confidence_threshold: 0.85,
  grace_restart_default_enabled: false // Default state for new assessments
}
```

### A/B Testing Plan

**Beta Test:**
- CVA School: Grace restart ON for formative assessments
- Endicott College: Grace restart OFF initially
- Compare:
  - Student completion rates
  - Restart usage rates
  - Teacher satisfaction
  - Student feedback

**Metrics to Track:**
```
- % of assessments with grace restart enabled
- % of students who use restart
- Restart reasons (pause vs off-topic)
- Success rate on second attempt vs first attempt
- Teacher override rate (did they disagree with AI?)
- Support tickets related to feature
```

---

## Documentation Requirements

### Teacher Help Article

**Title:** "Grace Period Restart: Help Students Succeed When They're Unprepared"

**Content:**
- What is grace restart?
- When to use it (formative) vs when not to (summative)
- How it works from student perspective
- How to interpret restart data
- Best practices for question banks
- FAQ

### Student Help Article

**Title:** "What Does 'Need More Time?' Mean?"

**Content:**
- You're not in trouble
- Why you might see this message
- What your options are
- This is a one-time opportunity
- FAQ

### In-App Tooltips

**Teacher Settings:**
"Allow students one chance to restart if they pause too long or submit an off-topic answer. Best for practice and formative assessments."

**Student Modal:**
"Your teacher has enabled a one-time restart option to help you succeed. Take time to review the material and return when you're ready."

---

## Success Metrics

### Week 1 Post-Launch:
- [ ] 20%+ of teachers enable grace restart for at least one assessment
- [ ] <5 support tickets related to feature confusion
- [ ] Zero technical errors in restart flow

### Month 1 Post-Launch:
- [ ] 5-10% of students use restart (shows it's useful but not abused)
- [ ] 70%+ of restart students succeed on second attempt
- [ ] Teacher satisfaction: >4/5 stars
- [ ] Student feedback: "Supportive" not "Surveillance"

### Month 3 Post-Launch:
- [ ] Feature used in 30%+ of formative assessments
- [ ] Restart usage correlates with improved learning outcomes
- [ ] Teachers request expansion (e.g., allow 2 restarts)
- [ ] No gaming/abuse detected

---

## Rollback Plan

**If feature causes problems:**

1. **Disable via feature flag** (no code deploy needed)
2. Notify teachers via email: "Temporarily disabled for improvements"
3. Existing restart events honored, new ones blocked
4. Fix issues, re-enable with fixes
5. Communicate timeline to affected teachers

**Rollback Criteria:**
- >10% of students gaming the system (excessive restarts)
- AI false positive rate >20%
- Teacher complaints >30% of users
- Technical failures >5% of restart attempts

---

## Development Checklist

### Week 1: Backend Foundation
- [ ] Create database tables
- [ ] Build restart event logging API
- [ ] Implement question rotation logic
- [ ] Write AI off-topic detection function
- [ ] Build restart status check API
- [ ] Unit tests for all backend logic

### Week 2: Frontend Implementation
- [ ] Build pause detection timer
- [ ] Create grace period modals (pause + off-topic)
- [ ] Implement restart button handlers
- [ ] Add teacher settings toggle
- [ ] Build teacher dashboard restart view
- [ ] Add restart columns to results table

### Week 3: Testing & Polish
- [ ] Integration tests (full flows)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Edge case handling
- [ ] Documentation writing
- [ ] Beta user testing with 2-3 teachers

### Pre-Launch:
- [ ] Feature flag configuration
- [ ] Monitoring/logging setup
- [ ] Support team training
- [ ] Teacher communication (email announcement)
- [ ] Help articles published

---

## Post-Launch Monitoring

### First 48 Hours:
- Monitor error logs for restart failures
- Track restart usage rates
- Review AI off-topic detection accuracy
- Check teacher dashboard loads correctly

### First 2 Weeks:
- Collect teacher feedback
- Review student satisfaction scores
- Analyze restart → success correlation
- Identify any unexpected usage patterns

### First Month:
- Compile usage statistics
- Interview 3-5 teachers who used it
- Adjust AI thresholds if needed
- Plan improvements based on feedback

---

## Future Enhancements (Post-Launch)

**Not in scope for v1, consider for v2:**

1. **Multiple Restarts (Configurable)**
   - Teacher sets: Allow 1-3 restarts
   - Useful for low-stakes practice

2. **Smart Restart Timing**
   - Detect if student just needs a few more seconds vs truly unprepared
   - "Take 30 more seconds to think" vs "Come back later"

3. **Student Self-Reflection**
   - Before restart: "What will you do to prepare better?"
   - Encourages metacognition

4. **Restart Analytics**
   - Identify patterns: "Students struggle most with Unit 3"
   - Inform instruction

5. **Partial Credit for Restart Attempts**
   - Teacher option: "First attempt: 100% credit, Restart: 80% credit"
   - Encourages trying without penalty for needing help

---

**Document Version:** 1.0  
**Next Review:** After beta testing (January 20, 2026)  
**Owner:** Eric Chamberlin  
**Dev Team:** [Assign developer]
