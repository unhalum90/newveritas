-- Migration: 010_add_session_tracking.sql

create table if not exists public.session_tracking (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default current_date,
  duration_seconds int not null default 0,
  sessions_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  data_classification text not null default 'educational'
);

-- Unique constraint to allow upserts per student per day
create unique index if not exists session_tracking_student_date_idx on public.session_tracking (student_id, date);

alter table public.session_tracking enable row level security;

-- Students can view their own tracking
drop policy if exists "Students can view own session tracking" on public.session_tracking;
create policy "Students can view own session tracking"
on public.session_tracking
for select
using (
  exists (
    select 1 from public.students s
    where s.id = student_id and s.auth_user_id = auth.uid()
  )
);

-- Teachers can view tracking for their students
drop policy if exists "Teachers can view student session tracking" on public.session_tracking;
create policy "Teachers can view student session tracking"
on public.session_tracking
for select
using (
  exists (
    select 1 from public.teachers t
    join public.classes c on c.workspace_id = t.workspace_id
    join public.students s on s.class_id = c.id
    where s.id = student_id and t.user_id = auth.uid()
  )
);
