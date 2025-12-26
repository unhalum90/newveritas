-- Veritas (Sprint 2): School → Workspace → Class → Student (+ RLS)
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  country text,
  school_type text,
  teaching_level text,
  onboarding_stage text not null default '0',
  disabled boolean not null default false,
  school_id uuid,
  workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teachers_user_id_idx on public.teachers(user_id);

-- Backfill columns if teachers already exists
alter table public.teachers add column if not exists school_id uuid;
alter table public.teachers add column if not exists workspace_id uuid;
alter table public.teachers add column if not exists disabled boolean not null default false;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teachers_set_updated_at on public.teachers;
create trigger teachers_set_updated_at
before update on public.teachers
for each row
execute function public.set_updated_at();

alter table public.teachers enable row level security;

drop policy if exists "Teachers can view own row" on public.teachers;
create policy "Teachers can view own row"
on public.teachers
for select
using (auth.uid() = user_id);

drop policy if exists "Teachers can insert own row" on public.teachers;
create policy "Teachers can insert own row"
on public.teachers
for insert
with check (auth.uid() = user_id);

drop policy if exists "Teachers can update own row" on public.teachers;
create policy "Teachers can update own row"
on public.teachers
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Schools
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  school_type text,
  created_at timestamptz default now()
);

-- =========================
-- Admin: School + Platform
-- =========================

-- School admins manage teachers/students for a single school.
-- App enforces access via server routes using the service role, but we keep RLS sane for safety.
create table if not exists public.school_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists school_admins_user_id_idx on public.school_admins(user_id);
create index if not exists school_admins_school_id_idx on public.school_admins(school_id);

alter table public.school_admins enable row level security;

drop policy if exists "School admins can view own row" on public.school_admins;
create policy "School admins can view own row"
on public.school_admins
for select
using (auth.uid() = user_id);

drop policy if exists "School admins can insert own row" on public.school_admins;
create policy "School admins can insert own row"
on public.school_admins
for insert
to authenticated
with check (auth.uid() = user_id);

-- Platform admins are a small allowlist of user ids (super admins).
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

drop policy if exists "Platform admins can view own row" on public.platform_admins;
create policy "Platform admins can view own row"
on public.platform_admins
for select
using (auth.uid() = user_id);

alter table public.schools enable row level security;

drop policy if exists "Schools scoped to teacher" on public.schools;
create policy "Schools scoped to teacher"
on public.schools
for select
using (
  id in (select t.school_id from public.teachers t where t.user_id = auth.uid())
);

drop policy if exists "Teachers can create schools" on public.schools;
create policy "Teachers can create schools"
on public.schools
for insert
to authenticated
with check (true);

-- Workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table public.workspaces enable row level security;

drop policy if exists "Workspaces scoped to teacher" on public.workspaces;
create policy "Workspaces scoped to teacher"
on public.workspaces
for select
using (
  id in (select t.workspace_id from public.teachers t where t.user_id = auth.uid())
);

drop policy if exists "Teachers can create workspaces" on public.workspaces;
create policy "Teachers can create workspaces"
on public.workspaces
for insert
to authenticated
with check (true);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  access_mode text not null default 'code', -- 'code' | 'email' | 'sso'
  created_at timestamptz default now()
);

create index if not exists classes_workspace_id_idx on public.classes(workspace_id);

alter table public.classes enable row level security;

drop policy if exists "Classes scoped to teacher" on public.classes;
create policy "Classes scoped to teacher"
on public.classes
for select
using (
  workspace_id in (select t.workspace_id from public.teachers t where t.user_id = auth.uid())
);

drop policy if exists "Teachers can manage classes" on public.classes;
create policy "Teachers can manage classes"
on public.classes
for all
using (
  workspace_id in (select t.workspace_id from public.teachers t where t.user_id = auth.uid())
)
with check (
  workspace_id in (select t.workspace_id from public.teachers t where t.user_id = auth.uid())
);

-- Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  student_code text unique,
  auth_user_id uuid,
  code_claimed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists students_class_id_idx on public.students(class_id);
create index if not exists students_student_code_idx on public.students(student_code);

alter table public.students enable row level security;

drop policy if exists "Students scoped to teacher" on public.students;
create policy "Students scoped to teacher"
on public.students
for select
using (
  class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
);

drop policy if exists "Teachers can manage students" on public.students;
create policy "Teachers can manage students"
on public.students
for all
using (
  class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
)
with check (
  class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
);

-- =========================
-- Sprint 3: Assessments spine
-- =========================

-- NOTE: This project is early; to remove segments cleanly, drop the old segment-based tables.
-- If you've already run an earlier version of Sprint 3 schema, run these drops first:
--   drop table if exists public.rubric_standards cascade;
--   drop table if exists public.rubrics cascade;
--   drop table if exists public.assessment_questions cascade;
--   drop table if exists public.assessment_segments cascade;
--   drop table if exists public.segment_scores cascade;

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  subject text,
  target_language text,
  instructions text,
  status text not null default 'draft', -- draft | live | closed
  authoring_mode text not null default 'manual', -- manual | upload | ai
  selected_asset_id uuid, -- points to assessment_assets.id (optional, v1)
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill columns if assessments already exists (create table if not exists does not add columns)
alter table public.assessments add column if not exists subject text;
alter table public.assessments add column if not exists target_language text;
alter table public.assessments add column if not exists instructions text;
alter table public.assessments add column if not exists status text not null default 'draft';
alter table public.assessments add column if not exists authoring_mode text not null default 'manual';
alter table public.assessments add column if not exists selected_asset_id uuid;
alter table public.assessments add column if not exists published_at timestamptz;
alter table public.assessments add column if not exists created_at timestamptz not null default now();
alter table public.assessments add column if not exists updated_at timestamptz not null default now();

create index if not exists assessments_class_id_idx on public.assessments(class_id);
create index if not exists assessments_status_idx on public.assessments(status);

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
before update on public.assessments
for each row
execute function public.set_updated_at();

alter table public.assessments enable row level security;

drop policy if exists "Assessments scoped to teacher" on public.assessments;
create policy "Assessments scoped to teacher"
on public.assessments
for select
using (
  class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
);

drop policy if exists "Teachers can create assessments" on public.assessments;
create policy "Teachers can create assessments"
on public.assessments
for insert
with check (
  class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
);

-- Only draft assessments can be updated/deleted. Publishing (draft → live) is allowed,
-- but after status changes away from 'draft', no further updates are allowed.
drop policy if exists "Teachers can update draft assessments" on public.assessments;
create policy "Teachers can update draft assessments"
on public.assessments
for update
using (
  status = 'draft'
  and class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
)
with check (
  class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
);

drop policy if exists "Teachers can delete draft assessments" on public.assessments;
create policy "Teachers can delete draft assessments"
on public.assessments
for delete
using (
  status = 'draft'
  and class_id in (
    select c.id
    from public.classes c
    join public.teachers t on t.workspace_id = c.workspace_id
    where t.user_id = auth.uid()
  )
);

-- Optional metadata for uploads/AI prompts
create table if not exists public.assessment_sources (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  source_type text not null, -- upload | ai
  source_reference text not null, -- storage path, filename, or prompt
  created_at timestamptz not null default now()
);

create index if not exists assessment_sources_assessment_id_idx on public.assessment_sources(assessment_id);

alter table public.assessment_sources enable row level security;

drop policy if exists "Assessment sources scoped to teacher" on public.assessment_sources;
create policy "Assessment sources scoped to teacher"
on public.assessment_sources
for all
using (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
);

create table if not exists public.assessment_integrity (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  pause_threshold_seconds numeric not null default 2.5,
  tab_switch_monitor boolean not null default true,
  shuffle_questions boolean not null default true,
  pledge_enabled boolean not null default false,
  pledge_version int not null default 1,
  pledge_text text,
  recording_limit_seconds int not null default 60,
  viewing_timer_seconds int not null default 20
);

-- Backfill columns if assessment_integrity already exists
alter table public.assessment_integrity add column if not exists pause_threshold_seconds numeric not null default 2.5;
alter table public.assessment_integrity add column if not exists tab_switch_monitor boolean not null default true;
alter table public.assessment_integrity add column if not exists shuffle_questions boolean not null default true;
alter table public.assessment_integrity add column if not exists pledge_enabled boolean not null default false;
alter table public.assessment_integrity add column if not exists pledge_version int not null default 1;
alter table public.assessment_integrity add column if not exists pledge_text text;
alter table public.assessment_integrity add column if not exists recording_limit_seconds int not null default 60;
alter table public.assessment_integrity add column if not exists viewing_timer_seconds int not null default 20;

alter table public.assessment_integrity enable row level security;

drop policy if exists "Assessment integrity scoped to teacher" on public.assessment_integrity;
create policy "Assessment integrity scoped to teacher"
on public.assessment_integrity
for all
using (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
);

create table if not exists public.assessment_assets (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  asset_type text not null, -- image
  asset_url text not null,
  generation_prompt text,
  created_at timestamptz not null default now()
);

-- Backfill columns if assessment_assets already exists
alter table public.assessment_assets add column if not exists asset_type text not null default 'image';
alter table public.assessment_assets add column if not exists asset_url text;
alter table public.assessment_assets add column if not exists generation_prompt text;
alter table public.assessment_assets add column if not exists created_at timestamptz not null default now();

create index if not exists assessment_assets_assessment_id_idx on public.assessment_assets(assessment_id);

alter table public.assessment_assets enable row level security;

drop policy if exists "Assessment assets scoped to teacher" on public.assessment_assets;
create policy "Assessment assets scoped to teacher"
on public.assessment_assets
for all
using (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and a.status = 'draft' and t.user_id = auth.uid()
  )
);

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  evidence_upload text not null default 'optional', -- disabled | optional | required
  question_text text not null,
  question_type text,
  order_index int not null,
  created_at timestamptz not null default now()
);

-- Backfill columns if assessment_questions already exists
alter table public.assessment_questions add column if not exists assessment_id uuid references public.assessments(id) on delete cascade;
alter table public.assessment_questions add column if not exists evidence_upload text not null default 'optional';
alter table public.assessment_questions add column if not exists question_text text;
alter table public.assessment_questions add column if not exists question_type text;
alter table public.assessment_questions add column if not exists order_index int;
alter table public.assessment_questions add column if not exists created_at timestamptz not null default now();

-- Ensure evidence_upload stays in allowed set
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_questions_evidence_upload_chk'
  ) then
    alter table public.assessment_questions
      add constraint assessment_questions_evidence_upload_chk
      check (evidence_upload in ('disabled', 'optional', 'required'));
  end if;
end;
$$;

create unique index if not exists assessment_questions_order_uq
on public.assessment_questions(assessment_id, order_index);

create index if not exists assessment_questions_assessment_id_idx on public.assessment_questions(assessment_id);

alter table public.assessment_questions enable row level security;

drop policy if exists "Assessment questions scoped to teacher" on public.assessment_questions;
create policy "Assessment questions scoped to teacher"
on public.assessment_questions
for all
using (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and a.status = 'draft' and t.user_id = auth.uid()
  )
);

create table if not exists public.rubrics (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  rubric_type text not null, -- reasoning | evidence
  instructions text not null,
  scale_min int not null default 1,
  scale_max int not null default 5,
  created_at timestamptz not null default now(),
  constraint rubrics_scale_chk check (scale_min < scale_max)
);

-- Backfill columns if rubrics already exists (note: if you previously had segment-based rubrics, drop/recreate per note above)
alter table public.rubrics add column if not exists assessment_id uuid references public.assessments(id) on delete cascade;
alter table public.rubrics add column if not exists rubric_type text;
alter table public.rubrics add column if not exists instructions text;
alter table public.rubrics add column if not exists scale_min int not null default 1;
alter table public.rubrics add column if not exists scale_max int not null default 5;
alter table public.rubrics add column if not exists created_at timestamptz not null default now();

create unique index if not exists rubrics_segment_type_uq
on public.rubrics(assessment_id, rubric_type);

create index if not exists rubrics_assessment_id_idx on public.rubrics(assessment_id);

alter table public.rubrics enable row level security;

drop policy if exists "Rubrics scoped to teacher" on public.rubrics;
create policy "Rubrics scoped to teacher"
on public.rubrics
for all
using (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and a.status = 'draft' and t.user_id = auth.uid()
  )
);

create table if not exists public.rubric_standards (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid references public.rubrics(id) on delete cascade,
  framework text not null, -- CCSS | ACTFL | CEFR | AACU
  standard_code text,
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists rubric_standards_uq
on public.rubric_standards(rubric_id, framework, standard_code);

create index if not exists rubric_standards_rubric_id_idx on public.rubric_standards(rubric_id);

alter table public.rubric_standards enable row level security;

drop policy if exists "Rubric standards scoped to teacher" on public.rubric_standards;
create policy "Rubric standards scoped to teacher"
on public.rubric_standards
for all
using (
  exists (
    select 1
    from public.rubrics r
    join public.assessments a on a.id = r.assessment_id
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where r.id = rubric_id and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.rubrics r
    join public.assessments a on a.id = r.assessment_id
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where r.id = rubric_id and a.status = 'draft' and t.user_id = auth.uid()
  )
);

-- Student submissions (attempts) for future Sprint 4 runtime/scoring
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  status text not null default 'started', -- started | submitted
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  scoring_status text not null default 'pending', -- pending | running | complete | error
  scoring_started_at timestamptz,
  scored_at timestamptz,
  scoring_error text,
  integrity_pledge_accepted_at timestamptz,
  integrity_pledge_ip_address text,
  integrity_pledge_version int,
  created_at timestamptz not null default now()
);

create index if not exists submissions_assessment_id_idx on public.submissions(assessment_id);
create index if not exists submissions_student_id_idx on public.submissions(student_id);

-- Backfill columns if submissions already exists
alter table public.submissions add column if not exists scoring_status text not null default 'pending';
alter table public.submissions add column if not exists scoring_started_at timestamptz;
alter table public.submissions add column if not exists scored_at timestamptz;
alter table public.submissions add column if not exists scoring_error text;
alter table public.submissions add column if not exists integrity_pledge_accepted_at timestamptz;
alter table public.submissions add column if not exists integrity_pledge_ip_address text;
alter table public.submissions add column if not exists integrity_pledge_version int;

create index if not exists submissions_scoring_status_idx on public.submissions(scoring_status);

alter table public.submissions enable row level security;

drop policy if exists "Submissions scoped to teacher" on public.submissions;
create policy "Submissions scoped to teacher"
on public.submissions
for select
using (
  exists (
    select 1
    from public.assessments a
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where a.id = assessment_id and t.user_id = auth.uid()
  )
);

-- Integrity events: tab switches, screenshot attempts, etc.
create table if not exists public.integrity_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid references public.assessment_questions(id) on delete set null,
  event_type text not null, -- tab_switch | screenshot_attempt
  duration_ms int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists integrity_events_submission_id_idx on public.integrity_events(submission_id);
create index if not exists integrity_events_created_at_idx on public.integrity_events(created_at);

alter table public.integrity_events enable row level security;

-- Teachers can view events for submissions in their workspace.
drop policy if exists "Integrity events scoped to teacher" on public.integrity_events;
create policy "Integrity events scoped to teacher"
on public.integrity_events
for select
using (
  exists (
    select 1
    from public.submissions sub
    join public.assessments a on a.id = sub.assessment_id
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where sub.id = submission_id and t.user_id = auth.uid()
  )
);

-- Students can insert events only for their own submissions.
drop policy if exists "Students can insert integrity events" on public.integrity_events;
create policy "Students can insert integrity events"
on public.integrity_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.submissions sub
    join public.students s on s.id = sub.student_id
    where sub.id = submission_id and s.auth_user_id = auth.uid()
  )
);

-- Student audio responses (uploaded recordings)
create table if not exists public.submission_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  storage_bucket text not null default 'student-recordings',
  storage_path text not null,
  mime_type text,
  duration_seconds int,
  transcript text,
  created_at timestamptz not null default now()
);

-- Backfill columns if submission_responses already exists
alter table public.submission_responses add column if not exists transcript text;

create unique index if not exists submission_responses_uq
on public.submission_responses(submission_id, question_id);

create index if not exists submission_responses_submission_id_idx on public.submission_responses(submission_id);
create index if not exists submission_responses_question_id_idx on public.submission_responses(question_id);

alter table public.submission_responses enable row level security;

drop policy if exists "Submission responses scoped to teacher" on public.submission_responses;
create policy "Submission responses scoped to teacher"
on public.submission_responses
for select
using (
  exists (
    select 1
    from public.submissions sub
    join public.assessments a on a.id = sub.assessment_id
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where sub.id = submission_id and t.user_id = auth.uid()
  )
);

-- Evidence images (optional uploads before recording)
create table if not exists public.evidence_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  submission_response_id uuid references public.submission_responses(id) on delete set null,
  original_filename text,
  storage_bucket text not null default 'student-evidence',
  storage_path text not null,
  file_size_bytes int,
  mime_type text,
  width_px int,
  height_px int,
  uploaded_at timestamptz not null default now(),
  analyzed_at timestamptz,
  ai_description text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists evidence_images_submission_question_uq
on public.evidence_images(submission_id, question_id);

create index if not exists evidence_images_submission_id_idx on public.evidence_images(submission_id);
create index if not exists evidence_images_question_id_idx on public.evidence_images(question_id);
create index if not exists evidence_images_submission_response_id_idx on public.evidence_images(submission_response_id);
create index if not exists evidence_images_deleted_at_idx on public.evidence_images(deleted_at);

drop trigger if exists evidence_images_set_updated_at on public.evidence_images;
create trigger evidence_images_set_updated_at
before update on public.evidence_images
for each row
execute function public.set_updated_at();

alter table public.evidence_images enable row level security;

drop policy if exists "Evidence images scoped to teacher" on public.evidence_images;
create policy "Evidence images scoped to teacher"
on public.evidence_images
for select
using (
  exists (
    select 1
    from public.submissions sub
    join public.assessments a on a.id = sub.assessment_id
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where sub.id = submission_id and t.user_id = auth.uid()
  )
);

drop policy if exists "Evidence images scoped to student" on public.evidence_images;
create policy "Evidence images scoped to student"
on public.evidence_images
for select
using (
  exists (
    select 1
    from public.submissions sub
    join public.students s on s.id = sub.student_id
    where sub.id = submission_id and s.auth_user_id = auth.uid()
  )
);

drop policy if exists "Students can manage own evidence images" on public.evidence_images;
create policy "Students can manage own evidence images"
on public.evidence_images
for all
using (
  exists (
    select 1
    from public.submissions sub
    join public.students s on s.id = sub.student_id
    where sub.id = submission_id and s.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.submissions sub
    join public.students s on s.id = sub.student_id
    where sub.id = submission_id and s.auth_user_id = auth.uid()
  )
);

-- Scores keyed to a submission so multiple attempts are representable.
create table if not exists public.question_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  question_id uuid references public.assessment_questions(id) on delete cascade,
  scorer_type text not null, -- reasoning | evidence
  score int,
  justification text,
  created_at timestamptz not null default now()
);

create unique index if not exists question_scores_uq
on public.question_scores(submission_id, question_id, scorer_type);

create index if not exists question_scores_submission_id_idx on public.question_scores(submission_id);
create index if not exists question_scores_question_id_idx on public.question_scores(question_id);

alter table public.question_scores enable row level security;

drop policy if exists "Question scores scoped to teacher" on public.question_scores;
create policy "Question scores scoped to teacher"
on public.question_scores
for select
using (
  exists (
    select 1
    from public.submissions sub
    join public.assessments a on a.id = sub.assessment_id
    join public.classes c on c.id = a.class_id
    join public.teachers t on t.workspace_id = c.workspace_id
    where sub.id = submission_id and t.user_id = auth.uid()
  )
);
