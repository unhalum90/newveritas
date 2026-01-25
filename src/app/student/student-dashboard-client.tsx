"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
};

type AssessmentListItem = {
  id: string;
  title: string;
  type?: "summative" | "pulse" | "studylab";
  published_at: string | null;
  asset_url: string | null;
  is_practice_mode?: boolean | null;
  latest_submission:
  | {
    id: string;
    status: "started" | "submitted" | "restarted" | "assigned";
    started_at: string;
    submitted_at: string | null;
    review_status?: string | null;
    published_at?: string | null;
  }
  | null;
};

export function StudentDashboardClient() {
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentName = useMemo(() => {
    if (!student) return null;
    return `${student.first_name} ${student.last_name}`.trim();
  }, [student]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch("/api/student/me", { cache: "no-store" });
        const me = (await meRes.json().catch(() => null)) as { student?: Student; error?: string } | null;
        if (!meRes.ok || !me?.student) throw new Error(me?.error ?? "Unable to load student profile.");
        setStudent(me.student);

        const aRes = await fetch("/api/student/assessments", { cache: "no-store" });
        const a = (await aRes.json().catch(() => null)) as { assessments?: AssessmentListItem[]; error?: string } | null;
        if (!aRes.ok || !a?.assessments) throw new Error(a?.error ?? "Unable to load assessments.");
        setAssessments(a.assessments);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Count active (unstarted or in-progress) assignments per category
  const activeCounts = useMemo(() => {
    const isActive = (a: AssessmentListItem) =>
      !a.latest_submission ||
      a.latest_submission.status === "assigned" ||
      a.latest_submission.status === "started" ||
      a.latest_submission.status === "restarted";
    return {
      assessments: assessments.filter((a) => (a.type === "summative" || !a.type) && isActive(a)).length,
      pulse: assessments.filter((a) => a.type === "pulse" && isActive(a)).length,
      studylab: assessments.filter((a) => a.type === "studylab" && isActive(a)).length,
    };
  }, [assessments]);

  const categories = [
    {
      title: "Assessments",
      description: "Summative assessments and graded work",
      href: "/student/assessments",
      count: activeCounts.assessments,
      icon: "📝",
      color: "bg-emerald-500",
    },
    {
      title: "Pulse Checks",
      description: "Quick check-ins on your understanding",
      href: "/student/pulse",
      count: activeCounts.pulse,
      icon: "💓",
      color: "bg-purple-500",
    },
    {
      title: "Study Lab",
      description: "Practice activities and study sessions",
      href: "/student/studylab",
      count: activeCounts.studylab,
      icon: "🧪",
      color: "bg-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {studentName ? `Welcome, ${studentName}.` : "Your assignments will appear here."}
            </p>
          </div>
          <Link href="/student/login">
            <Button type="button" variant="secondary">
              Log out
            </Button>
          </Link>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {loading ? <div className="text-sm text-zinc-600">Loading…</div> : null}

        {/* Practice Space Card */}
        {!loading && (
          <Card className="bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">Practice Space</CardTitle>
              <CardDescription className="text-zinc-400">
                Get comfortable with the flow before your first graded assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/practice">
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Start practice walkthrough
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Category Cards */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.title} href={cat.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{cat.icon}</span>
                      {cat.count > 0 && (
                        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${cat.color}`}>
                          {cat.count} active
                        </span>
                      )}
                    </div>
                    <CardTitle className="mt-2">{cat.title}</CardTitle>
                    <CardDescription>{cat.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
