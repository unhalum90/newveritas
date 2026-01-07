import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
    params: Promise<{ activityId: string }>;
}

export default async function FormativeActivityPage({ params }: Props) {
    const { activityId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Get activity
    const { data: activity } = await supabase
        .from("formative_activities")
        .select("id, title, prompt_template, rubric_template, due_at, status, created_at, teacher_id")
        .eq("id", activityId)
        .maybeSingle();

    if (!activity || activity.teacher_id !== user.id) {
        redirect("/formative");
    }

    // Get assignment info
    const { data: assignments } = await supabase
        .from("formative_assignments")
        .select(`
      id,
      class:classes (
        id,
        name
      )
    `)
        .eq("activity_id", activityId);

    const assignedClasses = assignments?.map((a) => {
        const cls = Array.isArray(a.class) ? a.class[0] : a.class;
        return cls?.name ?? "Unknown Class";
    }).filter(Boolean) ?? [];

    // Get submission stats
    const { data: submissions } = await supabase
        .from("formative_submissions")
        .select("status")
        .eq("activity_id", activityId);

    const stats = {
        assigned: 0,
        submitted: 0,
        reviewed: 0,
    };
    for (const s of submissions ?? []) {
        if (s.status === "assigned") stats.assigned++;
        else if (s.status === "submitted") stats.submitted++;
        else if (s.status === "reviewed") stats.reviewed++;
    }

    const statusColors: Record<string, string> = {
        draft: "bg-gray-200 text-gray-700",
        live: "bg-green-100 text-green-700",
        closed: "bg-red-100 text-red-700",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">{activity.title}</h1>
                    <div className="mt-2 flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[activity.status]}`}>
                            {activity.status === "draft" ? "Draft" : activity.status === "live" ? "Live" : "Closed"}
                        </span>
                        {activity.due_at && (
                            <span className="text-sm text-[var(--muted)]">
                                Due: {new Date(activity.due_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
                <Link href={`/formative/${activityId}/review`}>
                    <Button type="button">
                        Review Submissions {stats.submitted > 0 && `(${stats.submitted})`}
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Activity Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <span className="font-medium">Prompt:</span>
                            <p className="mt-1 text-[var(--muted)] italic">
                                &quot;{activity.prompt_template || "No prompt specified"}&quot;
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">Rubric:</span>
                            <p className="mt-1 text-[var(--muted)]">
                                {activity.rubric_template === "default"
                                    ? "Default (Accuracy, Reasoning, Clarity, Transfer)"
                                    : activity.rubric_template}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">Assigned to:</span>
                            <p className="mt-1 text-[var(--muted)]">
                                {assignedClasses.length > 0 ? assignedClasses.join(", ") : "No classes assigned"}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">Created:</span>
                            <p className="mt-1 text-[var(--muted)]">
                                {new Date(activity.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Submission Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submission Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="rounded-md bg-gray-100 p-4">
                                <div className="text-2xl font-bold">{stats.assigned}</div>
                                <div className="text-xs text-[var(--muted)]">Not Started</div>
                            </div>
                            <div className="rounded-md bg-yellow-100 p-4">
                                <div className="text-2xl font-bold text-yellow-700">{stats.submitted}</div>
                                <div className="text-xs text-yellow-700">Awaiting Review</div>
                            </div>
                            <div className="rounded-md bg-green-100 p-4">
                                <div className="text-2xl font-bold text-green-700">{stats.reviewed}</div>
                                <div className="text-xs text-green-700">Reviewed</div>
                            </div>
                        </div>

                        {stats.submitted > 0 && (
                            <div className="mt-4">
                                <Link href={`/formative/${activityId}/review`}>
                                    <Button type="button" className="w-full">
                                        Review {stats.submitted} Submission{stats.submitted !== 1 && "s"}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <Card>
                <CardContent className="py-4 flex gap-3">
                    <Link href="/formative">
                        <Button type="button" variant="secondary">← Back to Activities</Button>
                    </Link>
                    {activity.status === "draft" && (
                        <Button type="button" variant="secondary">Edit Activity</Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
