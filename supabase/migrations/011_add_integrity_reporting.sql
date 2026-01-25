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

-- Grant access to the view
GRANT SELECT ON public.admin_integrity_reports TO authenticated;
GRANT SELECT ON public.admin_integrity_reports TO service_role;

-- RLS for the view is not directly supported, but we can secure the underlying data 
-- or use a security definer function if needed. 
-- However, for the Admin Dashboard, we will access this via a service role API 
-- and enforce school_id filtering based on the admin's session.
