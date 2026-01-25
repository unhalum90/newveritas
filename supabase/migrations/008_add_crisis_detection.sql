-- Migration: 008_add_crisis_detection.sql

-- 1. Add dsl_email to schools
alter table public.schools add column if not exists dsl_email text;

-- 2. Add crisis_flagged to submissions
alter table public.submissions add column if not exists crisis_flagged boolean not null default false;

-- 3. Create crisis_alerts table
create table if not exists public.crisis_alerts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  keyword_detected text,
  context_excerpt text,
  alerted_at timestamptz default now(),
  dsl_email_sent_to text,
  data_classification text not null default 'sensitive'
);

create index if not exists crisis_alerts_school_id_idx on public.crisis_alerts(school_id);

alter table public.crisis_alerts enable row level security;

drop policy if exists "Teachers can view crisis alerts" on public.crisis_alerts;
create policy "Teachers can view crisis alerts"
on public.crisis_alerts
for select
using (
  exists (
    select 1
    from public.teachers t
    where t.school_id = school_id and t.user_id = auth.uid()
  )
);
