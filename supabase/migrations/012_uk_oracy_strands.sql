-- UK Oracy Build: Database Migration
-- Migration: 012_uk_oracy_strands.sql
-- Date: 2026-01-24
-- Description: Adds oracy strand profiles, progression tracking, scaffold fading, and UK localisation

-- ============================================
-- ORACY STRAND PROFILES (13+ subskills)
-- ============================================
CREATE TABLE IF NOT EXISTS oracy_strand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  strand_type TEXT NOT NULL CHECK (strand_type IN ('physical', 'linguistic', 'cognitive', 'social')),
  subskill_markers JSONB NOT NULL DEFAULT '{}',
  baseline_comparison JSONB,
  exploratory_patterns JSONB,  -- Self-correction, tentative reasoning markers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oracy_strand_profiles_student ON oracy_strand_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_oracy_strand_profiles_assessment ON oracy_strand_profiles(assessment_id);

-- ============================================
-- PROGRESSION TRACKING (baseline → latest)
-- ============================================
CREATE TABLE IF NOT EXISTS oracy_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  strand_type TEXT NOT NULL,
  subskill TEXT NOT NULL,
  baseline_value JSONB,
  latest_value JSONB,
  delta_notes TEXT,
  self_reflection TEXT,  -- Student's own reflection on progress
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oracy_progression_student ON oracy_progression(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_oracy_progression_unique ON oracy_progression(student_id, strand_type, subskill);

-- ============================================
-- SCAFFOLD FADING TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS scaffold_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  scaffold_level TEXT NOT NULL CHECK (scaffold_level IN ('heavy', 'light', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scaffold_usage_student ON scaffold_usage(student_id);

-- ============================================
-- SCHOOL-LEVEL DESCRIPTORS (UK configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS school_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  descriptors JSONB NOT NULL DEFAULT '["Exceptional", "Strong Standard", "Expected Standard", "Needs Attention", "Urgent Improvement"]',
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id)
);

-- ============================================
-- UK-SPECIFIC ASSESSMENT COLUMNS
-- ============================================
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS uk_locale_config JSONB DEFAULT NULL;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS oracy_strands TEXT[] DEFAULT NULL;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT 'lesson';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS scaffold_level TEXT DEFAULT 'heavy';

-- ============================================
-- EAL/SLCN TAGGING (analytics, not scoring bias)
-- ============================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS eal_status BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS slcn_status BOOLEAN DEFAULT FALSE;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Oracy strand profiles: teachers can read/write for students in their workspace
ALTER TABLE oracy_strand_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oracy_strand_profiles_teacher_access ON oracy_strand_profiles;
CREATE POLICY oracy_strand_profiles_teacher_access ON oracy_strand_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON t.workspace_id = c.workspace_id
      WHERE s.id = oracy_strand_profiles.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Oracy progression: teachers can read/write for students in their workspace
ALTER TABLE oracy_progression ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oracy_progression_teacher_access ON oracy_progression;
CREATE POLICY oracy_progression_teacher_access ON oracy_progression
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON t.workspace_id = c.workspace_id
      WHERE s.id = oracy_progression.student_id
      AND t.user_id = auth.uid()
    )
  );

-- Scaffold usage: teachers can read/write for students in their workspace
ALTER TABLE scaffold_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scaffold_usage_teacher_access ON scaffold_usage;
CREATE POLICY scaffold_usage_teacher_access ON scaffold_usage
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON t.workspace_id = c.workspace_id
      WHERE s.id = scaffold_usage.student_id
      AND t.user_id = auth.uid()
    )
  );

-- School descriptors: school admins can manage
ALTER TABLE school_descriptors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS school_descriptors_admin_access ON school_descriptors;
CREATE POLICY school_descriptors_admin_access ON school_descriptors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM school_admins sa
      WHERE sa.school_id = school_descriptors.school_id
      AND sa.user_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE oracy_strand_profiles IS 'Voice 21 Framework aligned oracy evidence by strand (Physical, Linguistic, Cognitive, Social)';
COMMENT ON TABLE oracy_progression IS 'Longitudinal tracking of student oracy progression by strand and subskill';
COMMENT ON TABLE scaffold_usage IS 'Tracks scaffold level (heavy/light/none) usage per student assessment';
COMMENT ON TABLE school_descriptors IS 'UK school-configurable descriptors replacing letter grades';
COMMENT ON COLUMN students.eal_status IS 'EAL status for analytics only - does not affect scoring';
COMMENT ON COLUMN students.slcn_status IS 'SLCN status for analytics only - does not affect scoring';
