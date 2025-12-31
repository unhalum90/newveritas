"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AssessmentRow = {
  id: string;
  title: string;
  status: "draft" | "live" | "closed";
  authoring_mode: string;
  is_practice_mode?: boolean | null;
  created_at: string;
  class_id: string;
};

export function AssessmentsClient({
  initialAssessments,
  classNameById,
  submissionStatsById,
}: {
  initialAssessments: AssessmentRow[];
  classNameById: Record<string, string>;
  submissionStatsById: Record<string, { completed: number; needsReview: number }>;
}) {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentRow[]>(initialAssessments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("newest");

  const nameFor = useMemo(() => new Map(Object.entries(classNameById)), [classNameById]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assessments.filter((assessment) => {
      const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
      const matchesSearch = !term
        ? true
        : `${assessment.title} ${nameFor.get(assessment.class_id) ?? ""}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [assessments, nameFor, search, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "completions") {
        const aStats = submissionStatsById[a.id] ?? { completed: 0, needsReview: 0 };
        const bStats = submissionStatsById[b.id] ?? { completed: 0, needsReview: 0 };
        return bStats.completed - aStats.completed;
      }
      if (sortKey === "needsReview") {
        const aStats = submissionStatsById[a.id] ?? { completed: 0, needsReview: 0 };
        const bStats = submissionStatsById[b.id] ?? { completed: 0, needsReview: 0 };
        return bStats.needsReview - aStats.needsReview;
      }
      if (sortKey === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [filtered, sortKey, submissionStatsById]);

  async function handleDelete(id: string) {
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

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}/duplicate`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: unknown } | null;
      if (!res.ok || !data?.id) throw new Error(typeof data?.error === "string" ? data.error : "Duplicate failed.");
      router.push(`/assessments/${data.id}?step=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed.");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleArchive(id: string) {
    const ok = window.confirm("Archive this assessment? Students will no longer see it as active.");
    if (!ok) return;

    setArchivingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}/archive`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { status?: string; error?: unknown } | null;
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Archive failed.");
      setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "closed" } : a)));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive failed.");
    } finally {
      setArchivingId(null);
    }
  }

  async function handleShare(id: string) {
    const link = `${window.location.origin}/student/assessments/${id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (error) {
      console.warn("Copy link failed.", error);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="assessment-search">Search assessments</Label>
            <Input
              id="assessment-search"
              placeholder="Search by title or class"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="assessment-status">Status</Label>
            <select
              id="assessment-status"
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="closed">Archived</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assessment-sort">Sort by</Label>
            <select
              id="assessment-sort"
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
              <option value="completions">Most completed</option>
              <option value="needsReview">Needs review</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-[var(--muted)]">{sorted.length} assessments</div>
      </div>

      {sorted.map((a) => {
        const canDelete = a.status === "draft";
        const stats = submissionStatsById[a.id] ?? { completed: 0, needsReview: 0 };
        return (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">
                    <Link href={`/assessments/${a.id}?step=1`} className="text-[var(--text)] hover:underline">
                      {a.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <span className="text-[var(--text)]">{nameFor.get(a.class_id) ?? "Class"}</span>
                    <span className="mx-2 text-[var(--muted)]">-</span>
                    <span className="uppercase text-[var(--muted)]">{a.status}</span>
                    {a.is_practice_mode ? (
                      <>
                        <span className="mx-2 text-[var(--muted)]">-</span>
                        <span className="text-xs font-semibold uppercase text-[var(--primary)]">Practice</span>
                      </>
                    ) : null}
                  </CardDescription>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    {stats.completed} complete / {stats.needsReview} new
                  </div>
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
                    className="underline underline-offset-4"
                    disabled={duplicatingId === a.id}
                    onClick={() => void handleDuplicate(a.id)}
                  >
                    {duplicatingId === a.id ? "Duplicating…" : "Duplicate"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="underline underline-offset-4"
                    onClick={() => void handleShare(a.id)}
                  >
                    Share
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={canDelete ? "text-[var(--danger)] underline underline-offset-4" : undefined}
                    disabled={!canDelete || deletingId === a.id}
                    onClick={() => setDeleteConfirmId(a.id)}
                  >
                    {deletingId === a.id ? "Deleting…" : "Delete"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="underline underline-offset-4"
                    disabled={archivingId === a.id || a.status === "closed"}
                    onClick={() => void handleArchive(a.id)}
                  >
                    {archivingId === a.id ? "Archiving…" : a.status === "closed" ? "Archived" : "Archive"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        title="Delete this assessment?"
        description="This will permanently remove the draft assessment and cannot be undone."
        confirmLabel="Delete"
        loading={Boolean(deleteConfirmId && deletingId === deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={async () => {
          if (!deleteConfirmId) return;
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          await handleDelete(id);
        }}
      />
    </div>
  );
}
