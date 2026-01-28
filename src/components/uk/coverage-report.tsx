"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KEY_STAGES, NC_SUBJECTS } from "@/lib/config/uk-config";

interface CoverageData {
    assessments: Array<{
        id: string;
        title: string;
        key_stage: string | null;
        year_group: number | null;
        nc_subject: { subject: string; domain: string | null } | null;
        activity_context: string | null;
        created_at: string;
        class_id?: string | null;
    }>;
    classes?: Array<{ id: string; name: string }>;
}

type DateRange = "all" | "year" | "term";

export function UKCoverageReport({ data }: { data: CoverageData }) {
    const [selectedKS, setSelectedKS] = useState<string | "all">("all");
    const [selectedSubject, setSelectedSubject] = useState<string | "all">("all");
    const [selectedClass, setSelectedClass] = useState<string | "all">("all");
    const [dateRange, setDateRange] = useState<DateRange>("all");

    // Date range filtering
    const getDateCutoff = (range: DateRange): Date | null => {
        const now = new Date();
        switch (range) {
            case "term":
                // Approximate: last 3 months
                return new Date(now.getFullYear(), now.getMonth() - 3, 1);
            case "year":
                return new Date(now.getFullYear(), 0, 1);
            default:
                return null;
        }
    };

    // Filter logic
    const filtered = useMemo(() => {
        const cutoff = getDateCutoff(dateRange);
        return data.assessments.filter(a => {
            const matchKS = selectedKS === "all" || a.key_stage === selectedKS;
            const matchSub = selectedSubject === "all" || a.nc_subject?.subject === selectedSubject;
            const matchClass = selectedClass === "all" || a.class_id === selectedClass;
            const matchDate = !cutoff || new Date(a.created_at) >= cutoff;
            return matchKS && matchSub && matchClass && matchDate;
        });
    }, [data.assessments, selectedKS, selectedSubject, selectedClass, dateRange]);

    // Aggregations for charts
    const subjectCounts = useMemo(() => {
        const counts = NC_SUBJECTS.map(s => ({
            subject: s.subject,
            count: filtered.filter(a => a.nc_subject?.subject === s.subject).length
        })).filter(s => s.count > 0);
        const maxCount = Math.max(...counts.map(s => s.count), 1);
        return counts.map(s => ({ ...s, percentage: (s.count / maxCount) * 100 }));
    }, [filtered]);

    const ksCounts = useMemo(() => {
        const counts = Object.keys(KEY_STAGES).map(ks => ({
            ks,
            count: filtered.filter(a => a.key_stage === ks).length
        })).filter(k => k.count > 0);
        const maxCount = Math.max(...counts.map(k => k.count), 1);
        return counts.map(k => ({ ...k, percentage: (k.count / maxCount) * 100 }));
    }, [filtered]);

    const activityCounts = useMemo(() => {
        const contexts = ["lesson", "homework", "formative", "summative", "portfolio"];
        const labels: Record<string, string> = {
            lesson: "Lesson Activity",
            homework: "Homework",
            formative: "Formative",
            summative: "Summative",
            portfolio: "Portfolio"
        };
        return contexts.map(ctx => ({
            context: labels[ctx] || ctx,
            count: filtered.filter(a => a.activity_context === ctx).length
        })).filter(c => c.count > 0);
    }, [filtered]);

    const exportCSV = () => {
        const headers = ["Title", "Key Stage", "Year Group", "Subject", "Domain", "Context", "Date"];
        const rows = filtered.map(a => [
            `"${a.title.replace(/"/g, '""')}"`,
            a.key_stage ?? "",
            a.year_group ? `Year ${a.year_group}` : "",
            a.nc_subject?.subject ?? "",
            a.nc_subject?.domain ?? "",
            a.activity_context ?? "",
            new Date(a.created_at).toLocaleDateString("en-GB")
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `uk_curriculum_coverage_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const subjectsCovered = new Set(filtered.map(a => a.nc_subject?.subject).filter(Boolean)).size;
    const yearsCovered = new Set(filtered.map(a => a.year_group).filter(Boolean)).size;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Curriculum Coverage</h2>
                    <p className="text-sm text-[var(--muted)]">Track how your assessments align with the National Curriculum.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                        Export CSV
                    </Button>
                    <Button size="sm" onClick={() => window.print()} className="bg-[var(--primary)]">
                        Print Report
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-[var(--border)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[var(--muted)]">Total Assessments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{filtered.length}</div>
                        <p className="text-xs text-[var(--muted)] mt-1">
                            {data.assessments.length - filtered.length > 0 && `${data.assessments.length - filtered.length} filtered out`}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-[var(--border)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[var(--muted)]">Subjects Covered</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{subjectsCovered}</div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-2 rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${(subjectsCovered / NC_SUBJECTS.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1">of {NC_SUBJECTS.length} NC subjects</p>
                    </CardContent>
                </Card>
                <Card className="border-[var(--border)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[var(--muted)]">Year Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{yearsCovered}</div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-2 rounded-full bg-blue-500 transition-all"
                                style={{ width: `${(yearsCovered / 13) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1">of 13 year groups</p>
                    </CardContent>
                </Card>
                <Card className="border-[var(--border)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[var(--muted)]">Key Stages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{ksCounts.length}</div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-2 rounded-full bg-purple-500 transition-all"
                                style={{ width: `${(ksCounts.length / 5) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1">of 5 key stages</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-[var(--border)]">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-[var(--muted)]">Date Range</label>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as DateRange)}
                        className="block w-36 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    >
                        <option value="all">All time</option>
                        <option value="year">This year</option>
                        <option value="term">This term</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-[var(--muted)]">Key Stage</label>
                    <select
                        value={selectedKS}
                        onChange={(e) => setSelectedKS(e.target.value)}
                        className="block w-32 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    >
                        <option value="all">All stages</option>
                        {Object.keys(KEY_STAGES).map(ks => (
                            <option key={ks} value={ks}>{ks}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-[var(--muted)]">Subject</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="block w-44 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    >
                        <option value="all">All subjects</option>
                        {NC_SUBJECTS.map(s => (
                            <option key={s.subject} value={s.subject}>{s.subject}</option>
                        ))}
                    </select>
                </div>
                {data.classes && data.classes.length > 0 && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-[var(--muted)]">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="block w-40 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        >
                            <option value="all">All classes</option>
                            {data.classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {(selectedKS !== "all" || selectedSubject !== "all" || selectedClass !== "all" || dateRange !== "all") && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedKS("all");
                            setSelectedSubject("all");
                            setSelectedClass("all");
                            setDateRange("all");
                        }}
                        className="text-[var(--muted)] hover:text-[var(--text)]"
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Charts Section */}
            {filtered.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Subject Distribution Chart */}
                    <Card className="border-[var(--border)]">
                        <CardHeader>
                            <CardTitle className="text-base">Subject Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {subjectCounts.length === 0 ? (
                                <p className="text-sm text-[var(--muted)] italic">No subject data available</p>
                            ) : (
                                subjectCounts.slice(0, 8).map(s => (
                                    <div key={s.subject} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{s.subject}</span>
                                            <span className="text-[var(--muted)]">{s.count}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                                style={{ width: `${s.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Key Stage Distribution Chart */}
                    <Card className="border-[var(--border)]">
                        <CardHeader>
                            <CardTitle className="text-base">Key Stage Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ksCounts.length === 0 ? (
                                <p className="text-sm text-[var(--muted)] italic">No key stage data available</p>
                            ) : (
                                ksCounts.map(k => (
                                    <div key={k.ks} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{k.ks}</span>
                                            <span className="text-[var(--muted)]">{k.count}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                                style={{ width: `${k.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Activity Context Breakdown (if data exists) */}
            {activityCounts.length > 0 && (
                <Card className="border-[var(--border)]">
                    <CardHeader>
                        <CardTitle className="text-base">Activity Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {activityCounts.map(c => (
                                <div key={c.context} className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2">
                                    <span className="text-sm font-medium">{c.context}</span>
                                    <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-bold text-white">{c.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Table */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--muted)] border-b border-[var(--border)]">
                        <tr>
                            <th className="px-4 py-3 font-medium">Assessment Title</th>
                            <th className="px-4 py-3 font-medium">Key Stage</th>
                            <th className="px-4 py-3 font-medium">Year</th>
                            <th className="px-4 py-3 font-medium">Subject</th>
                            <th className="px-4 py-3 font-medium">Domain</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                                            <svg className="h-8 w-8 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-[var(--muted)] font-medium">No UK assessments found</p>
                                        <p className="text-sm text-[var(--muted)]">Create assessments with UK curriculum tagging to see coverage here.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.slice(0, 50).map(a => (
                                <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                                    <td className="px-4 py-4 font-medium text-[var(--text)]">{a.title}</td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/20 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                                            {a.key_stage ?? "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">{a.year_group ? `Y${a.year_group}` : "—"}</td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                            {a.nc_subject?.subject ?? "None"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-[var(--muted)] text-xs">{a.nc_subject?.domain ?? "—"}</td>
                                    <td className="px-4 py-4 text-[var(--muted)] text-xs">
                                        {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {filtered.length > 50 && (
                    <div className="border-t border-[var(--border)] px-4 py-3 text-center text-sm text-[var(--muted)]">
                        Showing 50 of {filtered.length} assessments. Export CSV for full data.
                    </div>
                )}
            </div>
        </div>
    );
}
