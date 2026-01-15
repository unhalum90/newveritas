-- Add feedback visibility settings to formative_activities table
-- Run this in Supabase SQL Editor

ALTER TABLE public.formative_activities
ADD COLUMN IF NOT EXISTS show_score_to_student boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_summary_to_student boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_strengths_to_student boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_weaknesses_to_student boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.formative_activities.show_score_to_student IS 'Whether to show AI score to student in feedback';
COMMENT ON COLUMN public.formative_activities.show_summary_to_student IS 'Whether to show AI summary to student in feedback';
COMMENT ON COLUMN public.formative_activities.show_strengths_to_student IS 'Whether to show AI-identified strengths to student';
COMMENT ON COLUMN public.formative_activities.show_weaknesses_to_student IS 'Whether to show AI-identified focus areas to student';
