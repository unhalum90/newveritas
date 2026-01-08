"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuditLogEntry = {
    id: string;
    submission_id: string | null;
    assessment_id: string | null;
    student_id: string | null;
    event_type: string;
    actor_id: string | null;
    actor_role: string;
    previous_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    reason: string | null;
    created_at: string;
};

type Props = {
    initialLogs: AuditLogEntry[];
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    ai_scored: "AI Scored",
    teacher_override: "Teacher Override",
    teacher_comment: "Teacher Comment",
    review_requested: "Review Requested",
    review_resolved: "Review Resolved",
    published: "Published",
    audio_deleted: "Audio Deleted",
    submission_deleted: "Submission Deleted",
    score_changed: "Score Changed",
};

const ACTOR_ROLE_COLORS: Record<string, string> = {
    ai: "bg-purple-100 text-purple-800",
    teacher: "bg-blue-100 text-blue-800",
    student: "bg-green-100 text-green-800",
    admin: "bg-amber-100 text-amber-800",
    system: "bg-gray-100 text-gray-800",
};

function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function downloadCsv(filename: string, logs: AuditLogEntry[]) {
    const headers = [
        "ID",
        "Event Type",
        "Actor Role",
        "Reason",
        "Submission ID",
        "Assessment ID",
        "Student ID",
        "Created At",
        "New Value",
    ];

    const rows = logs.map((log) => [
        log.id,
        log.event_type,
        log.actor_role,
        log.reason ?? "",
        log.submission_id ?? "",
        log.assessment_id ?? "",
        log.student_id ?? "",
        log.created_at,
        log.new_value ? JSON.stringify(log.new_value) : "",
    ]);

    const escape = (v: string) => {
        const needs = /[",\n]/.test(v);
        const inner = v.replace(/"/g, '""');
        return needs ? `"${inner}"` : inner;
    };

    const csv = [
        headers.map(escape).join(","),
        ...rows.map((row) => row.map(escape).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function AuditLogClient({ initialLogs }: Props) {
    const [logs] = useState<AuditLogEntry[]>(initialLogs);
    const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
    const [actorRoleFilter, setActorRoleFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (eventTypeFilter && log.event_type !== eventTypeFilter) return false;
            if (actorRoleFilter && log.actor_role !== actorRoleFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesReason = log.reason?.toLowerCase().includes(query);
                const matchesId = log.submission_id?.toLowerCase().includes(query) ||
                    log.assessment_id?.toLowerCase().includes(query);
                if (!matchesReason && !matchesId) return false;
            }
            return true;
        });
    }, [logs, eventTypeFilter, actorRoleFilter, searchQuery]);

    const eventTypes = useMemo(() => {
        return Array.from(new Set(logs.map((l) => l.event_type))).sort();
    }, [logs]);

    const actorRoles = useMemo(() => {
        return Array.from(new Set(logs.map((l) => l.actor_role))).sort();
    }, [logs]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filters</CardTitle>
                    <CardDescription>Filter audit log entries</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--muted)]">Event Type</label>
                            <select
                                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                            >
                                <option value="">All events</option>
                                {eventTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {EVENT_TYPE_LABELS[type] ?? type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--muted)]">Actor Role</label>
                            <select
                                className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                                value={actorRoleFilter}
                                onChange={(e) => setActorRoleFilter(e.target.value)}
                            >
                                <option value="">All roles</option>
                                {actorRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-medium text-[var(--muted)]">Search</label>
                            <input
                                type="text"
                                placeholder="Search by reason or ID..."
                                className="h-9 w-full min-w-[200px] rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => downloadCsv("audit-log-export.csv", filteredLogs)}
                            disabled={!filteredLogs.length}
                        >
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-semibold">{filteredLogs.length}</div>
                        <div className="text-xs text-[var(--muted)]">Total Events</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-semibold">
                            {filteredLogs.filter((l) => l.event_type === "published").length}
                        </div>
                        <div className="text-xs text-[var(--muted)]">Published</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-semibold">
                            {filteredLogs.filter((l) =>
                                l.event_type === "published" &&
                                (l.new_value as { is_override?: boolean } | null)?.is_override
                            ).length}
                        </div>
                        <div className="text-xs text-[var(--muted)]">With Override</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-semibold">
                            {filteredLogs.filter((l) => l.event_type === "review_requested").length}
                        </div>
                        <div className="text-xs text-[var(--muted)]">Review Requests</div>
                    </CardContent>
                </Card>
            </div>

            {/* Log Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Events</CardTitle>
                    <CardDescription>
                        Showing {filteredLogs.length} of {logs.length} entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!filteredLogs.length ? (
                        <div className="py-8 text-center text-sm text-[var(--muted)]">
                            No audit log entries found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--muted)]">
                                        <th className="px-3 py-2">Timestamp</th>
                                        <th className="px-3 py-2">Event</th>
                                        <th className="px-3 py-2">Actor</th>
                                        <th className="px-3 py-2">Reason</th>
                                        <th className="px-3 py-2">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)]">
                                            <td className="px-3 py-3 text-xs text-[var(--muted)] whitespace-nowrap">
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-medium">
                                                    {EVENT_TYPE_LABELS[log.event_type] ?? log.event_type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${ACTOR_ROLE_COLORS[log.actor_role] ?? "bg-gray-100 text-gray-800"}`}>
                                                    {log.actor_role}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 max-w-[200px] truncate text-xs text-[var(--muted)]" title={log.reason ?? undefined}>
                                                {log.reason ?? "—"}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-[var(--muted)]">
                                                {log.new_value ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="hover:text-[var(--text)]">View JSON</summary>
                                                        <pre className="mt-2 max-w-[300px] overflow-auto rounded bg-[var(--surface)] p-2 text-[10px]">
                                                            {JSON.stringify(log.new_value, null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
