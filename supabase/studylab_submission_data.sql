-- Add submission_data column to formative_submissions
-- This allows storing flexible data like Socratic chat history, transcripts, etc.

alter table public.formative_submissions 
add column if not exists submission_data jsonb default '{}'::jsonb;
