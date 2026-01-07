import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StudentStudylabClient } from "./student-studylab-client";

interface Props {
    params: Promise<{ activityId: string }>;
}

export default async function StudentStudylabPage({ params }: Props) {
    const { activityId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/student/login");

    const { data: student } = await supabase
        .from("students")
        .select("id, class_id, first_name, last_name")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (!student) redirect("/student");

    // Verify assignment
    const { data: assignment } = student.class_id
        ? await supabase
            .from("formative_assignments")
            .select("id")
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
                    <br /><br />
                    <span className="text-xs text-red-500 font-mono">
                        Debug: Student Class: {student.class_id || "None"} | Activity: {activityId}
                    </span>
                </div>
            </div>
        );
    }

    const { data: activity } = await supabase
        .from("formative_activities")
        .select("*")
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

    // Get submission if exists
    const { data: submission } = await supabase
        .from("formative_submissions")
        .select("*")
        .eq("activity_id", activityId)
        .eq("student_id", student.id)
        .maybeSingle();

    return (
        <StudentStudylabClient
            activity={activity}
            student={student}
            initialSubmission={submission}
        />
    );
}
