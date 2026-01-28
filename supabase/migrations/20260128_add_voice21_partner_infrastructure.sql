-- Add Voice21 Partner Integration infrastructure to schools table
-- Ref: UK_Build2.md Sprint 2 - US-7: Partner Integration Setting
-- This prepares infrastructure for future Voice21 partnership

-- Add voice21_partner flag to schools table (admin-only toggle)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS voice21_partner BOOLEAN DEFAULT FALSE;

-- Add locale column to schools table if not exists (UK/US)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'US';

-- Add scaffold_level column to assessments if not already present
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS scaffold_level TEXT;

-- Index for partner filtering
CREATE INDEX IF NOT EXISTS schools_voice21_partner_idx ON public.schools(voice21_partner) WHERE voice21_partner = TRUE;
CREATE INDEX IF NOT EXISTS schools_locale_idx ON public.schools(locale);
