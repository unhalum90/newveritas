
-- =========================
-- Fix for Student Dashboard
-- Allow students to read their own profile to verify class enrollment.
-- =========================

alter table public.students enable row level security;

create policy "Students can view own profile"
  on public.students for select
  using (auth.uid() = auth_user_id);

-- Ensure previous tables are accessible
grant select, insert, update, delete on public.formative_activities to authenticated;
grant select, insert, update, delete on public.formative_assignments to authenticated;
grant select, insert, update, delete on public.formative_submissions to authenticated;
grant select, insert, update, delete on public.formative_submission_files to authenticated;
grant select, insert, update, delete on public.formative_scores to authenticated;
-- (Note: RLS policies above restrict actual access, but GRANT is needed for the role)
