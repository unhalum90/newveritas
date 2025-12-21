"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AssessmentRow = {
  id: string;
  title: string;
  status: "draft" | "live" | "closed";
  authoring_mode: string;
  created_at: string;
  class_id: string;
};

export function AssessmentsClient({
  initialAssessments,
  classNameById,
}: {
  initialAssessments: AssessmentRow[];
  classNameById: Record<string, string>;
}) {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentRow[]>(initialAssessments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameFor = useMemo(() => new Map(Object.entries(classNameById)), [classNameById]);

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this draft assessment? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Delete failed.");
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
      {assessments.map((a) => {
        const canDelete = a.status === "draft";
        return (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    <Link href={`/assessments/${a.id}?step=1`} className="text-[var(--text)] hover:underline">
                      {a.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {nameFor.get(a.class_id) ?? "Class"}
                    {" • "}
                    {a.status.toUpperCase()}
                    {" • "}
                    {a.authoring_mode}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/assessments/${a.id}?step=1`}>
                    <Button type="button" variant="ghost" size="sm" className="underline underline-offset-4">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/assessments/${a.id}/results`}>
                    <Button type="button" variant="ghost" size="sm" className="underline underline-offset-4">
                      Reports
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={canDelete ? "text-[var(--danger)] underline underline-offset-4" : undefined}
                    disabled={!canDelete || deletingId === a.id}
                    onClick={() => void handleDelete(a.id)}
                  >
                    {deletingId === a.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
