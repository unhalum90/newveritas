import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormativeSubmitClient } from "./formative-submit-client";

interface Props {
    params: Promise<{ activityId: string }>;
}

export default async function StudentFormativeActivityPage({ params }: Props) {
    const { activityId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/student/login");

    // Get student record
    const { data: student } = await supabase
        .from("students")
        .select("id, class_id, first_name, last_name")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (!student) redirect("/student");

    // Check if this activity is assigned to student's class
    const { data: assignment } = student.class_id
        ? await supabase
            .from("formative_assignments")
            .select("id, activity_id")
            .eq("activity_id", activityId)
            .eq("class_id", student.class_id)
            .limit(1)
            .maybeSingle()
        : { data: null };

    if (!assignment) {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                    This activity is not assigned to your class.
                </div>
            </div>
        );
    }

    // Get activity details
    const { data: activity } = await supabase
        .from("formative_activities")
        .select("id, title, prompt_template, due_at, status")
        .eq("id", activityId)
        .single();

    if (!activity || activity.status !== "live") {
        return (
            <div className="mx-auto max-w-2xl p-6">
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-700">
                    This activity is not currently available.
                </div>
            </div>
        );
    }

    // Get or create submission record
    const { data: submission } = await supabase
        .from("formative_submissions")
        .select("id, status, artifact_url, audio_url, submitted_at")
        .eq("activity_id", activityId)
        .eq("student_id", student.id)
        .maybeSingle();

    // Get existing feedback and scores if reviewed
    let feedback = null;
    let score = null;
    if (submission?.status === "reviewed") {
        const { data: feedbackData } = await supabase
            .from("formative_feedback")
            .select("comment, needs_resubmission, created_at")
            .eq("submission_id", submission.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        feedback = feedbackData;

        const { data: scoreData } = await supabase
            .from("formative_scores")
            .select("accuracy, reasoning, clarity, transfer, overall")
            .eq("submission_id", submission.id)
            .maybeSingle();
        score = scoreData;
    }

    return (
        <div className="mx-auto max-w-2xl p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[var(--text)]">{activity.title}</h1>
                {activity.due_at && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Due: {new Date(activity.due_at).toLocaleDateString()} at{" "}
                        {new Date(activity.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                )}
            </div>

            <FormativeSubmitClient
                activity={activity}
                submission={submission}
                studentId={student.id}
                feedback={feedback}
                score={score}
                hasIepAccommodations={false}
            />
        </div>
    );
}
