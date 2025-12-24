# Sprint Plan: Artifact + Explanation Evidence Upload
**Product:** SayVeritas V1.1  
**Sprint Duration:** 1 week  
**Target Completion:** February 2026 (after V1 beta feedback)

---

## Feature: Artifact + Explanation Assessment

**Goal:** Allow students to upload photo evidence (lab work, artwork, math solutions, written outlines) alongside oral responses. AI analyzes image to generate contextual follow-up questions.

**Success Metrics:**
- Students can upload images during assessment
- GPT-4o Vision generates relevant follow-ups based on image content
- Teachers see image + audio + transcript in unified review
- CVA teachers use this for traveling student-athletes with lab reports
- Works on mobile (critical for on-the-go uploads)

---

## User Stories

### SV-501: Student Uploads Evidence Image
**As a** student  
**I want** to upload a photo of my work before recording  
**So that** I can show my evidence and explain my reasoning

**Acceptance Criteria:**
- [ ] Assessment question shows optional "Upload Evidence" button
- [ ] Clicking opens device camera/photo library picker
- [ ] Supports JPG, PNG, HEIC formats
- [ ] Max file size: 10MB
- [ ] Image preview displays after selection
- [ ] "Remove" button allows deletion and re-upload
- [ ] Can proceed without image (truly optional)
- [ ] Mobile-optimized (large tap targets, works on iOS/Android)
- [ ] Upload happens before audio recording starts
- [ ] Progress indicator during upload

**Story Points:** 5

---

### SV-502: Teacher Configures Evidence Requirements
**As a** teacher  
**I want** to specify if evidence uploads are required, optional, or disabled  
**So that** I can control assessment format per question

**Acceptance Criteria:**
- [ ] Question builder has "Evidence Upload" setting per question:
  - Disabled (no upload option shown)
  - Optional (student can choose to upload)
  - Required (student must upload to continue)
- [ ] Help tooltip explains: "Students can submit photos of lab work, artwork, written solutions, etc."
- [ ] Default: Optional
- [ ] Setting saves with question
- [ ] If Required, student cannot proceed to recording without image

**Story Points:** 3

---

### SV-503: AI Analyzes Image for Context
**As a** system  
**I want** to analyze uploaded images with GPT-4o Vision  
**So that** follow-up questions reference what student actually created

**Acceptance Criteria:**
- [ ] When student submits response with image:
  - Image uploaded to secure storage (Supabase/S3)
  - Image URL passed to GPT-4o Vision API
  - AI receives: question text + image + audio transcript
  - AI analyzes image for relevant details
- [ ] GPT-4o Vision prompt structure:
```
You are reviewing student work. The student submitted this image as evidence.

Original question: "{question}"
Student's oral explanation: "{transcript}"
Image: [attached]

Analyze the image and generate ONE follow-up question that:
1. References specific elements visible in the image
2. Probes their reasoning, technique, or choices
3. Tests if they understand what they created
4. Is answerable based on what you see

Examples:
- "I see you arranged the beakers in a specific order. Why did you choose this setup?"
- "Your painting uses warm colors in the foreground. What effect were you trying to create?"
- "In your math solution, you used method X on line 3. Why did you choose that approach?"

Generate follow-up question:
```
- [ ] AI identifies visible elements (setup, technique, choices)
- [ ] Follow-up references image specifics, not generic
- [ ] Timeout: 15 seconds (fallback to generic question if fails)
- [ ] Cost monitored (GPT-4o Vision = ~$0.01 per image analysis)

**Story Points:** 13

---

### SV-504: Teacher Reviews Image + Response Together
**As a** teacher  
**I want** to see the uploaded image alongside audio and transcript  
**So that** I can verify student understanding of their own work

**Acceptance Criteria:**
- [ ] Review interface layout:
```
┌────────────────────────────────────────────┐
│ Question 1                                 │
│ "Explain your lab setup and reasoning"     │
│                                            │
│ Student Evidence                           │
│ ┌──────────────────────┐                  │
│ │                      │                  │
│ │   [Image Preview]    │                  │
│ │                      │                  │
│ └──────────────────────┘                  │
│ [🔍 View Full Size] [⬇ Download]         │
│                                            │
│ Student Explanation (0:47)                 │
│ [▶ Play Audio]                            │
│                                            │
│ Transcript                                 │
│ "I arranged the beakers this way because..." │
│                                            │
│ Reasoning: 4/5 | Evidence: 4/5            │
└────────────────────────────────────────────┘
```
- [ ] Image displays in review panel (responsive sizing)
- [ ] Click image to open full-size lightbox
- [ ] Download button exports image with filename: `{student}_{question}_{timestamp}.jpg`
- [ ] If no image uploaded, section shows: "No evidence image submitted"
- [ ] Works on tablet/desktop (teacher primary devices)

**Story Points:** 8

---

### SV-505: Image Storage & Security
**As a** system  
**I want** secure image storage with access controls  
**So that** student work is protected and FERPA-compliant

**Acceptance Criteria:**
- [ ] Images stored in secure cloud storage (Supabase Storage or AWS S3)
- [ ] File naming convention: `{assessment_id}/{student_id}/{question_id}_{timestamp}.jpg`
- [ ] Signed URLs with 24-hour expiration for viewing
- [ ] Only teacher + student + admin can access images
- [ ] Images auto-delete after: 
  - 90 days if assessment not completed
  - 1 year after assessment completion (configurable)
- [ ] EXIF data stripped (privacy - remove GPS, camera info)
- [ ] Virus scanning on upload (ClamAV or cloud service)
- [ ] Backup retention per district policy

**Story Points:** 8

---

### SV-506: Mobile Upload Optimization
**As a** student on mobile  
**I want** fast, reliable image uploads  
**So that** I'm not waiting or blocked by technical issues

**Acceptance Criteria:**
- [ ] Image compression before upload (resize to max 1920px width, 85% quality)
- [ ] Progress bar shows upload percentage
- [ ] Upload happens in background (doesn't block UI)
- [ ] Retry logic: Auto-retry 3 times on failure
- [ ] Error handling:
  - "Upload failed. Check connection and try again." (clear message)
  - [Retry] button visible
  - Can remove failed image and select new one
- [ ] Works on spotty connections (chunked upload if needed)
- [ ] Camera permissions requested with explanation:
  - "SayVeritas needs camera access to capture your work"
  - Links to settings if denied

**Story Points:** 8

---

### SV-507: Export Includes Images
**As a** teacher  
**I want** exported results to include images  
**So that** I have complete records for grading/audits

**Acceptance Criteria:**
- [ ] CSV export includes column: `evidence_image_url`
- [ ] URL is signed with 7-day expiration
- [ ] Batch download option: "Download All Evidence Images" (creates ZIP)
- [ ] ZIP naming: `{assessment_title}_evidence_{date}.zip`
- [ ] ZIP contents organized: `{student_name}/question_{n}.jpg`
- [ ] If printing results, images appear in PDF report

**Story Points:** 5

---

## Database Schema Changes

```sql
-- Add to assessment_questions table
ALTER TABLE assessment_questions ADD COLUMN evidence_upload VARCHAR(20) DEFAULT 'optional';
-- Values: 'disabled', 'optional', 'required'

-- Add to submission_responses table (stores each student response)
ALTER TABLE submission_responses ADD COLUMN evidence_image_url TEXT;
ALTER TABLE submission_responses ADD COLUMN evidence_image_uploaded_at TIMESTAMP;
ALTER TABLE submission_responses ADD COLUMN evidence_image_file_size INT; -- bytes
ALTER TABLE submission_responses ADD COLUMN evidence_image_analyzed BOOLEAN DEFAULT FALSE;

-- Image metadata table (optional, for advanced features later)
CREATE TABLE evidence_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_response_id UUID REFERENCES submission_responses(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  storage_path TEXT NOT NULL,
  file_size_bytes INT,
  mime_type VARCHAR(50),
  width_px INT,
  height_px INT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP,
  ai_description TEXT, -- GPT-4o Vision's understanding of image
  deleted_at TIMESTAMP, -- Soft delete for retention policy
  
  INDEX idx_evidence_submission (submission_response_id),
  INDEX idx_evidence_retention (deleted_at)
);
```

---

## API Endpoints

### Upload Evidence Image

```typescript
POST /api/assessments/:assessmentId/questions/:questionId/upload-evidence

Request (multipart/form-data):
{
  imageFile: File,
  studentId: string
}

Response:
{
  imageUrl: string, // Signed URL for viewing
  uploadedAt: string, // ISO timestamp
  fileSize: number // bytes
}

Error Response:
{
  error: "upload_failed" | "file_too_large" | "invalid_format",
  message: "Image must be under 10MB",
  retryable: true
}
```

### Analyze Image with Vision API

```typescript
POST /api/internal/analyze-evidence-image

Request:
{
  imageUrl: string,
  questionText: string,
  audioTranscript: string
}

Response:
{
  aiDescription: string, // What AI sees in image
  followUpQuestion: string, // Generated follow-up
  analysisTimeMs: number
}
```

---

## Cost Analysis

**Per student submission with image:**
- Image storage: $0.001/image/month (AWS S3 pricing)
- GPT-4o Vision analysis: ~$0.01 per image
- Image compression/processing: negligible
- **Total: ~$0.011 per image submission**

**For 100 students with images:**
- 100 × $0.011 = $1.10 cost
- Revenue at €12/student = €1,200
- Gross margin: 99.9%

**Storage long-term (1 year retention):**
- 1,000 images × $0.001/month × 12 months = $12/year
- Negligible compared to revenue

---

## Definition of Done

### Functionality
- [ ] Student can upload image before recording on mobile + desktop
- [ ] Image displays in student view as preview
- [ ] GPT-4o Vision analyzes image successfully
- [ ] Follow-up questions reference visible elements in image
- [ ] Teacher sees image + audio + transcript in unified review
- [ ] Download/export includes images
- [ ] Works without image if optional (graceful degradation)
- [ ] Blocks progression if required and no image uploaded

### UX
- [ ] Upload flow is intuitive (tested with 5 users)
- [ ] Progress indicators during upload
- [ ] Clear error messages if upload fails
- [ ] Mobile camera access works smoothly
- [ ] Image preview is responsive (fits screen)
- [ ] Full-size image viewer works (lightbox)
- [ ] Teacher can zoom/download images easily

### Performance
- [ ] Image upload completes in < 10 seconds (on 4G connection)
- [ ] Image compression reduces file size by 70%+ (maintains quality)
- [ ] GPT-4o Vision analysis completes in < 8 seconds
- [ ] No memory leaks with large images
- [ ] Works with images up to 10MB

### Security & Privacy
- [ ] Images stored with access controls (only authorized users)
- [ ] EXIF data stripped (no GPS coordinates exposed)
- [ ] Signed URLs expire after 24 hours
- [ ] Auto-deletion after retention period
- [ ] Virus scanning on upload
- [ ] FERPA-compliant storage

### Teacher Experience
- [ ] Can configure upload requirement per question
- [ ] Can view all images in review interface
- [ ] Can download images individually or batch
- [ ] Export CSV includes image URLs
- [ ] Can print/PDF with images included

### Error Handling
- [ ] Upload failure shows clear message + retry option
- [ ] Vision API timeout falls back to generic follow-up
- [ ] Large file warning before upload attempt
- [ ] Invalid format blocked at selection
- [ ] Lost connection handled gracefully (retry on reconnect)

### Documentation
- [ ] Teacher guide: "How to Use Evidence Uploads"
- [ ] Student guide: "Uploading Your Work"
- [ ] FAQ: "What image formats are supported?"
- [ ] Privacy policy updated (image storage explained)

### Testing
- [ ] Unit tests for image compression logic
- [ ] Integration tests for upload → storage → retrieval flow
- [ ] E2E test: Student uploads image → AI analyzes → Teacher views
- [ ] Mobile tested on iOS (Safari, Chrome) + Android (Chrome)
- [ ] Load test: 20 concurrent image uploads
- [ ] Edge cases:
  - Image upload fails mid-process
  - Image file corrupted
  - Vision API returns gibberish
  - Student tries uploading video instead of image
  - Extremely large image (50MB+)

---

## Implementation Priority

### Phase 1: Core Upload (Week 1, Days 1-3)
- [ ] Student image upload UI
- [ ] Image storage integration
- [ ] Teacher review display
- **Goal:** Students can upload, teachers can view

### Phase 2: AI Analysis (Week 1, Days 4-5)
- [ ] GPT-4o Vision integration
- [ ] Context-aware follow-up generation
- [ ] Fallback handling
- **Goal:** AI generates relevant questions based on images

### Phase 3: Polish & Export (Week 1, Days 6-7)
- [ ] Mobile optimization
- [ ] Export functionality
- [ ] Error handling
- [ ] Documentation
- **Goal:** Production-ready, full feature set

---

## CVA Pilot Test Plan

**Target:** 3 veteran teachers + 20 student-athletes

**Test Scenario:**
1. **Lab Report Submission**
   - Student traveling to competition in Europe
   - Takes photo of lab setup before leaving
   - Records explanation from hotel room
   - Uploads setup photo + oral response
   - AI asks: "Why did you arrange equipment this way?"

2. **Math Problem Demonstration**
   - Student shows work on paper
   - Photographs work
   - Explains reasoning orally
   - AI asks: "Walk me through your logic on step 3"

3. **Art Project Critique**
   - Student photographs finished artwork
   - Explains artistic choices
   - AI asks: "What techniques did you use for depth?"

**Success Metrics:**
- 80%+ of students successfully upload images on first try
- Teachers report images help verify understanding
- AI follow-ups rated "relevant" by teachers (4+/5)
- Zero data loss incidents
- Upload time < 15 seconds average

**Feedback Collection:**
- Weekly teacher check-in calls
- Student survey: "Was image upload helpful?"
- Log technical issues (upload failures, API errors)
- Iterate based on feedback

---

## Launch Messaging

**Feature Announcement (February 2026):**

> **New: Artifact + Explanation Assessment**
> 
> Students don't just explain concepts—they show their work and defend their reasoning.
> 
> Upload a photo of your lab setup, artwork, math solution, or written outline. Then explain your thinking orally. Our AI analyzes what you created and asks follow-up questions based on what it sees.
> 
> Perfect for:
> - Lab reports from traveling students
> - Art critiques with visual evidence
> - Math solutions with work shown
> - Essay outlines with reasoning explained
> 
> **Case Study:** "CVA student-athletes submit lab work from international competitions, maintaining academic standards while traveling 20+ weeks per year."

**Marketing Angle:**
- Not just oral assessment
- Not just image upload
- **The integration is the innovation**

**Differentiation:**
- Coraltalk: Oral assessment only
- You: Artifact + explanation with AI probing what it sees

---

## Risk Mitigation

**Risk 1: Image quality too poor for AI analysis**
- **Mitigation:** Require minimum resolution (800px), reject blurry images
- **Fallback:** AI says "Image unclear, proceeding with audio-only follow-up"

**Risk 2: Students upload inappropriate content**
- **Mitigation:** Content moderation API (Google Cloud Vision Safety)
- **Fallback:** Teacher review flags inappropriate images, student notified

**Risk 3: Upload costs spiral**
- **Mitigation:** Track cost per image, alert at $100/month
- **Fallback:** Rate limit: 10 images per student per day

**Risk 4: GPT-4o Vision generates irrelevant follow-ups**
- **Mitigation:** Test with 50 sample images before launch
- **Fallback:** Generic follow-up if Vision analysis confidence < 0.7

---

## Post-Launch Metrics

**Track for 30 days:**
- % of submissions with images uploaded
- Average upload time
- Upload failure rate
- Vision API analysis success rate
- Teacher satisfaction with image review UX
- Cost per image (storage + analysis)
- Feature adoption rate (% of teachers enabling it)

**Success = :**
- 60%+ of students upload images when optional
- 95%+ upload success rate
- < 2% Vision API failures
- Teachers rate feature 4+/5 useful
- Cost stays < $0.02 per image

---

**Document Version:** 1.0  
**Created:** December 24, 2025  
**Next Review:** January 20, 2026 (after V1 beta, before building V1.1)