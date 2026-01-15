import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
    params: Promise<{ activityId: string }>;
}

export default async function StudyLabReviewPage({ params }: Props) {
    const { activityId } = await params;
    const supabase = await createSupabaseServerClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch Activity
    const { data: activity } = await supabase
        .from("formative_activities")
        .select("id, title, teacher_id")
        .eq("id", activityId)
        .maybeSingle();

    if (!activity || activity.teacher_id !== user.id) redirect("/activities/studylab");

    // Fetch Submissions
    const { data: submissions } = await supabase
        .from("formative_submissions")
        .select(`
            id,
            status,
            submitted_at,
            student:students (
                id,
                first_name,
                last_name,
                email
            )
        `)
        .eq("activity_id", activityId)
        .order("submitted_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">Review Sessions</h1>
                    <p className="text-[var(--muted)]">Activity: {activity.title}</p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/activities/studylab/${activityId}/analytics`}>
                        <Button variant="secondary">Class Analytics</Button>
                    </Link>
                    <Link href={`/activities/studylab/${activityId}`}>
                        <Button variant="secondary">Back to Details</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {submissions?.map((sub) => {
                    const studentData = sub.student as any;
                    const studentName = studentData
                        ? `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim() || studentData.email || "Unknown Student"
                        : "Unknown Student";

                    return (
                        <Link key={sub.id} href={`/activities/studylab/${activityId}/review/${sub.id}`}>
                            <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{studentName}</CardTitle>
                                        {sub.status === "submitted" ? (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                Needs Review
                                            </span>
                                        ) : sub.status === "reviewed" ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                Reviewed
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                In Progress
                                            </span>
                                        )}
                                    </div>
                                    <CardDescription>
                                        {sub.submitted_at
                                            ? new Date(sub.submitted_at).toLocaleString()
                                            : "Not submitted yet"}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    );
                })}

                {(!submissions || submissions.length === 0) && (
                    <div className="col-span-full text-center py-12 text-[var(--muted)] border-2 border-dashed rounded-lg">
                        <p>No sessions found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
