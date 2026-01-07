
-- =========================
-- Fix Student Access to Formative Activities
-- =========================

-- Policy for students to see assignments for their class
create policy "Students can view assignments for their class"
  on public.formative_assignments for select
  using (
    class_id in (
      select class_id from public.students
      where auth_user_id = auth.uid()
    )
  );

-- Policy for students to see activities assigned to their class
create policy "Students can view activities assigned to their class"
  on public.formative_activities for select
  using (
    exists (
      select 1 from public.formative_assignments fa
      join public.students s on fa.class_id = s.class_id
      where fa.activity_id = formative_activities.id
      and s.auth_user_id = auth.uid()
    )
  );
