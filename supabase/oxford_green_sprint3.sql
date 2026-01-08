-- Oxford Green Sprint 3: Accountability & Agency Schema Changes
-- This migration adds the database schema needed for Oxford Rubric compliance
-- Run this file against your Supabase database

-- ============================================================================
-- 1. TEACHER OVERRIDE REASON TRACKING
-- ============================================================================
-- Add reason tracking to existing submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS override_reason_category TEXT,
ADD COLUMN IF NOT EXISTS override_timestamp TIMESTAMPTZ;

-- Add check constraint for valid reason categories
ALTER TABLE submissions 
ADD CONSTRAINT override_reason_category_check 
CHECK (override_reason_category IS NULL OR override_reason_category IN (
  'accent_dialect',
  'audio_quality', 
  'accommodation',
  'off_task',
  'other'
));

COMMENT ON COLUMN submissions.override_reason IS 'Free text explanation when teacher overrides AI score';
COMMENT ON COLUMN submissions.override_reason_category IS 'Categorized reason: accent_dialect, audio_quality, accommodation, off_task, other';
COMMENT ON COLUMN submissions.override_timestamp IS 'When the override was applied';

-- ============================================================================
-- 2. ASSESSMENT AUDIT LOG (Core accountability feature)
-- ============================================================================
-- Create immutable audit log for all assessment-related events
CREATE TABLE IF NOT EXISTS assessment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  -- Valid types: 'ai_scored', 'teacher_override', 'teacher_comment', 
  --              'review_requested', 'review_resolved', 'published',
  --              'audio_deleted', 'submission_deleted', 'score_changed'
  
  -- Actor information
  actor_id UUID, -- UUID of teacher/admin who performed action
  actor_role TEXT NOT NULL, -- 'ai', 'teacher', 'student', 'admin', 'system'
  
  -- Change tracking
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_submission ON assessment_audit_log(submission_id);
CREATE INDEX IF NOT EXISTS idx_audit_assessment ON assessment_audit_log(assessment_id);
CREATE INDEX IF NOT EXISTS idx_audit_student ON assessment_audit_log(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON assessment_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON assessment_audit_log(event_type);

-- Add check constraint for valid event types
ALTER TABLE assessment_audit_log 
ADD CONSTRAINT audit_event_type_check 
CHECK (event_type IN (
  'ai_scored',
  'teacher_override',
  'teacher_comment',
  'review_requested',
  'review_resolved',
  'published',
  'audio_deleted',
  'submission_deleted',
  'score_changed'
));

-- Add check constraint for valid actor roles
ALTER TABLE assessment_audit_log 
ADD CONSTRAINT audit_actor_role_check 
CHECK (actor_role IN ('ai', 'teacher', 'student', 'admin', 'system'));

COMMENT ON TABLE assessment_audit_log IS 'Immutable audit trail for all assessment-related events. DO NOT UPDATE OR DELETE ROWS.';
COMMENT ON COLUMN assessment_audit_log.event_type IS 'Type of event being logged';
COMMENT ON COLUMN assessment_audit_log.actor_role IS 'Role of the entity that triggered this event';
COMMENT ON COLUMN assessment_audit_log.previous_value IS 'State before the change (JSON)';
COMMENT ON COLUMN assessment_audit_log.new_value IS 'State after the change (JSON)';

-- ============================================================================
-- 3. STUDENT REVIEW REQUESTS
-- ============================================================================
-- Allow students to request teacher review of AI-scored results
CREATE TABLE IF NOT EXISTS student_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  
  -- Student request
  student_note TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' NOT NULL,
  -- Valid statuses: 'pending', 'reviewed', 'updated', 'no_change'
  
  -- Teacher response
  teacher_response TEXT,
  teacher_id UUID REFERENCES teachers(id),
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- One review request per submission
  UNIQUE(submission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON student_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_teacher ON student_review_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_student ON student_review_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_created ON student_review_requests(created_at DESC);

-- Add check constraint for valid statuses
ALTER TABLE student_review_requests 
ADD CONSTRAINT review_status_check 
CHECK (status IN ('pending', 'reviewed', 'updated', 'no_change'));

COMMENT ON TABLE student_review_requests IS 'Student-initiated requests for teacher review of AI-scored assessments';
COMMENT ON COLUMN student_review_requests.status IS 'Current status: pending, reviewed, updated, no_change';

-- ============================================================================
-- 4. AGENCY TOGGLES (Assessment-level controls)
-- ============================================================================
-- Add teacher/admin control toggles to assessments table
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS hide_ai_score_from_students BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_teacher_review_before_release BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disable_ai_feedback BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN assessments.hide_ai_score_from_students IS 'If true, students only see teacher-approved scores';
COMMENT ON COLUMN assessments.require_teacher_review_before_release IS 'If true, teacher must explicitly release results';
COMMENT ON COLUMN assessments.disable_ai_feedback IS 'If true, only transcripts are shown (no AI scoring)';

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Audit log: Teachers can view their own class audit logs
DROP POLICY IF EXISTS "Teachers can view audit logs for their assessments" ON assessment_audit_log;
CREATE POLICY "Teachers can view audit logs for their assessments"
ON assessment_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assessments a
    JOIN classes c ON c.id = a.class_id
    JOIN teachers t ON t.workspace_id = c.workspace_id
    WHERE a.id = assessment_audit_log.assessment_id
    AND t.user_id = auth.uid()
  )
);

-- Audit log: Admins can view all audit logs (platform admins)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON assessment_audit_log;
CREATE POLICY "Admins can view all audit logs"
ON assessment_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.user_id = auth.uid()
  )
);

-- Review requests: Students can create and view their own requests
DROP POLICY IF EXISTS "Students can create review requests" ON student_review_requests;
CREATE POLICY "Students can create review requests"
ON student_review_requests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_review_requests.student_id
    AND s.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can view their own review requests" ON student_review_requests;
CREATE POLICY "Students can view their own review requests"
ON student_review_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_review_requests.student_id
    AND s.auth_user_id = auth.uid()
  )
);

-- Review requests: Teachers can view and update requests for their assessments
DROP POLICY IF EXISTS "Teachers can view review requests for their assessments" ON student_review_requests;
CREATE POLICY "Teachers can view review requests for their assessments"
ON student_review_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM submissions sub
    JOIN assessments a ON a.id = sub.assessment_id
    JOIN classes c ON c.id = a.class_id
    JOIN teachers t ON t.workspace_id = c.workspace_id
    WHERE sub.id = student_review_requests.submission_id
    AND t.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can update review requests for their assessments" ON student_review_requests;
CREATE POLICY "Teachers can update review requests for their assessments"
ON student_review_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM submissions sub
    JOIN assessments a ON a.id = sub.assessment_id
    JOIN classes c ON c.id = a.class_id
    JOIN teachers t ON t.workspace_id = c.workspace_id
    WHERE sub.id = student_review_requests.submission_id
    AND t.user_id = auth.uid()
  )
);

-- Enable RLS on new tables
ALTER TABLE assessment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_review_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to log audit events (call this from your API routes)
CREATE OR REPLACE FUNCTION log_assessment_event(
  p_submission_id UUID,
  p_assessment_id UUID,
  p_student_id UUID,
  p_event_type TEXT,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO assessment_audit_log (
    submission_id,
    assessment_id,
    student_id,
    event_type,
    actor_id,
    actor_role,
    previous_value,
    new_value,
    reason
  ) VALUES (
    p_submission_id,
    p_assessment_id,
    p_student_id,
    p_event_type,
    p_actor_id,
    p_actor_role,
    p_previous_value,
    p_new_value,
    p_reason
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_assessment_event IS 'Helper function to create audit log entries. Call from API routes.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this script, then update your API routes to:
-- 1. Capture override_reason when teachers override scores
-- 2. Call log_assessment_event() for all significant events
-- 3. Implement student review request workflow
-- 4. Respect agency toggles in student-facing views
