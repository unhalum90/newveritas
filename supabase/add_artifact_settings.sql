-- Add artifact upload settings to formative_activities table
-- Allows teachers to configure how many photos/artifacts students can upload

ALTER TABLE public.formative_activities
ADD COLUMN IF NOT EXISTS require_artifact boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS max_artifact_count smallint NOT NULL DEFAULT 1 CHECK (max_artifact_count >= 1 AND max_artifact_count <= 4);

COMMENT ON COLUMN public.formative_activities.require_artifact IS 'Whether students must upload an artifact (photo/scan)';
COMMENT ON COLUMN public.formative_activities.max_artifact_count IS 'Maximum number of artifact photos allowed (1-4). Use multiple for multi-angle evidence like physical models.';

-- Add max_evidence_count to assessment_questions table
-- Per-question setting for how many photos students can upload as evidence

ALTER TABLE public.assessment_questions
ADD COLUMN IF NOT EXISTS max_evidence_count smallint NOT NULL DEFAULT 1 CHECK (max_evidence_count >= 1 AND max_evidence_count <= 4);

COMMENT ON COLUMN public.assessment_questions.max_evidence_count IS 'Maximum number of evidence photos allowed per question (1-4). Use multiple for multi-angle evidence.';

