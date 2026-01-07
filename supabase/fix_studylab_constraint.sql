-- Migration to add 'studylab' to input_mode check constraint in formative_submissions

ALTER TABLE public.formative_submissions
DROP CONSTRAINT IF EXISTS formative_submissions_input_mode_check;

ALTER TABLE public.formative_submissions
ADD CONSTRAINT formative_submissions_input_mode_check
CHECK (input_mode IN ('scan', 'voice_memo', 'digital', 'skeleton', 'studylab'));
