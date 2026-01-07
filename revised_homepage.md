# SayVeritas Homepage Rework: Dev Team Implementation Guide

**Project:** Homepage Repositioning - Infrastructure over Feature Focus  
**Goal:** Shift from "grading efficiency tool" to "complete voice-based learning system"  
**Timeline:** Priority 1 changes for immediate deployment

---

## Strategic Repositioning Summary

**OLD POSITIONING:** Assessment tool that saves grading time  
**NEW POSITIONING:** Voice-based learning infrastructure covering daily study → weekly formatives → unit assessments

**KEY ADDITIONS:**
- StudyLab (daily AI-guided Socratic study sessions)
- SayVeritas Pulse (weekly formative voice check-ins)
- SayVeritas Core (unit-level oral assessments)

---

## 1. HERO SECTION (Above the Fold)

### Current State
```
Headline: "Stop grading. Start teaching."
Subheadline: "AI-powered oral assessment that scores student understanding..."
```

### NEW Hero Section

#### Option A: Infrastructure Statement (RECOMMENDED)

**Headline:**
```
Voice-based learning infrastructure for grades 6-16
```

**Subheadline:**
```
Daily Socratic study sessions. Weekly formative check-ins. Unit oral assessments. 
One platform where thinking happens through speaking, not typing.
```

**Supporting Text:**
```
Like Seesaw for secondary education—but designed for reasoning, not just sharing work. 
Students develop verbal thinking as a habit. Teachers see understanding continuously.
```

**CTA Buttons (3 buttons horizontal):**
- Primary: `[See How It Works]` → scrolls to Section 2
- Secondary: `[Try StudyLab Free]` → /studylab-trial
- Tertiary: `[Book Demo]` → /demo

**Visual Element:**
- Keep existing teacher dashboard screenshot OR
- Replace with 3-panel mockup showing: StudyLab interface | Pulse dashboard | Core assessment review

---

#### Option B: Problem-First (Alternative)

**Headline:**
```
Typing doesn't make students think. Speaking does.
```

**Subheadline:**
```
SayVeritas is the complete voice-based learning system: AI-guided study sessions, 
formative voice checks, and AI-resistant oral assessment. From daily practice to unit exams—all through speaking.
```

**Supporting Text:**
```
Just like handwriting beats keyboards for memory, oral reasoning beats essays for understanding. 
We make voice-based learning scalable for every classroom.
```

---

### Implementation Notes for Hero:
- **Font Sizes:** 
  - Headline: 5xl/7xl (mobile/desktop)
  - Subheadline: lg/xl
  - Supporting text: base/lg
- **Background:** Keep current dark gradient
- **Badge Pills:** Update to include:
  - `Daily StudyLab` (teal)
  - `Weekly Pulse` (blue)
  - `Unit Assessments` (purple)
  - `AI-assisted` (green)

---

## 2. NEW SECTION: "How Students Use SayVeritas" (3-Part Story)

**Insert After:** Current hero section  
**Before:** Stats section

### Section Header

**Headline:**
```
From daily practice to unit mastery—voice all the way
```

**Subheadline:**
```
One platform covers the entire learning cycle. Students build verbal reasoning as a daily habit.
```

---

### Layout: Horizontal 3-Column Cards (Desktop) / Vertical Stack (Mobile)

Each card includes:
- Icon
- Frequency badge
- Title
- Student experience
- Teacher benefit
- Use cases list

---

#### Card 1: StudyLab (Daily)

```html
<div class="stage-card">
  <div class="icon">
    <!-- Brain with sound waves icon -->
    🧠💭
  </div>
  
  <div class="badge">Every day • 5-10 min</div>
  
  <h3>Daily Study (StudyLab)</h3>
  
  <div class="student-experience">
    <h4>Student experience:</h4>
    <p class="example-dialogue">
      "Help me study for tomorrow's quiz on mitosis"<br>
      → AI asks probing questions<br>
      → Student explains concepts verbally<br>
      → AI identifies gaps, suggests review
    </p>
  </div>
  
  <div class="teacher-benefit">
    <h4>Teacher benefit:</h4>
    <p>Dashboard shows who studied + common misconceptions before class even starts</p>
  </div>
  
  <div class="use-cases">
    <h4>Use cases:</h4>
    <ul>
      <li>Homework review</li>
      <li>Exam prep</li>
      <li>Concept reinforcement</li>
      <li>Self-paced learning</li>
    </ul>
  </div>
  
  <a href="/studylab" class="learn-more">Learn more →</a>
</div>
```

**Design Specs:**
- Background: Subtle gradient (teal accent)
- Border-left: 4px solid teal
- Hover state: Lift with shadow

---

#### Card 2: SayVeritas Pulse (Weekly)

```html
<div class="stage-card">
  <div class="icon">
    <!-- Microphone with checkmark icon -->
    🎤✓
  </div>
  
  <div class="badge">2-3x per week • 60 seconds</div>
  
  <h3>Weekly Check-Ins (Pulse)</h3>
  
  <div class="student-experience">
    <h4>Student experience:</h4>
    <p class="example-dialogue">
      "Summarize today's notes in one sentence"<br>
      → Student records quick response<br>
      → AI scores for accuracy, reasoning, clarity<br>
      → Teacher reviews in 5 minutes (entire class)
    </p>
  </div>
  
  <div class="teacher-benefit">
    <h4>Teacher benefit:</h4>
    <p>Instant data on who's getting it, who needs help, what to reteach tomorrow</p>
  </div>
  
  <div class="use-cases">
    <h4>Use cases:</h4>
    <ul>
      <li>Exit tickets that students actually do</li>
      <li>Formative feedback without grading burden</li>
      <li>Real-time instructional adjustment</li>
    </ul>
  </div>
  
  <a href="/pulse" class="learn-more">Learn more →</a>
</div>
```

**Design Specs:**
- Background: Subtle gradient (blue accent)
- Border-left: 4px solid blue

---

#### Card 3: SayVeritas Core (Unit-Level)

```html
<div class="stage-card">
  <div class="icon">
    <!-- Graduation cap with shield icon -->
    🎓🛡️
  </div>
  
  <div class="badge">1-2x per unit • 2-5 min per student</div>
  
  <h3>Unit Assessment (Core)</h3>
  
  <div class="student-experience">
    <h4>Student experience:</h4>
    <p class="example-dialogue">
      "Explain the causes of WWI using evidence from primary sources"<br>
      → Student records 2-3 minute response<br>
      → AI asks Socratic follow-ups<br>
      → AI transcribes + scores, teacher validates
    </p>
  </div>
  
  <div class="teacher-benefit">
    <h4>Teacher benefit:</h4>
    <p>30 minutes to review 90 students (vs. 6 hours grading essays)<br>
    AI-resistant assessment (can't fake spontaneous reasoning)</p>
  </div>
  
  <div class="use-cases">
    <h4>Use cases:</h4>
    <ul>
      <li>Unit exams</li>
      <li>Oral defenses</li>
      <li>AP/IB oral assessments</li>
      <li>Final presentations</li>
    </ul>
  </div>
  
  <a href="/core-assessment" class="learn-more">Learn more →</a>
</div>
```

**Design Specs:**
- Background: Subtle gradient (purple accent)
- Border-left: 4px solid purple

---

### Visual Timeline Element (Below Cards)

Add a horizontal progress line connecting the three stages:

```html
<div class="timeline-visual">
  <div class="timeline-line"></div>
  <div class="timeline-markers">
    <div class="marker">
      <span class="label">Practice</span>
      <span class="sublabel">Daily</span>
    </div>
    <div class="marker">
      <span class="label">Check-in</span>
      <span class="sublabel">Weekly</span>
    </div>
    <div class="marker">
      <span class="label">Summative</span>
      <span class="sublabel">Unit-level</span>
    </div>
  </div>
</div>

<p class="timeline-message">
  One platform covers the entire learning cycle
</p>
```

---

## 3. NEW SECTION: Education Level Segmentation

**Insert After:** 3-Part Story section  
**Before:** Current Stats section

### Section Header

**Headline:**
```
Built for how different levels actually learn
```

**Subheadline:**
```
Whether you teach middle school, high school, or college—SayVeritas adapts to your pedagogical needs.
```

---

### Layout: 3-Column Cards

#### Column 1: Middle School (Grades 6-8)

```html
<div class="level-card">
  <div class="level-icon">
    <!-- Image: Middle schoolers with laptops -->
  </div>
  
  <h3>Middle School<br><span class="grade-range">Grades 6-8</span></h3>
  
  <div class="pain-points">
    <h4>Pain Points:</h4>
    <ul>
      <li>Students struggle to articulate thinking</li>
      <li>Wide range of writing abilities</li>
      <li>Need frequent formative feedback</li>
    </ul>
  </div>
  
  <div class="how-helps">
    <h4>How SayVeritas Helps:</h4>
    <ul>
      <li><strong>StudyLab:</strong> Scaffolds verbal reasoning through daily practice</li>
      <li><strong>Pulse:</strong> Quick checks show who's lost before tests</li>
      <li><strong>Core:</strong> Assesses understanding separate from writing ability</li>
    </ul>
  </div>
  
  <div class="use-cases">
    <h4>Key Use Cases:</h4>
    <ul>
      <li>Building foundational oral reasoning skills</li>
      <li>Catching learning gaps early</li>
      <li>Supporting diverse learners</li>
    </ul>
  </div>
  
  <blockquote class="testimonial">
    "My 7th graders can explain scientific concepts they can't write about yet. 
    This tool reveals their actual understanding."
    <cite>— Middle School Science Teacher</cite>
  </blockquote>
</div>
```

---

#### Column 2: High School (Grades 9-12)

```html
<div class="level-card">
  <div class="level-icon">
    <!-- Image: High school students in discussion -->
  </div>
  
  <h3>High School<br><span class="grade-range">Grades 9-12</span></h3>
  
  <div class="pain-points">
    <h4>Pain Points:</h4>
    <ul>
      <li>AP/IB rigor demands authentic assessment</li>
      <li>Student-athletes miss class for travel</li>
      <li>AI making written work unreliable</li>
    </ul>
  </div>
  
  <div class="how-helps">
    <h4>How SayVeritas Helps:</h4>
    <ul>
      <li><strong>StudyLab:</strong> Students study independently (crucial for advanced courses)</li>
      <li><strong>Pulse:</strong> Teachers stay connected with traveling students</li>
      <li><strong>Core:</strong> AP/IB-style oral defenses at scale</li>
    </ul>
  </div>
  
  <div class="use-cases">
    <h4>Key Use Cases:</h4>
    <ul>
      <li>AP oral exam preparation</li>
      <li>Traveling student assessment</li>
      <li>Academic integrity restoration</li>
      <li>Honors/IB rigor</li>
    </ul>
  </div>
  
  <blockquote class="testimonial">
    "We require oral defense of research papers now. Students who used AI to write 
    can't explain their own thesis."
    <cite>— AP Literature Teacher</cite>
  </blockquote>
</div>
```

---

#### Column 3: Higher Ed (College/University)

```html
<div class="level-card">
  <div class="level-icon">
    <!-- Image: College lecture hall -->
  </div>
  
  <h3>Higher Education<br><span class="grade-range">College & University</span></h3>
  
  <div class="pain-points">
    <h4>Pain Points:</h4>
    <ul>
      <li>200+ student lectures (oral assessment impossible)</li>
      <li>TAs overwhelmed with grading</li>
      <li>AI-generated essays epidemic</li>
    </ul>
  </div>
  
  <div class="how-helps">
    <h4>How SayVeritas Helps:</h4>
    <ul>
      <li><strong>StudyLab:</strong> Scales Socratic method to large lectures</li>
      <li><strong>Pulse:</strong> Flipped classroom support (check prep before class)</li>
      <li><strong>Core:</strong> Efficient oral exams (200 students in 6 hours, not weeks)</li>
    </ul>
  </div>
  
  <div class="use-cases">
    <h4>Key Use Cases:</h4>
    <ul>
      <li>Large lecture courses</li>
      <li>Graduate seminar discussions</li>
      <li>Online/hybrid courses</li>
      <li>Research presentation practice</li>
    </ul>
  </div>
  
  <blockquote class="testimonial">
    "I teach 250 students. SayVeritas let me bring oral assessment back without hiring 10 TAs."
    <cite>— University Professor</cite>
  </blockquote>
</div>
```

---

## 4. STATS SECTION (Revised)

**Current stats focus on time savings. Reframe around insight + authenticity.**

### New Section Header

**Headline:**
```
Reclaim your time. But that's just the beginning.
```

**Subheadline:**
```
Yes, you'll save hours on grading. But the real value? Seeing student thinking every day, not just at test time.
```

---

### 3-Column Stats (Replace Existing)

#### Column 1: Continuous Insight

```html
<div class="stat-card">
  <div class="stat-visual">
    <!-- Icon: Calendar with checkmarks -->
  </div>
  
  <h3>Every day, not just test day</h3>
  
  <div class="stat-number">3-5x</div>
  <div class="stat-label">more touchpoints with student thinking</div>
  
  <p class="stat-explanation">
    Daily StudyLab + weekly Pulse means you see student thinking 15-20 times per unit 
    (vs. 2-3 times with traditional tests)
  </p>
  
  <div class="stat-impact">
    <strong>Impact:</strong> Catch misconceptions when they form, not after they're baked in
  </div>
</div>
```

---

#### Column 2: Time Redeployed

```html
<div class="stat-card">
  <div class="stat-visual">
    <!-- Icon: Clock with arrow -->
  </div>
  
  <h3>From grading to teaching</h3>
  
  <div class="stat-number">6 hours</div>
  <div class="stat-label">saved per week</div>
  
  <p class="stat-explanation">
    AI handles transcription + scoring suggestions. You validate + intervene where it matters.
  </p>
  
  <div class="stat-impact">
    <strong>Impact:</strong> Spend time with the 10-15% who need you most, not on routine grading
  </div>
</div>
```

---

#### Column 3: Authentic Assessment

```html
<div class="stat-card">
  <div class="stat-visual">
    <!-- Icon: Shield with checkmark -->
  </div>
  
  <h3>Can't fake thinking in real-time</h3>
  
  <div class="stat-number">AI-resistant</div>
  <div class="stat-label">by design</div>
  
  <p class="stat-explanation">
    Spontaneous oral reasoning + Socratic follow-ups defeat memorization and AI-generated scripts
  </p>
  
  <div class="stat-impact">
    <strong>Impact:</strong> Trust your grades again. Students develop actual reasoning skills.
  </div>
</div>
```

---

## 5. FEATURES SECTION (Reframed Context)

**Keep existing 6-feature grid, but update descriptions to add context:**

### Updated Feature Descriptions

**Socratic follow-ups**
```
OLD: "Adaptive probing based on what students actually say"
NEW: "Like office hours with every student—scaled to 200"
```

**Question rotation**
```
OLD: "Create multiple prompts that assess the same target skill"
NEW: "Different questions, same skill—answers can't spread"
```

**Integrity settings**
```
OLD: "Time limits and integrity options that don't interrupt experience"
NEW: "Flags inform review, don't punish automatically"
```

**Teacher-validated scoring**
```
OLD: "AI assists, teachers maintain professional judgment"
NEW: "AI suggests, you decide—always"
```

**Works on any device**
```
OLD: "Students record on phones, tablets, or laptops"
NEW: "Students record on phones—no app required"
```

**Admin-ready**
```
OLD: "School admin onboarding and bulk account workflows"
NEW: "School/district dashboards + bulk onboarding"
```

---

## 6. TESTIMONIAL SECTION (Revised)

**Replace single testimonial with 3-testimonial progression showing different use cases:**

### Layout: 3-Column Testimonial Cards

#### Testimonial 1: Daily Use (StudyLab)

```html
<div class="testimonial-card">
  <div class="testimonial-icon">💭</div>
  
  <blockquote>
    "My students use StudyLab every night to review concepts. I see who's stuck 
    before class even starts. It's like having office hours with all 90 students simultaneously."
  </blockquote>
  
  <div class="testimonial-attribution">
    <div class="avatar"><!-- Placeholder avatar --></div>
    <div class="details">
      <p class="name">Sarah M.</p>
      <p class="role">High School Chemistry Teacher</p>
    </div>
  </div>
</div>
```

---

#### Testimonial 2: Formative (Pulse)

```html
<div class="testimonial-card">
  <div class="testimonial-icon">🎤</div>
  
  <blockquote>
    "60-second voice checks replaced my written exit tickets. Completion went from 40% to 85% 
    because students don't perceive it as homework."
  </blockquote>
  
  <div class="testimonial-attribution">
    <div class="avatar"><!-- Placeholder avatar --></div>
    <div class="details">
      <p class="name">Michael T.</p>
      <p class="role">Middle School History Teacher</p>
    </div>
  </div>
</div>
```

---

#### Testimonial 3: Summative (Core)

```html
<div class="testimonial-card">
  <div class="testimonial-icon">🎓</div>
  
  <blockquote>
    "I was drowning in essay grading. Now I assign oral defenses. Students can't fake depth 
    in real-time, and I review 30 students in 30 minutes."
  </blockquote>
  
  <div class="testimonial-attribution">
    <div class="avatar"><!-- Placeholder avatar --></div>
    <div class="details">
      <p class="name">Dr. Jennifer L.</p>
      <p class="role">College Professor</p>
    </div>
  </div>
</div>
```

---

## 7. FINAL CTA SECTION (Revised)

**Replace existing CTA section:**

### New CTA Section

**Headline:**
```
Ready to make voice-based learning your classroom's infrastructure?
```

**Subheadline:**
```
Join schools where students think through speaking—from daily study sessions to unit exams. 
Beta launching this month.
```

**CTA Buttons (3 options):**
```html
<div class="cta-buttons">
  <a href="/demo" class="btn-primary">Request Demo</a>
  <a href="/waitlist" class="btn-secondary">Join Waitlist</a>
  <a href="/webinar" class="btn-tertiary">Attend Webinar</a>
</div>
```

**Supporting Text:**
```
Start with StudyLab (free for 30 days), expand to full assessments when ready.
```

---

## 8. NAVIGATION UPDATE

**Add StudyLab to main navigation:**

### Current Nav
```
Home | How it works | Features | Use cases | Trust | Sign in
```

### New Nav
```
Home | How it works | StudyLab | Pulse | Features | Use cases | Trust | Sign in
```

**Nav Item Details:**
- **StudyLab** → /studylab (new page explaining daily AI-guided study)
- **Pulse** → /pulse (new page explaining weekly formatives)

---

## 9. MOBILE RESPONSIVENESS REQUIREMENTS

### Hero Section (Mobile)
- Stack badge pills vertically
- Single-column CTA buttons
- Reduce headline to 3xl font size
- Screenshot becomes carousel (if showing 3-panel mockup)

### 3-Part Story (Mobile)
- Cards stack vertically
- Timeline becomes vertical progress bar on left side
- Collapse "use cases" into accordions to save space

### Education Level Segmentation (Mobile)
- Cards stack vertically
- Testimonials collapse into "Read more" expandable sections

### Stats Section (Mobile)
- Cards stack vertically
- Stat numbers remain prominent
- Explanatory text remains visible

---

## 10. COPY CHANGES SUMMARY TABLE

| Section | Current Copy | New Copy |
|---------|-------------|----------|
| **Hero Headline** | "Stop grading. Start teaching." | "Voice-based learning infrastructure for grades 6-16" |
| **Hero Subheadline** | "AI-powered oral assessment that scores..." | "Daily Socratic study sessions. Weekly formative check-ins. Unit oral assessments..." |
| **Primary Value Prop** | "Assessment that can't be faked" | "One platform where thinking happens through speaking, not typing" |
| **Stats Focus** | Time savings only | Continuous insight + time savings + authenticity |
| **Final CTA** | "Ready to reclaim your time?" | "Ready to make voice-based learning your classroom's infrastructure?" |

---

## 11. NEW PAGES NEEDED

Create these new landing pages (linked from new nav):

### /studylab
**Purpose:** Explain daily AI-guided Socratic study sessions  
**Key sections:**
- What is StudyLab?
- How it works (student + teacher view)
- Example study session dialogue
- Benefits (for students and teachers)
- Free 30-day trial CTA

### /pulse
**Purpose:** Explain weekly formative voice check-ins  
**Key sections:**
- What is Pulse?
- How it works (60-second check-in flow)
- Teacher morning dashboard preview
- Benefits (instant class-level insights)
- Pilot program CTA

---

## 12. DESIGN SYSTEM UPDATES

### New Color Accents for Product Tiers
```css
--studylab-accent: #14b8a6; /* Teal */
--pulse-accent: #60a5fa; /* Blue */
--core-accent: #a78bfa; /* Purple */
```

### Badge Component (New)
```html
<span class="frequency-badge" data-tier="studylab">
  Every day • 5-10 min
</span>
```

### Card Hover States
- Add lift animation (translateY(-4px))
- Add subtle shadow on hover
- Add left border accent color on hover

---

## 13. ANALYTICS TRACKING REQUIREMENTS

Add event tracking for:
- `hero_cta_click` (track which button: See How It Works | Try StudyLab | Book Demo)
- `3part_story_card_click` (track which stage: StudyLab | Pulse | Core)
- `education_level_card_click` (track: Middle School | High School | Higher Ed)
- `testimonial_view` (track which testimonial is in viewport)
- `nav_click` (track: StudyLab | Pulse clicks from nav)

---

## 14. SEO UPDATES NEEDED

### Meta Title
```
OLD: "SayVeritas - AI-Powered Oral Assessment Platform"
NEW: "SayVeritas - Voice-Based Learning Infrastructure for Grades 6-16"
```

### Meta Description
```
OLD: "Transform oral assessment with AI-powered scoring..."
NEW: "Complete voice-based learning system: Daily AI study sessions, weekly formatives, 
and unit oral assessments. Make student thinking visible—from practice to mastery."
```

### H1 (Hero Headline)
```
Voice-based learning infrastructure for grades 6-16
```

### Schema.org Structured Data
Add `Product` schema with 3 product tiers:
- SayVeritas StudyLab
- SayVeritas Pulse
- SayVeritas Core

---

## 15. PRIORITY IMPLEMENTATION ORDER

### Phase 1 (Deploy First - Week 1)
1. ✅ Hero section copy + CTA updates
2. ✅ Navigation addition (StudyLab, Pulse links)
3. ✅ Final CTA section rewrite
4. ✅ Stats section reframe

### Phase 2 (Deploy Second - Week 2)
5. ✅ 3-Part Story section (full build)
6. ✅ Education level segmentation section
7. ✅ Feature descriptions context updates
8. ✅ Testimonial section progression

### Phase 3 (New Pages - Week 3)
9. ✅ /studylab landing page
10. ✅ /pulse landing page

### Phase 4 (Polish - Week 4)
11. ✅ Mobile responsive refinements
12. ✅ Analytics tracking implementation
13. ✅ SEO metadata updates
14. ✅ A/B test setup (if desired)

---

## 16. QA CHECKLIST

Before deployment, verify:
- [ ] All links functional (especially new nav items)
- [ ] Mobile responsive at 320px, 768px, 1024px, 1440px breakpoints
- [ ] CTA buttons trigger correct actions
- [ ] Images optimized (WebP format, lazy loading)
- [ ] Page load time <2 seconds
- [ ] Accessibility (WCAG 2.1 AA): proper heading hierarchy, alt text, color contrast
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Analytics events firing correctly

---

## 17. ASSETS NEEDED FROM MARKETING/DESIGN

Provide to dev team:
- [ ] StudyLab interface screenshot/mockup
- [ ] Pulse dashboard screenshot/mockup
- [ ] 3-panel hero visual (StudyLab | Pulse | Core)
- [ ] Education level photos (middle school, high school, college)
- [ ] Testimonial headshots (3 placeholder avatars if real photos unavailable)
- [ ] Icon set for timeline markers
- [ ] Badge pill designs for product tiers

---

## SUMMARY: What This Accomplishes

**Before:** Homepage says "We're a grading efficiency tool"  
**After:** Homepage says "We're complete voice-based learning infrastructure"

**Before:** Focus on teachers saving time  
**After:** Focus on students thinking daily + teachers seeing understanding continuously

**Before:** One product (oral assessment)  
**After:** Three-tier system (StudyLab → Pulse → Core)

**Before:** Occasional use (unit exams)  
**After:** Always-on infrastructure (daily → weekly → summative)

**This repositions SayVeritas from "optional tool" to "essential infrastructure"—which is the foundation for sustainable growth.**

---

**Questions for dev team? Contact:** [Your contact info]  
**Design mockups:** [Link to Figma/design files]  
**Timeline:** Deploy Phase 1 by [specific date]