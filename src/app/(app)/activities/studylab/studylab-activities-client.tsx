"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormativeActivityRow {
    id: string;
    title: string;
    prompt_template: string | null;
    rubric_template: string;
    due_at: string | null;
    status: "draft" | "live" | "closed";
    created_at: string;
}

interface Props {
    initialActivities: FormativeActivityRow[];
    classNameById: Record<string, string>;
    classIdsByActivity: Record<string, string[]>;
    submissionStatsById: Record<string, { assigned: number; submitted: number; reviewed: number }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-gray-200 text-gray-700" },
    live: { label: "Live", color: "bg-green-100 text-green-700" },
    closed: { label: "Closed", color: "bg-red-100 text-red-700" },
};

export function StudyLabActivitiesClient({
    initialActivities,
    classNameById,
    classIdsByActivity,
    submissionStatsById,
}: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "live" | "closed">("all");

    const filtered = useMemo(() => {
        return initialActivities.filter((activity) => {
            const matchesSearch = activity.title.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [initialActivities, search, statusFilter]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search" className="sr-only">Search</Label>
                    <Input
                        id="search"
                        placeholder="Search StudyLab sessions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "draft", "live", "closed"] as const).map((status) => (
                        <Button
                            key={status}
                            type="button"
                            variant={statusFilter === status ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === "all" ? "All" : STATUS_LABELS[status].label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Activity Cards */}
            {filtered.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No StudyLab sessions yet</CardTitle>
                        <CardDescription>Create your first AI-guided StudyLab session.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((activity) => {
                        const classIds = classIdsByActivity[activity.id] ?? [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const classNames = classIds.map((id) => classNameById[id] ?? "Unknown").join(", ");
                        const stats = submissionStatsById[activity.id] ?? { assigned: 0, submitted: 0, reviewed: 0 };
                        const statusInfo = STATUS_LABELS[activity.status];

                        return (
                            <Link key={activity.id} href={`/activities/studylab/${activity.id}`}>
                                <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base line-clamp-2">{activity.title}</CardTitle>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <CardDescription className="mt-2">
                                            {classNames || "No classes assigned"}
                                        </CardDescription>
                                    </CardHeader>
                                    <div className="px-6 pb-4">
                                        <div className="flex gap-4 text-xs text-[var(--muted)]">
                                            <span title="Completed">
                                                🧠 {stats.submitted} completed
                                            </span>
                                        </div>
                                        {activity.due_at && (
                                            <p className="mt-2 text-xs text-[var(--muted)]">
                                                Due: {new Date(activity.due_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
