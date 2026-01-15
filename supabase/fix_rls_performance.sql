-- =================================================================
-- RLS Performance Fix: Wrap auth.uid() in (select ...)
-- Prevents re-evaluation of the function for every row.
-- =================================================================

-- 1. Formative Activities
DROP POLICY IF EXISTS "Teachers can view their own activities" ON public.formative_activities;
CREATE POLICY "Teachers can view their own activities"
ON public.formative_activities FOR SELECT
TO authenticated
USING ( (select auth.uid()) = teacher_id );

DROP POLICY IF EXISTS "Teachers can create activities" ON public.formative_activities;
CREATE POLICY "Teachers can create activities"
ON public.formative_activities FOR INSERT
TO authenticated
WITH CHECK ( (select auth.uid()) = teacher_id );

DROP POLICY IF EXISTS "Teachers can update their own activities" ON public.formative_activities;
CREATE POLICY "Teachers can update their own activities"
ON public.formative_activities FOR UPDATE
TO authenticated
USING ( (select auth.uid()) = teacher_id );

DROP POLICY IF EXISTS "Teachers can delete their own activities" ON public.formative_activities;
CREATE POLICY "Teachers can delete their own activities"
ON public.formative_activities FOR DELETE
TO authenticated
USING ( (select auth.uid()) = teacher_id );

-- 2. Teachers Table (High Read Volume)
DROP POLICY IF EXISTS "Teachers can view own row" ON public.teachers;
CREATE POLICY "Teachers can view own row"
ON public.teachers FOR SELECT
TO authenticated
USING ( (select auth.uid()) = user_id );

DROP POLICY IF EXISTS "Teachers can update own row" ON public.teachers;
CREATE POLICY "Teachers can update own row"
ON public.teachers FOR UPDATE
TO authenticated
USING ( (select auth.uid()) = user_id );

-- 3. Students Table (High Read Volume, Complex Joins)
-- Note: Student policies often join to classes/teachers, making the optimization even more important.

-- "Students scoped to teacher" usually uses a join. We optimize the subquery part.
-- Original: id in (select s.id from public.students s join public.classes c... where t.user_id = auth.uid())
-- We optimize the `auth.uid()` part inside any subquery too if we can, but simply fixing direct columns helps.
-- Since students don't usually have user_id on them directly (except via auth_user_id), we check that.

DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
CREATE POLICY "Students can view own profile"
ON public.students FOR SELECT
TO authenticated
USING ( (select auth.uid()) = auth_user_id );

-- 4. Assessments (High Volume)
DROP POLICY IF EXISTS "Assessments scoped to teacher" ON public.assessments;
CREATE POLICY "Assessments scoped to teacher"
ON public.assessments FOR SELECT
TO authenticated
USING (
  class_id IN (
    SELECT c.id FROM public.classes c
    JOIN public.teachers t ON c.workspace_id = t.workspace_id
    WHERE t.user_id = (select auth.uid())
  )
);

-- 5. Submissions (High Volume)
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions"
ON public.submissions FOR SELECT
TO authenticated
USING ( student_id IN (SELECT id FROM public.students WHERE auth_user_id = (select auth.uid())) );

-- Note: Applying this pattern to all 133 policies is repetitive but recommended for full clean-up.
-- These cover the most performance-critical paths.
