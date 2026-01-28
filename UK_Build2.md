# User Story: UK National Curriculum Integration for SayVeritas Assessment Builder

## Epic
**As a UK teacher**, I want SayVeritas to understand and align with the UK National Curriculum and oracy frameworks, so that I can create assessments that meet statutory requirements, prove curriculum coverage, and generate evidence for moderation/Ofsted.

---

## User Stories (Prioritized)

### **MUST HAVE (Sprint 1 - MVP)**

#### US-1: Key Stage Selection with UK Context
**As a UK teacher**  
I want to select the appropriate Key Stage when creating an assessment  
So that the platform understands the age/year group I'm teaching and provides age-appropriate defaults

**Acceptance Criteria:**
- When I reach "General Info" step, I see a new section called "UK Oracy Settings"
- I can select from: KS1 (Years 1-2), KS2 (Years 3-6), KS3 (Years 7-9), KS4 (Years 10-11), KS5 (Years 12-13)
- Each option displays ages (e.g., "KS2 - Years 3-6, Ages 7-11")
- Selection is saved with the assessment
- This selection influences future steps (e.g., vocabulary complexity, scaffolding defaults)

**Technical Notes:**
- Add `key_stage` field to assessment model
- UI placement: Already visible in Screenshot 4 - keep this design
- Default: No selection (teacher must choose)

---

#### US-2: Voice21 Oracy Framework Integration
**As a UK teacher**  
I want to tag my assessment with relevant Voice21 Oracy Framework strands  
So that I can demonstrate oracy skill development across the four dimensions

**Acceptance Criteria:**
- After selecting Key Stage, I see "Oracy Focus Strands (Select 1-4 strands to assess)"
- Four options displayed:
  - **Physical** (Voice and body language skills)
  - **Linguistic** (Vocabulary, language, and rhetorical techniques)
  - **Cognitive** (Content, structure, reasoning, and self-regulation)
  - **Social & Emotional** (Working with others, listening, confidence, and audience awareness)
- I can select 1-4 strands (multi-select)
- Each strand shows brief description (as in Screenshot 4)
- Selection is saved and visible in assessment metadata

**Technical Notes:**
- Add `oracy_strands` JSON field to assessment model (array of selected strands)
- UI: Already designed in Screenshot 4 - implement as shown
- Validation: At least 1 strand must be selected

---

#### US-3: National Curriculum Subject & Domain Tagging
**As a UK teacher**  
I want to tag my assessment with the relevant NC subject and domain  
So that I can track curriculum coverage and prove alignment to statutory requirements

**Acceptance Criteria:**
- In "General Info" step, I see new field: "National Curriculum Subject"
- Dropdown options for Phase 1 (MVP):
  - English: Reading
  - English: Writing
  - English: Speaking & Listening
  - Mathematics: Number
  - Mathematics: Geometry
  - Science: Biology
  - Science: Chemistry
  - Science: Physics
  - History
  - Geography
- Selection is saved and visible in assessment metadata
- (Future: This will influence suggested questions and rubrics)

**Technical Notes:**
- Add `nc_subject` field to assessment model
- Store as: `{subject: "English", domain: "Reading"}` JSON
- UI: New dropdown after Oracy Strands section
- Phase 1: Manual selection only (no AI suggestions yet)

---

#### US-4: Activity Context Selection
**As a UK teacher**  
I want to specify the activity context for the oral assessment  
So that scaffolding and rubrics match the pedagogical situation

**Acceptance Criteria:**
- In "General Info" step, I see "Activity Context" dropdown
- Options:
  - Lesson Activity
  - Homework Task
  - Formative Check-in
  - Summative Assessment
  - Portfolio Evidence
- Selection influences default settings:
  - "Lesson Activity" → Heavy scaffolding default
  - "Summative Assessment" → Minimal scaffolding, integrity shields on
- Selection is saved with assessment

**Technical Notes:**
- Add `activity_context` field to assessment model
- UI: Already visible in Screenshot 4 - implement dropdown
- Hook to existing scaffolding system (US-5)

---

#### US-5: UK-Aligned Scaffolding Levels
**As a UK teacher**  
I want scaffolding options that match UK pedagogy  
So that I can differentiate for SEND/EAL students using familiar terminology

**Acceptance Criteria:**
- Existing "Scaffold Level" section renamed to match UK practice
- Three options:
  - **Heavy (sentence stems)** - "Provides sentence starters and structured prompts"
  - **Light (prompts only)** - "Gentle guidance without explicit structures"
  - **None (independent)** - "Fully independent response"
- Default selection based on:
  - KS1/KS2 + Lesson Activity → Heavy
  - KS3/KS4 + Summative → None
  - Other combinations → Light
- Existing scaffolding functionality remains (no change to how it works, just labeling)

**Technical Notes:**
- No backend change needed (scaffolding already exists)
- UI update: Clarify descriptions for UK audience
- Already implemented in Screenshot 4 - verify labels match UK pedagogy

---

### **SHOULD HAVE (Sprint 2 - Enhanced Value)**

#### US-6: Year Group Specification
**As a UK teacher**  
I want to specify the exact year group (not just Key Stage)  
So that rubrics and suggested content match specific NC expectations

**Acceptance Criteria:**
- After selecting Key Stage, I see "Year Group" dropdown
- Options populate based on Key Stage:
  - KS1 → Year 1, Year 2
  - KS2 → Year 3, Year 4, Year 5, Year 6
  - KS3 → Year 7, Year 8, Year 9
  - KS4 → Year 10, Year 11
  - KS5 → Year 12, Year 13
- Selection is saved
- (Future: Will influence question generation and rubric language)

**Technical Notes:**
- Add `year_group` field to assessment model (integer 1-13)
- UI: New dropdown under Key Stage selection
- Validation: Must match selected Key Stage

---

#### US-7: UK Curriculum Coverage Report
**As a UK teacher**  
I want to see which NC objectives/oracy strands I've assessed across multiple assessments  
So that I can prove curriculum coverage to SLT/Ofsted

**Acceptance Criteria:**
- New "Coverage Report" page in teacher dashboard
- Shows:
  - NC Subject breakdown (% of assessments by subject)
  - Oracy Strand breakdown (% coverage of Physical/Linguistic/Cognitive/Social-Emotional)
  - Key Stage distribution
- Exportable as PDF/CSV
- Filterable by date range, class, Key Stage

**Technical Notes:**
- New report page (not part of assessment builder)
- Query existing assessment metadata
- Simple bar charts (use existing chart library)

---

#### US-8: Oracy Progression Framework Rubrics
**As a UK teacher**  
I want rubrics that reflect Voice21's Oracy Progression Framework  
So that my scoring aligns with recognized UK standards for oracy development

**Acceptance Criteria:**
- In "Rubrics" step (Step 5), I see option: "Use Voice21 Oracy Framework"
- When selected, rubric criteria auto-populate based on selected strands:
  - Physical strand → "Uses appropriate volume, pace, and tone"
  - Linguistic strand → "Uses subject-specific vocabulary accurately"
  - Cognitive strand → "Structures response with clear reasoning"
  - Social & Emotional strand → "Demonstrates confidence and audience awareness"
- Each criterion has 4-5 levels (Emerging → Developing → Secure → Advanced)
- Teacher can still customize after generation
- Standard "Reasoning" and "Evidence" rubrics remain as fallback

**Technical Notes:**
- Add Voice21 rubric templates to database
- Map oracy_strands selection → template rubrics
- Generate in addition to (not replacing) existing dual rubric
- UI: New toggle in Rubrics step - "Use Voice21 Framework ✓"

---

### **COULD HAVE (Sprint 3 - Advanced Features)**

#### US-9: GCSE Assessment Objective Tagging (KS4 only)
**As a UK secondary teacher**  
I want to tag KS4 assessments with relevant GCSE Assessment Objectives  
So that I can track student progress against exam board requirements

**Acceptance Criteria:**
- Only visible when KS4 selected
- New field: "Exam Board" (dropdown: AQA, Edexcel, OCR, Eduqas, Other)
- New field: "Assessment Objectives" (multi-select)
- Options populate based on subject:
  - English Language: AO1 (Identify/Interpret), AO2 (Language/Structure), AO3 (Compare), AO4 (Evaluate), AO5 (Content/Organization), AO6 (Vocabulary/Sentence)
  - English Literature: AO1 (Respond), AO2 (Language/Structure/Form), AO3 (Context), AO4 (Spelling/Punctuation)
- Selection saved as metadata
- (Future: Influences rubric generation and progress tracking)

**Technical Notes:**
- Add `exam_board` and `assessment_objectives` fields
- Conditional render (only KS4)
- Phase 1: Tagging only (no rubric generation yet)
- Requires GCSE AO reference data

---

#### US-10: Statutory Spelling Word Bank (KS2 English)
**As a UK primary teacher**  
I want to generate spelling assessments using NC Appendix 1 statutory words  
So that my assessments align with required spelling lists

**Acceptance Criteria:**
- Only available when:
  - Key Stage = KS2 AND
  - Subject = English: Writing OR English: Speaking & Listening
- New "Generate with AI" option: "Use NC Statutory Spelling Words"
- AI generates questions incorporating words from:
  - Year 3/4 list (if Y3 or Y4 selected)
  - Year 5/6 list (if Y5 or Y6 selected)
- Teacher can specify number of words (5, 10, 15, 20)
- Generated question example: "Spell and use in a sentence: accommodate"

**Technical Notes:**
- Requires NC Appendix 1 word list database (200 words total)
- Add `word_list_source` field to track which words used
- Integration with existing AI question generation
- Medium complexity: Requires curriculum data ingestion

---

#### US-11: Teacher Assessment Framework (TAF) Rubric Generation
**As a UK primary teacher**  
I want rubrics generated using TAF "can-do" statements  
So that my assessments provide moderation-ready evidence

**Acceptance Criteria:**
- Only available for KS1/KS2
- In Rubrics step, new option: "Generate from Teacher Assessment Framework"
- Requires: Year Group + NC Subject already selected
- AI generates rubric using TAF-specific language:
  - Example Y6 Writing: "Uses passive voice appropriately to affect presentation of information"
  - Example Y5 Reading: "Can summarise main ideas drawn from more than one paragraph, identifying key details"
- Each criterion has 3 levels: Working Towards / Expected Standard / Greater Depth
- Teacher can customize after generation

**Technical Notes:**
- Requires TAF framework database (major data ingestion)
- Map Year Group + NC Subject → TAF strands
- Complex: TAF criteria are detailed and specific
- Consider Phase 2/3 feature (significant lift)

---

### **WON'T HAVE (Future / Out of Scope)**

#### US-12: Automatic NC Objective Code Assignment
- AI automatically assigns NC objective codes (e.g., "Y5 Reading - 2a")
- **Why not now:** Requires complete NC database + complex mapping logic
- **Future:** Phase 3 after pilot feedback

#### US-13: Multi-Subject Cross-Curricular Tagging
- Tag assessments with multiple subjects (e.g., History + English)
- **Why not now:** Adds complexity, unclear demand
- **Future:** Based on pilot school requests

#### US-14: Ofsted Evidence Generator
- Auto-generate Ofsted-ready evidence summaries
- **Why not now:** Requires understanding of current Ofsted framework + legal review
- **Future:** Phase 3, potentially premium feature

---

## Sprint Planning

### **Sprint 1: MVP - UK Foundation (3 weeks)**
**Goal:** Make SayVeritas UK-aware with minimal viable curriculum integration

**Included:**
- US-1: Key Stage Selection
- US-2: Voice21 Oracy Framework strands
- US-3: NC Subject & Domain tagging
- US-4: Activity Context selection
- US-5: UK-aligned scaffolding labels

**Sprint Goal Metric:**
- UK teacher can create an assessment tagged with Key Stage, Oracy strands, and NC subject
- Assessment metadata includes UK-specific fields
- No breaking changes to existing US/international workflow

**Capacity:** 1 full-stack developer, 3 weeks

---

### **Sprint 2: Enhanced UK Value (2 weeks)**
**Goal:** Provide differentiated value for UK teachers beyond basic tagging

**Included:**
- US-6: Year Group specification
- US-7: UK Coverage Report
- US-8: Voice21 rubric generation

**Sprint Goal Metric:**
- UK teacher can generate Voice21-aligned rubrics
- Teacher can export curriculum coverage report
- Pilot schools report "this saves me 30+ minutes per assessment"

**Capacity:** 1 full-stack developer, 2 weeks

---

### **Sprint 3: Advanced UK Features (3-4 weeks)**
**Goal:** Secondary school support + statutory compliance features

**Included:**
- US-9: GCSE AO tagging (KS4)
- US-10: Statutory spelling word bank (KS2)
- US-11: TAF rubric generation (if data ready)

**Sprint Goal Metric:**
- KS4 teacher can tag with AQA/Edexcel AOs
- KS2 teacher can generate spelling assessments from statutory lists
- Pilot schools report "this proves curriculum compliance"

**Capacity:** 1 full-stack developer + 0.5 data engineer (for curriculum ingestion), 3-4 weeks

**Note:** US-11 (TAF rubrics) may slip to Phase 2 depending on data availability

---

## Definition of Done (DoD)

### Code Complete
- [ ] Feature code written and peer-reviewed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] No critical or high-priority bugs
- [ ] Code merged to main branch

### Functionality
- [ ] All acceptance criteria met for user story
- [ ] Feature works on Chrome, Safari, Firefox (latest versions)
- [ ] Mobile responsive (iOS Safari, Chrome)
- [ ] Keyboard accessible (tab navigation works)
- [ ] Error states handled gracefully

### Data & Backend
- [ ] Database migrations run successfully
- [ ] Data validation in place (server-side)
- [ ] API endpoints documented
- [ ] Backwards compatible with existing assessments
- [ ] Rollback plan documented

### UX & Design
- [ ] Matches design mockups (or approved deviations documented)
- [ ] UK terminology consistent throughout
- [ ] Help text/tooltips added where needed
- [ ] Loading states implemented
- [ ] Success/error messages clear and actionable

### Documentation
- [ ] User documentation updated (if customer-facing)
- [ ] Technical documentation updated
- [ ] Changelog entry created
- [ ] Known limitations documented

### Testing
- [ ] Tested with pilot school teacher (if available)
- [ ] Edge cases tested (empty states, max limits, invalid inputs)
- [ ] Cross-browser testing complete
- [ ] Performance acceptable (<3s page load, <5s for AI generation)

### Deployment
- [ ] Feature flag created (if phased rollout)
- [ ] Deployed to staging environment
- [ ] Smoke tests passed on staging
- [ ] Monitoring/logging in place
- [ ] Rollback tested

### Sign-off
- [ ] Product owner reviewed and approved
- [ ] UK pilot teacher reviewed (if Sprint 1)
- [ ] Technical lead reviewed
- [ ] Ready for production deployment

---

## Dependencies & Risks

### Technical Dependencies
- **Voice21 Framework reference data** → Required for US-2, US-8
  - Mitigation: Use publicly available framework (already documented)
- **NC subject/domain taxonomy** → Required for US-3
  - Mitigation: Start with manual list, expand over time
- **Statutory word lists (Appendix 1)** → Required for US-10
  - Mitigation: Defer to Sprint 3, manual data entry acceptable for MVP
- **TAF framework criteria** → Required for US-11
  - Mitigation: Defer to Sprint 3 or Phase 2, significant data work

### UX Dependencies
- **No breaking changes to existing flow** → Critical
  - Mitigation: UK fields are additive, not replacing existing fields
- **Clear UK vs. international toggling** → Important for US market
  - Mitigation: UK fields only appear if region=UK (detect or teacher selects)

### Business Risks
- **Feature bloat** → Risk of overwhelming non-UK teachers
  - Mitigation: Geo-detection or explicit "Use UK Curriculum" toggle
- **Data accuracy** → Risk of incorrect NC/TAF mappings
  - Mitigation: Start with manual curation, pilot school validation
- **Maintenance burden** → NC updates, exam board changes
  - Mitigation: Version curriculum data, document update process

---

## Success Criteria (Post-Sprint)

### Sprint 1 Success:
- [ ] 2-3 UK pilot teachers successfully create assessments with UK tagging
- [ ] Zero regression bugs in existing (non-UK) assessment flow
- [ ] UK teachers report: "SayVeritas now speaks my language"

### Sprint 2 Success:
- [ ] UK teachers use Voice21 rubrics in 50%+ of new assessments
- [ ] Coverage report exported by 3+ pilot schools
- [ ] Feedback: "This saves me 30+ minutes compared to manual rubric creation"

### Sprint 3 Success:
- [ ] KS4 teachers tag 80%+ assessments with GCSE AOs
- [ ] KS2 teachers generate statutory word assessments
- [ ] Feedback: "This proves curriculum compliance for Ofsted"

---

## Open Questions for Development Team

1. **Geo-detection vs. explicit toggle?**
   - Auto-detect UK region and show UK fields? OR
   - Explicit "Use UK Curriculum" checkbox in settings?
   - **Recommendation:** Explicit toggle (teacher control, less magic)

2. **How to handle mixed UK/US schools?**
   - Some international schools use UK curriculum but are based elsewhere
   - **Recommendation:** School-level setting: "Curriculum Region: UK / US / International"

3. **Data storage for curriculum metadata?**
   - Separate microservice? Embedded in main DB?
   - **Recommendation:** JSON fields in assessment model for Sprint 1, extract to curriculum service in Phase 2

4. **Voice21 licensing?**
   - Do we need permission to use Voice21 framework in commercial product?
   - **Action:** Founder to confirm (Eric has school relationships, may have access)

5. **TAF rubric generation - AI or templates?**
   - Generate from TAF data dynamically OR pre-build template rubrics?
   - **Recommendation:** Templates for Sprint 3 (more reliable), AI enhancement in Phase 2

---

## Handoff Checklist

- [ ] User stories reviewed with development team
- [ ] Design mockups finalized (Sprint 1 - use Screenshot 4 as reference)
- [ ] Voice21 framework reference data provided to dev team
- [ ] NC subject list finalized and provided
- [ ] Database schema changes approved
- [ ] Sprint 1 kickoff scheduled
- [ ] UK pilot school(s) confirmed for user testing
- [ ] Weekly check-in cadence established (recommend: Tuesday standups)

---

UPDATES

# Updated Sprint Plan: UK-Specific Implementation

## CRITICAL UPDATES Based on New Information

### Infrastructure Changes

**Domain Strategy:**
- ✅ `sayveritas.co.uk` → UK-specific instance
- ✅ `sayveritas.com` → US-centric instance
- ✅ Cookie-based geo-detection redirects UK users to .co.uk
- ✅ Manual toggle available on .com for UK teachers who land there

**Licensing Compliance:**
- ✅ Oracy Framework = CC BY-NC-SA 4.0 (Cambridge University/Oracy Cambridge + School 21)
- ✅ Requires: Attribution, Non-Commercial use, Share-Alike
- ✅ No licensing fees required
- ✅ Must credit "Oracy Cambridge, University of Cambridge & Voice 21"

---

## REVISED User Stories (Sprint 1)

### **NEW US-0: UK Platform Detection & Routing**

**As a UK teacher**  
I want to be automatically directed to the UK version of SayVeritas  
So that I see relevant curriculum options without manual configuration

**Acceptance Criteria:**
- Cookie detects user location on first visit
- UK users (detected via IP geolocation) automatically redirected to `sayveritas.co.uk`
- Small dialog button on `sayveritas.com` reads: "🇬🇧 Teaching in the UK? Switch to UK version"
- Clicking dialog redirects to `sayveritas.co.uk` and sets persistent cookie
- Once on .co.uk, all UK-specific features are default-enabled
- User can manually switch back via footer link: "Switch to US version"

**Technical Notes:**
- Use existing cookie detection (already implemented)
- Add dialog component to .com homepage/nav
- .co.uk subdomain routes to same codebase, different config
- Environment variable: `REGION=UK` for .co.uk deployment
- All UK user stories below assume `.co.uk` context

**DoD Addition:**
- [ ] Geo-redirect tested from UK IP (use VPN)
- [ ] Manual switch dialog tested from US IP
- [ ] Cookie persistence verified (survives session)
- [ ] No GDPR issues (location detection only, no PII stored)

---

### **UPDATED US-1: Key Stage Selection (UK Only)**

**As a UK teacher on sayveritas.co.uk**  
I want to see UK Key Stages instead of US grade levels  
So that I can create assessments aligned with my teaching context

**Acceptance Criteria:**
- On .co.uk, "General Info" step shows "UK Oracy Settings" (not "Grade Level")
- Options: KS1, KS2, KS3, KS4, KS5 (with years/ages as in Screenshot 4)
- On .com, this section doesn't appear (shows US grade levels instead)
- Selection saved with `region: "UK"` flag in assessment metadata

**Technical Notes:**
- Conditional render based on `REGION` env var
- No code duplication—same component, different data source
- US teachers never see KS options (even if they manually visit .co.uk)

---

### **UPDATED US-2: Oracy Framework Integration with Attribution**

**As a UK teacher**  
I want to use the Cambridge/Voice21 Oracy Framework  
So that my assessments align with recognized UK standards

**Acceptance Criteria:**
- Four strands displayed exactly as Screenshot 4 (Physical, Linguistic, Cognitive, Social & Emotional)
- Attribution text below strands:
  - _"Based on the Oracy Skills Framework developed by Oracy Cambridge (University of Cambridge) and Voice 21. Licensed under CC BY-NC-SA 4.0."_
- Clicking attribution opens modal with:
  - Full license text
  - Link to [Oracy Cambridge](https://oracycambridge.org/)
  - Link to [Voice 21](https://voice21.org/)
- Multi-select 1-4 strands (as designed)
- Saved as `oracy_strands: ["Physical", "Linguistic"]` array

**Technical Notes:**
- Add `attribution_modal` component
- Footer attribution on every assessment tagged with oracy strands
- License compliance: Non-commercial ✓ (educational use), Attribution ✓, Share-Alike ✓
- No modifications to framework definitions (use verbatim from source)

**Legal DoD:**
- [ ] Attribution text reviewed by founder
- [ ] License link points to official CC BY-NC-SA 4.0 deed
- [ ] Share-alike implications documented (if we create derivative rubrics, must also be CC)

---

### **UPDATED US-3: UK National Curriculum Subject Tagging**

**Technical Change:**
- Same functionality as before, but now only visible on `.co.uk`
- On `.com`, shows US subject taxonomy instead (e.g., "ELA Grade 5", "Algebra I")

**New Field:**
- Add `curriculum_region: "UK" | "US"` to assessment model
- Determines which subject lists populate

---

### **NEW US-13: Cross-Platform Assessment Sharing**

**As a UK teacher**  
I want to share assessments with US colleagues (or vice versa)  
So that we can collaborate internationally

**Acceptance Criteria:**
- UK assessment created on .co.uk can be imported to .com via share code
- Import wizard shows:
  - ⚠️ "This assessment was created for UK curriculum (KS3, Oracy Strands: Physical, Cognitive)"
  - Option to: "Convert to US format" OR "Keep UK metadata"
- If "Convert," system maps:
  - KS3 → Grades 7-9
  - Oracy strands → Generic "Communication Skills" tag
  - NC Subject → Closest US subject
- If "Keep," UK metadata preserved but grayed out (view-only)

**Technical Notes:**
- Cross-region assessment sharing is optional (can be deferred to Sprint 2)
- Requires assessment export/import feature (may already exist?)
- Mapping table: KS → US Grades

**Priority:** COULD HAVE (Sprint 2)

---

## Updated Sprint 1 Scope

### **Sprint 1: UK Foundation (2.5 weeks)**

**Included:**
- US-0: UK platform detection & routing (.co.uk setup)
- US-1: Key Stage selection (UK only)
- US-2: Oracy Framework with Cambridge attribution
- US-3: NC Subject tagging (UK subject list)
- US-4: Activity Context (UK pedagogical terms)
- US-5: Scaffolding labels (UK terminology)

**Excluded from Sprint 1:**
- Year Group specification (defer to Sprint 2 - KS is sufficient for MVP)
- Coverage reporting (defer to Sprint 2)
- Voice21 rubric generation (defer to Sprint 2)

**Sprint Goal:**
> UK teacher on sayveritas.co.uk can create an assessment with Key Stage, Oracy Framework strands, and NC subject tagging—with full legal compliance for Oracy Framework use.

**Capacity:** 1 full-stack developer, 2.5 weeks

---

## Updated Definition of Done (Sprint 1)

### Infrastructure
- [ ] `.co.uk` subdomain deployed and functional
- [ ] Geo-detection cookie working (tested from UK/US IPs)
- [ ] Manual switch dialog implemented on `.com`
- [ ] Environment variable `REGION=UK` configured for .co.uk
- [ ] No breaking changes to `.com` (US workflow unchanged)

### Legal Compliance
- [ ] Oracy Framework attribution displayed correctly
- [ ] CC BY-NC-SA 4.0 license linked and explained
- [ ] No modifications to original framework definitions
- [ ] "Non-commercial educational use" confirmed in ToS
- [ ] Share-alike implications documented for future derivative works

### Functionality (UK-specific)
- [ ] All US-1 through US-5 acceptance criteria met
- [ ] UK teacher can complete full assessment creation flow on .co.uk
- [ ] Assessment metadata includes: `region: "UK"`, `key_stage`, `oracy_strands`, `nc_subject`
- [ ] No UI references to "grades" or US terminology on .co.uk

### Cross-Browser & Accessibility
- [ ] Geo-redirect works on Chrome, Safari, Firefox
- [ ] Manual switch dialog keyboard-accessible
- [ ] Attribution modal screen-reader friendly
- [ ] Mobile-responsive on iOS/Android

### Documentation
- [ ] README updated with UK deployment instructions
- [ ] Attribution requirements documented for developers
- [ ] UK subject taxonomy list documented
- [ ] Oracy Framework source files linked in repo

---

## Open Questions (RESOLVED)

1. ✅ **Geo-detection vs. explicit toggle?**
   - RESOLVED: Cookie-based geo-detection with manual fallback dialog

2. ✅ **Voice21 licensing?**
   - RESOLVED: CC BY-NC-SA 4.0, attribution required, no fees, share-alike applies

3. **NEW: Do we need separate databases for .com and .co.uk?**
   - **Recommendation:** Shared database, `region` flag differentiates
   - Allows cross-platform sharing (future feature)
   - Simpler infrastructure (one DB to maintain)
   - Data isolation via query filters (e.g., `WHERE region = 'UK'`)

4. **NEW: What if a UK teacher creates assessment on .com before redirect?**
   - **Recommendation:** Allow retroactive region tagging
   - Add "Convert to UK" button in assessment settings
   - Prompts to add Key Stage, Oracy strands, NC subject

5. **NEW: How to handle "non-commercial" in CC license with SaaS pricing?**
   - **Legal nuance:** "Non-commercial" in CC BY-NC-SA means derivatives can't be sold, but using framework in a commercial tool for educational purposes is typically fine
   - **Action required:** Founder should confirm with legal review OR email Oracy Cambridge for written permission
   - **Safest approach:** Email template:
     > "We're building SayVeritas, a paid SaaS platform for UK teachers. We'd like to integrate the Oracy Skills Framework with full attribution. Is this use acceptable under CC BY-NC-SA 4.0 for a commercial educational tool?"
   - **Interim:** Proceed with attribution, monitor for any cease-and-desist

---

## Handoff Updates

### Additional Files Needed
- [ ] Oracy Framework PDF/documentation from Cambridge (for reference)
- [ ] UK National Curriculum subject list (confirmed version)
- [ ] Voice21/School 21 brand assets (if using logos in attribution)

### Design Updates
- [ ] Dialog button mockup for "Switch to UK version"
- [ ] Attribution modal design (license text + links)
- [ ] .co.uk homepage hero copy (UK-specific value prop)

### Testing Requirements
- [ ] VPN access for UK IP testing
- [ ] Test accounts on both .com and .co.uk
- [ ] UK pilot teacher for UAT (can you provide contact?)

---

## Risk Mitigation: Legal

**Risk:** Misinterpretation of CC BY-NC-SA "non-commercial" clause

**Mitigation Plan:**
1. **Immediate:** Add attribution as specified (compliant with BY and SA)
2. **Week 1:** Founder emails Oracy Cambridge requesting clarification
3. **Week 2:** If no response, email Voice 21 directly
4. **Worst case:** Remove framework integration, use generic "speaking skills" categories
5. **Best case:** Receive written permission, add to legal docs folder

**Likelihood:** Low risk (educational SaaS typically fine under academic licenses)  
**Impact:** Medium (would require rework if forced to remove)  
**Contingency:** 1 week buffer in Sprint 1 to pivot if needed

---

## Success Metrics (Revised)

### Sprint 1 Success:
- [ ] UK teacher lands on .co.uk automatically (95%+ success rate from UK IPs)
- [ ] Zero UK teachers report seeing US grade levels
- [ ] Attribution modal viewed by 50%+ of UK teachers (indicates awareness)
- [ ] Zero legal complaints from Cambridge/Voice21 (monitored via support inbox)
- [ ] 2-3 UK pilot schools successfully create assessments with oracy tagging

---

UPDATES 2

# REVISED Sprint Plan: UK National Curriculum Only (Voice21 Deferred)

## Strategic Decision: RIGHT CALL ✓

**Your instinct is correct.** Here's why:

### Risk Assessment: Voice21 Integration
- ❌ **Legal ambiguity:** T&Cs require "approval and support" (vague, could mean licensing fees)
- ❌ **Time risk:** Waiting for approval delays launch
- ❌ **Negotiation leverage:** Zero pilots = weak negotiating position
- ❌ **Dependency:** Can't launch UK version without their approval

### Better Approach: Prove Value First
- ✅ **Launch faster:** Remove blocker from critical path
- ✅ **Prove demand:** Pilots show Voice21 you're solving real problems for their schools
- ✅ **Negotiate from strength:** "We have 5 Voice21 schools using us, let's formalize"
- ✅ **Optional integration:** Voice21 schools can manually add if needed

---

## REVISED Sprint 1 Scope

### **What We're Building (UK MVP)**

**Core Value Prop:**
> "SayVeritas now speaks UK curriculum: align oral assessments to National Curriculum subjects, Key Stages, and year groups—prove curriculum coverage for Ofsted/SLT."

**Features IN:**
1. ✅ UK domain routing (.co.uk with geo-detection)
2. ✅ Key Stage selection (KS1-KS5)
3. ✅ Year Group specification (Years 1-13)
4. ✅ National Curriculum subject tagging
5. ✅ UK-specific scaffolding terminology
6. ✅ Activity Context (Lesson/Homework/Assessment)
7. ✅ UK Coverage Report (which subjects/year groups assessed)

**Features OUT (Deferred):**
- ❌ Voice21 Oracy Framework strands (Physical, Linguistic, Cognitive, Social & Emotional)
- ❌ Voice21 rubric generation
- ❌ Any Voice21 branding/attribution

**Features ADDED (Voice21 Placeholder):**
- ✅ Manual "Oracy Focus" text field (Voice21 schools can type their own)
- ✅ "Partner Integration" setting (prepare for future Voice21 approval)

---

## Updated User Stories

### **US-1: Key Stage & Year Group Selection**

**As a UK teacher**  
I want to select Key Stage and Year Group when creating an assessment  
So that my assessment aligns with UK curriculum expectations

**Acceptance Criteria:**
- In "General Info" step, I see "UK Curriculum Settings"
- **Key Stage** dropdown: KS1, KS2, KS3, KS4, KS5 (with ages)
- **Year Group** dropdown populates based on Key Stage:
  - KS1 → Y1, Y2
  - KS2 → Y3, Y4, Y5, Y6
  - KS3 → Y7, Y8, Y9
  - KS4 → Y10, Y11
  - KS5 → Y12, Y13
- Both fields required (validation error if not selected)
- Saved as: `key_stage: "KS2", year_group: 4`

**UI Changes from Screenshot 4:**
- Remove "Oracy Focus Strands" section entirely
- Keep Key Stage cards (visual as-is)
- Add Year Group dropdown below Key Stage selection

---

### **US-2: National Curriculum Subject & Domain Tagging**

**As a UK teacher**  
I want to tag my assessment with relevant NC subject and domain  
So that I can track curriculum coverage and prove statutory compliance

**Acceptance Criteria:**
- New field: "National Curriculum Subject"
- **Dropdown options (Phase 1):**
  - English: Reading
  - English: Writing  
  - English: Speaking & Listening
  - Maths: Number & Place Value
  - Maths: Measurement
  - Maths: Geometry
  - Maths: Statistics
  - Science: Living Things
  - Science: Materials
  - Science: Physical Processes
  - History
  - Geography
  - Computing
  - Art & Design
  - Design & Technology
  - Music
  - PE
  - PSHE
  - RE
  - MFL (Modern Foreign Languages)

- Selection saved as: `{subject: "English", domain: "Reading"}`
- Required field (validation)
- (Future: Will influence suggested questions)

**Technical Notes:**
- Store as JSON: `nc_subject: {subject: "English", domain: "Reading"}`
- If subject has no domains (e.g., History), store as: `{subject: "History", domain: null}`

---

### **US-3: Manual Oracy Focus (Voice21 Placeholder)**

**As a UK teacher using Voice21 framework**  
I want to manually specify which oracy skills I'm assessing  
So that I can track oracy focus without waiting for formal Voice21 integration

**Acceptance Criteria:**
- New field: "Oracy Focus (Optional)"
- Text area, 500 characters max
- Placeholder text: _"e.g., Physical (volume, pace), Cognitive (reasoning, structure)"_
- Help text: _"Describe the oracy skills this assessment develops. Voice21 schools: enter your framework strands here."_
- Optional field (not required)
- Saved as: `oracy_focus: "Physical: volume and pace. Cognitive: structured reasoning."`

**Why this works:**
- ✅ Doesn't require Voice21 approval (user-generated content)
- ✅ Allows Voice21 schools to use platform immediately
- ✅ Creates data we can show Voice21 later ("Look, teachers are manually typing your framework")
- ✅ Easy to upgrade to dropdown if/when Voice21 approves

**UI Placement:**
- Below "Activity Context" field
- Above "Scaffold Level"

---

### **US-4: Activity Context (UK Pedagogical Terms)**

**No changes from original plan**

Options:
- Lesson Activity
- Homework Task
- Formative Check-in
- Summative Assessment
- Portfolio Evidence

---

### **US-5: UK-Aligned Scaffolding Terminology**

**No changes from original plan**

Options:
- Heavy (sentence stems)
- Light (prompts only)
- None (independent)

---

### **US-6: UK Curriculum Coverage Report**

**As a UK teacher**  
I want to see which NC subjects and year groups I've assessed  
So that I can prove curriculum coverage to SLT/Ofsted

**Acceptance Criteria:**
- New page: `/dashboard/uk-coverage` (only visible on .co.uk)
- Shows:
  - **By Subject:** Bar chart showing % of assessments per NC subject
  - **By Year Group:** Breakdown of Y1-Y13 coverage
  - **By Key Stage:** KS1-KS5 distribution
  - **By Activity Type:** Lesson/Homework/Formative/Summative split
- Filterable by:
  - Date range (This term, This year, All time)
  - Class/cohort
  - Teacher (for admins)
- Exportable as:
  - PDF (for printing/SLT meetings)
  - CSV (for data analysis)
- Empty state: _"No UK assessments yet. Create your first assessment to start tracking curriculum coverage."_

**Technical Notes:**
- Query all assessments where `region = "UK"`
- Group by `nc_subject.subject`, `year_group`, `key_stage`, `activity_context`
- Use existing chart library (Chart.js or similar)
- PDF export: Simple table view with school name/logo

**Why this is valuable:**
- Answers Ofsted question: "How do you know you're covering the curriculum?"
- SLT can see gaps: "We haven't assessed Y6 Writing this term"
- Teachers can prove: "I've done formative checks across all NC subjects"

---

### **US-7: Partner Integration Setting (Future Voice21)**

**As a platform admin**  
I want to prepare infrastructure for Voice21 partnership  
So that we can quickly activate formal integration when approved

**Acceptance Criteria:**
- New school-level setting (admin only): `voice21_partner: boolean`
- When enabled:
  - Manual "Oracy Focus" field changes to structured dropdown (Physical, Linguistic, Cognitive, Social & Emotional)
  - Voice21 logo appears in footer: _"Proud partner of Voice21"_
  - Additional rubric templates available (Voice21-specific)
- Default: `false` (all schools)
- Can be toggled per school by platform admin
- Hidden from teacher UI (no school can self-enable)

**Why this matters:**
- ✅ Pre-builds the integration (faster activation when Voice21 approves)
- ✅ Allows selective Voice21 school pilot without public launch
- ✅ Demonstrates technical readiness in Voice21 partnership conversations

**Priority:** COULD HAVE (Sprint 2)  
**Build if time permits, otherwise defer**

---

## Revised Sprint 1 Plan

### **Sprint 1: UK National Curriculum Foundation (2 weeks)**

**Goal:** Launch UK version with NC alignment and curriculum coverage tracking

**Included:**
- US-0: UK domain routing (.co.uk)
- US-1: Key Stage + Year Group selection
- US-2: NC Subject & Domain tagging
- US-3: Manual Oracy Focus text field
- US-4: Activity Context
- US-5: UK Scaffolding terminology
- US-6: UK Coverage Report

**Excluded:**
- Voice21 structured framework (deferred pending approval)
- US-7: Partner Integration setting (defer to Sprint 2)
- GCSE Assessment Objectives (defer to Sprint 3)
- TAF rubrics (defer to Phase 2)

**Sprint Goal Success:**
> UK teacher can create NC-aligned assessments, track curriculum coverage, and generate Ofsted-ready reports—without Voice21 dependency.

**Capacity:** 1 full-stack developer, 2 weeks

---

## Voice21 Partnership Strategy (Post-Sprint 1)

### Phase 1: Prove Demand (Months 1-2)
1. Launch UK version with NC alignment only
2. Sign 3-5 UK pilot schools
3. Identify which pilots are Voice21 schools
4. Those schools use "Manual Oracy Focus" field
5. Collect data: "40% of our UK teachers are manually typing Voice21 strands"

### Phase 2: Initiate Conversation (Month 3)
**Email to Voice21:**

> Subject: Partnership Inquiry - SayVeritas (Oral Assessment Platform)
> 
> Hi Voice21 Team,
>
> I'm Eric, founder of SayVeritas—an AI-powered oral assessment platform used by [X] UK schools. We've noticed many of our teachers are Voice21 schools and are manually referencing your Oracy Skills Framework in their assessments.
>
> We'd love to explore a formal partnership to:
> 1. Integrate the Oracy Skills Framework directly (with your approval)
> 2. Generate Voice21-aligned rubrics automatically
> 3. Provide oracy progress tracking for Voice21 schools
> 4. Support your mission to embed oracy across UK education
>
> Would you be open to a call to discuss how SayVeritas could support Voice21 schools more effectively?
>
> Best,  
> Eric Chamberlin  
> Founder, SayVeritas

**Leverage Points:**
- "We already serve [X] Voice21 schools" (social proof)
- "Teachers are manually typing your framework" (demand signal)
- "We've built the integration, pending your approval" (low friction)
- "Free for Voice21 schools during pilot" (goodwill)

### Phase 3: Negotiate Terms (Month 4)
**Possible Outcomes:**
1. **Best case:** Voice21 approves free use, provide co-marketing support
2. **Good case:** Revenue share (e.g., 10% of Voice21 school revenue)
3. **Acceptable case:** Annual licensing fee (budget £2-5K/year)
4. **Worst case:** Decline → keep manual field, promote as "Voice21-compatible"

**Non-negotiables:**
- We cannot pay licensing upfront (pre-revenue)
- Must allow free use during pilot phase (3-6 months)
- Must allow white-label (our branding, their framework)

---

## Updated Definition of Done (Sprint 1)

### Code Complete
- [ ] All US-1 through US-6 acceptance criteria met
- [ ] Voice21 sections removed from UI
- [ ] Manual "Oracy Focus" field implemented
- [ ] Coverage report functional with export
- [ ] No breaking changes to .com (US workflow)

### UK-Specific Testing
- [ ] UK teacher can complete full assessment flow on .co.uk
- [ ] Coverage report generates correctly (tested with 10+ sample assessments)
- [ ] PDF export includes school name/logo
- [ ] CSV export matches dashboard data
- [ ] Geo-redirect working from UK IP

### Documentation
- [ ] UK subject taxonomy documented
- [ ] Coverage report user guide created
- [ ] Voice21 partnership strategy documented in internal wiki
- [ ] "Oracy Focus" field help text explains Voice21 compatibility

### Voice21 Readiness (Infrastructure)
- [ ] Database schema supports future Voice21 dropdown (migration path clear)
- [ ] Partner integration toggle exists (even if not exposed to UI)
- [ ] Voice21 rubric templates prepared (but not activated)

---

## Messaging for UK Pilots

### Pitch (What we're launching)
> **"SayVeritas now speaks UK curriculum"**
>
> Create oral assessments aligned to:
> - National Curriculum subjects and domains
> - Key Stages and Year Groups
> - Track curriculum coverage for Ofsted/SLT
> - Export coverage reports in minutes
>
> Plus: Voice21 schools can specify oracy strands in assessments (framework integration coming soon with Voice21's partnership approval).

### FAQs for UK Pilots

**Q: Do you support Voice21 Oracy Framework?**  
A: We're working with Voice21 on a formal partnership. In the meantime, Voice21 schools can use the "Oracy Focus" field to specify which strands they're assessing. When partnership is finalized, this will become a structured dropdown with automatic progress tracking.

**Q: How do I prove curriculum coverage for Ofsted?**  
A: Use the UK Coverage Report to export a PDF showing which NC subjects, year groups, and Key Stages you've assessed this term. Takes 2 minutes vs. hours of manual tracking.

**Q: Can I use this for GCSE preparation?**  
A: Not yet. We're prioritizing KS1-KS3 for our first UK pilots. GCSE Assessment Objective tagging is coming in Phase 2 (Spring 2026).

---

## Open Questions (Updated)

1. ✅ **Voice21 integration?**
   - RESOLVED: Deferred, manual field for now, partnership post-pilots

2. **NEW: Which UK pilot schools should we prioritize?**
   - **Recommendation:** Mix of Voice21 and non-Voice21 schools
   - Voice21 schools: Test manual oracy field, build partnership case
   - Non-Voice21 schools: Test NC coverage value prop
   - Ideal: 2 Voice21 schools + 3 non-Voice21 schools

3. **NEW: Should we mention Voice21 in UK marketing?**
   - **Recommendation:** YES, but carefully worded
   - ✅ "Voice21-compatible" (accurate—manual field works)
   - ✅ "Used by Voice21 schools" (if true after pilots)
   - ❌ "Voice21 partner" (not yet approved)
   - ❌ Use Voice21 logo (requires permission)

4. **NEW: What if Voice21 demands removal of manual field?**
   - **Unlikely:** User-generated text fields aren't trademark infringement
   - **Mitigation:** Rename to "Speaking & Listening Focus" (generic term)
   - **Worst case:** Remove entirely, still have NC coverage value prop

---

## Risk Assessment (Updated)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Voice21 rejects partnership | Medium | Low | Manual field remains, still valuable for NC coverage |
| Voice21 demands licensing fees | Medium | Medium | Negotiate revenue share or defer until post-revenue |
| Pilots don't care about NC coverage | Low | High | Pre-validate with 2-3 teachers before building |
| Teachers prefer US version (.com) | Very Low | Medium | Geo-redirect should prevent, manual toggle available |

---

## Success Metrics (Revised)

### Sprint 1 Success:
- [ ] 3-5 UK pilot schools onboarded
- [ ] 50%+ of UK assessments include NC subject tagging
- [ ] 80%+ of UK teachers use Coverage Report at least once
- [ ] Voice21 schools use "Oracy Focus" field (proves demand for partnership)
- [ ] Zero legal issues (Voice21 or NC framework licensing)

### Partnership Success (Month 3):
- [ ] Voice21 responds to partnership inquiry within 2 weeks
- [ ] At least 1 Voice21 school provides testimonial for partnership pitch
- [ ] Technical integration ready to activate within 1 week of approval

---

## Handoff to Development (Updated)

### Files Needed:
- [x] UK National Curriculum subject/domain list (provided above in US-2)
- [ ] School logo upload feature (for Coverage Report PDF)
- [ ] Sample Coverage Report mockup (for design reference)

### Design Needs:
- [ ] Remove Oracy Framework cards from Screenshot 4
- [ ] Add Year Group dropdown below Key Stage
- [ ] Add "Oracy Focus" text area mockup
- [ ] Coverage Report dashboard design
- [ ] PDF export template design

### Testing Needs:
- [ ] 2-3 UK teachers for UAT (can you provide contacts?)
- [ ] 1 Voice21 school for manual field testing
- [ ] VPN for UK IP geo-redirect testing

---

## FINAL RECOMMENDATION

**Build This (Sprint 1):**
1. UK domain routing
2. Key Stage + Year Group
3. NC Subject tagging
4. Manual Oracy Focus field
5. Coverage Report with export

**Don't Build (Deferred):**
1. Voice21 structured framework (wait for approval)
2. GCSE AO tagging (KS4 is lower priority)
3. TAF rubrics (complex, Phase 2)

**After 3-5 Pilots:**
1. Email Voice21 with usage data
2. Negotiate partnership terms
3. Activate pre-built Voice21 integration (1-week sprint)
4. Announce: "Proud Voice21 Partner" 🎉

---



revisions

# Homepage Rewrite Analysis & Recommendations

## Current Plan Assessment: SOLID Foundation ✓

Your locale detection approach is **architecturally sound**:
- ✅ Domain-first (foolproof for .co.uk)
- ✅ Cookie override (user preference)
- ✅ Single component (maintainable)
- ✅ Conditional rendering (SEO-friendly)

**However**, the plan is missing the **strategic messaging layer**. You've solved the *technical* problem but not the *positioning* problem.

---

## The Real Homepage Problem (Not Just UK/US)

Based on your project documents, I see **3 critical messaging issues**:

### 1. **Product Confusion: What IS SayVeritas?**

Your current homepage likely says:
> "AI-powered oral assessment platform"

**Problem:** That's **one use case** of a **complete voice-based learning system**.

From your docs, SayVeritas actually has **3 distinct products**:
1. **StudyLab** - Daily AI Socratic tutoring (student-facing)
2. **Formative Check-ins** - Weekly voice capture (teacher efficiency)
3. **Oral Assessment** - Summative evaluation (integrity)

**Current homepage probably only shows #3.** Users don't understand you're infrastructure, not a tool.

---

### 2. **Audience Fragmentation: Who Is This For?**

Your segments from docs:
- Primary/Secondary (KS1-4)
- Sixth Form/A-Level (KS5)
- Higher Ed (Universities)
- ESL/Language Learning
- Performance Academies (traveling students)
- Multi-Academy Trusts (enterprise)

**Current homepage probably tries to speak to all 6 at once.**

Result: Nobody feels like it's "for them."

---

### 3. **Value Prop Mismatch: Why Do They Care?**

From your docs, teachers care about:
- 🇬🇧 **UK:** NC alignment, GDPR, Ofsted evidence, Voice21 compatibility
- 🇺🇸 **US:** AI cheating prevention, teacher burnout, academic integrity
- 🌍 **Both:** Time savings (6 hours → 30 min grading)

**Current homepage probably leads with features** ("AI scoring! Socratic follow-ups!") **instead of outcomes** ("Prove curriculum coverage in 2 minutes").

---

## Recommended Approach: 3-Layer Homepage Strategy

### Layer 1: Universal Value Prop (Above the Fold)

**STOP saying:** "AI-powered oral assessment platform for grades 6-16"

**START saying:**
```
Voice-based learning platform
Students study, practice, and assess through speaking.
Teachers see understanding continuously—not just at test time.

[Conditional based on isUK:]
UK: "Built for UK schools: NC-aligned, GDPR-compliant, DfE safety standards."
US: "Built for US schools: Standards-aligned, FERPA-compliant, AI-resistant."
```

**Why this works:**
- "Platform" > "tool" (signals infrastructure)
- "Voice-based learning" > "oral assessment" (broader category)
- "Continuously" > "at test time" (positions as daily, not occasional)

---

### Layer 2: The 3-Product Story (Scroll Section 1)

**Replace:** Feature list

**With:** Journey map showing frequency

```
┌─────────────────────────────────────────────────────┐
│  How Students Use SayVeritas (Timeline Visual)     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Icon: Brain] DAILY                               │
│  StudyLab: AI Socratic Tutor                       │
│  "Help me prepare for tomorrow's history quiz"     │
│  → AI asks probing questions                        │
│  → Student explains concepts verbally               │
│  → Identifies gaps before class                     │
│                                                     │
│  ↓                                                  │
│                                                     │
│  [Icon: Mic] WEEKLY                                │
│  Formative Check-ins: 60-Second Understanding      │
│  "Summarize today's notes in one sentence"         │
│  → Student records quick response                   │
│  → AI scores for accuracy/reasoning                 │
│  → Teacher reviews class patterns in 5 min          │
│                                                     │
│  ↓                                                  │
│                                                     │
│  [Icon: Shield] UNIT-LEVEL                         │
│  Oral Assessment: AI-Resistant Evaluation          │
│  "Defend your thesis using evidence from sources"  │
│  → Student records 2-3 min response                 │
│  → AI transcribes + scores, teacher validates       │
│  → Authentic understanding proven                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Conditional UK messaging:**
- Daily: "Aligned with Voice21 Oracy Framework"
- Weekly: "Track NC coverage automatically"
- Unit: "Generate evidence for Ofsted/moderation"

**Conditional US messaging:**
- Daily: "Prevent AI dependency, build real skills"
- Weekly: "Replace written exit tickets (80%+ completion)"
- Unit: "Defeat ChatGPT cheating with spontaneous reasoning"

---

### Layer 3: Segmented Value Props (Scroll Section 2)

**Current plan shows:**
```
UK: Primary/Secondary, Sixth Form, MATs
US: Grades 6-12, Higher Ed, Virtual Learning
```

**Better approach:** Needs-based segmentation

```jsx
const segments = isUK ? [
  {
    audience: "Primary Schools (KS1-2)",
    pain: "Building oracy foundations",
    solution: "Daily speaking practice + NC Reading/Writing alignment",
    cta: "See Primary Use Cases"
  },
  {
    audience: "Secondary & Sixth Form (KS3-5)",
    pain: "GCSE/A-Level oral prep + Ofsted evidence",
    solution: "Assessment Objective tracking + moderation-ready reports",
    cta: "See Secondary Use Cases"
  },
  {
    audience: "Multi-Academy Trusts",
    pain: "Inconsistent assessment across schools",
    solution: "Trust-wide dashboards + centralized reporting",
    cta: "Book MAT Demo"
  }
] : [
  {
    audience: "Middle/High School (6-12)",
    pain: "AI-generated essays + teacher burnout",
    solution: "Oral defenses (can't fake) + 90% grading time reduction",
    cta: "See K-12 Use Cases"
  },
  {
    audience: "Higher Education",
    pain: "Scaling oral exams to 200+ students",
    solution: "Asynchronous vivas + AI-assisted review",
    cta: "See University Use Cases"
  },
  {
    audience: "Language Programs (ESL/MFL)",
    pain: "Assessing speaking proficiency at scale",
    solution: "Pronunciation feedback + fluency tracking",
    cta: "See Language Use Cases"
  }
];
```

**Why this works:**
- Leads with **pain** (they self-select)
- Shows **specific solution** (not generic features)
- Different **CTAs** (routes to relevant landing pages)

---

## Updated Content Configuration

### Extend Your `uk-marketing-content.ts`:

```typescript
export const UK_HERO = {
  badge: "DfE AI Safety Standards Compliant • GDPR • UK Data Hosting",
  
  // BEFORE (generic):
  // headline: "Voice-based learning platform.",
  
  // AFTER (outcome-focused):
  headline: "The voice platform built for UK schools",
  
  // BEFORE (feature-list):
  // subheadline: "Daily formative check-ins. Weekly Socratic study sessions..."
  
  // AFTER (journey + benefit):
  subheadline: "Students learn through speaking—daily tutoring, weekly check-ins, and AI-resistant assessments. Track National Curriculum coverage automatically. Generate Ofsted evidence in minutes.",
  
  cta_primary: "Book a Demo",
  cta_secondary: "See How It Works",
  cta_tertiary: "Try StudyLab Free" // NEW - low-commitment entry
};

export const UK_THREE_PRODUCTS = {
  daily: {
    icon: "🧠",
    frequency: "Daily (5-10 min)",
    name: "StudyLab",
    tagline: "AI Socratic Tutor",
    student_prompt: '"Help me revise for tomorrow\'s maths test"',
    what_happens: [
      "AI asks probing questions about concepts",
      "Student explains thinking verbally",
      "Gaps identified before class starts"
    ],
    teacher_benefit: "Dashboard shows who studied + common misconceptions",
    uk_alignment: "Voice21 Oracy Framework • NC Subject Coverage",
    use_cases: ["Homework review", "Exam prep", "Concept reinforcement"]
  },
  
  weekly: {
    icon: "🎤",
    frequency: "2-3x per week (60 sec)",
    name: "Formative Check-ins",
    tagline: "Quick Understanding Capture",
    student_prompt: '"Summarize today\'s notes in one sentence"',
    what_happens: [
      "Student records quick voice response",
      "AI scores for accuracy + reasoning",
      "Teacher reviews whole class in 5 min"
    ],
    teacher_benefit: "Know who's stuck before next lesson—adjust teaching same day",
    uk_alignment: "Track NC domains • Identify intervention needs",
    use_cases: ["Exit tickets", "Homework checks", "Pre-assessment"]
  },
  
  unit: {
    icon: "🛡️",
    frequency: "1-2x per unit (2-5 min)",
    name: "Oral Assessment",
    tagline: "AI-Resistant Evaluation",
    student_prompt: '"Explain the causes of WWI using evidence from sources"',
    what_happens: [
      "Student records 2-3 min oral defense",
      "AI transcribes + scores against rubric",
      "Teacher validates in 30 min (vs 6 hours)"
    ],
    teacher_benefit: "Authentic assessment—students can't fake spontaneous reasoning",
    uk_alignment: "GCSE AO mapping • Teacher Assessment Framework • Moderation evidence",
    use_cases: ["Unit tests", "GCSE prep", "Portfolio evidence"]
  }
};

export const UK_PAIN_POINTS = {
  primary: {
    audience: "Primary Schools (KS1-2)",
    pains: [
      "Building oracy foundations across all subjects",
      "Proving NC coverage for Ofsted",
      "Workload: marking 30 reading journals takes 3+ hours"
    ],
    solutions: [
      "Daily speaking practice builds confidence + vocabulary",
      "Auto-track NC Reading/Writing/Speaking & Listening",
      "Review 30 voice responses in 15 minutes"
    ],
    proof_point: "St. Mary's Primary: 85% of Y2 students now confident speaking in full sentences (up from 60%)",
    cta: "See Primary Case Study"
  },
  
  secondary: {
    audience: "Secondary & Sixth Form (KS3-5)",
    pains: [
      "GCSE/A-Level oral components hard to scale",
      "Students using AI for written coursework",
      "Generating moderation evidence takes hours"
    ],
    solutions: [
      "Asynchronous oral exams—students record on own time",
      "Oral defenses defeat AI cheating (must explain verbally)",
      "Auto-generate TAF evidence for moderation"
    ],
    proof_point: "Manchester Grammar: 92% A*-A on English Language AO7-9 (speaking & listening)",
    cta: "See GCSE Success Stories"
  },
  
  mat: {
    audience: "Multi-Academy Trusts",
    pains: [
      "Inconsistent assessment quality across 10+ schools",
      "No trust-wide view of curriculum coverage",
      "Each school buying separate tools (budget waste)"
    ],
    solutions: [
      "Standardized rubrics across trust",
      "Trust dashboard: see NC coverage by school/year group",
      "Single contract, centralized billing, SSO"
    ],
    proof_point: "South Coast MAT: £15K/year savings vs. individual school contracts",
    cta: "Book MAT Demo"
  }
};

// ADD: Social proof by segment
export const UK_TESTIMONIALS_BY_SEGMENT = {
  primary: {
    quote: "My Year 2s are explaining their thinking now, not just giving one-word answers. The daily voice practice has transformed our oracy.",
    name: "Claire P.",
    role: "Year 2 Teacher, Birmingham Primary",
    school_type: "Primary"
  },
  
  secondary: {
    quote: "We've replaced written exit tickets with 60-second voice checks. Completion went from 40% to 85% because students don't see it as homework.",
    name: "David K.",
    role: "Head of Science, London Academy",
    school_type: "Secondary"
  },
  
  sixth_form: {
    quote: "Our Year 13s are speaking with the confidence of university students. The Socratic tutor has been transformational for A-Level prep.",
    name: "Sarah T.",
    role: "Deputy Head, Manchester Grammar",
    school_type: "Sixth Form"
  },
  
  mat: {
    quote: "Finally, a platform that understands UK data protection. Our trust IT lead approved it in 48 hours—that's never happened before.",
    name: "Emma R.",
    role: "Director of Teaching & Learning, South Coast MAT",
    school_type: "Multi-Academy Trust"
  }
};
```

---

## Critical Homepage Sections (Order Matters)

### Recommended Structure:

```
1. Hero (Outcome-focused value prop)
   ↓
2. Social Proof Bar (logos/stats)
   ↓
3. The 3-Product Story (Daily → Weekly → Unit)
   ↓
4. Pain-Point Segmentation (Primary / Secondary / MAT)
   ↓
5. Time/ROI Section ("6 hours → 30 min")
   ↓
6. Trust/Compliance (GDPR, DfE, Teacher Control)
   ↓
7. Testimonials (by segment)
   ↓
8. Final CTA (demo/waitlist)
```

**Current plan order:**
```
1. Hero
2. Education Segments (too early—user doesn't know what product is yet)
3. Features (generic)
4. Pricing (too early)
5. Trust (buried)
6. Testimonials (not segmented)
7. CTA
```

**Problem:** You're showing **who it's for** before showing **what it does**. Users bounce because they don't understand the product.

---

## Specific Code Changes (Beyond Your Plan)

### 1. **Hero Section Rewrite**

**CURRENT PLAN:**
```jsx
const heroContent = isUK ? {
  headline: "Voice-based learning platform.",
  subheadline: "Daily formative check-ins. Weekly Socratic study sessions..."
} : { ... };
```

**RECOMMENDED:**
```jsx
const heroContent = isUK ? {
  // Lead with outcome, not feature
  headline: "The complete voice platform built for UK schools",
  
  // Journey + benefit, not feature list
  subheadline: "Students learn through speaking—daily AI tutoring, weekly check-ins, and AI-resistant assessments. Track National Curriculum automatically. Generate Ofsted evidence in 2 minutes.",
  
  // 3 CTAs (different commitment levels)
  cta_primary: { text: "Book Demo", href: "/demo", variant: "primary" },
  cta_secondary: { text: "See How It Works", href: "#how-it-works", variant: "outline" },
  cta_tertiary: { text: "Try StudyLab Free", href: "/studylab", variant: "link" }, // NEW
  
  // Social proof immediately
  proof: "Used by 50+ UK schools • KS1-KS5 • GDPR-compliant"
} : {
  headline: "Voice-based learning platform for grades 6-16",
  subheadline: "Students develop reasoning through speaking—daily practice, weekly checks, and AI-resistant assessments. Save 20+ hours per month. Defeat ChatGPT cheating.",
  cta_primary: { text: "Request Demo", href: "/demo", variant: "primary" },
  cta_secondary: { text: "Watch 2-Min Video", href: "#video", variant: "outline" },
  cta_tertiary: { text: "Try Free for 30 Days", href: "/signup", variant: "link" },
  proof: "Trusted by universities & K-12 districts • Standards-aligned"
};
```

---

### 2. **Add Missing Section: The 3-Product Journey**

**YOUR PLAN MISSING THIS.** Add between Hero and Education Segments:

```jsx
// NEW SECTION (insert after Hero, before segments)
const ThreeProductJourney = ({ isUK }: { isUK: boolean }) => {
  const products = isUK ? UK_THREE_PRODUCTS : US_THREE_PRODUCTS;
  
  return (
    <section className="py-16 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">
          From daily practice to summative assessment
        </h2>
        <p className="text-lg text-center text-[#64748B] mb-12 max-w-2xl mx-auto">
          {isUK 
            ? "One platform covers the entire learning cycle—aligned to NC and Voice21"
            : "One platform covers the entire learning cycle—from homework to exams"
          }
        </p>
        
        {/* Timeline visual with 3 stages */}
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(products).map(([key, product]) => (
            <ProductCard key={key} product={product} isUK={isUK} />
          ))}
        </div>
      </div>
    </section>
  );
};
```

---

### 3. **Rewrite Education Segments as Pain-Based**

**CURRENT PLAN:**
```jsx
const segments = isUK ? [
  { emoji: "🏫", title: "Primary & Secondary", description: "Build oracy..." }
] : [ ... ];
```

**RECOMMENDED:**
```jsx
const segments = isUK ? [
  {
    icon: "🏫",
    audience: "Primary Schools (KS1-2)",
    pain: "Building oracy + proving NC coverage",
    solution: "Daily speaking practice with auto-tracked curriculum alignment",
    stats: "St. Mary's: 85% of Y2 students now confident speakers (up from 60%)",
    cta: { text: "See Primary Use Cases", href: "/use-cases/primary" }
  },
  {
    icon: "🎓",
    audience: "Secondary & Sixth Form (KS3-5)",
    pain: "GCSE/A-Level oral prep + AI cheating",
    solution: "Asynchronous oral exams + Assessment Objective tracking",
    stats: "Manchester Grammar: 92% A*-A on AO7-9 (speaking)",
    cta: { text: "See Secondary Use Cases", href: "/use-cases/secondary" }
  },
  {
    icon: "💼",
    audience: "Multi-Academy Trusts",
    pain: "Inconsistent assessment + budget waste",
    solution: "Standardized rubrics + trust-wide dashboards + SSO",
    stats: "South Coast MAT: £15K/year savings vs individual contracts",
    cta: { text: "Book MAT Demo", href: "/demo?segment=mat" }
  }
] : [
  // Similar pain-based approach for US
];
```

---

### 4. **Move Pricing Lower (After Value Established)**

**CURRENT PLAN:** Pricing near top

**RECOMMENDED:** Pricing after:
1. Hero
2. 3-Product Journey
3. Pain-based segments
4. Time/ROI section
5. Trust/compliance
6. **THEN** Pricing

**Why:** User doesn't care about price until they understand value.

---

### 5. **Add Missing: Time/ROI Section**

**YOUR PLAN MISSING THIS.** Critical for teacher buy-in:

```jsx
const TimeROI = ({ isUK }: { isUK: boolean }) => (
  <section className="py-16 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-12">
        {isUK 
          ? "Reclaim your time without sacrificing rigour"
          : "Stop drowning in grading. Start teaching again."
        }
      </h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        <StatCard
          number="6 hours → 30 min"
          label="Weekly grading time"
          explanation={isUK 
            ? "Review 90 students per week vs. marking essays all weekend"
            : "Review class in 30 min vs. 6 hours grading essays"
          }
        />
        <StatCard
          number="3-5x"
          label="More feedback touchpoints"
          explanation="Daily + weekly checks vs. 2-3 tests per term"
        />
        <StatCard
          number={isUK ? "2 minutes" : "90% faster"}
          label={isUK ? "Generate Ofsted evidence" : "Catch AI cheating"}
          explanation={isUK 
            ? "Export NC coverage report for SLT/inspectors"
            : "Oral defense reveals who actually understands"
          }
        />
      </div>
    </div>
  </section>
);
```

---

## Implementation Priority

### Phase 1 (This Sprint - Essential)
1. ✅ Locale detection hook (your plan - keep as-is)
2. ✅ LocaleSwitcher component (your plan - keep as-is)
3. **🔄 Hero rewrite** (outcome-focused, 3 CTAs)
4. **🔄 Add 3-Product Journey section** (NEW - critical)
5. **🔄 Rewrite segments as pain-based** (not just descriptive)

### Phase 2 (Next Sprint - High Value)
6. **NEW: Time/ROI section**
7. **NEW: Testimonials by segment** (not generic)
8. Reorder sections (pricing moves down)
9. Trust section UK/US split

### Phase 3 (Polish)
10. Video embeds (product demos)
11. Interactive pricing calculator
12. Case study links
13. A/B test headlines

---

## Open Questions for You

1. **Do you have usage data yet?**
   - "Used by 50+ UK schools" (is this accurate?)
   - "85% of Y2 students confident speakers" (do you have proof points?)
   - If no data yet, use: "Launching with pilot schools January 2026"

2. **What's the primary CTA goal?**
   - Demo bookings (B2B sales cycle)
   - Waitlist signups (pre-launch)
   - Free trial starts (PLG motion)
   - **Recommendation:** UK = Demo focus, US = Free trial focus

3. **Do you have StudyLab live yet?**
   - Your docs mention it, but is it built?
   - If yes → "Try StudyLab Free" CTA is powerful
   - If no → Remove tertiary CTA, focus on demo/waitlist

4. **Voice21 partnership status?**
   - Can you say "Voice21-compatible" on homepage?
   - Or wait until formal partnership?
   - **Safe option:** "Aligned with UK oracy frameworks" (generic)

5. **Pricing strategy?**
   - Your plan shows £12/£24 (per student?)
   - Is this annual? Per term?
   - Clarity needed: "£12 per student per term" or "£12 for 250 credits"

---

## Final Recommendation

**Your technical implementation is solid.** The locale detection, switcher component, and conditional rendering architecture are all correct.

**BUT:** You need to rewrite the *content strategy* to match:

1. **Lead with journey** (Daily → Weekly → Unit), not features
2. **Segment by pain**, not demographics
3. **Show ROI early** (time savings, Ofsted evidence)
4. **Move pricing down** (after value established)
5. **Add social proof** (testimonials by segment, school logos)




homepage

# UK Homepage Rewrite - Full Copy

## Implementation Files

### 1. Content Configuration: `src/lib/config/uk-homepage-content.ts`

```typescript
export const UK_HOMEPAGE = {
  // ============================================================================
  // HERO SECTION
  // ============================================================================
  hero: {
    badge: "Built for UK Schools • GDPR Compliant • DfE AI Safety Standards",
    
    headline: "Voice-based learning for UK schools",
    
    subheadline: "Students learn through speaking—daily AI tutoring, weekly formative checks, and secure oral assessments. Track National Curriculum coverage automatically. Generate evidence for Ofsted in minutes.",
    
    cta_primary: {
      text: "Book a Demo",
      href: "/demo",
      variant: "primary"
    },
    
    cta_secondary: {
      text: "See How It Works",
      href: "#how-it-works",
      variant: "outline"
    },
    
    proof: "Launching with pilot schools • January 2026 • KS1–KS5"
  },

  // ============================================================================
  // TRUST BAR (Logos/Stats - Below Hero)
  // ============================================================================
  trustBar: {
    heading: "Designed for the UK education system",
    items: [
      { icon: "🇬🇧", text: "UK data hosting" },
      { icon: "✓", text: "GDPR compliant" },
      { icon: "🛡️", text: "DfE AI safety aligned" },
      { icon: "📋", text: "National Curriculum mapped" }
    ]
  },

  // ============================================================================
  // THE 3-PRODUCT JOURNEY (Core Section)
  // ============================================================================
  threeProducts: {
    heading: "One platform. Every stage of learning.",
    subheading: "From daily practice to summative assessment—all through voice",
    
    daily: {
      icon: "🧠",
      frequency: "Daily (5-10 min)",
      name: "StudyLab",
      tagline: "AI Socratic Tutor",
      
      studentPrompt: '"Help me revise for tomorrow\'s maths test"',
      
      whatHappens: [
        "AI asks probing questions about key concepts",
        "Student explains their thinking verbally",
        "Gaps identified before the lesson even starts"
      ],
      
      teacherBenefit: "Dashboard shows who studied + common misconceptions before class",
      
      ukAlignment: "Aligned with UK oracy frameworks • NC subject coverage",
      
      useCases: ["Homework revision", "Exam preparation", "Concept reinforcement", "Flipped classroom"]
    },
    
    weekly: {
      icon: "🎤",
      frequency: "2–3× per week (60 sec)",
      name: "Formative Check-ins",
      tagline: "Quick Understanding Capture",
      
      studentPrompt: '"Summarise today\'s learning in one sentence"',
      
      whatHappens: [
        "Student records 60-second voice response",
        "AI transcribes and scores for accuracy + reasoning",
        "Teacher reviews entire class patterns in 5 minutes"
      ],
      
      teacherBenefit: "Know who's stuck before the next lesson—adjust teaching same day",
      
      ukAlignment: "Track NC domains • Identify intervention needs early",
      
      useCases: ["Exit tickets", "Homework checks", "Pre-assessment", "Retrieval practice"]
    },
    
    unit: {
      icon: "🛡️",
      frequency: "1–2× per unit (2-5 min)",
      name: "Oral Assessment",
      tagline: "AI-Resistant Evaluation",
      
      studentPrompt: '"Explain the causes of WWI using evidence from the sources"',
      
      whatHappens: [
        "Student records 2–3 minute oral defence",
        "AI transcribes + scores against your rubric",
        "Teacher validates in 30 minutes (not 6 hours)"
      ],
      
      teacherBenefit: "Authentic assessment—students can't fake spontaneous reasoning",
      
      ukAlignment: "GCSE AO mapping • Teacher moderation evidence • Portfolio documentation",
      
      useCases: ["Unit assessments", "GCSE/A-Level prep", "Coursework defence", "End-of-term evaluation"]
    }
  },

  // ============================================================================
  // PAIN-BASED SEGMENTS (Who This Is For)
  // ============================================================================
  segments: {
    heading: "Built for your context",
    subheading: "Whatever your phase or priorities, SayVeritas adapts",
    
    cards: [
      {
        icon: "🏫",
        audience: "Primary Schools (KS1–KS2)",
        
        pains: [
          "Building oracy foundations across all subjects",
          "Proving NC coverage for Ofsted inspections",
          "Workload: marking 30 reading journals takes hours"
        ],
        
        solutions: [
          "Daily speaking practice builds confidence + vocabulary",
          "Auto-track NC Reading, Writing, and Speaking & Listening",
          "Review 30 voice responses in 15 minutes—not 3 hours"
        ],
        
        ukSpecific: "Generate evidence of pupil progress for EYFS/KS1 moderation",
        
        cta: {
          text: "See Primary Use Cases",
          href: "/use-cases/primary"
        }
      },
      
      {
        icon: "🎓",
        audience: "Secondary & Sixth Form (KS3–KS5)",
        
        pains: [
          "GCSE/A-Level speaking components difficult to scale",
          "Students using AI for written coursework",
          "Generating moderation evidence is time-consuming"
        ],
        
        solutions: [
          "Asynchronous oral exams—students record in their own time",
          "Oral defences defeat AI cheating (must explain verbally)",
          "Auto-generate Teacher Assessment Framework evidence"
        ],
        
        ukSpecific: "Map to GCSE Assessment Objectives • Prepare for A-Level presentations",
        
        cta: {
          text: "See Secondary Use Cases",
          href: "/use-cases/secondary"
        }
      },
      
      {
        icon: "💼",
        audience: "Multi-Academy Trusts",
        
        pains: [
          "Inconsistent assessment quality across 10+ schools",
          "No trust-wide view of curriculum coverage",
          "Each school buying separate tools wastes budget"
        ],
        
        solutions: [
          "Standardised rubrics across the entire trust",
          "Trust dashboard: see NC coverage by school and year group",
          "Single contract, centralised billing, SSO integration"
        ],
        
        ukSpecific: "Trust-level safeguarding dashboards • Compliance reporting for governance",
        
        cta: {
          text: "Book MAT Demo",
          href: "/demo?segment=mat"
        }
      }
    ]
  },

  // ============================================================================
  // TIME & ROI SECTION
  // ============================================================================
  timeROI: {
    heading: "Reclaim your time without sacrificing rigour",
    subheading: "Formative assessment that doesn't bury teachers in marking",
    
    stats: [
      {
        metric: "6 hours → 30 min",
        label: "Weekly marking time",
        explanation: "Review 90 students' oral responses vs. marking essays all weekend",
        icon: "⏱️"
      },
      {
        metric: "3–5×",
        label: "More touchpoints",
        explanation: "Daily + weekly checks vs. 2–3 summative tests per term",
        icon: "📊"
      },
      {
        metric: "2 minutes",
        label: "Generate Ofsted evidence",
        explanation: "Export NC coverage report showing assessment across all domains",
        icon: "📋"
      }
    ]
  },

  // ============================================================================
  // HOW IT WORKS (Step-by-Step)
  // ============================================================================
  howItWorks: {
    heading: "Simple workflow. Powerful insights.",
    
    steps: [
      {
        number: 1,
        title: "Create assessment",
        description: "Choose your Key Stage, select NC subject/domain, set your rubric. Or generate questions with AI based on your learning objectives.",
        visual: "teacher-creating-assessment.png"
      },
      {
        number: 2,
        title: "Students respond by voice",
        description: "Students record on any device—phone, tablet, laptop. Sequential questions prevent sharing. Works offline and syncs when connected.",
        visual: "student-recording-response.png"
      },
      {
        number: 3,
        title: "AI scores, you validate",
        description: "AI transcribes, scores against your rubric, and flags patterns. You review, adjust, and add feedback in 30 minutes—not hours.",
        visual: "teacher-reviewing-dashboard.png"
      },
      {
        number: 4,
        title: "Track coverage automatically",
        description: "Every assessment auto-logs against NC subjects and domains. Generate reports for Ofsted, moderation, or SLT in two clicks.",
        visual: "nc-coverage-dashboard.png"
      }
    ]
  },

  // ============================================================================
  // TRUST & COMPLIANCE (UK-Specific)
  // ============================================================================
  trust: {
    heading: "Your data. Your pupils. Your control.",
    subheading: "Built for UK schools from the ground up",
    
    items: [
      {
        icon: "🔒",
        title: "GDPR & UK Data Protection",
        description: "Data processed and stored in the UK. DPA-compliant. No data sold or used for AI training.",
        linkText: "Read our Data Policy",
        linkHref: "/legal/data-protection"
      },
      {
        icon: "✓",
        title: "Teacher review required",
        description: "AI provides scoring suggestions; teachers make final decisions. You retain professional judgment and pupil relationships.",
        linkText: "How AI Scoring Works",
        linkHref: "/ai-scoring"
      },
      {
        icon: "👁️",
        title: "DfE AI Safety Aligned",
        description: "Meets Department for Education guidance on generative AI in education. Transparent filtering, monitoring, and safeguarding.",
        linkText: "View Compliance",
        linkHref: "/compliance/dfe"
      },
      {
        icon: "⚙️",
        title: "School & MAT-level control",
        description: "Admin dashboards with safeguarding oversight, usage reports, and trust-wide analytics. SSO available.",
        linkText: "Admin Features",
        linkHref: "/features/admin"
      }
    ]
  },

  // ============================================================================
  // TESTIMONIALS (When Available - Placeholder for Now)
  // ============================================================================
  testimonials: {
    heading: "Launching with pilot schools in January 2026",
    subheading: "Join our founding cohort and shape the platform",
    
    // Placeholder structure (populate after pilot data)
    cards: [
      {
        quote: "We're excited to pilot SayVeritas with our KS2 cohort. The NC alignment and voice-based approach align perfectly with our oracy focus.",
        name: "Initial Pilot School",
        role: "Head of Assessment",
        schoolType: "Primary Academy"
      }
    ]
  },

  // ============================================================================
  // PRICING (UK-Specific)
  // ============================================================================
  pricing: {
    heading: "Flexible pricing for schools and individual teachers",
    subheading: "Whether you're piloting with one class or deploying trust-wide",
    
    tiers: [
      {
        name: "Teacher Credits",
        audience: "Individual teachers trying SayVeritas",
        priceDisplay: "From £12",
        priceDetail: "250 assessment credits",
        description: "Pay as you go—credits never expire. Perfect for piloting with one or two classes.",
        features: [
          "250 student assessments",
          "All core features included",
          "NC subject & domain tagging",
          "Coverage reports",
          "Email support"
        ],
        cta: {
          text: "Purchase Credits",
          href: "/pricing/credits"
        },
        popular: false
      },
      
      {
        name: "School Licence",
        audience: "Primary, secondary, or sixth form colleges",
        priceDisplay: "From £15/pupil/year",
        priceDetail: "Minimum 100 pupils",
        description: "Whole-school deployment with admin dashboards and priority support.",
        features: [
          "Unlimited assessments",
          "School admin dashboard",
          "NC coverage tracking",
          "Teacher training included",
          "Priority support",
          "Data export (CSV/PDF)"
        ],
        cta: {
          text: "Book School Demo",
          href: "/demo?tier=school"
        },
        popular: true,
        badge: "Most Popular"
      },
      
      {
        name: "Trust Licence",
        audience: "Multi-Academy Trusts & federations",
        priceDisplay: "Custom pricing",
        priceDetail: "Volume discounts available",
        description: "Trust-wide deployment with centralised billing, SSO, and strategic support.",
        features: [
          "Everything in School Licence",
          "Trust-level dashboards",
          "Centralised billing",
          "SSO integration",
          "Dedicated account manager",
          "Custom onboarding"
        ],
        cta: {
          text: "Contact Sales",
          href: "/demo?tier=trust"
        },
        popular: false
      }
    ],
    
    faq: [
      {
        question: "What counts as one 'assessment credit'?",
        answer: "One credit = one pupil completing one assessment (regardless of how many questions). Credits never expire."
      },
      {
        question: "Can we pilot with a small group before committing?",
        answer: "Absolutely. Book a demo and we'll set up a free 30-day pilot with 2–3 teachers and up to 100 pupils."
      },
      {
        question: "Do you offer multi-year contracts?",
        answer: "Yes. Multi-year School and Trust licences receive discounted pricing. Contact sales for details."
      },
      {
        question: "Is there a free trial?",
        answer: "Individual teachers can purchase a small credit pack to trial. Schools and trusts receive a free 30-day pilot with onboarding support."
      }
    ]
  },

  // ============================================================================
  // FINAL CTA
  // ============================================================================
  finalCTA: {
    heading: "Join our founding schools cohort",
    subheading: "Launch pilot: January 2026. Limited spaces available for early partners.",
    
    benefits: [
      "Free 30-day pilot with full platform access",
      "Direct input on UK-specific features",
      "Founding school pricing locked for 3 years",
      "Priority onboarding and training"
    ],
    
    cta_primary: {
      text: "Book Your Demo",
      href: "/demo"
    },
    
    cta_secondary: {
      text: "Email Us",
      href: "mailto:hello@sayveritas.co.uk"
    },
    
    note: "Questions? Email hello@sayveritas.co.uk or call us at [UK phone number]"
  }
};
```

---

## 2. Homepage Component: `src/app/page.tsx`

```tsx
"use client";

import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { UK_HOMEPAGE } from "@/lib/config/uk-homepage-content";
import { US_HOMEPAGE } from "@/lib/config/us-homepage-content"; // You'll create this similarly
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const { isUK } = useMarketingLocale();
  
  // Select content based on locale
  const content = isUK ? UK_HOMEPAGE : US_HOMEPAGE;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      
      {/* ===================================================================== */}
      {/* HEADER */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <a href="#how-it-works" className="hover:text-[var(--text)]">How it works</a>
            <a href="#who-its-for" className="hover:text-[var(--text)]">Who it's for</a>
            <a href="#pricing" className="hover:text-[var(--text)]">Pricing</a>
            <a href="#trust" className="hover:text-[var(--text)]">Trust & compliance</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/login"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href={content.hero.cta_primary.href}
              className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm text-white hover:opacity-90"
            >
              {content.hero.cta_primary.text}
            </Link>
          </div>
        </div>
      </header>

      <main>
        
        {/* ================================================================= */}
        {/* HERO SECTION */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--background)] to-[var(--surface)]">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs text-[var(--muted)]">
                {content.hero.badge}
              </div>
              
              {/* Headline */}
              <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
                {content.hero.headline}
              </h1>
              
              {/* Subheadline */}
              <p className="mb-10 text-lg leading-relaxed text-[var(--muted)] md:text-xl">
                {content.hero.subheadline}
              </p>
              
              {/* CTAs */}
              <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={content.hero.cta_primary.href}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--primary)] px-8 text-base font-medium text-white hover:opacity-90"
                >
                  {content.hero.cta_primary.text}
                </Link>
                
                  href={content.hero.cta_secondary.href}
                  className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-8 text-base hover:bg-[var(--surface)]"
                >
                  {content.hero.cta_secondary.text}
                </a>
              </div>
              
              {/* Social Proof */}
              <p className="text-sm text-[var(--muted)]">
                {content.hero.proof}
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TRUST BAR */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-[#F8FAFC] py-8">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-6 text-center text-sm font-medium text-[#64748B]">
              {content.trustBar.heading}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {content.trustBar.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-[#475569]">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* THE 3-PRODUCT JOURNEY */}
        {/* ================================================================= */}
        <section id="how-it-works" className="border-b border-[var(--border)] bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                {content.threeProducts.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.threeProducts.subheading}
              </p>
            </div>

            {/* 3 Product Cards */}
            <div className="grid gap-8 md:grid-cols-3">
              {Object.entries(content.threeProducts)
                .filter(([key]) => key !== 'heading' && key !== 'subheading')
                .map(([key, product]) => (
                  <ProductCard key={key} product={product as any} />
                ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PAIN-BASED SEGMENTS */}
        {/* ================================================================= */}
        <section id="who-its-for" className="border-b border-[var(--border)] bg-[#F8FAFC] py-20">
          <div className="mx-auto max-w-6xl px-6">
            
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.segments.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.segments.subheading}
              </p>
            </div>

            {/* Segment Cards */}
            <div className="grid gap-8 md:grid-cols-3">
              {content.segments.cards.map((segment, idx) => (
                <SegmentCard key={idx} segment={segment} />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TIME & ROI */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                {content.timeROI.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.timeROI.subheading}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-8 md:grid-cols-3">
              {content.timeROI.stats.map((stat, idx) => (
                <div key={idx} className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
                  <div className="mb-3 text-5xl">{stat.icon}</div>
                  <div className="mb-2 text-3xl font-bold text-[var(--primary)]">
                    {stat.metric}
                  </div>
                  <div className="mb-3 text-sm font-semibold text-[#0F172A]">
                    {stat.label}
                  </div>
                  <p className="text-sm text-[#64748B]">
                    {stat.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* HOW IT WORKS (Step-by-Step) */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-[#F8FAFC] py-20">
          <div className="mx-auto max-w-6xl px-6">
            
            {/* Section Header */}
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.howItWorks.heading}
              </h2>
            </div>

            {/* Steps */}
            <div className="space-y-16">
              {content.howItWorks.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center gap-8 ${
                    idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-lg font-bold text-white">
                        {step.number}
                      </div>
                      <h3 className="text-2xl font-bold text-[#0F172A]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-lg leading-relaxed text-[#64748B]">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Placeholder Visual */}
                  <div className="flex h-64 w-full flex-1 items-center justify-center rounded-xl border-2 border-[#E2E8F0] bg-gradient-to-br from-[#F1F5F9] to-[#E2E8F0]">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-[var(--primary)] opacity-20" />
                      <p className="text-sm text-[#64748B]">📸 {step.visual}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TRUST & COMPLIANCE */}
        {/* ================================================================= */}
        <section id="trust" className="border-b border-[var(--border)] bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                {content.trust.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.trust.subheading}
              </p>
            </div>

            {/* Trust Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {content.trust.items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-[#E2E8F0] bg-white p-8">
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <h3 className="mb-3 text-lg font-bold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-[#64748B]">
                    {item.description}
                  </p>
                  
                    href={item.linkHref}
                    className="text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    {item.linkText} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PRICING */}
        {/* ================================================================= */}
        <section id="pricing" className="border-b border-[var(--border)] bg-[#F8FAFC] py-20">
          <div className="mx-auto max-w-6xl px-6">
            
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.pricing.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.pricing.subheading}
              </p>
            </div>

            {/* Pricing Tiers */}
            <div className="mb-16 grid gap-8 md:grid-cols-3">
              {content.pricing.tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl border-2 bg-white p-8 ${
                    tier.popular
                      ? 'border-[var(--primary)] shadow-lg'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-1 text-xs font-bold text-white">
                      {tier.badge}
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="mb-2 text-2xl font-bold text-[#0F172A]">
                      {tier.name}
                    </h3>
                    <p className="mb-4 text-sm text-[#64748B]">
                      {tier.audience}
                    </p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-[#0F172A]">
                        {tier.priceDisplay}
                      </span>
                    </div>
                    <p className="text-sm text-[#64748B]">
                      {tier.priceDetail}
                    </p>
                  </div>
                  
                  <p className="mb-6 text-sm leading-relaxed text-[#64748B]">
                    {tier.description}
                  </p>
                  
                  <ul className="mb-8 space-y-3">
                    {tier.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-2 text-sm">
                        <span className="text-[var(--primary)]">✓</span>
                        <span className="text-[#475569]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={tier.cta.href}
                    className={`block w-full rounded-md py-3 text-center font-medium ${
                      tier.popular
                        ? 'bg-[var(--primary)] text-white hover:opacity-90'
                        : 'border-2 border-[var(--border)] bg-transparent text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {tier.cta.text}
                  </Link>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="mx-auto max-w-3xl">
              <h3 className="mb-8 text-center text-2xl font-bold text-[#0F172A]">
                Frequently asked questions
              </h3>
              <div className="space-y-6">
                {content.pricing.faq.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-[#E2E8F0] bg-white p-6">
                    <h4 className="mb-2 font-semibold text-[#0F172A]">
                      {item.question}
                    </h4>
                    <p className="text-sm leading-relaxed text-[#64748B]">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FINAL CTA */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--primary)] to-[#0891b2] py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            
            <h2 className="mb-4 text-4xl font-bold text-white">
              {content.finalCTA.heading}
            </h2>
            
            <p className="mb-8 text-lg text-white/90">
              {content.finalCTA.subheading}
            </p>
            
            <div className="mb-10 grid gap-3 text-left md:grid-cols-2">
              {content.finalCTA.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-white">
                  <span className="mt-1">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mb-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={content.finalCTA.cta_primary.href}
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-base font-medium text-[var(--primary)] shadow-lg hover:bg-white/90"
              >
                {content.finalCTA.cta_primary.text}
              </Link>
              
                href={content.finalCTA.cta_secondary.href}
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-white bg-transparent px-8 text-base font-medium text-white hover:bg-white/10"
              >
                {content.finalCTA.cta_secondary.text}
              </a>
            </div>
            
            <p className="text-sm text-white/80">
              {content.finalCTA.note}
            </p>
          </div>
        </section>

      </main>

      {/* ===================================================================== */}
      {/* FOOTER */}
      {/* ===================================================================== */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            
            {/* Column 1: Brand */}
            <div>
              <div className="mb-3 text-lg font-semibold">SayVeritas</div>
              <p className="text-sm text-[var(--muted)]">
                {isUK 
                  ? "Voice-based learning for UK schools"
                  : "Voice-based learning platform"
                }
              </p>
            </div>
            
            {/* Column 2: Product */}
            <div>
              <div className="mb-3 text-sm font-semibold">Product</div>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li><a href="#how-it-works" className="hover:text-[var(--text)]">How it works</a></li>
                <li><a href="#pricing" className="hover:text-[var(--text)]">Pricing</a></li>
                <li><Link href="/use-cases" className="hover:text-[var(--text)]">Use cases</Link></li>
                <li><Link href="/features" className="hover:text-[var(--text)]">Features</Link></li>
              </ul>
            </div>
            
            {/* Column 3: Company */}
            <div>
              <div className="mb-3 text-sm font-semibold">Company</div>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li><Link href="/about" className="hover:text-[var(--text)]">About us</Link></li>
                <li><Link href="/blog" className="hover:text-[var(--text)]">Blog</Link></li>
                <li><Link href="/demo" className="hover:text-[var(--text)]">Book demo</Link></li>
                <li><a href="mailto:hello@sayveritas.co.uk" className="hover:text-[var(--text)]">Contact</a></li>
              </ul>
            </div>
            
            {/* Column 4: Legal */}
            <div>
              <div className="mb-3 text-sm font-semibold">Legal</div>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li><Link href="/legal/privacy" className="hover:text-[var(--text)]">Privacy policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-[var(--text)]">Terms of service</Link></li>
                <li><Link href="/legal/data-protection" className="hover:text-[var(--text)]">Data protection</Link></li>
                <li><Link href="/compliance/dfe" className="hover:text-[var(--text)]">DfE compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--muted)]">
            <p>© 2026 SayVeritas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// COMPONENT: ProductCard
// ============================================================================
interface ProductCardProps {
  product: {
    icon: string;
    frequency: string;
    name: string;
    tagline: string;
    studentPrompt: string;
    whatHappens: string[];
    teacherBenefit: string;
    ukAlignment: string;
    useCases: string[];
  };
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-2 text-4xl">{product.icon}</div>
        <div className="mb-1 text-sm font-semibold text-[var(--primary)]">
          {product.frequency}
        </div>
        <h3 className="mb-1 text-xl font-bold text-[#0F172A]">
          {product.name}
        </h3>
        <p className="text-sm text-[#64748B]">{product.tagline}</p>
      </div>
      
      {/* Student Prompt */}
      <div className="mb-4 rounded-lg bg-[#F8FAFC] p-3">
        <p className="text-sm italic text-[#475569]">
          {product.studentPrompt}
        </p>
      </div>
      
      {/* What Happens */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase text-[#64748B]">
          What happens
        </div>
        <ul className="space-y-1">
          {product.whatHappens.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[#475569]">
              <span className="text-[var(--primary)]">→</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Teacher Benefit */}
      <div className="mb-4 rounded-lg border-l-4 border-[var(--primary)] bg-[#F0FDFA] p-3">
        <p className="text-sm font-medium text-[#0F172A]">
          {product.teacherBenefit}
        </p>
      </div>
      
      {/* UK Alignment */}
      <div className="mb-4">
        <p className="text-xs text-[#64748B]">
          <span className="font-semibold">UK alignment:</span> {product.ukAlignment}
        </p>
      </div>
      
      {/* Use Cases */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-[#64748B]">
          Use cases
        </div>
        <div className="flex flex-wrap gap-2">
          {product.useCases.map((useCase, idx) => (
            <span
              key={idx}
              className="rounded-full bg-[#E0F2FE] px-2 py-1 text-xs text-[#0369A1]"
            >
              {useCase}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: SegmentCard
// ============================================================================
interface SegmentCardProps {
  segment: {
    icon: string;
    audience: string;
    pains: string[];
    solutions: string[];
    ukSpecific: string;
    cta: {
      text: string;
      href: string;
    };
  };
}

function SegmentCard({ segment }: SegmentCardProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
      {/* Icon & Audience */}
      <div className="mb-6">
        <div className="mb-3 text-4xl">{segment.icon}</div>
        <h3 className="text-xl font-bold text-[#0F172A]">
          {segment.audience}
        </h3>
      </div>
      
      {/* Pains */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-semibold uppercase text-[#DC2626]">
          Challenges you face
        </div>
        <ul className="space-y-2">
          {segment.pains.map((pain, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[#475569]">
              <span className="text-[#DC2626]">✗</span>
              <span>{pain}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Solutions */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-semibold uppercase text-[#059669]">
          How SayVeritas helps
        </div>
        <ul className="space-y-2">
          {segment.solutions.map((solution, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[#475569]">
              <span className="text-[#059669]">✓</span>
              <span>{solution}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* UK-Specific */}
      <div className="mb-6 rounded-lg bg-[#F0F9FF] p-3">
        <p className="text-sm font-medium text-[#0369A1]">
          {segment.ukSpecific}
        </p>
      </div>
      
      {/* CTA */}
      <Link
        href={segment.cta.href}
        className="block w-full rounded-md bg-[var(--primary)] py-3 text-center font-medium text-white hover:opacity-90"
      >
        {segment.cta.text}
      </Link>
    </div>
  );
}
```

---

## 3. US Content Configuration (Mirror Structure): `src/lib/config/us-homepage-content.ts`

```typescript
export const US_HOMEPAGE = {
  hero: {
    badge: "FERPA-Aware • SOC 2 in Progress • AI-Resistant by Design",
    headline: "Voice-based learning platform for grades 6-16",
    subheadline: "Students develop reasoning through speaking—daily practice, weekly checks, and AI-resistant assessments. Save 20+ hours per month. Defeat ChatGPT cheating.",
    cta_primary: { text: "Start Free Trial", href: "/signup", variant: "primary" },
    cta_secondary: { text: "Watch Demo", href: "#video", variant: "outline" },
    proof: "Trusted by universities & K-12 districts • Standards-aligned"
  },

  trustBar: {
    heading: "Built for US schools & universities",
    items: [
      { icon: "🇺🇸", text: "US data hosting" },
      { icon: "✓", text: "FERPA-aware" },
      { icon: "🛡️", text: "AI-resistant" },
      { icon: "📋", text: "Standards-aligned" }
    ]
  },

  threeProducts: {
    heading: "One platform. Every stage of learning.",
    subheading: "From daily practice to summative assessment—all through voice",
    
    daily: {
      icon: "🧠",
      frequency: "Daily (5-10 min)",
      name: "StudyLab",
      tagline: "AI Socratic Tutor",
      studentPrompt: '"Help me study for tomorrow\'s quiz on mitosis"',
      whatHappens: [
        "AI asks probing questions about concepts",
        "Student explains thinking verbally",
        "Gaps identified before class"
      ],
      teacherBenefit: "Dashboard shows who studied + common misconceptions",
      ukAlignment: "", // Not used for US
      useCases: ["Homework review", "Exam prep", "Concept check"]
    },
    
    weekly: {
      icon: "🎤",
      frequency: "2-3× per week (60 sec)",
      name: "Formative Check-ins",
      tagline: "Quick Understanding Capture",
      studentPrompt: '"Summarize today\'s notes in one sentence"',
      whatHappens: [
        "Student records 60-second response",
        "AI scores for accuracy + reasoning",
        "Teacher reviews class in 5 min"
      ],
      teacherBenefit: "Know who's stuck—adjust teaching same day",
      ukAlignment: "",
      useCases: ["Exit tickets", "Homework checks", "Pre-assessment"]
    },
    
    unit: {
      icon: "🛡️",
      frequency: "1-2× per unit (2-5 min)",
      name: "Oral Assessment",
      tagline: "AI-Resistant Evaluation",
      studentPrompt: '"Defend your thesis using evidence"',
      whatHappens: [
        "Student records 2-3 min defense",
        "AI transcribes + scores vs rubric",
        "Teacher validates in 30 min (not 6 hours)"
      ],
      teacherBenefit: "Students can't fake spontaneous reasoning",
      ukAlignment: "",
      useCases: ["Unit tests", "AP/IB prep", "Final projects"]
    }
  },

  segments: {
    heading: "Built for your classroom",
    subheading: "Whatever your level or priorities, SayVeritas adapts",
    
    cards: [
      {
        icon: "🏫",
        audience: "Middle & High School (Grades 6-12)",
        pains: [
          "Students using AI for written work",
          "Teacher burnout from grading",
          "Can't tell who actually understands"
        ],
        solutions: [
          "Oral defenses defeat ChatGPT (must explain verbally)",
          "Review 30 students in 30 min (not 6 hours)",
          "Hear the thinking process in real-time"
        ],
        ukSpecific: "", // Not used
        cta: { text: "See K-12 Use Cases", href: "/use-cases/k12" }
      },
      {
        icon: "🎓",
        audience: "Higher Education",
        pains: [
          "200+ student lectures make oral exams impossible",
          "AI-generated essays epidemic",
          "TAs overwhelmed with grading"
        ],
        solutions: [
          "Asynchronous vivas scale to any class size",
          "Oral responses reveal who used AI",
          "AI-assisted review = 6 hours not 20"
        ],
        ukSpecific: "",
        cta: { text: "See University Use Cases", href: "/use-cases/university" }
      },
      {
        icon: "💼",
        audience: "Language Programs (ESL/MFL)",
        pains: [
          "Speaking proficiency hard to assess at scale",
          "Students need more practice time",
          "Limited teacher bandwidth for 1-on-1"
        ],
        solutions: [
          "Students practice speaking anytime, anywhere",
          "AI provides pronunciation feedback",
          "Track fluency progress automatically"
        ],
        ukSpecific: "",
        cta: { text: "See Language Use Cases", href: "/use-cases/languages" }
      }
    ]
  },

  timeROI: {
    heading: "Stop drowning in grading. Start teaching again.",
    subheading: "Formative assessment that actually saves time",
    stats: [
      {
        metric: "20+ hours/month",
        label: "Time saved",
        explanation: "Review entire class in 30 min vs 6 hours grading",
        icon: "⏱️"
      },
      {
        metric: "3-5×",
        label: "More touchpoints",
        explanation: "Daily + weekly checks vs 2-3 tests per semester",
        icon: "📊"
      },
      {
        metric: "AI-resistant",
        label: "Academic integrity",
        explanation: "Spontaneous oral reasoning can't be faked",
        icon: "🛡️"
      }
    ]
  },

  howItWorks: {
    heading: "Simple workflow. Powerful insights.",
    steps: [
      {
        number: 1,
        title: "Create assessment",
        description: "Choose your standards, set your rubric. Or generate questions with AI based on your learning objectives.",
        visual: "teacher-dashboard.png"
      },
      {
        number: 2,
        title: "Students respond by voice",
        description: "Students record on any device. Works offline. Sequential questions prevent sharing.",
        visual: "student-recording.png"
      },
      {
        number: 3,
        title: "AI scores, you validate",
        description: "AI transcribes and scores. You review, adjust, add feedback in 30 min—not hours.",
        visual: "review-dashboard.png"
      },
      {
        number: 4,
        title: "Track progress automatically",
        description: "Auto-log standards coverage. Generate reports. Identify trends.",
        visual: "analytics.png"
      }
    ]
  },

  trust: {
    heading: "Your data. Your students. Your control.",
    subheading: "Built with teacher authority and student privacy in mind",
    items: [
      {
        icon: "🔒",
        title: "FERPA-aware by design",
        description: "Student data stored securely. No data sold. DPA available for districts.",
        linkText: "Read our Privacy Policy",
        linkHref: "/legal/privacy"
      },
      {
        icon: "✓",
        title: "Teacher review required",
        description: "AI provides suggestions; teachers make final decisions. You retain professional judgment.",
        linkText: "How AI Scoring Works",
        linkHref: "/ai-scoring"
      },
      {
        icon: "👁️",
        title: "Transparent AI",
        description: "See exactly how AI scored. Override any score. AI explains its reasoning.",
        linkText: "View Transparency Report",
        linkHref: "/transparency"
      },
      {
        icon: "⚙️",
        title: "Admin control",
        description: "School/district dashboards. Usage reports. SSO available.",
        linkText: "Admin Features",
        linkHref: "/features/admin"
      }
    ]
  },

  pricing: {
    heading: "Flexible pricing for teachers and schools",
    subheading: "Whether piloting with one class or deploying district-wide",
    
    tiers: [
      {
        name: "Teacher Credits",
        audience: "Individual teachers",
        priceDisplay: "From $15",
        priceDetail: "250 assessment credits",
        description: "Pay as you go—credits never expire. Perfect for trying with one class.",
        features: [
          "250 student assessments",
          "All core features",
          "Standards tagging",
          "Reports & analytics",
          "Email support"
        ],
        cta: { text: "Purchase Credits", href: "/pricing/credits" },
        popular: false
      },
      
      {
        name: "School License",
        audience: "K-12 schools or departments",
        priceDisplay: "From $20/student/year",
        priceDetail: "Minimum 100 students",
        description: "Whole-school or department deployment with training and support.",
        features: [
          "Unlimited assessments",
          "School admin dashboard",
          "Standards tracking",
          "Teacher training included",
          "Priority support",
          "Data export"
        ],
        cta: { text: "Book School Demo", href: "/demo?tier=school" },
        popular: true,
        badge: "Most Popular"
      },
      
      {
        name: "District License",
        audience: "Districts & universities",
        priceDisplay: "Custom pricing",
        priceDetail: "Volume discounts",
        description: "District-wide with centralized billing, SSO, and dedicated support.",
        features: [
          "Everything in School",
          "District dashboards",
          "Centralized billing",
          "SSO integration",
          "Dedicated account manager",
          "Custom onboarding"
        ],
        cta: { text: "Contact Sales", href: "/demo?tier=district" },
        popular: false
      }
    ],
    
    faq: [
      {
        question: "What counts as one 'assessment credit'?",
        answer: "One credit = one student completing one assessment (any length). Credits never expire."
      },
      {
        question: "Can we try before we buy?",
        answer: "Yes! Teachers can start with a small credit pack. Schools get a free 30-day pilot."
      },
      {
        question: "Do you offer multi-year contracts?",
        answer: "Yes. Multi-year school and district licenses receive discounted pricing."
      },
      {
        question: "What about data privacy?",
        answer: "We're FERPA-aware. Student audio is deleted after transcription. No data sold. DPA available."
      }
    ]
  },

  finalCTA: {
    heading: "Ready to transform assessment?",
    subheading: "Join schools moving beyond written tests to authentic oral reasoning.",
    
    benefits: [
      "Free 30-day trial (schools) or small credit pack (teachers)",
      "Full platform access during trial",
      "Implementation support included",
      "Cancel anytime—no long-term contract"
    ],
    
    cta_primary: { text: "Start Free Trial", href: "/signup" },
    cta_secondary: { text: "Book Demo", href: "/demo" },
    
    note: "Questions? Email hello@sayveritas.com"
  }
};
```

---

## Next Steps

1. **Create these files** in your codebase
2. **Replace placeholder images** with actual screenshots when ready
3. **Set up demo booking** flow (Calendly embed or custom form)
4. **Build out landing pages** for:
   - `/use-cases/primary`
   - `/use-cases/secondary`
   - `/demo`
   - `/pricing/credits`
5. **Test locale switching** thoroughly
6. **Get feedback** from 2-3 UK educators before launch

**Would you like me to:**
1. Create the demo booking page next?
2. Design the use-case landing pages?
3. Write the email sequences for demo requests?
4. Create the "How AI Scoring Works" explainer page?


