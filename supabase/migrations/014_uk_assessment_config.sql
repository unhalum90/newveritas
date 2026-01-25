-- UK Assessment Config: Database Migration
-- Migration: 014_uk_assessment_config.sql
-- Date: 2026-01-25
-- Description: Adds JSONB column to assessments for storing UK-specific configuration
--              (Key Stage, Oracy Strands, Context Type, Scaffold Level)

ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS uk_locale_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN assessments.uk_locale_config IS 'Stores UK-specific metadata: key_stage, oracy_strands, context_type, scaffold_level';
