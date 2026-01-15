import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
    params: Promise<{ activityId: string }>;
}

export default async function StudyLabAnalyticsPage({ params }: Props) {
    const { activityId } = await params;
    const supabase = await createSupabaseServerClient();

    // Auth Check
    const {
        data: { user },
    } = await supabase.auth.getUser();
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
            submission_data,
            student_id
        `)
        .eq("activity_id", activityId);

    // Aggregation Logic
    const allSubmissions = submissions || [];
    const submittedCount = allSubmissions.filter((s) => s.status === "submitted" || s.status === "reviewed").length;
    const totalCount = allSubmissions.length; // This might need refinement if 'assigned' rows exist for all students
    // For now, let's just show count of started/submitted sessions found.

    const focusAreaCounts: Record<string, number> = {};
    let totalSelfRating = 0;
    let selfRatingCount = 0;

    allSubmissions.forEach((sub) => {
        const data = sub.submission_data as any;
        const improvements = data?.grading?.feedback?.improvements;

        // Aggregate Focus Areas
        if (Array.isArray(improvements)) {
            improvements.forEach((area: string) => {
                const key = area.trim();
                if (key) {
                    focusAreaCounts[key] = (focusAreaCounts[key] || 0) + 1;
                }
            });
        }

        // Aggregate Self Rating
        if (typeof data?.selfRating === 'number') {
            totalSelfRating += data.selfRating;
            selfRatingCount++;
        }
    });

    const averageConfidence = selfRatingCount > 0 ? (totalSelfRating / selfRatingCount) : null;

    const sortedFocusAreas = Object.entries(focusAreaCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([area, count]) => ({ area, count }));

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">Class Analytics</h1>
                    <p className="text-[var(--muted)]">Activity: {activity.title}</p>
                </div>
                <Link href={`/activities/studylab/${activityId}/review`}>
                    <Button variant="secondary">Back to Review</Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Completion Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Session Status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-[var(--text)]">{submittedCount}</div>
                        <p className="text-sm text-[var(--muted)]">Submissions Scored</p>
                    </CardContent>
                </Card>

                {/* Confidence Score Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Confidence Score</CardTitle>
                        <CardDescription>Avg. Student Self-Rating (1-5)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-[var(--text)]">
                            {averageConfidence ? averageConfidence.toFixed(1) : "—"}
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                            based on {selfRatingCount} response{selfRatingCount !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                {/* Top Focus Areas */}
                <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Common Focus Areas</CardTitle>
                        <CardDescription>
                            Aggregated from AI feedback across all student submissions. These are the most frequent improvement
                            suggestions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sortedFocusAreas.length === 0 ? (
                            <p className="text-[var(--muted)]">No focus areas identified yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {sortedFocusAreas.map(({ area, count }) => (
                                    <div
                                        key={area}
                                        className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 text-amber-500">→</span>
                                            <span className="text-sm font-medium text-[var(--text)]">{area}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[var(--text)]">{count}</span>
                                            <span className="text-xs text-[var(--muted)]">students</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
