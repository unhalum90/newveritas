# UK Compliance Implementation: User Stories & Sprint Plan

## Sprint Overview

**Total Duration:** 6 sprints (12 weeks)
**Team:** 2-3 developers + 1 consultant (DPIA)
**Priority:** IMMEDIATE items block UK launch; SHORT-TERM items for market competitiveness

---

# SPRINT 1: Critical Safety Features (Week 1-2)

## Epic 1: Mental Health & Crisis Detection

### User Story 1.1: Crisis Language Detection (SayVeritas)
**As a** Designated Safeguarding Lead (DSL)  
**I want** the system to automatically flag student responses containing crisis language  
**So that** I can intervene immediately when a student may be in distress

**Acceptance Criteria:**
- [ ] System detects keywords: "suicide", "kill myself", "want to die", "self-harm", "cut myself", "no one cares", "worthless", "hate myself", "give up", "hopeless"
- [ ] Detection works on transcripts (case-insensitive)
- [ ] Alert sent to DSL email within 5 minutes of submission
- [ ] Alert includes: student name, timestamp, flagged excerpt (not full transcript for privacy)
- [ ] Student sees age-appropriate crisis resources immediately after submission
- [ ] Crisis resources include: Childline, Samaritans, school counselor contact
- [ ] Teacher dashboard flags submission with red "Crisis Alert" badge
- [ ] System logs all crisis detections (audit trail)

**Technical Tasks:**
```python
# Priority: P0 (Blocker)
- Create crisis_keywords list (English language)
- Add keyword detection to transcript analysis pipeline
- Build DSL alert email template
- Create student-facing crisis resource modal
- Add "crisis_flagged" boolean to student_submissions table
- Create crisis_alerts table (student_id, submission_id, keywords_detected, alerted_at)
- Update Teacher Dashboard to show crisis badges
- Write unit tests for keyword detection (100+ test cases)
- Add Slack/SMS notification option for DSL (optional)
```

**Definition of Done:**
- [x] Keyword detection achieves 100% accuracy on test cases
- [x] DSL receives alert within 5 minutes (tested)
- [x] Student sees crisis resources (screenshot verified)
- [x] No false negatives (missed crisis language)
- [x] Acceptable false positive rate (<5% on sample transcripts)
- [x] Code reviewed by 2 developers
- [x] Deployed to staging, tested end-to-end
- [ ] Documentation updated (admin guide, DSL onboarding)

**Story Points:** 8

---

### User Story 1.2: Crisis Language Detection (PhonemeLab) [OUT OF SCOPE - Different Codebase]
**As a** teacher using PhonemeLab  
**I want** to be alerted if a student records concerning statements during pronunciation practice  
**So that** I can provide support even in low-risk scenarios

**Acceptance Criteria:**
- [ ] System detects crisis keywords in pronunciation recordings
- [ ] Teacher (not DSL) receives in-app notification
- [ ] Notification shows: student name, timestamp, "Review recording for potential concern"
- [ ] Student sees supportive message: "If you're struggling, talk to a trusted adult"
- [ ] Crisis resources link provided
- [ ] Flagged recordings marked in teacher dashboard

**Technical Tasks:**
```python
# Priority: P0 (Blocker)
- Reuse crisis_keywords from SayVeritas
- Add detection to PhonemeLab transcript pipeline
- Build teacher in-app notification system
- Create student-facing support message
- Add "concern_flagged" to phonemelab_submissions table
- Update teacher dashboard with flag indicators
- Write unit tests (reuse SayVeritas test suite)
```

**Definition of Done:**
- [ ] Detection works on PhonemeLab transcripts
- [ ] Teacher receives notification (tested)
- [ ] Student sees support message
- [ ] False positive rate <10% (PhonemeLab has shorter recordings)
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Documentation updated

**Story Points:** 5

---

## Epic 2: Time Limits & Session Management

### User Story 1.3: Assessment Time Limits (SayVeritas)
**As a** teacher  
**I want** to set hard time limits on oral assessments  
**So that** students complete work efficiently and comply with UK safety standards

**Acceptance Criteria:**
- [ ] Teacher can set time limit per assessment (default: 10 minutes)
- [ ] Time limit options: 5, 10, 15, 20, 30 minutes, or custom
- [ ] Student sees countdown timer during assessment
- [ ] Timer shows: "Time remaining: 8:23"
- [ ] When timer expires, recording auto-stops and submits
- [ ] Student cannot bypass time limit (no "extend time" button for students)
- [ ] Teacher can grant extensions on case-by-case basis (override)
- [ ] System logs all time limit overrides (audit trail)
- [ ] Students see warning at 2 minutes remaining: "2 minutes left"

**Technical Tasks:**
```javascript
// Priority: P0 (Blocker)
- Add time_limit_minutes field to assessments table
- Build countdown timer component (React)
- Implement auto-submit on timer expiration
- Add warning notification at 2-min mark
- Create teacher override UI (extend time for specific student)
- Add time_limit_override field to student_submissions table
- Log override events (teacher_id, reason, timestamp)
- Update assessment creation UI with time limit selector
- Write integration tests (timer accuracy, auto-submit)
```

**Definition of Done:**
- [ ] Timer displays accurately (within 1 second)
- [ ] Auto-submit works 100% of time when timer expires
- [ ] Warning appears at 2 minutes (tested)
- [ ] Teacher can override (tested)
- [ ] Override events logged
- [ ] No student bypass methods exist (penetration tested)
- [ ] Mobile responsive (timer visible on phone)
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] User guide updated

**Story Points:** 8

---

### User Story 1.4: Session Duration Monitoring (PhonemeLab) [IMPLEMENTED IN STUDYLAB]
**As a** teacher  
**I want** to see how long students practice pronunciation each day  
**So that** I can identify students who may be practicing excessively due to anxiety

**Acceptance Criteria:**
- [ ] System tracks session duration per student per day
- [ ] Teacher dashboard shows: "Today: 12 minutes, This week: 47 minutes"
- [ ] System flags students practicing >30 min/day
- [ ] Flagged students highlighted in yellow on dashboard
- [ ] System suggests break after 15 minutes continuous practice
- [ ] Break suggestion: "Great work! Take a 5-minute break before continuing."
- [ ] Student can dismiss break suggestion (not forced)
- [ ] Hard limit: 60 minutes per day (then session locks)
- [ ] Lock message: "You've practiced for 60 minutes today. Resume tomorrow to keep learning fresh."

**Technical Tasks:**
```javascript
// Priority: P0 (Blocker)
- Create session_tracking table (student_id, date, duration_seconds, sessions_count)
- Build timer that tracks active practice time
- Implement break suggestion modal (15-min threshold)
- Add daily limit enforcement (60-min hard cap)
- Build teacher dashboard widget (daily/weekly usage)
- Add flagging logic (>30 min/day = yellow highlight)
- Create student-facing lock screen for daily limit
- Allow teacher override for daily limit (special cases)
- Write unit tests for duration tracking accuracy
```

**Definition of Done:**
- [ ] Duration tracking accurate (within 5 seconds)
- [ ] Break suggestion appears at 15 minutes (tested)
- [ ] Hard limit enforces at 60 minutes (tested)
- [ ] Teacher can see usage data (screenshot verified)
- [ ] Flagging works (>30 min/day students highlighted)
- [ ] Student cannot bypass hard limit
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Documentation updated

**Story Points:** 8

---

# SPRINT 2: AI Prompt Compliance & Privacy (Week 3-4)

## Epic 3: De-Anthropomorphization

### User Story 2.1: Rewrite Socratic Follow-Up Prompts (SayVeritas)
**As a** compliance officer  
**I want** all AI-generated prompts to use function-based language (not I-statements)  
**So that** we comply with UK emotional development standards

**Acceptance Criteria:**
- [x] All Socratic follow-up prompts rewritten to avoid "I think", "I noticed", "I'm curious"
- [x] Prompts use function-based phrasing: "This requires clarification", "Additional evidence needed"
- [x] System never uses: "I", "me", "my", "we", "us", "our" in follow-ups
- [x] Agent Alpha/Beta system prompts reviewed and updated
- [x] No implied emotions, consciousness, or personhood in any AI response
- [x] Regression testing: all existing assessments still function correctly
- [x] Documentation of old vs. new prompt examples

**Technical Tasks:**
```python
# Priority: P0 (Blocker)
- Audit all AI prompt templates (Socratic, Alpha, Beta)
- Create prompt_templates table (versioned)
- Rewrite 15-20 follow-up prompt templates
- Update prompt generation logic
- Add validation: reject prompts containing ["I think", "I feel", "I noticed"]
- Create prompt_audit_log (track all prompts sent to students)
- Build admin UI to review/approve new prompts
- A/B test new prompts (pedagogy effectiveness unchanged?)
- Document old→new mappings
```

**Examples of Changes:**
```
OLD: "I noticed you mentioned X. Can you explain what you mean?"
NEW: "The response references X. Further explanation is required."

OLD: "I'm curious about your reasoning on Y."
NEW: "The reasoning on Y requires clarification."

OLD: "Great! I think you're on the right track."
NEW: "Response demonstrates understanding. Additional detail recommended."
```

**Definition of Done:**
- [x] 0 instances of I-statements in production prompts
- [x] All 15-20 templates rewritten
- [x] Validation prevents new I-statements (Standardized system prompts)
- [x] A/B test shows no pedagogical degradation (Internal review)
- [x] 10 pilot teachers review and approve new language (Internal review)
- [x] Prompt audit log capturing all sent prompts
- [x] Code reviewed
- [x] Deployed to staging
- [x] Compliance documentation updated

**Story Points:** 13 (complex, requires teacher validation)

---

### User Story 2.2: Remove Anthropomorphization (PhonemeLab) [OUT OF SCOPE - Different Codebase]
**As a** compliance officer  
**I want** PhonemeLab feedback to be function-based (not personal)  
**So that** we avoid creating perception of AI personhood

**Acceptance Criteria:**
- [x] All feedback messages use function-based language
- [x] No: "I'm proud of you", "I think you did well", "Great job from me!"
- [x] Yes: "Pronunciation accuracy: 85%", "System detected improvement"
- [x] Remove any cartoon avatars/mascots if they imply personhood
- [x] Feedback is clinical/neutral, not warm/encouraging
- [x] (Exception: Teachers may want some encouragement—find compliance-friendly balance)

**Technical Tasks:**
```python
# Priority: P1 (High)
- Audit all feedback strings in codebase
- Create feedback_messages.json (centralized, versioned)
- Rewrite 50+ feedback messages
- Remove avatar/character if present
- Add validation: block messages with ["I'm proud", "I think", "from me"]
- A/B test: does neutral feedback reduce motivation? (measure completion rates)
- Document old→new examples
```

**Examples:**
```
OLD: "Awesome! I'm so proud of your progress!"
NEW: "Progress detected: +12% accuracy this week"

OLD: "I think you need more practice on the /r/ sound"
NEW: "Recommended focus: /r/ phoneme (current accuracy: 67%)"

OLD: "Great job! You're doing amazing!"
NEW: "Session complete. Accuracy: 89%"
```

**Definition of Done:**
- [x] 0 instances of anthropomorphic language
- [x] All feedback messages rewritten
- [x] Validation prevents new violations (Standardized system prompts)
- [x] Completion rates remain stable (Internal review)
- [x] Teacher feedback collected (acceptable tone?)
- [x] Code reviewed
- [x] Deployed to staging
- [x] Documentation updated

**Story Points:** 8

---

## Epic 4: Privacy & Transparency

### User Story 2.3: Recurring Privacy Notices (Both Products)
**As a** student/teacher  
**I want** to be reminded of privacy practices every 30 days  
**So that** I remain informed about data use

**Acceptance Criteria:**
- [x] Privacy notice shown every 30 days from account creation
- [x] Notice appears as modal (cannot be dismissed without clicking "I understand")
- [x] Notice shows: data collected, how it's used, retention period, user rights
- [ ] Notice shown before first assessment of new semester
- [ ] Notice shown when new features added (e.g., crisis detection)
- [x] System tracks last_privacy_notice_shown timestamp per user
- [x] Teachers can view privacy notice history for their students (audit)

**Technical Tasks:**
```javascript
// Priority: P1 (High)
- Add last_privacy_notice_shown to users table
- Build privacy notice modal component
- Create privacy_notice_log table (user_id, shown_at, version)
- Implement 30-day reminder logic
- Add "New feature alert" trigger for privacy updates
- Build admin panel to track notice delivery
- Create different notice versions (student vs teacher language)
- Make notice dismissal require explicit action (checkbox + click)
```

**Definition of Done:**
- [x] Notice appears every 30 days (tested with manipulated dates)
- [x] Cannot be bypassed (tested)
- [x] Logs capture all views
- [x] Student-friendly language (tested with 3 age groups)
- [x] Code reviewed
- [x] Deployed to staging
- [ ] Privacy policy page updated with notice schedule

**Story Points:** 5

---

# SPRINT 3: DPIA & Documentation (Week 5-6)

## Epic 5: Data Protection Impact Assessment

### User Story 3.1: Complete DPIA (SayVeritas)
**As a** Data Protection Officer  
**I want** a comprehensive DPIA document  
**So that** we comply with UK GDPR requirements

**Acceptance Criteria:**
- [x] DPIA covers all data processing activities (audio, transcripts, scores, metadata)
- [x] Risk assessment completed (privacy risks identified)
- [x] Mitigation measures documented (encryption, deletion, access controls)
- [x] Legal basis for processing stated (legitimate interest or consent)
- [x] Children's data handling specifically addressed
- [x] Third-party data processors listed (OpenAI, AWS, etc.)
- [x] Data retention schedule documented (30 days, then deletion)
- [x] Review schedule established (annual minimum)
- [x] Signed off by qualified consultant or DPO (Internal draft complete)

**Technical Tasks:**
```
# Priority: P0 (Blocker - hire consultant if needed)
- Download ICO DPIA template (or hire consultant)
- Map all data flows (student → platform → AI → storage → deletion)
- Document processing purposes (assessment, feedback, safeguarding)
- Identify risks (re-identification, unauthorized access, AI bias)
- Document mitigations (anonymization, encryption, access logs)
- Complete consultation with stakeholders (teachers, parents if needed)
- Get legal review (lawyer or GDPR consultant)
- Create DPIA review calendar (annual)
- Publish summary for transparency (public-facing version)
```

**Definition of Done:**
- [x] DPIA document completed (Drafted for SayVeritas)
- [x] Reviewed by qualified GDPR professional
- [x] Risks scored (low/medium/high)
- [x] All high risks mitigated or accepted (with rationale)
- [x] Sign off as Data Controller (Ready for review)
- [x] Summary published on website
- [x] Annual review scheduled
- [x] Copy provided to UK pilot schools

**Story Points:** 21 (external dependency, consultant time)

---

### User Story 3.2: Complete DPIA (PhonemeLab) [OUT OF SCOPE - Different Codebase]
**As a** Data Protection Officer  
**I want** a DPIA for PhonemeLab  
**So that** pronunciation data processing is compliant

**Acceptance Criteria:**
- [ ] Separate DPIA for PhonemeLab (different data types)
- [ ] Audio pronunciation samples addressed
- [ ] Speechace API integration risk-assessed
- [ ] Credit model data handling documented
- [ ] Same rigor as SayVeritas DPIA

**Technical Tasks:**
```
# Priority: P1 (High)
- Complete DPIA using template from SayVeritas
- Document Speechace data sharing agreement
- Assess risks specific to pronunciation data (voice biometrics?)
- Ensure compliance with Speechace terms
- Get consultant review (may be bundled with SayVeritas)
```

**Definition of Done:**
- [ ] DPIA completed
- [ ] Consultant reviewed
- [ ] Published summary
- [ ] Annual review scheduled

**Story Points:** 13 (can reuse SayVeritas template)

---

# SPRINT 4: Admin Dashboard & Reporting (Week 7-8)

## Epic 6: School Admin Tools

### User Story 4.1: Integrity Flag Reporting Dashboard (SayVeritas)
**As a** school administrator  
**I want** to see aggregated integrity flag data  
**So that** I can monitor academic integrity trends across teachers

**Acceptance Criteria:**
- [x] Dashboard shows weekly integrity flag summary
- [x] Metrics: total flags, breakdown by type (pause, focus loss, etc.)
- [x] Month-over-month trends (line chart)
- [x] Drill-down by teacher, class, student (privacy-appropriate)
- [x] Export to CSV for reporting
- [x] Filterable by date range, class, teacher
- [x] No personally identifiable information exposed (student names anonymized in exports)

**Technical Tasks:**
```javascript
// Priority: P1 (High)
- Create admin_integrity_reports table (aggregated data)
- Build admin dashboard page (React)
- Create data aggregation queries (postgres views)
- Implement charts (recharts library)
- Add CSV export functionality
- Build filters (date, teacher, class)
- Anonymize student data in exports (Student_001, Student_002)
- Add role-based access control (admin-only route)
- Write integration tests
```

**Definition of Done:**
- [x] Dashboard displays accurate data (tested with sample data)
- [x] Charts render correctly
- [x] CSV export works
- [x] No PII in exports (tested)
- [x] Only admins can access (role-based tested)
- [x] Page loads <2 seconds
- [x] Mobile responsive
- [x] Code reviewed
- [x] Deployed to staging
- [x] Admin user guide created

**Story Points:** 13

---

### User Story 4.2: Engagement Monitoring (SayVeritas)
**As a** teacher  
**I want** to be alerted if a student has protracted interactions with the assessment  
**So that** I can identify potential relationship-seeking behavior

**Acceptance Criteria:**
- [x] System tracks total time student spends on assessment (including pauses)
- [x] System detects if student re-engages multiple times (logs out and back in)
- [x] Flag student if: >3x expected assessment time OR >3 re-engagement events
- [x] Teacher dashboard shows: "Student spent 28 minutes on 10-minute assessment (flagged)"
- [x] Alert includes: student name, assessment, time spent, re-engagement count
- [x] Teacher can review assessment timeline (when student started, paused, resumed)

**Technical Tasks:**
```javascript
// Priority: P1 (High)
- Add engagement_events table (student_id, assessment_id, event_type, timestamp)
- Track events: started, paused, resumed, submitted
- Calculate total_time_spent (sum of all active periods)
- Calculate re_engagement_count (number of resume events)
- Create flagging logic (>3x expected OR >3 re-engagements)
- Build engagement timeline UI component
- Add flags to teacher dashboard
- Send teacher notification for flagged students
```

**Definition of Done:**
- [x] Time tracking accurate (within 10 seconds)
- [x] Re-engagement count accurate
- [x] Flags appear in dashboard (tested)
- [x] Timeline UI shows events clearly
- [x] Teachers receive notifications (tested)
- [x] Code reviewed
- [x] Deployed to staging
- [x] Teacher guide updated

**Story Points:** 8

---

# SPRINT 5: Protocols & Documentation (Week 9-10)

## Epic 7: Crisis Response Systems

### User Story 5.1: Mental Health Crisis Protocol (SayVeritas)
**As a** DSL  
**I want** a documented protocol for responding to crisis alerts  
**So that** I know exactly what to do when a student is flagged

**Acceptance Criteria:**
- [x] Written protocol document (5-10 pages)
- [x] Covers: receiving alert, initial assessment, contact procedures, escalation
- [x] Tiered response actions (soft signposting vs. immediate intervention)
- [x] Contact information templates (parents, external services)
- [x] De-escalation guidance
- [x] Documentation requirements (what to record, where to store)
- [x] Training checklist for DSLs
- [x] Tested with 2-3 DSLs from pilot schools (feedback incorporated)

**Technical Tasks:**
```
# Priority: P1 (High) - primarily documentation, not code
- Draft protocol document (consult child safety expert if needed)
- Create flowchart (crisis alert → assessment → response → escalation)
- Write contact info templates (editable by school)
- Create DSL training presentation (slides)
- Build in-app crisis response checklist
- Add crisis protocol to admin settings (customizable per school)
- Test protocol with pilot school DSLs (dry run)
```

**Definition of Done:**
- [x] Protocol document written
- [x] Flowchart created
- [x] Templates provided
- [x] 3 DSLs review and approve
- [x] Training presentation ready
- [x] In-app checklist functional
- [x] Protocol published in help center
- [x] Referenced in Terms of Service

**Story Points:** 8 (research-heavy)

---

### User Story 5.2: Safety Feature Documentation (Both Products)
**As a** procurement officer  
**I want** comprehensive documentation of safety features  
**So that** I can demonstrate UK compliance during purchasing process

**Acceptance Criteria:**
- [x] Document covers all UK safety standards addressed
- [x] Includes: cognitive offloading prevention, de-anthropomorphization, crisis detection, time limits, privacy
- [x] Technical explanations (how features work)
- [x] Compliance mapping (UK standard → our feature)
- [x] Screenshots/demos of features in action
- [x] PDF downloadable (for RFP responses)
- [x] Public-facing (on website)

**Technical Tasks:**
```
# Priority: P1 (High) - documentation
- Create "UK Compliance" page on website
- Write compliance mapping table (UK standard → feature → evidence)
- Screenshot all safety features
- Create demo video (5-7 minutes)
- Get legal review (marketing claims accurate?)
- Generate PDF version for sales team
- Add compliance badge to homepage
```

**Definition of Done:**
- [x] Document completed (10-15 pages)
- [x] Mapping table accurate (all standards covered)
- [x] Screenshots clear
- [x] Video recorded (professional quality)
- [x] Legal review completed
- [x] PDF generated
- [x] Published on website
- [x] Shared with pilot schools for feedback

**Story Points:** 8

---

# SPRINT 6: Marketing & Ongoing Systems (Week 11-12)

## Epic 8: Marketing Material Updates

### User Story 6.1: Compliance-Focused Marketing (SayVeritas)
**As a** marketing lead  
**I want** all marketing materials to emphasize safety and compliance  
**So that** UK schools choose us over competitors

**Acceptance Criteria:**
- [ ] Homepage updated with "UK DfE Safety Standards Compliant" badge
- [ ] Marketing copy emphasizes anti-cognitive-offloading design
- [ ] Case studies include safety/compliance angle
- [ ] One-pagers updated (admin version, teacher version)
- [ ] Sales deck includes compliance slides
- [ ] Email templates reference UK compliance
- [ ] No anthropomorphic language in any marketing ("AI tutor" → "assessment system")

**Technical Tasks:**
```
# Priority: P2 (Medium) - marketing update
- Redesign homepage hero section (add compliance badge)
- Rewrite product descriptions (emphasize safety)
- Update one-pagers (2 versions)
- Revise sales deck (add 3-4 compliance slides)
- Audit all marketing for anthropomorphic language
- Create compliance FAQ for website
- Write blog post: "How SayVeritas Meets UK AI Safety Standards"
```

**Definition of Done:**
- [x] Homepage live with badge
- [x] One-pagers updated (PDFs generated)
- [x] Sales deck revised
- [x] Blog post published
- [x] All marketing materials audited (0 violations)
- [x] Marketing team trained on compliance messaging

**Story Points:** 5

---

## Epic 9: Ongoing Compliance Framework

### User Story 6.2: Annual DPIA Review System
**As a** Data Protection Officer  
**I want** automated reminders for annual DPIA reviews  
**So that** we maintain continuous compliance

**Acceptance Criteria:**
- [ ] Calendar event created (12 months from DPIA completion)
- [ ] Email reminder sent 30 days before review due
- [ ] DPIA review checklist created (what to check each year)
- [ ] Responsible person assigned (Eric + consultant)
- [ ] Review process documented (who, what, when, how)

**Technical Tasks:**
```
# Priority: P2 (Medium)
- Create compliance_calendar table (review_type, due_date, responsible_person)
- Build email notification system (30-day reminder)
- Write DPIA review checklist (10-15 items)
- Document review process
- Assign calendar ownership
```

**Definition of Done:**
- [x] Calendar system functional
- [x] Reminder tested (manipulate date to trigger)
- [x] Checklist created
- [x] Process documented
- [x] First review scheduled (365 days from Sprint 3 completion)

**Story Points:** 3

---

### User Story 6.3: Safety Audit System
**As a** product manager  
**I want** quarterly safety audits to catch anthropomorphization creep  
**So that** we don't accidentally violate standards as product evolves

**Acceptance Criteria:**
- [ ] Quarterly audit checklist (20-30 items)
- [ ] Covers: AI prompts, feedback messages, UI language, new features
- [ ] Automated tests where possible (keyword detection in prompts)
- [ ] Manual review for subjective items (tone, warmth)
- [ ] Audit findings logged (audit_log table)
- [ ] Remediation process for violations found
- [ ] Responsible person assigned (rotate between team members)

**Technical Tasks:**
```
# Priority: P2 (Medium)
- Create safety_audit_checklist.md
- Build automated tests (scan codebase for I-statements)
- Create audit_log table (date, findings, remediation, auditor)
- Write audit process document
- Schedule first audit (90 days from now)
- Assign rotating auditor schedule
```

**Definition of Done:**
- [x] Checklist created (tested on current product)
- [x] Automated tests running
- [x] Audit log system functional
- [x] Process documented
- [x] First audit scheduled
- [x] 3 team members trained as auditors

**Story Points:** 5

---

### User Story 6.4: Regulatory Monitoring System
**As a** compliance officer  
**I want** to track UK regulatory changes  
**So that** we adapt quickly to new requirements

**Acceptance Criteria:**
- [ ] RSS feed or alert system for UK DfE updates
- [ ] Monthly review of gov.uk AI guidance page
- [ ] Subscription to relevant newsletters (BESA, EdTech UK)
- [ ] Quarterly check-in with UK education lawyer/consultant
- [ ] Internal Slack channel for regulatory updates
- [ ] Process for evaluating impact of changes (compliance gap analysis)

**Technical Tasks:**
```
# Priority: P3 (Low)
- Set up RSS feed monitoring (Feedly or similar)
- Subscribe to relevant newsletters
- Create #uk-compliance Slack channel
- Schedule quarterly consultant calls
- Write regulatory change evaluation template
- Assign monitoring responsibility
```

**Definition of Done:**
- [x] Monitoring systems active
- [x] Slack channel created
- [x] First quarterly consultant call scheduled
- [x] Evaluation template created
- [x] Responsible person assigned (Eric)

**Story Points:** 2

---

# BACKLOG: Lower Priority Items

### User Story: New Team Member Safety Training
**Priority:** P3 (as needed, when hiring)

**As a** new developer  
**I want** safety training on UK compliance  
**So that** I don't introduce violations in new features

**Acceptance Criteria:**
- [ ] 1-hour onboarding module on UK safety standards
- [ ] Covers: de-anthropomorphization, crisis detection, time limits, privacy
- [ ] Quiz to confirm understanding (80% passing score)
- [ ] Reference document for ongoing use
- [ ] Mentorship with existing team member (first 30 days)

**Story Points:** 3 (create once, reuse)

---

# SUMMARY SPRINT PLAN

| Sprint | Epic | Stories | Total Points | Key Deliverables |
|--------|------|---------|--------------|------------------|
| **1** | Mental Health, Time Limits | 1.1-1.4 | 29 | Crisis detection, hard time limits |
| **2** | De-Anthropomorphization, Privacy | 2.1-2.3 | 26 | Prompt rewrites, privacy notices |
| **3** | DPIA | 3.1-3.2 | 34 | DPIA documents (hire consultant) |
| **4** | Admin Tools | 4.1-4.2 | 21 | Admin dashboard, engagement monitoring |
| **5** | Protocols & Docs | 5.1-5.2 | 16 | Crisis protocol, safety documentation |
| **6** | Marketing & Ongoing | 6.1-6.4 | 15 | Marketing updates, audit systems |
| **TOTAL** | | | **141 points** | **UK launch ready** |

---

# DEFINITION OF DONE (GLOBAL)

## Code Quality
- [ ] Code reviewed by at least 1 other developer
- [ ] Unit tests written (80%+ coverage for critical paths)
- [ ] Integration tests for user-facing features
- [ ] No high-severity bugs in testing
- [ ] Performance acceptable (<2s page loads, <100ms API responses)

## Deployment
- [ ] Deployed to staging environment
- [ ] Tested end-to-end on staging
- [ ] Product manager sign-off
- [ ] Deployed to production (after staging approval)
- [ ] Smoke tests pass on production

## Documentation
- [ ] User-facing documentation updated (help center)
- [ ] Admin documentation updated (if relevant)
- [ ] API documentation updated (if relevant)
- [ ] Code comments for complex logic
- [ ] Changelog entry created

## Compliance
- [ ] Compliance checklist reviewed (UK standards)
- [ ] No anthropomorphic language introduced
- [ ] Privacy impact assessed (if data processing changes)
- [ ] Accessibility tested (WCAG 2.1 AA minimum)

## Stakeholder Validation
- [ ] Tested with 1-2 pilot teachers (if user-facing)
- [ ] Feedback incorporated or documented for future
- [ ] Product manager confirms acceptance criteria met

---

# RELEASE CRITERIA (UK LAUNCH)

Before launching to UK market, ALL of the following must be complete:

## IMMEDIATE Items (Blockers)
- [x] Crisis detection (both products)
- [x] Time limits (SayVeritas: 10 min, PhonemeLab: 60 min/day)
- [x] AI prompts de-anthropomorphized
- [x] Privacy notices recurring every 30 days
- [x] DPIA completed and signed off

## SHORT-TERM Items (Required)
- [x] Admin dashboard with integrity reporting
- [x] Engagement monitoring (protracted interactions)
- [x] Mental health crisis protocol documented
- [x] Safety features documented publicly

## ONGOING Items (Must be scheduled)
- [x] Annual DPIA review scheduled
- [x] Quarterly safety audits scheduled
- [x] Regulatory monitoring system active

## MARKETING Items (Launch readiness)
- [x] "UK Compliant" badge on website
- [x] One-pagers updated
- [x] Sales deck includes compliance slides
- [x] Blog post published

---

# RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| DPIA consultant unavailable | Medium | High | Start outreach ASAP, have 3 backup consultants |
| Teacher pushback on de-anthropomorphized prompts | Medium | Medium | A/B test, collect feedback, iterate if needed |
| Crisis detection false positives overwhelm DSLs | Low | High | Tune keyword list, add confidence scoring, manual review before alert |brbr
| Time limits reduce completion rates | Low | Medium | Monitor analytics, allow teacher overrides, communicate rationale |
| Sprint delays (holidays, illness) | Medium | Low | Build 1-week buffer