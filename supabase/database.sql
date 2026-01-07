-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit_trail (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT admin_audit_trail_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_trail_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.api_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model text,
  route text,
  status_code integer,
  latency_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  cost_cents numeric,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'anonymous'::text,
  CONSTRAINT api_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.assessment_analysis_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  class_id uuid,
  teacher_id uuid,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'processing'::text,
  report_version integer NOT NULL DEFAULT 1,
  supersedes_report_id uuid,
  student_count integer,
  completion_rate numeric,
  avg_reasoning_score double precision,
  avg_evidence_score double precision,
  avg_response_length_words integer,
  data_quality jsonb,
  rubric_distributions jsonb,
  misconceptions jsonb,
  reasoning_patterns jsonb,
  evidence_patterns jsonb,
  engagement_indicators jsonb,
  question_effectiveness jsonb,
  suggested_actions jsonb,
  evidence_index jsonb,
  raw_ai_analysis text,
  processing_time_seconds numeric,
  ai_model_version text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT assessment_analysis_reports_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_analysis_reports_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT assessment_analysis_reports_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assessment_analysis_reports_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT assessment_analysis_reports_supersedes_report_id_fkey FOREIGN KEY (supersedes_report_id) REFERENCES public.assessment_analysis_reports(id)
);
CREATE TABLE public.assessment_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  asset_type text NOT NULL,
  asset_url text NOT NULL,
  generation_prompt text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  original_filename text,
  duration_seconds integer,
  max_duration_seconds integer,
  require_full_listen boolean NOT NULL DEFAULT true,
  CONSTRAINT assessment_assets_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_assets_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.assessment_assignments (
  assessment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_assignments_pkey PRIMARY KEY (assessment_id, student_id),
  CONSTRAINT assessment_assignments_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT assessment_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.assessment_integrity (
  assessment_id uuid NOT NULL,
  pause_threshold_seconds numeric,
  tab_switch_monitor boolean NOT NULL DEFAULT false,
  shuffle_questions boolean NOT NULL DEFAULT false,
  recording_limit_seconds integer NOT NULL DEFAULT 60,
  viewing_timer_seconds integer NOT NULL DEFAULT 20,
  pledge_enabled boolean NOT NULL DEFAULT false,
  pledge_version integer NOT NULL DEFAULT 1,
  pledge_text text,
  allow_grace_restart boolean NOT NULL DEFAULT false,
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT assessment_integrity_pkey PRIMARY KEY (assessment_id),
  CONSTRAINT assessment_integrity_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.assessment_question_standards (
  question_id uuid NOT NULL,
  standard_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_question_standards_pkey PRIMARY KEY (question_id, standard_id),
  CONSTRAINT assessment_question_standards_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id),
  CONSTRAINT assessment_question_standards_standard_id_fkey FOREIGN KEY (standard_id) REFERENCES public.standards_nodes(id)
);
CREATE TABLE public.assessment_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  segment_id uuid,
  question_text text NOT NULL,
  question_type text,
  order_index integer NOT NULL,
  assessment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  submission_id uuid,
  kind text NOT NULL DEFAULT 'initial'::text,
  parent_question_id uuid,
  evidence_upload text NOT NULL DEFAULT 'optional'::text CHECK (evidence_upload = ANY (ARRAY['disabled'::text, 'optional'::text, 'required'::text])),
  blooms_level text CHECK (blooms_level IS NULL OR (blooms_level = ANY (ARRAY['remember'::text, 'understand'::text, 'apply'::text, 'analyze'::text, 'evaluate'::text, 'create'::text]))),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT assessment_questions_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_questions_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.assessment_segments(id),
  CONSTRAINT assessment_questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT assessment_questions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT assessment_questions_parent_question_id_fkey FOREIGN KEY (parent_question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.assessment_report_excerpts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  submission_id uuid,
  question_id uuid,
  transcript_text text,
  start_ms integer,
  end_ms integer,
  asr_confidence numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'audio'::text,
  CONSTRAINT assessment_report_excerpts_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_report_excerpts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT assessment_report_excerpts_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT assessment_report_excerpts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.assessment_restart_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  student_id uuid,
  submission_id uuid,
  new_submission_id uuid,
  question_id uuid,
  restart_reason text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_restart_events_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_restart_events_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT assessment_restart_events_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT assessment_restart_events_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT assessment_restart_events_new_submission_id_fkey FOREIGN KEY (new_submission_id) REFERENCES public.submissions(id),
  CONSTRAINT assessment_restart_events_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.assessment_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  segment_type text NOT NULL,
  prompt text,
  time_limit_seconds integer,
  view_limit_seconds integer,
  order_index integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_segments_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_segments_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.assessment_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  source_type text NOT NULL,
  source_reference text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT assessment_sources_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_sources_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.assessment_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  grade_band text,
  blooms_level_avg text,
  description text,
  asset_url text,
  instructions text,
  target_language text,
  questions jsonb NOT NULL,
  rubrics jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  title text NOT NULL,
  subject text,
  target_language text,
  instructions text,
  status text NOT NULL DEFAULT 'draft'::text,
  authoring_mode text NOT NULL DEFAULT 'manual'::text,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  selected_asset_id uuid,
  socratic_enabled boolean NOT NULL DEFAULT false,
  socratic_follow_ups integer NOT NULL DEFAULT 1 CHECK (socratic_follow_ups >= 1 AND socratic_follow_ups <= 2),
  is_practice_mode boolean NOT NULL DEFAULT false,
  data_classification text NOT NULL DEFAULT 'educational'::text,
  has_class_report boolean NOT NULL DEFAULT false,
  latest_report_id uuid,
  scores_last_modified_at timestamp with time zone,
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assessments_latest_report_id_fkey FOREIGN KEY (latest_report_id) REFERENCES public.assessment_analysis_reports(id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid,
  name text NOT NULL,
  description text,
  access_mode text NOT NULL DEFAULT 'code'::text,
  created_at timestamp with time zone DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE TABLE public.credit_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT credit_adjustments_pkey PRIMARY KEY (id),
  CONSTRAINT credit_adjustments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT credit_adjustments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.cultural_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  headline text NOT NULL,
  price_snapshot text,
  top_song text,
  CONSTRAINT cultural_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.evidence_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  question_id uuid NOT NULL,
  submission_response_id uuid,
  original_filename text,
  storage_bucket text NOT NULL DEFAULT 'student-evidence'::text,
  storage_path text NOT NULL,
  file_size_bytes integer,
  mime_type text,
  width_px integer,
  height_px integer,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  analyzed_at timestamp with time zone,
  ai_description text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT evidence_images_pkey PRIMARY KEY (id),
  CONSTRAINT evidence_images_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT evidence_images_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id),
  CONSTRAINT evidence_images_submission_response_id_fkey FOREIGN KEY (submission_response_id) REFERENCES public.submission_responses(id)
);
CREATE TABLE public.integrity_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  question_id uuid,
  event_type text NOT NULL,
  duration_ms integer,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT integrity_events_pkey PRIMARY KEY (id),
  CONSTRAINT integrity_events_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT integrity_events_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.memories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timeline_id uuid,
  author_name text NOT NULL,
  year integer NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  media_url text,
  location text,
  lat double precision,
  lng double precision,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT memories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.platform_admins (
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT platform_admins_pkey PRIMARY KEY (user_id),
  CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.question_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid,
  question_id uuid,
  scorer_type text NOT NULL,
  score integer,
  justification text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT question_scores_pkey PRIMARY KEY (id),
  CONSTRAINT question_scores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT question_scores_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.report_claim_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid,
  claim_id text NOT NULL,
  rating text NOT NULL,
  note text,
  teacher_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT report_claim_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT report_claim_feedback_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.assessment_analysis_reports(id),
  CONSTRAINT report_claim_feedback_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);
CREATE TABLE public.report_evidence_refs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid,
  claim_id text NOT NULL,
  excerpt_id uuid,
  submission_id uuid,
  question_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT report_evidence_refs_pkey PRIMARY KEY (id),
  CONSTRAINT report_evidence_refs_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.assessment_analysis_reports(id),
  CONSTRAINT report_evidence_refs_excerpt_id_fkey FOREIGN KEY (excerpt_id) REFERENCES public.assessment_report_excerpts(id),
  CONSTRAINT report_evidence_refs_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT report_evidence_refs_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.rubric_standards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rubric_id uuid,
  framework text NOT NULL,
  standard_code text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT rubric_standards_pkey PRIMARY KEY (id),
  CONSTRAINT rubric_standards_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id)
);
CREATE TABLE public.rubrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  segment_id uuid,
  rubric_type text NOT NULL,
  instructions text NOT NULL,
  scale_min integer NOT NULL DEFAULT 1,
  scale_max integer NOT NULL DEFAULT 5,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  assessment_id uuid,
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT rubrics_pkey PRIMARY KEY (id),
  CONSTRAINT rubrics_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.assessment_segments(id),
  CONSTRAINT rubrics_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.school_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  school_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT school_admins_pkey PRIMARY KEY (id),
  CONSTRAINT school_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT school_admins_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  school_type text,
  created_at timestamp with time zone DEFAULT now(),
  retention_audio_days integer NOT NULL DEFAULT 30,
  retention_transcript_days integer NOT NULL DEFAULT 30,
  retention_log_days integer NOT NULL DEFAULT 90,
  data_classification text NOT NULL DEFAULT 'anonymous'::text,
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.segment_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid,
  segment_id uuid,
  scorer_type text NOT NULL,
  score integer,
  justification text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT segment_scores_pkey PRIMARY KEY (id),
  CONSTRAINT segment_scores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT segment_scores_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.assessment_segments(id)
);
CREATE TABLE public.standards_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL,
  code text NOT NULL,
  title text,
  description text,
  node_type text NOT NULL DEFAULT 'standard'::text,
  parent_code text,
  sort_order integer,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT standards_nodes_pkey PRIMARY KEY (id),
  CONSTRAINT standards_nodes_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.standards_sets(id)
);
CREATE TABLE public.standards_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  subject text,
  jurisdiction text,
  organization text,
  version text,
  description text,
  source_url text,
  license text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT standards_sets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  student_code text UNIQUE,
  auth_user_id uuid,
  code_claimed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  disabled boolean NOT NULL DEFAULT false,
  consent_audio boolean NOT NULL DEFAULT false,
  consent_audio_at timestamp with time zone,
  consent_revoked_at timestamp with time zone,
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.submission_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  question_id uuid NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'student-recordings'::text,
  storage_path text NOT NULL,
  mime_type text,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  transcript text,
  response_stage text NOT NULL DEFAULT 'primary'::text CHECK (response_stage = ANY (ARRAY['primary'::text, 'followup'::text])),
  ai_followup_question text,
  ai_followup_created_at timestamp with time zone,
  data_classification text NOT NULL DEFAULT 'audio'::text,
  CONSTRAINT submission_responses_pkey PRIMARY KEY (id),
  CONSTRAINT submission_responses_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT submission_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid,
  student_id uuid,
  status text NOT NULL DEFAULT 'started'::text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  scoring_status text NOT NULL DEFAULT 'pending'::text,
  scoring_started_at timestamp with time zone,
  scored_at timestamp with time zone,
  scoring_error text,
  integrity_pledge_accepted_at timestamp with time zone,
  integrity_pledge_ip_address text,
  integrity_pledge_version integer,
  review_status text NOT NULL DEFAULT 'pending'::text,
  teacher_comment text,
  published_at timestamp with time zone,
  final_score_override double precision,
  data_classification text NOT NULL DEFAULT 'educational'::text,
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  priority text,
  status text NOT NULL DEFAULT 'open'::text,
  requester_email text,
  related_user_id uuid,
  related_school_id uuid,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES auth.users(id),
  CONSTRAINT support_tickets_related_school_id_fkey FOREIGN KEY (related_school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  provider text,
  severity text,
  message text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'anonymous'::text,
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teacher_enabled_standards (
  teacher_id uuid NOT NULL,
  standards_set_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_enabled_standards_pkey PRIMARY KEY (teacher_id, standards_set_id),
  CONSTRAINT teacher_enabled_standards_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT teacher_enabled_standards_standards_set_id_fkey FOREIGN KEY (standards_set_id) REFERENCES public.standards_sets(id)
);
CREATE TABLE public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  first_name text,
  last_name text,
  country text,
  school_type text,
  teaching_level text,
  onboarding_stage text NOT NULL DEFAULT '0'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id uuid,
  workspace_id uuid,
  disabled boolean NOT NULL DEFAULT false,
  data_classification text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  data_classification text NOT NULL DEFAULT 'anonymous'::text,
  CONSTRAINT workspaces_pkey PRIMARY KEY (id),
  CONSTRAINT workspaces_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);