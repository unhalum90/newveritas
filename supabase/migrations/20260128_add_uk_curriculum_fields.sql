-- Add UK Curriculum fields to assessments table
-- Ref: UK_Build2.md Sprint 1

ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS key_stage TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS year_group SMALLINT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS nc_subject JSONB;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS oracy_focus TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS activity_context TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS curriculum_region TEXT; -- 'UK' | 'US'

-- Index for coverage report performance
CREATE INDEX IF NOT EXISTS assessments_curriculum_region_idx ON public.assessments(curriculum_region);
CREATE INDEX IF NOT EXISTS assessments_key_stage_idx ON public.assessments(key_stage);
CREATE INDEX IF NOT EXISTS assessments_year_group_idx ON public.assessments(year_group);
