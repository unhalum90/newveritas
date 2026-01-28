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



