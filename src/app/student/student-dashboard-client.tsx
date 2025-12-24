"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  published_at: string | null;
  asset_url: string | null;
  latest_submission: { id: string; status: "started" | "submitted"; started_at: string; submitted_at: string | null } | null;
};

type MeResponse = {
  student?: Student;
  onboarding?: { completed: boolean; completed_at: string | null };
  error?: string;
};

function formatDate(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export function StudentDashboardClient() {
  const router = useRouter();
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
        const me = (await meRes.json().catch(() => null)) as MeResponse | null;
        if (!meRes.ok || !me?.student) throw new Error(me?.error ?? "Unable to load student profile.");
        if (!me.onboarding?.completed) {
          router.replace("/student/onboarding");
          return;
        }
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
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {studentName ? `Welcome, ${studentName}.` : "Your assignments will appear here."}
            </p>
          </div>
          <Link href="/student/login">
            <Button type="button" variant="secondary">
              Switch account
            </Button>
          </Link>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {loading ? <div className="text-sm text-zinc-600">Loading…</div> : null}

        {!loading && !assessments.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No published assessments yet</CardTitle>
              <CardDescription>Your teacher will publish assessments to your class.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              If you think this is wrong, confirm you logged in with the correct student code.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assessments.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                {a.asset_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.asset_url} alt="" className="h-40 w-full object-cover" />
                ) : null}
                <CardHeader>
                  <CardTitle>{a.title}</CardTitle>
                  <CardDescription>
                    {formatDate(a.published_at) ? `Published ${formatDate(a.published_at)}` : "Published"}
                    {a.latest_submission ? ` • Last: ${a.latest_submission.status}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/student/assessments/${a.id}`}>
                    <Button type="button" className="w-full">
                      {a.latest_submission?.status === "started" ? "Continue" : "Open"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
