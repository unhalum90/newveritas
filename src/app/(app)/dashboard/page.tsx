import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SessionMonitoring } from "@/components/compliance/session-monitoring";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: teacher } = await supabase
    .from("teachers")
    .select("workspace_id, schools(locale)")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!teacher?.workspace_id) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.5)] p-6 text-sm text-[var(--muted)]">
        Your workspace is still provisioning. Refresh in a moment or contact support if it persists.
      </div>
    );
  }

  const isUK = (teacher.schools as { locale?: string })?.locale === "UK";

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

  const { data: sessionData } = students?.length
    ? await supabase
      .from("session_tracking")
      .select("student_id, duration_seconds, last_activity_at, students(first_name, last_name)")
      .in("student_id", students.map(s => s.id))
      .eq("date", new Date().toISOString().split("T")[0])
    : { data: [] };

  const sessions = (sessionData ?? []).map((s: any) => ({
    student_id: s.student_id,
    student_name: `${s.students?.first_name ?? "Student"} ${s.students?.last_name ?? ""}`.trim(),
    duration_seconds: s.duration_seconds,
    last_activity_at: s.last_activity_at,
  }));

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

  // Get user name for greeting
  const displayName = data.user.user_metadata?.full_name || data.user.user_metadata?.first_name || "Teacher";

  // Time-of-day greeting
  const hour = new Date().getHours();
  // Note: This is server time, which is imperfect but acceptable for MVP. 
  // Ideally this would be a client component or use user's timezone.
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] space-y-8 pb-10">
      {/* Sparkle background effect - subtle radial gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-background dark:to-background" />

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">
            {greeting}, <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-indigo-500">{displayName}</span>
          </h1>
          <p className="text-[var(--muted)]">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex gap-3">
          {isUK && (
            <Link href="/dashboard/uk-coverage">
              <Button variant="outline" className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-subtle)]">
                View Coverage Report
              </Button>
            </Link>
          )}
          <Link href="/classes/new" data-tour="create-class">
            <Button type="button" className="bg-gradient-to-r from-[var(--primary)] to-teal-600 shadow-lg shadow-teal-700/20 hover:shadow-teal-700/30 hover:-translate-y-0.5 transition-all duration-300">
              + Create Class
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Students", value: totalStudents, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Active Assessments", value: activeAssessments, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Pending Reviews", value: pendingReviewCount ?? 0, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Completion Rate", value: completionRate === null ? "—" : `${completionRate}%`, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
        ].map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/50">
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.bg} opacity-50 blur-2xl transition-all group-hover:scale-150 group-hover:opacity-100`} />
            <div className="relative">
              <div className="text-sm font-medium text-[var(--muted)]">{stat.label}</div>
              <div className={`mt-2 text-3xl font-light ${stat.color}`}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-0 bg-[var(--surface)]/50 shadow-sm backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest submissions from your students.</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentSubmissions?.length ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-gray-50/50 dark:bg-gray-900/10">
                <p className="text-sm text-[var(--muted)]">No submissions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                {recentSubmissions.map((submission) => {
                  const assessment = pickSingle(submission.assessments);
                  const student = pickSingle(submission.students);
                  return (
                    <div
                      key={`${submission.assessment_id}-${submission.student_id}-${submission.submitted_at ?? submission.created_at ?? ""}`}
                      className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                          {student?.first_name?.[0] ?? "S"}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text)]">{assessment?.title ?? "Assessment"}</div>
                          <div className="text-xs text-[var(--muted)]">
                            {student?.first_name ?? "Student"} {student?.last_name ?? ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${submission.review_status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                          {submission.review_status === "published" ? "Reviewed" : "Pending"}
                        </span>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {formatTimestamp(submission.submitted_at ?? submission.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <SessionMonitoring sessions={sessions} />

        {/* Classes Column */}
        <div className="space-y-6">
          <Card className="border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-gray-50/50 dark:to-gray-900/20">
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              {!hasClasses && (
                <CardDescription>Setup your classes to get started.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {classesError ? (
                <div className="text-sm text-red-500">Failed to load classes.</div>
              ) : !hasClasses ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[var(--muted)] mb-4">No classes yet.</p>
                  <Link href="/classes/new">
                    <Button variant="secondary" size="sm">Create First Class</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes?.map((c) => (
                    <Link
                      key={c.id}
                      href={`/classes/${c.id}`}
                      className="group block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-[var(--text)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {c.name}
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div className="mt-2 text-xs text-[var(--muted)] flex items-center gap-2">
                        <span>{studentCountByClass.get(c.id) ?? 0} Students</span>
                        <span>•</span>
                        <span>{liveAssessmentCountByClass.get(c.id) ?? 0} Live</span>
                      </div>
                    </Link>
                  ))}
                  <Link href="/classes" className="inline-block text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
                    View all classes →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions / Getting Started */}
          <Card className={`${totalAssessments > 0 && activeAssessments > 0 ? 'bg-[var(--surface)]' : 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900'}`}>
            <CardHeader>
              <CardTitle className="text-base">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Create class", done: hasClasses },
                { label: "Add students", done: totalStudents > 0 },
                { label: "Create assessment", done: totalAssessments > 0 },
                { label: "Publish assessment", done: activeAssessments > 0 },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3 text-sm">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${step.done ? "border-green-600 bg-green-100 text-green-600 dark:bg-green-900/30" : "border-gray-300 bg-white text-gray-300 dark:bg-gray-800 dark:border-gray-700"}`} >
                    {step.done ? "✓" : i + 1}
                  </div>
                  <span className={step.done ? "text-[var(--muted)] line-through opacity-70" : "font-medium text-[var(--text)]"}>
                    {step.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
