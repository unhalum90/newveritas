import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormativeActivitiesClient } from "./formative-activities-client";

export default async function FormativePage() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");

    // Get teacher's workspace from teachers table (matching ClassesPage logic)
    const { data: teacher } = await supabase
        .from("teachers")
        .select("workspace_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    // Get teacher's classes using workspace_id
    const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("workspace_id", teacher?.workspace_id ?? "");

    const classNameById = new Map(classes?.map((c) => [c.id, c.name]));

    // Get formative activities
    const { data: activities } = await supabase
        .from("formative_activities")
        .select(`
      id,
      title,
      prompt_template,
      rubric_template,
      due_at,
      status,
      created_at
    `)
        .eq("teacher_id", data.user.id)
        .eq("type", "pulse")
        .order("created_at", { ascending: false });

    // Get assignments for each activity
    const activityIds = activities?.map((a) => a.id) ?? [];
    const { data: assignments } = activityIds.length
        ? await supabase
            .from("formative_assignments")
            .select("activity_id, class_id")
            .in("activity_id", activityIds)
        : { data: [] };

    // Build activity -> class mapping
    const classIdsByActivity: Record<string, string[]> = {};
    for (const assignment of assignments ?? []) {
        const list = classIdsByActivity[assignment.activity_id] ?? [];
        list.push(assignment.class_id);
        classIdsByActivity[assignment.activity_id] = list;
    }

    // Get submission stats
    const submissionStatsById: Record<string, { assigned: number; submitted: number; reviewed: number }> = {};
    if (activityIds.length) {
        const { data: submissions } = await supabase
            .from("formative_submissions")
            .select("activity_id, status")
            .in("activity_id", activityIds);

        for (const submission of submissions ?? []) {
            const stats = submissionStatsById[submission.activity_id] ?? { assigned: 0, submitted: 0, reviewed: 0 };
            if (submission.status === "assigned") stats.assigned += 1;
            else if (submission.status === "submitted") stats.submitted += 1;
            else if (submission.status === "reviewed") stats.reviewed += 1;
            submissionStatsById[submission.activity_id] = stats;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">Pulse</h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Verbal check-ins &quot;Capture + Defend&quot; activities.
                    </p>
                </div>
                <Link href="/formative/create">
                    <Button type="button">+ New Activity</Button>
                </Link>
            </div>

            {!classes?.length ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Create a class first</CardTitle>
                        <CardDescription>Formative activities are assigned to classes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/classes/new">
                            <Button type="button">Create Class</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : !activities?.length ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No formative activities yet</CardTitle>
                        <CardDescription>Create your first &quot;Capture + Defend&quot; activity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-[var(--muted)]">
                            <p>StudyLab lets students:</p>
                            <ol className="list-decimal space-y-1 pl-5">
                                <li>Upload their handwritten notes or sketches</li>
                                <li>Record a short voice explanation (60–120 seconds)</li>
                                <li>Receive fast feedback with a micro-rubric</li>
                            </ol>
                            <Link href="/formative/create">
                                <Button type="button" className="mt-3">Create Activity</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <FormativeActivitiesClient
                    initialActivities={activities}
                    classNameById={Object.fromEntries(classNameById.entries())}
                    classIdsByActivity={classIdsByActivity}
                    submissionStatsById={submissionStatsById}
                />
            )}
        </div>
    );
}
