
-- Migration: Add support for UK AI analysis storage

-- 1. Add ai_analysis column to question_scores
ALTER TABLE question_scores
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

-- 2. Make score column nullable to support qualitative-only feedback
-- (Note: Existing 'score' column might possess NOT NULL constraint, we drop it.)
ALTER TABLE question_scores
ALTER COLUMN score DROP NOT NULL;

-- 3. Add index for ai_analysis (Gin index) for querying markers if needed
CREATE INDEX IF NOT EXISTS idx_qs_ai_analysis ON question_scores USING GIN (ai_analysis);
