-- Add GCSE Assessment Objectives fields to assessments table
-- Ref: UK_Build2.md Sprint 3 - US-9: GCSE AO Tagging (KS4)
-- These fields are only relevant for Key Stage 4 assessments

-- Exam board selection (AQA, Edexcel, OCR, etc.)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS exam_board TEXT;

-- Assessment Objectives as JSON array of IDs (e.g., ["eng-lang-ao1", "eng-lang-ao3"])
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS assessment_objectives JSONB;

-- Index for GCSE filtering (only index rows where these fields are populated)
CREATE INDEX IF NOT EXISTS assessments_exam_board_idx ON public.assessments(exam_board) WHERE exam_board IS NOT NULL;
CREATE INDEX IF NOT EXISTS assessments_key_stage_ks4_idx ON public.assessments(key_stage) WHERE key_stage = 'KS4';
