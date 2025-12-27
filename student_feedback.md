Technical Setup: Student Feedback & Result ReleaseObjective: Enable students to view teacher-verified scores, specific feedback, and annotated transcripts once the teacher has clicked "Release Grade."1. Database Schema Update (Supabase)We need to add fields to running_record_assessments to track the state of the feedback.-- Update the assessments table to handle the feedback loop
ALTER TABLE running_record_assessments 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending', -- 'pending', 'reviewed', 'published'
ADD COLUMN IF NOT EXISTS teacher_comment text,
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS final_score_override float;

-- RLS Policy: Students can only see their own assessments IF they are published
CREATE POLICY "Students can view their published assessments"
  ON running_record_assessments
  FOR SELECT
  USING (
    auth.uid() = student_id AND status = 'published'
  );
2. API Logic: Release ProtocolWhen the teacher clicks "Release Grade" in TeacherReview.jsx, the following backend action must occur:Transaction Start:Update Assessment: Set status = 'published', teacher_comment = {feedback}, published_at = now().Snapshot Overrides: Pull the latest data from running_record_overrides and calculate the final_score_override.Notification: Trigger an edge function to notify the student (email or in-app "nudge").3. Student View ArchitectureThe student report should be a read-only, high-encouragement version of the teacher review screen. It must highlight:The "Verified" Stamp: To differentiate between AI-only and Teacher-reviewed results.The Growth Note: The personal feedback from the teacher.The Audio-Transcript Link: Allowing the student to listen back to their own voice alongside the teacher's corrections.4. JIRA Tasks for Dev TeamTaskDescriptionPriorityDB-05Apply migration for status and teacher_comment columns.HighAPI-12Create POST /api/assessments/[id]/release endpoint (Teacher Only).HighFE-22Build StudentFeedbackReport.jsx (The "Verified" view).MediumFE-23Add "New Feedback" notification toast to Student Dashboard.Low

