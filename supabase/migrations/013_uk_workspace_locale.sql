-- UK Workspace Locale: Database Migration
-- Migration: 013_uk_workspace_locale.sql
-- Date: 2026-01-25
-- Description: Adds school-level locale for UK workspace mode
--              Per uk_centric_build.md: Hard UK locale at workspace (school) creation

-- ============================================
-- SCHOOL LOCALE COLUMN
-- ============================================
-- Add locale column to schools table
-- Values: 'US' (default) | 'UK'
ALTER TABLE schools ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'US';

-- Add constraint to enforce valid locale values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'schools_locale_check'
  ) THEN
    ALTER TABLE schools
      ADD CONSTRAINT schools_locale_check
      CHECK (locale IN ('US', 'UK'));
  END IF;
END;
$$;

-- Locale is immutable after creation (enforced at app level, but we track here)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS locale_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- UPDATE EXISTING UK SCHOOLS
-- ============================================
-- Set locale to UK for schools with UK-related country values
UPDATE schools 
SET locale = 'UK', locale_locked = TRUE
WHERE country IN ('UK', 'GB', 'United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland')
  AND locale = 'US';

-- ============================================
-- UK DEFAULTS VIEW
-- ============================================
-- Convenience view for checking UK locale
CREATE OR REPLACE VIEW uk_schools AS
SELECT 
  id,
  name,
  country,
  locale,
  locale_locked,
  CASE 
    WHEN locale = 'UK' THEN TRUE 
    ELSE FALSE 
  END AS is_uk_workspace
FROM schools;

-- ============================================
-- WORKSPACE LOCALE INHERITANCE
-- ============================================
-- Workspaces inherit locale from school (denormalized for performance)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS locale TEXT;

-- Backfill workspace locales from parent schools
UPDATE workspaces w
SET locale = s.locale
FROM schools s
WHERE w.school_id = s.id
  AND w.locale IS NULL;

-- ============================================
-- TEACHER LOCALE ACCESS
-- ============================================
-- Add locale to teachers view for quick access
-- Teachers inherit locale from their workspace's school
CREATE OR REPLACE VIEW teacher_locale_info AS
SELECT 
  t.id AS teacher_id,
  t.user_id,
  t.workspace_id,
  t.school_id,
  s.locale,
  s.locale_locked,
  CASE 
    WHEN s.locale = 'UK' THEN TRUE 
    ELSE FALSE 
  END AS is_uk_teacher
FROM teachers t
LEFT JOIN schools s ON t.school_id = s.id;

-- ============================================
-- LOCALE UPDATE RESTRICTIONS
-- ============================================
-- Only platform admins can change locale after creation
-- This is enforced at the app level, but we document intent here
COMMENT ON COLUMN schools.locale IS 'Workspace locale (US/UK). Set at creation, immutable for UK schools.';
COMMENT ON COLUMN schools.locale_locked IS 'If true, locale cannot be changed by school admins (UK schools are always locked).';

-- ============================================
-- GRANTS FOR VIEWS
-- ============================================
-- Grant select on views to authenticated users
GRANT SELECT ON uk_schools TO authenticated;
GRANT SELECT ON teacher_locale_info TO authenticated;

-- ============================================
-- UK SCHOOL DEFAULTS FUNCTION
-- ============================================
-- Function to initialize UK defaults when a UK school is created
CREATE OR REPLACE FUNCTION initialize_uk_school_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run for UK schools
  IF NEW.locale = 'UK' THEN
    -- Lock the locale for UK schools
    NEW.locale_locked := TRUE;
    
    -- Create default school descriptors if not exists
    INSERT INTO school_descriptors (school_id, descriptors, is_custom)
    VALUES (
      NEW.id, 
      '["Exceptional", "Strong Standard", "Expected Standard", "Needs Attention", "Urgent Improvement"]'::jsonb,
      FALSE
    )
    ON CONFLICT (school_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run on school insert/update
DROP TRIGGER IF EXISTS trigger_uk_school_defaults ON schools;
CREATE TRIGGER trigger_uk_school_defaults
  BEFORE INSERT OR UPDATE OF locale ON schools
  FOR EACH ROW
  EXECUTE FUNCTION initialize_uk_school_defaults();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON VIEW uk_schools IS 'View of schools with UK locale information for quick filtering';
COMMENT ON VIEW teacher_locale_info IS 'View joining teachers with their school locale for authorization';
