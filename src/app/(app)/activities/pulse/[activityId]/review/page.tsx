import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormativeReviewClient } from "./formative-review-client";

interface Props {
    params: Promise<{ activityId: string }>;
}

export default async function FormativeReviewPage({ params }: Props) {
    const { activityId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Get activity
    const { data: activity } = await supabase
        .from("formative_activities")
        .select("id, title, prompt_template, status, teacher_id")
        .eq("id", activityId)
        .maybeSingle();

    if (!activity || activity.teacher_id !== user.id) {
        redirect("/formative");
    }

    // Get all submissions for this activity with student info
    const { data: submissions } = await supabase
        .from("formative_submissions")
        .select(`
      id,
      status,
      artifact_url,
      audio_url,
      submitted_at,
      reviewed_at,
      student:students (
        id,
        first_name,
        last_name
      )
    `)
        .eq("activity_id", activityId)
        .order("submitted_at", { ascending: false, nullsFirst: false });

    // Get scores for each submission
    const submissionIds = submissions?.map((s) => s.id) ?? [];
    const { data: scores } = submissionIds.length
        ? await supabase
            .from("formative_scores")
            .select("submission_id, accuracy, reasoning, clarity, transfer, overall")
            .in("submission_id", submissionIds)
        : { data: [] };

    interface ScoreRecord {
        submission_id: string;
        accuracy: number | null;
        reasoning: number | null;
        clarity: number | null;
        transfer: number | null;
        overall: number | null;
    }

    const scoresBySubmission: Record<string, ScoreRecord> = {};
    for (const score of (scores ?? []) as ScoreRecord[]) {
        scoresBySubmission[score.submission_id] = score;
    }

    // Get feedback for each submission
    const { data: feedbacks } = submissionIds.length
        ? await supabase
            .from("formative_feedback")
            .select("submission_id, comment, needs_resubmission, created_at")
            .in("submission_id", submissionIds)
            .order("created_at", { ascending: false })
        : { data: [] };

    interface FeedbackRecord {
        submission_id: string;
        comment: string;
        needs_resubmission: boolean;
        created_at: string;
    }

    const feedbackBySubmission: Record<string, FeedbackRecord> = {};
    for (const feedback of (feedbacks ?? []) as FeedbackRecord[]) {
        if (!feedbackBySubmission[feedback.submission_id]) {
            feedbackBySubmission[feedback.submission_id] = feedback;
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[var(--text)]">Review Submissions</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">{activity.title}</p>
            </div>

            <FormativeReviewClient
                activity={activity}
                submissions={submissions ?? []}
                scoresBySubmission={scoresBySubmission}
                feedbackBySubmission={feedbackBySubmission}
                teacherId={user.id}
            />
        </div>
    );
}
