# Sprint Plan: Academic Integrity System
**Product:** SayVeritas  
**Sprint Duration:** 3 weeks  
**Target Completion:** January 31, 2026 (before institutional pilots)

---

## Epic: Silent Integrity Detection & Question Rotation

**Goal:** Provide multi-layered academic integrity protection that preserves authentic assessment conditions while giving teachers actionable data to identify potential cheating.

**Success Metrics:**
- 95%+ of students complete integrity pledge without confusion
- Behavioral flags accurate enough that teachers review <15% of submissions
- Question rotation maintains cognitive equivalence (validated by teachers)
- Zero false accusations (teacher always makes final judgment)
- System performance: flags calculated in <2 seconds per submission

---

## User Stories

### AI-101: Pre-Assessment Academic Integrity Pledge

**As a** student  
**I want** clear expectations about academic honesty before starting  
**So that** I understand the assessment is meant to measure my own learning

**Acceptance Criteria:**
- [ ] Pledge displays before student sees any assessment questions
- [ ] Cannot proceed until student clicks "I Agree"
- [ ] Pledge text customizable by teacher (default provided)
- [ ] Default text includes:
  - "I have studied the material and am ready to demonstrate my understanding"
  - "I will not use notes, websites, or other people during this assessment"
  - "I understand this assessment measures what I know, not what I can look up"
  - "My responses will be in my own words based on my learning"
- [ ] Timestamp recorded when student accepts
- [ ] Acceptance logged to database: `student_id`, `assessment_id`, `pledge_accepted_at`
- [ ] Teacher can view pledge acceptance in submission details

**Story Points:** 3

---

### AI-102: Response Speed Anomaly Detection

**As a** teacher  
**I want** the system to flag students who answer suspiciously fast  
**So that** I can investigate potential pre-planned or pre-written answers

**Acceptance Criteria:**
- [ ] Timer starts when question first displays to student
- [ ] System calculates "time to first word spoken"
- [ ] Flag triggered if student begins speaking in <2 seconds
- [ ] Flag includes:
  - Exact time to first word
  - Question complexity estimate (word count as proxy)
  - Expected minimum read time based on question length
- [ ] Flag severity levels:
  - **High:** <2 seconds (nearly impossible to read + think)
  - **Medium:** 2-5 seconds (very fast, worth checking)
  - **Low:** 5-10 seconds (quick but plausible)
- [ ] No flags generated for responses >10 seconds to first word
- [ ] Flag displayed in teacher review interface with timestamp
- [ ] Student experience unchanged (no warning, interruption, or notification)

**Technical Implementation:**
```javascript
// Pseudocode
const questionDisplayTime = timestamp;
const firstWordSpokenTime = timestamp;
const timeToResponse = firstWordSpokenTime - questionDisplayTime;
const questionWordCount = question.split(' ').length;
const minimumReadTime = questionWordCount * 0.25; // ~250 wpm

if (timeToResponse < 2000) {
  flagSeverity = 'high';
} else if (timeToResponse < 5000) {
  flagSeverity = 'medium';
} else if (timeToResponse < minimumReadTime) {
  flagSeverity = 'low';
}
```

**Story Points:** 5

---

### AI-103: Pause Pattern Analysis

**As a** teacher  
**I want** the system to detect unusual pauses during student responses  
**So that** I can identify potential mid-answer research or consultation

**Acceptance Criteria:**
- [ ] System analyzes audio waveform for silence periods >3 seconds
- [ ] Detects total number of pauses and cumulative pause time
- [ ] Flag triggered if:
  - Single pause >7 seconds, OR
  - Total pause time >30% of response duration, OR
  - More than 5 pauses >3 seconds in a single response
- [ ] Flag includes:
  - Number of significant pauses (>3 sec)
  - Longest pause duration
  - Total pause time as % of response
  - Timestamp of each pause
- [ ] Distinguishes between:
  - **Thinking pauses:** 3-7 seconds (normal, not flagged)
  - **Research pauses:** >7 seconds (flagged)
- [ ] Natural pauses at sentence breaks not counted
- [ ] Flag displayed in teacher dashboard with audio visualization
- [ ] Student experience unchanged

**Technical Implementation:**
```python
# Pseudocode
pauses = detect_silence_periods(audio, threshold=-40dB, min_duration=3sec)
long_pauses = [p for p in pauses if p.duration > 7]
total_pause_time = sum(p.duration for p in pauses)
pause_percentage = (total_pause_time / total_response_time) * 100

if any(p.duration > 7 for p in pauses):
    flag = 'research_pause'
elif pause_percentage > 30:
    flag = 'excessive_pauses'
elif len(long_pauses) > 5:
    flag = 'frequent_pauses'
```

**Story Points:** 8

---

### AI-104: Tab Switching & Screenshot Detection

**As a** teacher  
**I want** to know if students switch tabs or take screenshots during assessment  
**So that** I can identify potential external resource use or answer sharing

**Acceptance Criteria:**
- [ ] System monitors browser `visibilitychange` events
- [ ] Records each time student switches away from assessment tab
- [ ] Tracks total time tab was not visible
- [ ] Records screenshot attempts (browser-level detection where available)
- [ ] Flag triggered if:
  - Tab switched >3 times during response, OR
  - Tab not visible for >20 seconds cumulative, OR
  - Screenshot detected
- [ ] Flag includes:
  - Number of tab switches
  - Duration of each switch
  - Total time away from assessment
  - Screenshot attempt timestamps (if detected)
- [ ] Data logged to `integrity_events` table:
  - `event_type`: 'tab_switch' | 'screenshot_attempt'
  - `timestamp`
  - `duration` (for tab switches)
- [ ] Teacher dashboard shows timeline of events
- [ ] Student sees no warning or interruption
- [ ] Works across browsers (graceful degradation for unsupported features)

**Technical Implementation:**
```javascript
// Browser tab visibility detection
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    tabSwitchStart = Date.now();
  } else {
    tabSwitchEnd = Date.now();
    duration = tabSwitchEnd - tabSwitchStart;
    logIntegrityEvent('tab_switch', duration);
  }
});

// Screenshot detection (limited browser support)
document.addEventListener('keyup', function(e) {
  if (e.key === 'PrintScreen') {
    logIntegrityEvent('screenshot_attempt', null);
  }
});
```

**Story Points:** 5

---

### AI-105: Question Bank Generation & Rotation

**As a** teacher  
**I want** to create multiple versions of the same question  
**So that** students in different class periods can't share specific answers

**Acceptance Criteria:**
- [ ] Teacher provides:
  - Essential question or learning objective
  - Subject area and grade level
  - Desired cognitive level (Bloom's taxonomy)
  - Number of variants (default: 5, max: 8)
- [ ] AI generates 5-8 cognitively equivalent questions:
  - Same Bloom's level
  - Same scope and evidence requirements
  - Different surface content/examples
- [ ] Teacher reviews and approves all variants before activation
- [ ] Teacher can:
  - Edit AI-generated questions
  - Remove variants that don't meet standards
  - Add manually-written variants
  - Mark variants as "needs revision"
- [ ] System randomly assigns one variant to each student
- [ ] No two students in same class period get same variant (if possible)
- [ ] Question variant tracked in database: `student_id`, `assessment_id`, `variant_id`
- [ ] Teacher can see which students received which variant
- [ ] Minimum 3 variants required to activate rotation
- [ ] Teacher can disable rotation and use single question if preferred

**AI Prompt Structure:**
```
Generate {n} cognitively equivalent questions for a {grade_level} {subject} assessment.

Learning Objective: {objective}
Bloom's Level: {level}
Original Question: {question}

Requirements:
- Maintain exact same cognitive demand
- Require same type and amount of evidence
- Use different examples, contexts, or framings
- Keep similar length and complexity
- Ensure questions are equally difficult

Return JSON array of questions with metadata.
```

**Story Points:** 13

---

### AI-106: Teacher Review Dashboard for Integrity Flags

**As a** teacher  
**I want** a clear interface to review flagged submissions  
**So that** I can make informed judgments about academic integrity

**Acceptance Criteria:**
- [ ] Dashboard shows all submissions with integrity flags
- [ ] Submissions sorted by flag severity (high → medium → low)
- [ ] Each flagged submission displays:
  - Student name
  - Flag type(s): speed, pauses, tab switching, screenshot
  - Flag severity indicator (color-coded)
  - Audio player with pause visualization overlay
  - Timeline showing tab switches and their duration
  - Comparison to student's normal performance pattern
- [ ] Teacher can:
  - Play audio with visual indicators of pauses
  - See exact timestamps of all integrity events
  - Add notes to submission
  - Mark as "Reviewed - No Issue" or "Follow Up Required"
  - Request follow-up oral assessment with student
  - Override AI score if integrity concerns warrant
- [ ] Filter options:
  - By flag type
  - By severity
  - By class
  - Reviewed vs. Unreviewed
- [ ] Bulk actions: "Mark all as reviewed"
- [ ] Dashboard shows what % of submissions were flagged (expect <15%)
- [ ] No student-facing indicators that their submission was flagged

**Interface Mockup Requirements:**
```
┌─────────────────────────────────────────────┐
│ Integrity Flags (12 of 87 submissions)     │
├─────────────────────────────────────────────┤
│ 🔴 Sarah Martinez - Period 2               │
│ • Response speed: <2 sec (HIGH)            │
│ • Tab switches: 5 times (MEDIUM)           │
│ • Audio: [▶ Play] [Waveform visualization]│
│ • Notes: ___________________________       │
│ [Mark Reviewed] [Request Follow-Up]       │
├─────────────────────────────────────────────┤
│ 🟡 James Cooper - Period 4                 │
│ • Pause duration: 12 sec (MEDIUM)          │
│ • Audio: [▶ Play] [Pause at 0:34]        │
└─────────────────────────────────────────────┘
```

**Story Points:** 8

---

### AI-107: Difficulty Calibration for Question Variants

**As a** teacher  
**I want** confirmation that all question variants are equally difficult  
**So that** no student has an unfair advantage/disadvantage

**Acceptance Criteria:**
- [ ] System tracks performance on each question variant:
  - Average score per variant
  - Score distribution per variant
  - Time to complete per variant
- [ ] After 20+ responses per variant, system calculates:
  - Mean score for each variant
  - Standard deviation
  - Difficulty index (% of students scoring >80%)
- [ ] Teacher receives alert if variant difficulty differs significantly:
  - Mean score variance >10 points between variants
  - One variant consistently easier/harder
- [ ] Dashboard shows variant comparison:
  ```
  Variant A: Avg 78%, 45 responses
  Variant B: Avg 82%, 42 responses  ⚠️ Easier
  Variant C: Avg 76%, 48 responses
  Variant D: Avg 72%, 44 responses  ⚠️ Harder
  Variant E: Avg 79%, 46 responses
  ```
- [ ] Teacher can:
  - Retire problematic variants
  - Adjust scoring rubric for specific variants
  - Request new AI-generated replacement
- [ ] System recommends retiring variants after statistical review
- [ ] Minimum sample size (20 responses) before flagging differences

**Story Points:** 8

---

## Definition of Done

### Functionality
- [ ] All 7 user stories implemented and tested
- [ ] Integrity pledge displays and logs acceptance
- [ ] Response speed calculated accurately (<100ms precision)
- [ ] Pause detection works across different audio quality levels
- [ ] Tab switching tracked across Chrome, Firefox, Safari, Edge
- [ ] Question rotation assigns variants randomly and evenly
- [ ] Teacher dashboard displays all flags clearly
- [ ] Difficulty calibration runs automatically after sufficient data
- [ ] No student-facing indicators of integrity monitoring
- [ ] All data logged to database with proper indexing

### Performance
- [ ] Integrity analysis completes within 2 seconds of submission
- [ ] Dashboard loads flagged submissions in <1 second
- [ ] Audio waveform visualization renders smoothly
- [ ] Question variant generation completes in <30 seconds
- [ ] System handles 1,000+ simultaneous submissions without degradation

### UX
- [ ] Integrity pledge clear and non-threatening
- [ ] Teacher dashboard intuitive (requires <5 min training)
- [ ] Flags displayed with appropriate context (not just binary yes/no)
- [ ] Teacher can complete review workflow in <2 min per flagged submission
- [ ] Mobile-responsive dashboard (tablets minimum)

### Data & Privacy
- [ ] All integrity events logged with timestamps
- [ ] Data retained for academic year, then archived
- [ ] Teacher notes encrypted at rest
- [ ] Student audio never accessible outside teacher review
- [ ] FERPA-compliant data handling
- [ ] No sharing of integrity flags with students or parents (teacher discretion only)

### Documentation
- [ ] Teacher guide: "Understanding Integrity Flags"
- [ ] FAQ: "What triggers a flag?"
- [ ] Best practices: "Reviewing Flagged Submissions"
- [ ] Video tutorial: 5-minute walkthrough of review dashboard
- [ ] Admin guide: System-wide integrity reporting

### Testing
- [ ] Unit tests for all detection algorithms
- [ ] Integration tests for flag workflow
- [ ] Load testing with 500+ concurrent submissions
- [ ] Cross-browser testing for tab detection
- [ ] Audio analysis tested with various microphone qualities
- [ ] Question variant quality reviewed by 3+ teachers
- [ ] Beta testing with CVA and Endicott before GA

### Launch Readiness
- [ ] Feature flags enable/disable per school
- [ ] Teacher can opt out of specific flags (e.g., disable tab switching detection)
- [ ] System performance monitoring configured
- [ ] Error logging and alerting active
- [ ] Support documentation published
- [ ] Training webinar scheduled for beta schools

---

## Sprint Breakdown

### Week 1: Foundation & Detection Core
**Focus:** Build the detection mechanisms without UI

**Tasks:**
- [ ] Database schema for integrity events
- [ ] Implement response speed calculation
- [ ] Build pause pattern analysis algorithm
- [ ] Implement tab switching event listeners
- [ ] Create integrity pledge UI component
- [ ] Unit tests for all detection logic

**Deliverable:** Working detection system logging events to database

---

### Week 2: Question Rotation & AI Integration
**Focus:** Multi-variant question system

**Tasks:**
- [ ] Design question variant data model
- [ ] Build AI prompt for question generation
- [ ] Create teacher review interface for variants
- [ ] Implement random variant assignment logic
- [ ] Build variant tracking in database
- [ ] Test question generation with sample content

**Deliverable:** Teachers can generate, review, and activate question banks

---

### Week 3: Teacher Dashboard & Polish
**Focus:** Review interface and launch prep

**Tasks:**
- [ ] Build teacher review dashboard UI
- [ ] Implement flag filtering and sorting
- [ ] Create audio player with pause visualization
- [ ] Build difficulty calibration reports
- [ ] Write teacher documentation
- [ ] Conduct beta testing with 2-3 teachers
- [ ] Bug fixes and refinements

**Deliverable:** Complete integrity system ready for pilot launch

---

## Risk Assessment

### High Risk
**Question variants not cognitively equivalent**
- **Impact:** Students get unfair advantages/disadvantages
- **Mitigation:** Teacher review required before activation + ongoing difficulty calibration
- **Contingency:** Ability to retire problematic variants mid-assessment

### Medium Risk
**False positive rate too high (>20% of submissions flagged)**
- **Impact:** Teachers overwhelmed with reviews, lose trust in system
- **Mitigation:** Tune detection thresholds during beta, provide severity levels
- **Contingency:** Feature flags to disable specific detections

**Browser compatibility issues with tab detection**
- **Impact:** Inconsistent integrity monitoring across platforms
- **Mitigation:** Graceful degradation, document which browsers support which features
- **Contingency:** Teacher can manually note student device type

### Low Risk
**Students learn to game specific detection algorithms**
- **Impact:** Reduced effectiveness over time
- **Mitigation:** Multi-layered approach means gaming all systems simultaneously is difficult
- **Contingency:** Ability to add new detection methods post-launch

---

## Success Metrics (Post-Launch)

**Within 30 Days:**
- [ ] <15% of submissions flagged (indicates good threshold tuning)
- [ ] Teachers review flagged submissions in <3 minutes on average
- [ ] 90%+ of teachers report flags are "useful" or "very useful"
- [ ] Zero false accusations (teacher always makes final call)
- [ ] Question variants show <10% difficulty variance

**Within 90 Days:**
- [ ] Documented reduction in suspected cheating vs. previous semester
- [ ] Teachers report 50%+ time savings on assessment review
- [ ] Student feedback shows academic integrity pledge sets appropriate tone
- [ ] No student complaints about unfair question difficulty due to variants

---

**Document Version:** 1.0  
**Created:** December 25, 2025  
**Target Delivery:** January 31, 2026  
**Priority:** HIGH (Required for institutional pilots)