-- Refinements for StudyLab Pilot
-- Adds pedagogical constraints and context fields to formative_activities

alter table public.formative_activities
add column if not exists learning_target text,
add column if not exists max_turns int default 6,
add column if not exists difficulty text default 'standard' check (difficulty in ('supportive', 'standard', 'challenge')),
add column if not exists artifact_required boolean default true;

-- Comment on columns for clarity
comment on column public.formative_activities.learning_target is 'Specific learning goal or unit context for the AI to anchor on.';
comment on column public.formative_activities.max_turns is 'Maximum number of conversational turns before forcing closure.';
comment on column public.formative_activities.difficulty is 'Pedagogical scaffolding level.';
