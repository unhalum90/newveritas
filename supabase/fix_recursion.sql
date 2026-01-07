
-- =========================
-- Fix Infinite Recursion in RLS
-- =========================

-- 1. Add teacher_id to assignments to allow direct ownership check
alter table public.formative_assignments 
add column if not exists teacher_id uuid references auth.users(id);

-- 2. Backfill teacher_id from parent activities
update public.formative_assignments fa
set teacher_id = (select teacher_id from public.formative_activities where id = fa.activity_id)
where teacher_id is null;

-- 3. Drop circular policies
drop policy if exists "Teachers can view assignments for their activities" on public.formative_assignments;
drop policy if exists "Teachers can create assignments for their activities" on public.formative_assignments;

-- 4. Create new linear policies
create policy "Teachers can view own assignments"
  on public.formative_assignments for select
  using (teacher_id = auth.uid());

create policy "Teachers can manage own assignments"
  on public.formative_assignments for all
  using (teacher_id = auth.uid());

-- Note: Student policy on assignments (created in previous step) remains valid:
-- checking class_id in students table. It does not reference activities, so no loop.
