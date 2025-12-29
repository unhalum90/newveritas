"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  student_code: string | null;
  auth_user_id: string | null;
  code_claimed_at: string | null;
  created_at: string;
};

function buildLoginLink(code: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/student/login?code=${encodeURIComponent(code)}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Clipboard copy failed.", error);
  }
  return false;
}

export function StudentTable({ classId, students }: { classId: string; students: StudentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  function flashCopyStatus(message: string, tone: "success" | "error" = "success") {
    setCopyStatus({ message, tone });
    if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopyStatus(null), 2200);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "activated" && student.auth_user_id) ||
        (statusFilter === "pending" && !student.auth_user_id);
      const matchesSearch = !term
        ? true
        : `${student.first_name} ${student.last_name} ${student.email ?? ""} ${student.student_code ?? ""}`
            .toLowerCase()
            .includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [students, search, statusFilter]);

  const selectedList = filtered.filter((student) => selectedIds.has(student.id));
  const allSelected = filtered.length > 0 && selectedList.length === filtered.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((student) => student.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const rows = (selectedList.length ? selectedList : filtered).map((student) => ({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email ?? "",
      code: student.student_code ?? "",
      status: student.auth_user_id ? "activated" : "pending",
    }));
    if (!rows.length) return;
    const header = "first_name,last_name,email,code,status";
    const body = rows
      .map((row) => [row.first_name, row.last_name, row.email, row.code, row.status].join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyLinks() {
    const targets = (selectedList.length ? selectedList : filtered).filter((student) => student.student_code);
    if (!targets.length) return;
    const text = targets.map((student) => buildLoginLink(student.student_code!)).join("\n");
    const ok = await copyToClipboard(text);
    flashCopyStatus(
      ok ? `Copied ${targets.length} login link${targets.length === 1 ? "" : "s"}.` : "Clipboard blocked. Copy failed.",
      ok ? "success" : "error",
    );
  }

  async function copyCodes() {
    const targets = (selectedList.length ? selectedList : filtered).filter((student) => student.student_code);
    if (!targets.length) return;
    const text = targets.map((student) => student.student_code!).join("\n");
    const ok = await copyToClipboard(text);
    flashCopyStatus(
      ok ? `Copied ${targets.length} code${targets.length === 1 ? "" : "s"}.` : "Clipboard blocked. Copy failed.",
      ok ? "success" : "error",
    );
  }

  async function deleteSelected() {
    const targets = selectedList;
    if (!targets.length) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ student_ids: targets.map((student) => student.id) }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Delete failed.");
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.warn("Bulk delete failed.", error);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="student-search">Search students</Label>
            <Input
              id="student-search"
              placeholder="Search by name, email, or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="student-status">Status</Label>
            <select
              id="student-status"
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All students</option>
              <option value="activated">Activated</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-[var(--muted)]">
          {filtered.length} students - {selectedList.length} selected
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={toggleAll} disabled={!filtered.length}>
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setConfirmOpen(true)}
          disabled={selectedList.length === 0 || deleting}
        >
          {deleting ? "Deleting…" : "Delete Selected"}
        </Button>
        <Button type="button" variant="secondary" onClick={copyLinks} disabled={!filtered.length}>
          Copy Login Links
        </Button>
        <Button type="button" variant="secondary" onClick={copyCodes} disabled={!filtered.length}>
          Copy Codes
        </Button>
        <Button type="button" variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
          Export CSV
        </Button>
        {copyStatus ? (
          <span className={`text-xs ${copyStatus.tone === "success" ? "text-[var(--primary)]" : "text-[var(--danger)]"}`}>
            {copyStatus.message}
          </span>
        ) : null}
      </div>

      {!filtered.length ? (
        <div className="text-sm text-[var(--muted)]">No students match your filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-[var(--text)]">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2 pr-4">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all students" />
                </th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Student link</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleOne(student.id)}
                      aria-label={`Select ${student.first_name} ${student.last_name}`}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="py-2 pr-4">{student.email ?? "-"}</td>
                  <td className="py-2 pr-4">
                    {student.student_code ? (
                      <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono text-[var(--text)]">
                        {student.student_code}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {student.student_code ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="underline underline-offset-4"
                        onClick={async () => {
                          const ok = await copyToClipboard(buildLoginLink(student.student_code!));
                          flashCopyStatus(ok ? "Copied login link." : "Clipboard blocked. Copy failed.", ok ? "success" : "error");
                        }}
                      >
                        Copy Link
                      </Button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {student.auth_user_id ? (
                      <span className="text-[var(--primary)]">Activated</span>
                    ) : (
                      <span className="text-[var(--muted)]">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete selected students?"
        description={`This will remove ${selectedList.length} student${selectedList.length === 1 ? "" : "s"} from the class.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await deleteSelected();
        }}
      />
    </div>
  );
}
