-- Create a view for aggregated integrity reporting
CREATE OR REPLACE VIEW public.admin_integrity_reports AS
SELECT
    s.id AS school_id,
    s.name AS school_name,
    t.id AS teacher_id,
    t.first_name || ' ' || t.last_name AS teacher_name,
    c.id AS class_id,
    c.name AS class_name,
    ie.event_type,
    COUNT(ie.id) AS event_count,
    DATE_TRUNC('week', ie.created_at) AS report_week
FROM
    public.integrity_events ie
JOIN public.submissions sub ON ie.submission_id = sub.id
JOIN public.assessments a ON sub.assessment_id = a.id
JOIN public.classes c ON a.class_id = c.id
JOIN public.workspaces w ON c.workspace_id = w.id
JOIN public.schools s ON w.school_id = s.id
JOIN public.teachers t ON w.id = t.workspace_id
GROUP BY
    s.id, s.name, t.id, t.first_name, t.last_name, c.id, c.name, ie.event_type, report_week;

-- Engagement Monitoring (Story 4.2)
CREATE TABLE IF NOT EXISTS public.engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- started, paused, resumed, submitted
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_classification TEXT NOT NULL DEFAULT 'educational'
);

CREATE INDEX IF NOT EXISTS engagement_events_submission_idx ON public.engagement_events(submission_id);

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.admin_integrity_reports TO authenticated;
GRANT SELECT ON public.admin_integrity_reports TO service_role;
GRANT ALL ON public.engagement_events TO service_role;
