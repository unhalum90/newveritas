"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Student {
    id: string;
    first_name: string;
    last_name: string;
}

interface Submission {
    id: string;
    status: string;
    artifact_url: string | null;
    audio_url: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    student: Student | Student[] | null;
}

interface Score {
    submission_id: string;
    accuracy: number | null;
    reasoning: number | null;
    clarity: number | null;
    transfer: number | null;
    overall: number | null;
}

interface Feedback {
    submission_id: string;
    comment: string;
    needs_resubmission: boolean;
    created_at: string;
}

interface Activity {
    id: string;
    title: string;
    prompt_template: string | null;
    status: string;
}

interface Props {
    activity: Activity;
    submissions: Submission[];
    scoresBySubmission: Record<string, Score>;
    feedbackBySubmission: Record<string, Feedback>;
    teacherId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    assigned: { label: "Not Started", color: "bg-gray-200 text-gray-700" },
    submitted: { label: "Needs Review", color: "bg-yellow-100 text-yellow-700" },
    reviewed: { label: "Reviewed", color: "bg-green-100 text-green-700" },
};

export function FormativeReviewClient({
    activity,
    submissions,
    scoresBySubmission,
    feedbackBySubmission,
    teacherId,
}: Props) {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "reviewed">("all");
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    // Scoring state
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [reasoning, setReasoning] = useState<number | null>(null);
    const [clarity, setClarity] = useState<number | null>(null);
    const [transfer, setTransfer] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [needsResubmission, setNeedsResubmission] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File URLs (signed)
    const [artifactUrl, setArtifactUrl] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loadingFiles, setLoadingFiles] = useState(false);

    const filtered = submissions.filter((s) => {
        if (statusFilter === "all") return s.status !== "assigned";
        return s.status === statusFilter;
    });

    const getStudentName = (submission: Submission) => {
        const student = Array.isArray(submission.student) ? submission.student[0] : submission.student;
        if (!student) return "Unknown Student";
        return `${student.first_name} ${student.last_name}`;
    };

    const openSubmission = async (submission: Submission) => {
        setSelectedSubmission(submission);
        setError(null);

        // Load existing scores/feedback
        const existingScore = scoresBySubmission[submission.id];
        if (existingScore) {
            setAccuracy(existingScore.accuracy);
            setReasoning(existingScore.reasoning);
            setClarity(existingScore.clarity);
            setTransfer(existingScore.transfer);
        } else {
            setAccuracy(null);
            setReasoning(null);
            setClarity(null);
            setTransfer(null);
        }

        const existingFeedback = feedbackBySubmission[submission.id];
        if (existingFeedback) {
            setComment(existingFeedback.comment);
            setNeedsResubmission(existingFeedback.needs_resubmission);
        } else {
            setComment("");
            setNeedsResubmission(false);
        }

        // Get signed URLs for files
        setLoadingFiles(true);
        try {
            const response = await fetch("/api/formative/files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    artifactPath: submission.artifact_url,
                    audioPath: submission.audio_url,
                }),
            });

            if (response.ok) {
                const { artifactUrl, audioUrl } = await response.json();
                setArtifactUrl(artifactUrl);
                setAudioUrl(audioUrl);
            }
        } catch {
            // Silent fail, files just won't load
        }
        setLoadingFiles(false);
    };

    const handleScore = async () => {
        if (!selectedSubmission) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/formative/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    teacherId,
                    accuracy,
                    reasoning,
                    clarity,
                    transfer,
                    comment,
                    needsResubmission,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save score.");
            }

            setSelectedSubmission(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
                {(["all", "submitted", "reviewed"] as const).map((status) => (
                    <Button
                        key={status}
                        type="button"
                        variant={statusFilter === status ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                    >
                        {status === "all" ? "All Submitted" : STATUS_LABELS[status].label}
                    </Button>
                ))}
            </div>

            {/* Submission List */}
            <div className="grid gap-3">
                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-[var(--muted)]">
                            No submissions to review yet.
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((submission) => {
                        const statusInfo = STATUS_LABELS[submission.status] ?? STATUS_LABELS.assigned;
                        const score = scoresBySubmission[submission.id];

                        return (
                            <Card
                                key={submission.id}
                                className="cursor-pointer hover:border-[var(--primary)] transition-colors"
                                onClick={() => openSubmission(submission)}
                            >
                                <CardContent className="py-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{getStudentName(submission)}</p>
                                        <p className="text-xs text-[var(--muted)]">
                                            Submitted: {submission.submitted_at
                                                ? new Date(submission.submitted_at).toLocaleString()
                                                : "—"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {score && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${score.accuracy === 3 ? "bg-green-100 text-green-700" :
                                                score.accuracy === 2 ? "bg-yellow-100 text-yellow-700" :
                                                    score.accuracy === 1 ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-600"
                                                }`}>
                                                {score.accuracy === 3 ? "Understood" :
                                                    score.accuracy === 2 ? "Needs Support" :
                                                        score.accuracy === 1 ? "Off Topic" : "—"}
                                            </span>
                                        )}
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Review Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-[var(--background)] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{getStudentName(selectedSubmission)}</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                ✕
                            </Button>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Artifact */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Artifact</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingFiles ? (
                                    <p className="text-sm text-[var(--muted)]">Loading...</p>
                                ) : artifactUrl ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {artifactUrl.split(",").map((url, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={url}
                                                    alt={`Page ${index + 1}`}
                                                    className="w-full rounded-md border border-[var(--border)]"
                                                />
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                                                    Page {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">No artifact available</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Audio */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Audio Explanation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingFiles ? (
                                    <p className="text-sm text-[var(--muted)]">Loading...</p>
                                ) : audioUrl ? (
                                    <audio src={audioUrl} controls className="w-full" />
                                ) : (
                                    <p className="text-sm text-[var(--muted)]">No audio available</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sentiment Acknowledgment - Pulse is not scored */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Student Understanding</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-xs text-[var(--muted)]">
                                    Pulse check-ins are for sentiment analysis, not grading. Select how you'd categorize this response:
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { value: 3, label: "✓ Understood", color: "bg-green-100 text-green-700 border-green-300" },
                                        { value: 2, label: "? Needs Support", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
                                        { value: 1, label: "✕ Off Topic", color: "bg-red-100 text-red-700 border-red-300" },
                                    ].map(({ value, label, color }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => {
                                                setAccuracy(value);
                                                setReasoning(value);
                                                setClarity(value);
                                                setTransfer(value);
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${accuracy === value
                                                ? `${color} ring-2 ring-offset-1 ring-[var(--primary)]`
                                                : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feedback */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Feedback</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <textarea
                                    placeholder="Add a comment for the student..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="h-20 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={needsResubmission}
                                        onChange={(e) => setNeedsResubmission(e.target.checked)}
                                    />
                                    Request resubmission
                                </label>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleScore}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save & Mark Reviewed"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
