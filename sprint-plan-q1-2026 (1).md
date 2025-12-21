# EduSynapse Sprint Plan: Q1 2026
**Team: Development • Product: Veritas Assess + PhonemeLab Enhancements**  
**Sprint Duration: 2 weeks per sprint • Timeline: January 5 - March 31, 2026**

---

## Table of Contents
1. [Epic Overview](#epic-overview)
2. [Sprint 1: Veritas Wizard Foundation](#sprint-1-veritas-wizard-foundation)
3. [Sprint 2: Assessment Generation & AI Integration](#sprint-2-assessment-generation--ai-integration)
4. [Sprint 3: Question Management & Rubrics](#sprint-3-question-management--rubrics)
5. [Sprint 4: Maine Standards Alignment (PhonemeLab)](#sprint-4-maine-standards-alignment-phonemelab)
6. [Sprint 5: Title III Compliance Features](#sprint-5-title-iii-compliance-features)
7. [Sprint 6: Polish & Production Readiness](#sprint-6-polish--production-readiness)
8. [Definition of Done](#definition-of-done)
9. [Technical Dependencies](#technical-dependencies)

---

## Epic Overview

### Epic 1: Veritas Assess Builder Redesign
**Goal:** Transform assessment creation from cluttered single-page form to intuitive wizard flow with AI-powered generation.

**Success Metrics:**
- Teachers can create assessment in < 10 minutes
- 90% completion rate for started assessments
- Zero support tickets about "confusing interface"

**Reference Design:** Gemini-style dark theme wizard (see screenshots in Slack)

---

### Epic 2: Standards Alignment for Market Entry
**Goal:** Position PhonemeLab as Maine Learning Results + WIDA aligned tool to access Title III funding and World Languages budgets.

**Success Metrics:**
- Alignment documentation complete and approved
- 3 Maine districts agree to pilot
- Listed on Maine DOE resources page

---

## Sprint 1: Veritas Wizard Foundation
**Dates:** January 6-17, 2026  
**Goal:** Build core wizard navigation and Step 1 (General Info)

### User Stories

#### VS-101: Wizard Layout & Navigation
**As a** teacher  
**I want** a clear step-by-step workflow for creating assessments  
**So that** I'm not overwhelmed by all options at once

**Acceptance Criteria:**
- [ ] Wizard layout displays left panel (800px) for main content, right panel (350px) for context
- [ ] Step navigation shows 4 numbered steps: General Info, Visual Assets, Questions, Rubrics
- [ ] Current step is highlighted with teal accent color
- [ ] Completed steps remain clickable to navigate back
- [ ] Uncompleted steps are disabled (greyed out)
- [ ] "Save Draft" button persists top-right across all steps
- [ ] "Publish to Class" button appears only on Step 4

**Story Points:** 8

---

#### VS-102: Step 1 - General Info Form
**As a** teacher  
**I want** to enter basic assessment information quickly  
**So that** I can move on to creating actual questions

**Acceptance Criteria:**
- [ ] Assessment Title input (required, max 100 chars)
- [ ] Subject dropdown (History, Science, Literature, Math, Language Arts, Other)
- [ ] Target Language dropdown (English US, Spanish, French, Mandarin, Arabic, Other)
- [ ] Student Instructions textarea (optional, max 500 chars, placeholder text provided)
- [ ] All fields save to draft on blur (auto-save every 3 seconds)
- [ ] "Continue →" button validates required fields before advancing to Step 2
- [ ] Validation errors display inline with red text and icon

**Story Points:** 5

---

#### VS-103: Context Panel - Integrity Shields
**As a** teacher  
**I want** to configure anti-cheating measures upfront  
**So that** my assessment has proper safeguards

**Acceptance Criteria:**
- [ ] Context panel displays on right side, sticky position
- [ ] Three toggle switches with labels:
  - "Pausing Guardrail" (Flag silence > 2.5s)
  - "Focus Monitor" (Track browser tab switching)
  - "Dynamic Shuffle" (Randomize question order)
- [ ] All toggles default to ON
- [ ] Toggle state persists across steps
- [ ] Settings save to draft immediately on toggle
- [ ] Tooltip on hover explains what each shield does

**Story Points:** 3

---

#### VS-104: Context Panel - Recording Limits
**As a** teacher  
**I want** to set time limits for student responses  
**So that** assessments stay within reasonable duration

**Acceptance Criteria:**
- [ ] "Recording Limit" dropdown: [30s, 60s, 90s, 120s, 180s]
- [ ] "Viewing Timer (Retell)" dropdown: [10s, 15s, 20s, 30s]
- [ ] Default values: 60s recording, 20s viewing
- [ ] Changes save immediately to draft
- [ ] Limits persist across steps

**Story Points:** 2

---

#### VS-105: Dark Theme Design System
**As a** developer  
**I want** consistent design tokens  
**So that** UI is cohesive across all wizard steps

**Acceptance Criteria:**
- [ ] CSS variables defined for colors (--background, --surface, --primary, etc.)
- [ ] Typography scale implemented (--text-3xl through --text-sm)
- [ ] Spacing tokens defined (--space-xs through --space-2xl)
- [ ] Card component styled with border-radius: 12px, border: 1px solid var(--border)
- [ ] Button variants: primary (teal), ghost (transparent), disabled (greyed)
- [ ] Form inputs styled consistently (dark background, teal focus border)
- [ ] Design system documented in Storybook or style guide

**Story Points:** 5

**Total Sprint 1 Points:** 23

---

## Sprint 2: Assessment Generation & AI Integration
**Dates:** January 20 - January 31, 2026  
**Goal:** Build Step 2 (Visual Assets) and AI generation infrastructure

### User Stories

#### VS-201: Step 2 - Visual Asset Generation
**As a** teacher  
**I want** to generate unique images for my assessment  
**So that** each student gets a different visual to prevent cheating

**Acceptance Criteria:**
- [ ] Textarea for image description (placeholder: "e.g., 'A factory floor during the 1850s...'")
- [ ] "Generate 3 Options" button calls DALL-E 3 API
- [ ] Loading state shows spinner with "Generating images..."
- [ ] 3 generated images display in grid (200x200px thumbnails)
- [ ] Clicking image selects it (teal border highlight)
- [ ] Selected image ID saves to assessment draft
- [ ] "Regenerate" button allows trying again with same prompt
- [ ] Continue button disabled until image selected
- [ ] Badge displays "POWERED BY DALL-E 3"

**Story Points:** 8

---

#### VS-202: Natural Language Assessment Generation (Option 1)
**As a** teacher  
**I want** to describe my assessment needs in plain English  
**So that** I don't have to fill out forms

**Acceptance Criteria:**
- [ ] On "New Assessment" page, show two options: "Start from scratch" or "Generate with AI"
- [ ] "Generate with AI" shows large textarea: "Describe the assessment you want to create..."
- [ ] Example text: "4 questions on cellular respiration for 10th grade honors biology..."
- [ ] Submit button calls GPT-4o to extract structured parameters:
  - Subject
  - Grade level
  - Topic
  - Number of questions
  - Learning objectives
- [ ] Extracted parameters pre-fill Step 1 form
- [ ] Teacher can edit extracted values before continuing
- [ ] If extraction fails, show error: "Could you be more specific? Include subject, grade, and topic."

**Story Points:** 13

---

#### VS-203: Question Bank Auto-Generation
**As a** teacher  
**I want** AI to generate initial questions based on my topic  
**So that** I have a starting point to refine

**Acceptance Criteria:**
- [ ] After completing Step 1 & 2, "Generate Questions" button appears on Step 3
- [ ] Button calls GPT-4o with prompt including:
  - Assessment title
  - Subject
  - Visual asset description (if provided)
  - Student instructions
- [ ] Generates 4 questions by default
- [ ] Questions tagged as "AI-Generated" with badge
- [ ] Teacher can edit, delete, or add more questions
- [ ] Each question has type: "Open Synthesis" (default for now)
- [ ] Questions save to draft immediately

**Story Points:** 8

---

#### VS-204: Upload Existing Material (Option 2)
**As a** teacher  
**I want** to upload my existing lesson materials  
**So that** AI can generate questions from my content

**Acceptance Criteria:**
- [ ] "Upload existing material" option on New Assessment page
- [ ] Accept file types: PDF, DOCX, TXT, MD (max 5MB)
- [ ] File uploads to temporary storage (auto-delete after 1 hour)
- [ ] OCR extracts text from PDF/images
- [ ] Text parsing identifies key concepts and objectives
- [ ] Extracted content pre-fills "Student Instructions" and generates initial questions
- [ ] Original file never stored permanently
- [ ] User sees confirmation: "Material processed. Review generated content below."

**Story Points:** 13

---

#### VS-205: Error Handling & Rate Limiting
**As a** developer  
**I want** graceful error handling for AI calls  
**So that** teachers aren't blocked by API failures

**Acceptance Criteria:**
- [ ] OpenAI API errors show user-friendly messages
- [ ] Rate limit errors: "AI service is busy. Please try again in 30 seconds."
- [ ] Timeout errors (>30s): "Generation taking longer than expected. Save draft and try again."
- [ ] Retry button appears for failed generations
- [ ] All AI calls have 30s timeout
- [ ] Failed generations don't lose teacher's input data

**Story Points:** 5

**Total Sprint 2 Points:** 47

---

## Sprint 3: Question Management & Rubrics
**Dates:** February 3-14, 2026  
**Goal:** Complete Step 3 (Questions) and Step 4 (Rubrics)

### User Stories

#### VS-301: Step 3 - Question Bank Display
**As a** teacher  
**I want** to see all my questions in a clear list  
**So that** I can review and organize them

**Acceptance Criteria:**
- [ ] Questions display as cards (not table rows)
- [ ] Each card shows:
  - Question number (1, 2, 3...)
  - Question type badge ("Open Synthesis")
  - Question text (truncated at 150 chars with "...")
  - Edit icon button
  - Delete icon button
- [ ] Cards have subtle border and hover effect
- [ ] "No questions yet" state shows helpful message
- [ ] "+ Add Question to Bank" button at bottom

**Story Points:** 5

---

#### VS-302: Question Editor Modal
**As a** teacher  
**I want** to edit questions in a focused view  
**So that** I'm not distracted by other UI

**Acceptance Criteria:**
- [ ] Modal overlays entire screen with dark backdrop
- [ ] Modal content centered, 600px wide
- [ ] Question text textarea (required, max 500 chars)
- [ ] Character count shows remaining characters
- [ ] Question type dropdown (for now: "Open Synthesis" only)
- [ ] "Save" button validates and closes modal
- [ ] "Cancel" button discards changes with confirmation if edited
- [ ] Escape key closes modal
- [ ] Click outside modal shows "Unsaved changes" warning

**Story Points:** 8

---

#### VS-303: Question Deletion with Confirmation
**As a** teacher  
**I want** confirmation before deleting questions  
**So that** I don't accidentally lose content

**Acceptance Criteria:**
- [ ] Delete button shows confirmation modal
- [ ] Modal text: "Delete this question? This cannot be undone."
- [ ] Two buttons: "Cancel" (grey) and "Delete" (red)
- [ ] Successful deletion removes card with fade-out animation
- [ ] Toast notification: "Question deleted"
- [ ] Can't delete if it's the only question (show error instead)

**Story Points:** 3

---

#### VS-304: Step 4 - Dual Scorer Rubrics
**As a** teacher  
**I want** to customize how AI evaluates responses  
**So that** scoring aligns with my priorities

**Acceptance Criteria:**
- [ ] Two scorer cards side-by-side:
  - "Scorer 1: Reasoning & Synthesis" (badge: AGENT ALPHA)
  - "Scorer 2: Evidence & Factual Accuracy" (badge: AGENT BETA)
- [ ] Each card has textarea for focus instructions
- [ ] Placeholder text provides examples of good instructions
- [ ] Character limit: 500 chars per scorer
- [ ] "Consensus Active" badge displays at top
- [ ] Instructions save to draft on blur

**Story Points:** 5

---

#### VS-305: Grading Scale Display
**As a** teacher  
**I want** to see the grading scale visually  
**So that** I understand how scores map to performance

**Acceptance Criteria:**
- [ ] 5 boxes displayed horizontally
- [ ] Each box shows:
  - Number (1-5)
  - Label (POOR, DEVELOPING, AVERAGE, PROFICIENT, ELITE)
- [ ] Boxes have gradient color (red → yellow → green)
- [ ] Hover shows tooltip with description (to be added later)
- [ ] For MVP, scale is fixed (not customizable)

**Story Points:** 3

---

#### VS-306: Finish & Publish Flow
**As a** teacher  
**I want** to finalize my assessment  
**So that** it's ready to assign to students

**Acceptance Criteria:**
- [ ] "Publish to Class" button enabled only on Step 4
- [ ] Button opens confirmation modal showing summary:
  - Title
  - Number of questions
  - Integrity shields enabled
  - Time limits
- [ ] Validation runs:
  - At least 1 question exists
  - Visual asset selected (if Step 2 was visited)
  - All required fields completed
- [ ] "Publish" changes status from DRAFT → ACTIVE
- [ ] Redirect to Assessments list page
- [ ] Success toast: "Assessment published! Ready to assign to students."

**Story Points:** 8

**Total Sprint 3 Points:** 32

---

## Sprint 4: Maine Standards Alignment (PhonemeLab)
**Dates:** February 17-28, 2026  
**Goal:** Add Maine Learning Results + WIDA alignment features to PhonemeLab

### User Stories

#### PL-401: Standards Tagging System
**As a** PhonemeLab admin  
**I want** to tag exercises with Maine Learning Results standards  
**So that** teachers can filter by standard

**Acceptance Criteria:**
- [ ] Admin interface to assign standards to exercises
- [ ] Maine Learning Results taxonomy in database:
  - 5 Cs (Communication, Cultures, Connections, Comparisons, Communities)
  - Proficiency levels (Novice Low → Advanced Low)
  - Performance indicators
- [ ] Each exercise can have multiple tags
- [ ] Tags stored in exercise metadata
- [ ] Teacher view shows which standard each exercise addresses

**Story Points:** 8

---

#### PL-402: WIDA Domain Alignment
**As a** PhonemeLab admin  
**I want** to tag exercises with WIDA domains  
**So that** ELL teachers can find relevant content

**Acceptance Criteria:**
- [ ] WIDA taxonomy in database:
  - 5 domains (Listening, Speaking, Reading, Writing, Language)
  - 6 proficiency levels (Entering → Reaching)
- [ ] Exercises tagged with domain + level
- [ ] Dual tagging: Same exercise can map to both Maine LR and WIDA
- [ ] Example: Visual Retell = "Communication: Interpretive" AND "Speaking Domain, Level 2-3"

**Story Points:** 5

---

#### PL-403: Student "Can-Do" Dashboard
**As a** student  
**I want** to see my progress in language I understand  
**So that** I know what I can do and what to work on

**Acceptance Criteria:**
- [ ] Student dashboard shows "I can..." statements from Maine Learning Results
- [ ] Statements filtered by current proficiency level
- [ ] Checkmarks appear when student completes relevant exercises
- [ ] Progress bar shows % of "Can-Do" statements achieved at current level
- [ ] Example: "✓ I can express my own preferences or feelings"
- [ ] Click statement to see which exercises help achieve it

**Story Points:** 8

---

#### PL-404: Teacher Standards-Based Reporting
**As a** teacher  
**I want** reports showing student progress against Maine standards  
**So that** I can document standards mastery for district

**Acceptance Criteria:**
- [ ] Teacher dashboard has "Standards Report" tab
- [ ] Report shows per-student:
  - Which Maine LR Performance Indicators achieved
  - WIDA proficiency level estimates (by domain)
  - Growth over time (proficiency level changes)
- [ ] Class-level summary: "85% of class meets Novice High Presentational"
- [ ] Export to CSV for district reporting
- [ ] Uses exact language from Maine Learning Results document

**Story Points:** 13

---

#### PL-405: Seal of Biliteracy Badge System
**As a** student  
**I want** to earn badges toward the Seal of Biliteracy  
**So that** I'm motivated to reach certification level

**Acceptance Criteria:**
- [ ] Badge system tracks progress toward Intermediate Mid/High
- [ ] Visual badge display on student profile
- [ ] Badges aligned to Seal requirements:
  - "Intermediate Low: Speaking"
  - "Intermediate Mid: Speaking"
  - "Intermediate High: Speaking" (Seal-ready)
- [ ] Teacher can print portfolio evidence for Seal application
- [ ] Info page explains Seal of Biliteracy and pathway

**Story Points:** 8

---

#### PL-406: Home Language Support (Multilingual UI)
**As an** ELL student  
**I want** instructions in my home language  
**So that** I understand what to do

**Acceptance Criteria:**
- [ ] Language selector in student settings: Somali, Arabic, Portuguese, Spanish, French, English
- [ ] Exercise instructions translate to selected language
- [ ] Audio instructions available in home language (text-to-speech)
- [ ] Navigation UI translates (buttons, labels, menus)
- [ ] Student can switch language mid-session
- [ ] Default language inherits from student profile (set by teacher)

**Story Points:** 13

**Total Sprint 4 Points:** 55

---

## Sprint 5: Title III Compliance Features
**Dates:** March 3-14, 2026  
**Goal:** Add features required for Title III federal funding eligibility

### User Stories

#### PL-501: Title III Progress Monitoring Export
**As a** district Title III coordinator  
**I want** standardized progress reports  
**So that** I can submit federal compliance documentation

**Acceptance Criteria:**
- [ ] Admin/Teacher can export "Title III Progress Report"
- [ ] Report includes required fields:
  - Student name/ID
  - Entry date and proficiency level
  - Current proficiency level by domain
  - Assessments completed
  - Growth rate (% improvement per month)
  - Intervention tier (if applicable)
- [ ] Export formats: PDF, CSV, Excel
- [ ] Report template matches federal Title III requirements
- [ ] Can filter by date range, student cohort, program

**Story Points:** 13

---

#### PL-502: Evidence-Based Research Documentation
**As a** district administrator  
**I want** research citations proving PhonemeLab is evidence-based  
**So that** I can justify Title III purchase

**Acceptance Criteria:**
- [ ] "Research" page on website with:
  - Peer-reviewed studies on oral assessment effectiveness
  - Meta-analysis citations (Nallaya et al. 2024)
  - UC San Diego, Carnegie Mellon studies
  - OECD policy alignment
- [ ] Downloadable PDF: "Evidence Base for PhonemeLab"
- [ ] ESSA Tier II/III evidence level claims (supported by citations)
- [ ] One-pager: "Title III Eligibility Brief"

**Story Points:** 5

---

#### PL-503: Family Engagement Reports (Multilingual)
**As a** parent  
**I want** progress reports in my home language  
**So that** I understand my child's learning

**Acceptance Criteria:**
- [ ] Parent report generates automatically monthly
- [ ] Report translates to student's home language
- [ ] Includes:
  - Proficiency level and growth
  - "Your child can now..." statements (translated)
  - Suggested home activities (translated)
  - Teacher contact info
- [ ] Email delivery or printable PDF
- [ ] Supports Somali, Arabic, Portuguese, Spanish, French

**Story Points:** 13

---

#### PL-504: WIDA Can-Do Descriptor Integration
**As a** teacher  
**I want** WIDA Can-Do descriptors shown alongside student work  
**So that** I can assess proficiency levels accurately

**Acceptance Criteria:**
- [ ] When reviewing student oral responses, sidebar shows relevant WIDA Can-Do descriptors
- [ ] Descriptors filter by domain (Speaking) and student's current level
- [ ] Example: "Can communicate basic needs" (Level 2)
- [ ] Teacher can click descriptor to mark as "demonstrated"
- [ ] Proficiency level estimates update based on demonstrated descriptors
- [ ] All descriptors sourced from official WIDA documents

**Story Points:** 8

---

#### PL-505: Data Privacy & FERPA Compliance
**As a** district privacy officer  
**I want** assurance that student data is protected  
**So that** we meet FERPA requirements

**Acceptance Criteria:**
- [ ] Privacy policy page updated with:
  - FERPA compliance statement
  - Data storage location (US-based servers)
  - Data retention policy (deleted after [X] months of inactivity)
  - Parent rights (access, deletion, export)
- [ ] Student audio deleted immediately after transcription (ephemeral processing)
- [ ] DPA (Data Processing Agreement) template available for districts
- [ ] SOC 2 compliance roadmap documented (even if not certified yet)

**Story Points:** 5

**Total Sprint 5 Points:** 44

---

## Sprint 6: Polish & Production Readiness
**Dates:** March 17-28, 2026  
**Goal:** Bug fixes, UX refinements, documentation, Maine market prep

### User Stories

#### VS-601: Mobile Responsive Design (Veritas)
**As a** teacher on mobile  
**I want** the wizard to work on my phone  
**So that** I can create assessments anywhere

**Acceptance Criteria:**
- [ ] Wizard layout stacks vertically on mobile (< 768px)
- [ ] Context panel moves to bottom on mobile
- [ ] Step navigation switches to dropdown on mobile
- [ ] All form inputs are touch-friendly (min 44px tap targets)
- [ ] Modal overlays work correctly on mobile
- [ ] Tested on iOS Safari and Android Chrome

**Story Points:** 8

---

#### VS-602: Keyboard Navigation & Accessibility
**As a** teacher using keyboard  
**I want** to navigate without mouse  
**So that** the tool is accessible

**Acceptance Criteria:**
- [ ] Tab order is logical through all steps
- [ ] All interactive elements keyboard-accessible
- [ ] Escape key closes modals
- [ ] Enter key submits forms
- [ ] Focus indicators visible on all controls
- [ ] Screen reader announces step changes
- [ ] WCAG 2.1 AA compliance validated

**Story Points:** 5

---

#### PL-603: Maine Alignment Documentation
**As a** Maine educator  
**I want** documentation showing standards alignment  
**So that** I can justify the purchase

**Acceptance Criteria:**
- [ ] PDF: "PhonemeLab Alignment to Maine Learning Results" (8-12 pages)
  - Table mapping features → Performance Indicators
  - 5 Cs coverage breakdown
  - Proficiency level progression
  - Seal of Biliteracy preparation pathway
- [ ] PDF: "PhonemeLab Alignment to WIDA ELD Standards" (6-8 pages)
  - Domain coverage (emphasis on Speaking)
  - Can-Do descriptor examples
  - Proficiency level scaffolding
- [ ] One-pager: "Title III Eligibility Brief"
  - Evidence-based research citations
  - Progress monitoring capabilities
  - Compliance requirements met
- [ ] All PDFs downloadable from website

**Story Points:** 13

---

#### PL-604: Landing Page Updates
**As a** Maine educator or ELL coordinator  
**I want** to immediately see Maine/Title III relevance  
**So that** I know this tool fits my needs

**Acceptance Criteria:**
- [ ] Homepage hero includes badges: "Maine Learning Results Aligned" + "Title III Eligible"
- [ ] New section: "For English Language Learners"
  - WIDA alignment mentioned
  - Multilingual support highlighted
  - Family engagement features
- [ ] New section: "For World Languages Programs"
  - 5 Cs framework alignment
  - Seal of Biliteracy preparation
- [ ] Testimonial quote from Maine pilot teacher (once available)
- [ ] CTA: "Request Maine Pilot Program"

**Story Points:** 5

---

#### GEN-605: User Onboarding Flow
**As a** new teacher  
**I want** guided setup  
**So that** I'm not confused on first login

**Acceptance Criteria:**
- [ ] First-time user sees welcome modal
- [ ] 4-step guided tour:
  - "Create your first class"
  - "Import or add students"
  - "Create your first assessment"
  - "Review student submissions"
- [ ] Tour can be skipped with "I'll explore on my own"
- [ ] Tour can be restarted from Help menu
- [ ] Tooltips highlight key features during first week of use

**Story Points:** 8

---

#### GEN-606: Help Documentation & Support
**As a** teacher  
**I want** easy access to help  
**So that** I'm not blocked by questions

**Acceptance Criteria:**
- [ ] Help icon (?) in top nav
- [ ] Help center with searchable articles:
  - Getting started guide
  - Creating assessments walkthrough
  - Understanding integrity shields
  - Interpreting student results
  - Maine standards alignment FAQ
  - Title III compliance FAQ
- [ ] Video tutorials for key workflows (5-10 mins each)
- [ ] Email support form (hello@edusynapse.org)
- [ ] Response time: < 24 hours for support emails

**Story Points:** 13

---

#### GEN-607: Performance Optimization
**As a** user  
**I want** fast page loads  
**So that** I'm not waiting

**Acceptance Criteria:**
- [ ] Initial page load < 2 seconds (measured on 3G connection)
- [ ] Image generation displays progress (not just spinner)
- [ ] Form auto-save doesn't cause lag
- [ ] Student assessment loading < 1 second
- [ ] Audio playback starts < 500ms
- [ ] Lazy load images below fold
- [ ] Bundle size < 300KB (gzipped)

**Story Points:** 8

**Total Sprint 6 Points:** 60

---

## Definition of Done

### For All User Stories

**Code Quality:**
- [ ] Code reviewed by at least one other developer
- [ ] No linting errors (ESLint + Prettier pass)
- [ ] TypeScript strict mode enabled, no `any` types
- [ ] Unit tests written for business logic (>80% coverage)
- [ ] Integration tests for critical paths

**Functionality:**
- [ ] All acceptance criteria met
- [ ] Tested in Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Mobile tested on iOS Safari and Android Chrome
- [ ] No console errors or warnings
- [ ] Error handling covers edge cases

**UX/Design:**
- [ ] Matches design system (colors, typography, spacing)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Loading states implemented for async operations
- [ ] Success/error toast notifications where appropriate
- [ ] Keyboard navigation works
- [ ] Focus states visible

**Performance:**
- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices)
- [ ] No memory leaks (tested in Chrome DevTools)
- [ ] API calls optimized (no N+1 queries)
- [ ] Images optimized and lazy-loaded

**Documentation:**
- [ ] README updated if new setup required
- [ ] API endpoints documented if added
- [ ] Component props documented (Storybook or JSDoc)
- [ ] User-facing changes added to changelog

**Deployment:**
- [ ] Feature flagged if not ready for all users
- [ ] Deployed to staging environment
- [ ] QA tested by product owner
- [ ] Merged to main branch
- [ ] Deployed to production

---

## Technical Dependencies

### Infrastructure

**Required for Sprint 1:**
- [ ] Vercel project configured for Veritas subdomain
- [ ] Database schema migrations for assessment drafts
- [ ] Authentication working on new domain

**Required for Sprint 2:**
- [ ] OpenAI API key with GPT-4o access
- [ ] DALL-E 3 API access enabled
- [ ] Rate limiting configured (avoid costs spiraling)
- [ ] File upload S3 bucket or equivalent
- [ ] OCR service (Textract or open-source alternative)

**Required for Sprint 4:**
- [ ] Maine Learning Results taxonomy data in database
- [ ] WIDA standards taxonomy in database
- [ ] Translation API (Google Translate or DeepL) for multilingual UI

**Required for Sprint 5:**
- [ ] Email service configured (SendGrid, Postmark, or similar)
- [ ] PDF generation library (Puppeteer or similar)
- [ ] Excel export library (xlsx.js)

### External APIs

| API | Purpose | Rate Limits | Cost Estimate |
|-----|---------|-------------|---------------|
| OpenAI GPT-4o | Assessment generation, question creation | 10K RPM | $15/1M tokens (~$0.015/assessment) |
| OpenAI DALL-E 3 | Visual asset generation | 5 images/min | $0.04/image |
| Google Translate | Multilingual UI | 500K chars/month free | $20/1M chars after |
| Whisper API | Audio transcription (existing) | 50 RPM | $0.006/minute |

**Estimated API costs for 100 assessments created:**
- GPT-4o: 100 × $0.015 = $1.50
- DALL-E 3: 100 × $0.04 = $4.00
- **Total: $5.50 for 100 assessments**

---

## Risk Management

### High-Risk Items

**Risk 1: AI Generation Quality**
- **Probability:** Medium  
- **Impact:** High (unusable questions = product failure)
- **Mitigation:** 
  - Build extensive prompt testing
  - Allow teacher editing of all AI output
  - Have human-written examples as fallback

**Risk 2: DALL-E 3 Rate Limits**
- **Probability:** Medium  
- **Impact:** Medium (teachers blocked from creating assessments)
- **Mitigation:**
  - Queue system for image generation
  - Pre-generate common use case images
  - Allow upload of own images as alternative

**Risk 3: Maine Standards Documentation Accuracy**
- **Probability:** Low  
- **Impact:** High (lose credibility with educators)
- **Mitigation:**
  - Have Maine educator review alignment docs
  - Cross-reference official Maine DOE documents
  - Get legal review before claiming "compliance"

**Risk 4: Scope Creep**
- **Probability:** High  
- **Impact:** High (miss launch deadlines)
- **Mitigation:**
  - Strict adherence to sprint plan
  - Feature flags for "nice to have" items
  - Defer non-critical features to Q2

---

## Success Metrics (Post-Launch)

### Veritas Assess
- **Adoption:** 20+ assessments created by March 31
- **Completion Rate:** >80% of started assessments get published
- **Time to Create:** Average <15 minutes from start to publish
- **User Satisfaction:** NPS >50 from beta testers

### PhonemeLab (Maine Focus)
- **Maine Pilots:** 3+ districts agree to pilot by March 31
- **Standards Docs:** Downloaded >50 times by educators
- **Inquiries:** 10+ schools request demos after seeing alignment
- **Approval:** Listed on Maine DOE resources page by April 15

### Technical Health
- **Uptime:** >99.5% availability
- **Error Rate:** <1% of API calls fail
- **Support Load:** <2 tickets per week during beta
- **Performance:** P95 page load <3 seconds

---

## Post-Sprint Retrospective Template

**What went well:**
- [Team fills in after each sprint]

**What could improve:**
- [Team fills in after each sprint]

**Action items:**
- [Team fills in after each sprint]

**Velocity:**
- Planned points: [X]
- Completed points: [Y]
- Completion rate: [Y/X]%

---

## Notes for Development Team

**Priorities if timeline slips:**

1. **Must Have (Launch Blockers):**
   - Veritas Wizard Steps 1-4 functional
   - Basic AI generation working
   - Mobile responsive
   - No critical bugs

2. **Should Have (Defer to Sprint 7):**
   - Upload existing material
   - Advanced error handling
   - Extensive help docs

3. **Nice to Have (Defer to Q2):**
   - Keyboard shortcuts
   - Onboarding tour
   - Video tutorials

**Communication:**
- Daily standups: 9am (15 min max)
- Sprint planning: First Monday of sprint (2 hours)
- Sprint review: Last Friday of sprint (1 hour)
- Retrospective: Last Friday of sprint (1 hour)
- Slack channel: #dev-veritas, #dev-phonemelab

**Code Repository:**
- Branch naming: `feature/VS-XXX-description` or `feature/PL-XXX-description`
- PRs require 1 approval before merge
- Main branch protected, auto-deploys to production
- Staging branch auto-deploys to staging

---

**Document Version:** 1.0  
**Last Updated:** December 19, 2025  
**Next Review:** January 5, 2026 (after Sprint 1 completion)
