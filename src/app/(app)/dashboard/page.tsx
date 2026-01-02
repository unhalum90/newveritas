import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: teacher } = await supabase
    .from("teachers")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!teacher?.workspace_id) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.5)] p-6 text-sm text-[var(--muted)]">
        Your workspace is still provisioning. Refresh in a moment or contact support if it persists.
      </div>
    );
  }

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, access_mode, created_at")
    .eq("workspace_id", teacher.workspace_id)
    .order("created_at", { ascending: false })
    .limit(3);

  const classIds = classes?.map((c) => c.id) ?? [];
  const hasClasses = Boolean(classes && classes.length > 0);

  const { data: students } = classIds.length
    ? await supabase.from("students").select("id, class_id").in("class_id", classIds)
    : { data: [] };

  const { data: assessments } = classIds.length
    ? await supabase.from("assessments").select("id, class_id, status, created_at").in("class_id", classIds)
    : { data: [] };

  const assessmentIds = assessments?.map((a) => a.id) ?? [];
  const { count: pendingReviewCount } = assessmentIds.length
    ? await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("assessment_id", assessmentIds)
        .eq("status", "submitted")
        .neq("review_status", "published")
    : { count: 0 };

  const { count: submittedCount } = assessmentIds.length
    ? await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("assessment_id", assessmentIds)
        .eq("status", "submitted")
    : { count: 0 };

  const { count: completedCount } = assessmentIds.length
    ? await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("assessment_id", assessmentIds)
        .eq("status", "submitted")
        .eq("review_status", "published")
    : { count: 0 };

  const { data: recentSubmissions } = assessmentIds.length
    ? await supabase
        .from("submissions")
        .select(
          "assessment_id, student_id, submitted_at, created_at, review_status, assessments(title, class_id), students(first_name, last_name)",
        )
        .in("assessment_id", assessmentIds)
        .order("submitted_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { data: activitySubmissions } = assessmentIds.length
    ? await supabase
        .from("submissions")
        .select("assessment_id, submitted_at, created_at, assessments(class_id)")
        .in("assessment_id", assessmentIds)
        .order("submitted_at", { ascending: false })
        .limit(100)
    : { data: [] };

  const studentCountByClass = new Map<string, number>();
  for (const s of students ?? []) {
    const count = studentCountByClass.get(s.class_id) ?? 0;
    studentCountByClass.set(s.class_id, count + 1);
  }

  const assessmentCountByClass = new Map<string, number>();
  const liveAssessmentCountByClass = new Map<string, number>();
  for (const a of assessments ?? []) {
    assessmentCountByClass.set(a.class_id, (assessmentCountByClass.get(a.class_id) ?? 0) + 1);
    if (a.status === "live") {
      liveAssessmentCountByClass.set(a.class_id, (liveAssessmentCountByClass.get(a.class_id) ?? 0) + 1);
    }
  }

  const pickSingle = <T,>(value?: T | T[] | null) => (Array.isArray(value) ? value[0] ?? null : value ?? null);

  const lastActivityByClass = new Map<string, string>();
  for (const submission of activitySubmissions ?? []) {
    const classId = pickSingle(submission.assessments)?.class_id;
    const timestamp = submission.submitted_at ?? submission.created_at;
    if (!classId || !timestamp) continue;
    const existing = lastActivityByClass.get(classId);
    if (!existing || new Date(timestamp) > new Date(existing)) {
      lastActivityByClass.set(classId, timestamp);
    }
  }

  const totalStudents = students?.length ?? 0;
  const totalAssessments = assessments?.length ?? 0;
  const activeAssessments = (assessments ?? []).filter((a) => a.status === "live").length;
  const completionRate =
    submittedCount && completedCount ? Math.round((completedCount / submittedCount) * 100) : submittedCount ? 0 : null;

  const formatTimestamp = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Dashboard</h1>
        </div>
        <Link href="/classes/new" data-tour="create-class">
          <Button type="button">+ Create Class</Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1" data-tour="dashboard-stats">
          <CardHeader>
            <CardTitle>Quick stats</CardTitle>
            <CardDescription>Snapshot of your workspace activity.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="text-sm text-[var(--muted)]">Total students</div>
              <div className="text-lg font-semibold text-[var(--text)]">{totalStudents}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="text-sm text-[var(--muted)]">Active assessments</div>
              <div className="text-lg font-semibold text-[var(--text)]">{activeAssessments}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="text-sm text-[var(--muted)]">Pending reviews</div>
              <div className="text-lg font-semibold text-[var(--text)]">{pendingReviewCount ?? 0}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="text-sm text-[var(--muted)]">Completion rate</div>
              <div className="text-lg font-semibold text-[var(--text)]">
                {completionRate === null ? "—" : `${completionRate}%`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest student submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentSubmissions?.length ? (
              <div className="text-sm text-[var(--muted)]">No submissions yet.</div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => {
                  const assessment = pickSingle(submission.assessments);
                  const student = pickSingle(submission.students);
                  return (
                  <div
                    key={`${submission.assessment_id}-${submission.student_id}-${submission.submitted_at ?? submission.created_at ?? ""}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-[var(--text)]">{assessment?.title ?? "Assessment"}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {student?.first_name ?? "Student"} {student?.last_name ?? ""}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {submission.review_status === "published" ? "Reviewed" : "Awaiting review"} -{" "}
                      {formatTimestamp(submission.submitted_at ?? submission.created_at)}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>Complete the basics to unlock the full workflow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Create your first class</span>
            <span className="text-[var(--muted)]">{hasClasses ? "Done" : "Pending"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Add students to a class</span>
            <span className="text-[var(--muted)]">{totalStudents > 0 ? "Done" : "Pending"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Create an assessment</span>
            <span className="text-[var(--muted)]">{totalAssessments > 0 ? "Done" : "Pending"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Publish to a class</span>
            <span className="text-[var(--muted)]">{activeAssessments > 0 ? "Done" : "Pending"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          {!hasClasses ? (
            <CardDescription>Set up your first class to begin preparing assessments.</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {classesError ? (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
              We couldn&apos;t load your classes right now. Try refreshing, or check{" "}
              <Link href="/classes" className="text-[var(--text)] hover:underline">
                Classes
              </Link>
              .
            </div>
          ) : !hasClasses ? (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
              Create your first class to begin preparing assessments.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-[var(--muted)]">
                Recent classes (manage all in{" "}
                <Link href="/classes" className="text-[var(--text)] hover:underline">
                  Classes
                </Link>
                ).
              </div>
              <div className="space-y-2">
                {classes?.map((c) => (
                  <Link
                    key={c.id}
                    href={`/classes/${c.id}`}
                    className="block rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--text)]">{c.name}</div>
                      <span className="text-xs text-[var(--muted)]">View</span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {c.access_mode === "code" ? "Code access" : c.access_mode.toUpperCase()} -{" "}
                      {studentCountByClass.get(c.id) ?? 0} students - {liveAssessmentCountByClass.get(c.id) ?? 0} live
                      assessments
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Last activity: {formatTimestamp(lastActivityByClass.get(c.id) ?? c.created_at)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
