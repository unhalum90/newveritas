"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

function formatDate(d: string | null) {
    if (!d) return null;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
}

export function PulseListClient() {
    const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<"active" | "past">("active");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
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

    // Filter for pulse checks only
    const pulseAssessments = useMemo(() => {
        return assessments.filter((a) => a.type === "pulse");
    }, [assessments]);

    // Split into active and past
    const { activeAssessments, pastAssessments } = useMemo(() => {
        const isActive = (a: AssessmentListItem) =>
            !a.latest_submission ||
            a.latest_submission.status === "assigned" ||
            a.latest_submission.status === "started" ||
            a.latest_submission.status === "restarted";

        return {
            activeAssessments: pulseAssessments.filter(isActive),
            pastAssessments: pulseAssessments.filter((a) => !isActive(a)),
        };
    }, [pulseAssessments]);

    const displayedAssessments = view === "active" ? activeAssessments : pastAssessments;

    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-10">
            <div className="mx-auto w-full max-w-4xl space-y-6">
                {/* Breadcrumb Header */}
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Link href="/student" className="hover:text-zinc-700 hover:underline">
                        Dashboard
                    </Link>
                    <span>/</span>
                    <span className="text-zinc-900 font-medium">Pulse Checks</span>
                </div>

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">💓 Pulse Checks</h1>
                        <p className="mt-1 text-sm text-zinc-600">Quick check-ins on your understanding</p>
                    </div>
                </div>

                {/* Active/Past Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setView("active")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "active"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                            }`}
                    >
                        Active ({activeAssessments.length})
                    </button>
                    <button
                        onClick={() => setView("past")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "past"
                                ? "bg-zinc-800 text-white"
                                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                            }`}
                    >
                        Past ({pastAssessments.length})
                    </button>
                </div>

                {error ? <div className="text-sm text-red-600">{error}</div> : null}
                {loading ? <div className="text-sm text-zinc-600">Loading…</div> : null}

                {/* Empty State */}
                {!loading && displayedAssessments.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 bg-white rounded-lg border border-dashed border-zinc-200">
                        <span className="text-4xl block mb-2">💓</span>
                        <p>
                            {view === "active" ? "No active pulse checks right now." : "No past pulse checks yet."}
                        </p>
                    </div>
                )}

                {/* Pulse Cards */}
                {!loading && displayedAssessments.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {displayedAssessments.map((a) => (
                            <Card key={a.id} className="overflow-hidden">
                                {a.asset_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={a.asset_url} alt={`${a.title} cover`} className="h-40 w-full object-cover" />
                                ) : null}
                                <CardHeader>
                                    <CardTitle>{a.title}</CardTitle>
                                    <CardDescription>
                                        {formatDate(a.published_at) ? `Published ${formatDate(a.published_at)}` : "Published"}
                                        {a.latest_submission
                                            ? ` • ${a.latest_submission.review_status === "published"
                                                ? "Feedback ready"
                                                : `Status: ${a.latest_submission.status}`
                                            }`
                                            : ""}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/student/formative/${a.id}`}>
                                        <Button type="button" className="w-full">
                                            {a.latest_submission?.review_status === "published"
                                                ? "View Feedback"
                                                : a.latest_submission?.status === "started"
                                                    ? "Continue"
                                                    : "Open"}
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
