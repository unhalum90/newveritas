-- Migration: Fix Formative Assessment Schema
-- Run this in Supabase SQL Editor to resolve 500 errors in formative submissions.

-- 1. Add missing columns to formative_submissions
ALTER TABLE public.formative_submissions 
ADD COLUMN IF NOT EXISTS artifact_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- 2. Add missing columns to formative_scores
ALTER TABLE public.formative_scores 
ADD COLUMN IF NOT EXISTS accuracy INTEGER,
ADD COLUMN IF NOT EXISTS reasoning INTEGER,
ADD COLUMN IF NOT EXISTS clarity INTEGER,
ADD COLUMN IF NOT EXISTS transfer INTEGER,
ADD COLUMN IF NOT EXISTS overall INTEGER,
ADD COLUMN IF NOT EXISTS scored_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create formative_feedback table (Teacher comments)
CREATE TABLE IF NOT EXISTS public.formative_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.formative_submissions(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    needs_resubmission BOOLEAN DEFAULT FALSE,
    feedback_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create formative_submission_files table (Images/Audio)
CREATE TABLE IF NOT EXISTS public.formative_submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.formative_submissions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'audio')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS and add basic policies for formative_feedback
ALTER TABLE public.formative_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage feedback" ON public.formative_feedback;
CREATE POLICY "Teachers can manage feedback"
ON public.formative_feedback FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.formative_submissions s
    JOIN public.formative_activities a ON s.activity_id = a.id
    WHERE s.id = formative_feedback.submission_id
    AND a.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can view their own feedback" ON public.formative_feedback;
CREATE POLICY "Students can view their own feedback"
ON public.formative_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.formative_submissions s
    JOIN public.students stu ON s.student_id = stu.id
    WHERE s.id = formative_feedback.submission_id
    AND stu.auth_user_id = auth.uid()
  )
);

-- 6. Add RLS for formative_submission_files
ALTER TABLE public.formative_submission_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view submission files" ON public.formative_submission_files;
CREATE POLICY "Teachers can view submission files"
ON public.formative_submission_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.formative_submissions s
    JOIN public.formative_activities a ON s.activity_id = a.id
    WHERE s.id = formative_submission_files.submission_id
    AND a.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can view/create their own submission files" ON public.formative_submission_files;
CREATE POLICY "Students can view/create their own submission files"
ON public.formative_submission_files FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.formative_submissions s
    JOIN public.students stu ON s.student_id = stu.id
    WHERE s.id = formative_submission_files.submission_id
    AND stu.auth_user_id = auth.uid()
  )
);

-- 5. Update formative_scores RLS (to allow teacher management)
DROP POLICY IF EXISTS "Teachers can manage scores" ON public.formative_scores;
CREATE POLICY "Teachers can manage scores"
ON public.formative_scores FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.formative_submissions s
    JOIN public.formative_activities a ON s.activity_id = a.id
    WHERE s.id = formative_scores.submission_id
    AND a.teacher_id = auth.uid()
  )
);

COMMENT ON TABLE public.formative_feedback IS 'Feedback and resubmission requests for formative assessments.';
