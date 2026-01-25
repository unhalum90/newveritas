-- Migration: 009_add_privacy_notices.sql

-- 1. Add last_privacy_notice_shown to teachers
alter table public.teachers add column if not exists last_privacy_notice_shown timestamptz;

-- 2. Add last_privacy_notice_shown to students
alter table public.students add column if not exists last_privacy_notice_shown timestamptz;

-- 3. Create privacy_notice_log table
create table if not exists public.privacy_notice_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_type text not null, -- 'teacher' | 'student'
  notice_version text not null default 'v1',
  shown_at timestamptz not null default now()
);

create index if not exists privacy_notice_log_user_id_idx on public.privacy_notice_log(user_id);

alter table public.privacy_notice_log enable row level security;

drop policy if exists "Users can view own privacy logs" on public.privacy_notice_log;
create policy "Users can view own privacy logs"
on public.privacy_notice_log
for select
using (user_id = auth.uid());
