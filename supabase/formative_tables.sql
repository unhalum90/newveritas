-- =========================
-- StudyLab: Formative Assessment Tables
-- Run this in Supabase SQL Editor.
--
-- Dependencies:
--   - auth.users (user_id)
--   - public.teachers (user_id maps to auth.users)
--   - public.students (id)
--   - public.classes (id)
-- =========================

-- Formative activities (created by teachers)
create table if not exists public.formative_activities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt_template text,
  rubric_template text not null default 'default', -- default | custom
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'live', 'closed')),
  type text not null default 'pulse' check (type in ('pulse', 'studylab')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data_classification text not null default 'educational'
);

create index if not exists formative_activities_teacher_id_idx on public.formative_activities(teacher_id);
create index if not exists formative_activities_status_idx on public.formative_activities(status);

-- Formative assignments (linking activities to classes)
create table if not exists public.formative_assignments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.formative_activities(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  
  unique(activity_id, class_id)
);

-- Formative submissions (student work)
create table if not exists public.formative_submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.formative_activities(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned', 'submitted', 'reviewed')),
  input_mode text check (input_mode in ('scan', 'voice_memo', 'digital', 'skeleton')),
  artifact_url text, -- For convenience in aggregation
  audio_url text,    -- For convenience in aggregation
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(activity_id, student_id)
);

-- Formative submission files (images/audio)
create table if not exists public.formative_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.formative_submissions(id) on delete cascade,
  file_path text not null,
  file_type text not null check (file_type in ('image', 'audio')),
  created_at timestamptz not null default now()
);

-- Formative scores (teacher evaluation)
create table if not exists public.formative_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.formative_submissions(id) on delete cascade,
  accuracy integer,
  reasoning integer,
  clarity integer,
  transfer integer,
  overall integer,
  rubric_scores jsonb not null default '{}'::jsonb, -- Legacy support/flexible storage
  feedback_audio_url text,
  feedback_text text,
  scored_by uuid references auth.users(id),
  scored_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(submission_id)
);

-- Formative feedback (teacher comments)
create table if not exists public.formative_feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.formative_submissions(id) on delete cascade,
  comment text not null,
  needs_resubmission boolean default false,
  feedback_by uuid references auth.users(id),
  created_at timestamptz default now()
);


-- =========================
-- RLS Policies
-- =========================

alter table public.formative_activities enable row level security;
alter table public.formative_assignments enable row level security;
alter table public.formative_submissions enable row level security;
alter table public.formative_submission_files enable row level security;
alter table public.formative_scores enable row level security;

-- Activities policies
create policy "Teachers can view their own activities"
  on public.formative_activities for select
  using (auth.uid() = teacher_id);

create policy "Teachers can create activities"
  on public.formative_activities for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own activities"
  on public.formative_activities for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own activities"
  on public.formative_activities for delete
  using (auth.uid() = teacher_id);

-- Assignments policies
create policy "Teachers can view assignments for their activities"
  on public.formative_assignments for select
  using (
    exists (
      select 1 from public.formative_activities
      where id = formative_assignments.activity_id
      and teacher_id = auth.uid()
    )
  );

create policy "Teachers can create assignments for their activities"
  on public.formative_assignments for insert
  with check (
    exists (
      select 1 from public.formative_activities
      where id = formative_assignments.activity_id
      and teacher_id = auth.uid()
    )
  );

-- Submissions policies
-- Teachers can view submissions for their activities
create policy "Teachers can view submissions for their activities"
  on public.formative_submissions for select
  using (
    exists (
      select 1 from public.formative_activities
      where id = formative_submissions.activity_id
      and teacher_id = auth.uid()
    )
  );

-- Students can view their own submissions
-- Note: 'students' table doesn't map 1:1 to auth.users easily without a lookup.
-- We rely on the app to query correctly, or if students log in via auth, we can link them.
-- Assuming students have auth_user_id in public.students:
create policy "Students can view their own submissions"
  on public.formative_submissions for select
  using (
    exists (
      select 1 from public.students
      where id = formative_submissions.student_id
      and auth_user_id = auth.uid()
    )
  );

create policy "Students can create/update their own submissions"
  on public.formative_submissions for all
  using (
    exists (
      select 1 from public.students
      where id = formative_submissions.student_id
      and auth_user_id = auth.uid()
    )
  );

-- Files policies (similar to submissions)
create policy "Teachers can view submission files"
  on public.formative_submission_files for select
  using (
    exists (
      select 1 from public.formative_submissions s
      join public.formative_activities a on s.activity_id = a.id
      where s.id = formative_submission_files.submission_id
      and a.teacher_id = auth.uid()
    )
  );

create policy "Students can view/create their own submission files"
  on public.formative_submission_files for all
  using (
    exists (
      select 1 from public.formative_submissions s
      join public.students stu on s.student_id = stu.id
      where s.id = formative_submission_files.submission_id
      and stu.auth_user_id = auth.uid()
    )
  );

-- Scores policies
create policy "Teachers can manage scores"
  on public.formative_scores for all
  using (
    exists (
      select 1 from public.formative_submissions s
      join public.formative_activities a on s.activity_id = a.id
      where s.id = formative_scores.submission_id
      and a.teacher_id = auth.uid()
    )
  );

create policy "Students can view their scores"
  on public.formative_scores for select
  using (
    exists (
      select 1 from public.formative_submissions s
      join public.students stu on s.student_id = stu.id
      where s.id = formative_scores.submission_id
      and stu.auth_user_id = auth.uid()
    )
  );

-- Feedback policies
alter table public.formative_feedback enable row level security;

create policy "Teachers can manage feedback"
  on public.formative_feedback for all
  using (
    exists (
      select 1 from public.formative_submissions s
      join public.formative_activities a on s.activity_id = a.id
      where s.id = formative_feedback.submission_id
      and a.teacher_id = auth.uid()
    )
  );

create policy "Students can view their own feedback"
  on public.formative_feedback for select
  using (
    exists (
      select 1 from public.formative_submissions s
      join public.students stu on s.student_id = stu.id
      where s.id = formative_feedback.submission_id
      and stu.auth_user_id = auth.uid()
    )
  );

