"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
    teacherId: string;
    classes: { id: string; name: string }[];
}

export function StudyLabCreateForm({ teacherId, classes }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [prompt, setPrompt] = useState("");
    // New fields
    const [learningTarget, setLearningTarget] = useState("");
    const [maxTurns, setMaxTurns] = useState(6);
    const [difficulty, setDifficulty] = useState<"supportive" | "standard" | "challenge">("standard");

    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState("");
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

    // Feedback visibility settings
    const [showScoreToStudent, setShowScoreToStudent] = useState(true);
    const [showSummaryToStudent, setShowSummaryToStudent] = useState(true);
    const [showStrengthsToStudent, setShowStrengthsToStudent] = useState(true);
    const [showWeaknessesToStudent, setShowWeaknessesToStudent] = useState(true);

    // Artifact upload settings
    const [requireArtifact, setRequireArtifact] = useState(true);
    const [maxArtifactCount, setMaxArtifactCount] = useState(1);

    const handleClassToggle = (classId: string) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId)
                ? prev.filter((id) => id !== classId)
                : [...prev, classId]
        );
    };

    const handleSubmit = async (e: React.FormEvent, publishNow: boolean) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Title is required.");
            return;
        }

        if (!learningTarget.trim()) {
            setError("Learning Target is required.");
            return;
        }

        if (publishNow && selectedClassIds.length === 0) {
            setError("Select at least one class to publish.");
            return;
        }

        setIsSubmitting(true);

        try {
            const dueAt = dueDate && dueTime
                ? new Date(`${dueDate}T${dueTime}`).toISOString()
                : dueDate
                    ? new Date(`${dueDate}T23:59:59`).toISOString()
                    : null;

            const response = await fetch("/api/formative/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId,
                    title: title.trim(),
                    promptTemplate: prompt.trim() || undefined,
                    learningTarget: learningTarget.trim(),
                    maxTurns,
                    difficulty,
                    rubricTemplate: "default",
                    dueAt,
                    status: publishNow ? "live" : "draft",
                    classIds: publishNow ? selectedClassIds : [],
                    type: "studylab",
                    // Feedback visibility
                    showScoreToStudent,
                    showSummaryToStudent,
                    showStrengthsToStudent,
                    showWeaknessesToStudent,
                    // Artifact settings
                    requireArtifact,
                    maxArtifactCount,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create activity.");
            }

            // Redirect to StudyLab dashboard
            router.push(`/activities/studylab`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-6">
            {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Session Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Topic / Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Mitosis Review"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="learningTarget">Learning Target / Unit Context *</Label>
                        <p className="text-xs text-[var(--muted)] mb-1">
                            What specific concept should the AI help students understand?
                        </p>
                        <textarea
                            id="learningTarget"
                            placeholder="e.g., Students will understand the difference between prophase and metaphase."
                            value={learningTarget}
                            onChange={(e) => setLearningTarget(e.target.value)}
                            required
                            className="mt-1 h-20 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="maxTurns">Max Conversation Turns</Label>
                            <Input
                                id="maxTurns"
                                type="number"
                                min={3}
                                max={20}
                                value={maxTurns}
                                onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="difficulty">Scaffolding Level</Label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as any)}
                                className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            >
                                <option value="supportive">Supportive (Hints & Definitions)</option>
                                <option value="standard">Standard (Socratic Guidance)</option>
                                <option value="challenge">Challenge (Extension Questions)</option>
                            </select>
                        </div>
                    </div>


                    <div>
                        <Label htmlFor="prompt">Additional AI Instructions (Optional)</Label>
                        <p className="text-xs text-[var(--muted)] mb-1">
                            Any other specific behaviors?
                        </p>
                        <textarea
                            id="prompt"
                            placeholder="e.g., Do not give away the answer."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="mt-1 h-20 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="dueTime">Due Time</Label>
                            <Input
                                id="dueTime"
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Artifact Upload Settings */}
                    <div className="pt-4 border-t border-[var(--border)]">
                        <Label className="text-base font-medium">Student Evidence Upload</Label>
                        <p className="text-xs text-[var(--muted)] mb-3">
                            Configure how students submit visual evidence of their work.
                        </p>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] hover:bg-[var(--surface)]/50 cursor-pointer">
                                <div>
                                    <span className="font-medium text-sm">Require Photo Upload</span>
                                    <p className="text-xs text-[var(--muted)]">Students must upload at least one photo</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={requireArtifact}
                                    onChange={(e) => setRequireArtifact(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                            </label>

                            {requireArtifact && (
                                <div>
                                    <Label htmlFor="maxArtifactCount">Maximum Photos Allowed</Label>
                                    <p className="text-xs text-[var(--muted)] mb-2">
                                        Allow multiple photos for multi-angle evidence (e.g., physical models, art projects)
                                    </p>
                                    <div className="flex items-center gap-4">
                                        {[1, 2, 3, 4, 5].map((count) => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => setMaxArtifactCount(count)}
                                                className={`px-4 py-2 rounded-md border transition-colors ${maxArtifactCount === count
                                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                                                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                                                    }`}
                                            >
                                                {count === 1 ? "1 photo" : `Up to ${count}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student Feedback Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Student Feedback Settings</CardTitle>
                    <p className="text-sm text-[var(--muted)]">
                        Choose what parts of the AI feedback students will see after completing their session.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] hover:bg-[var(--surface)]/50 cursor-pointer">
                        <div>
                            <span className="font-medium text-sm">Score</span>
                            <p className="text-xs text-[var(--muted)]">Show the AI-assigned score (1-4)</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={showScoreToStudent}
                            onChange={(e) => setShowScoreToStudent(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] hover:bg-[var(--surface)]/50 cursor-pointer">
                        <div>
                            <span className="font-medium text-sm">Summary</span>
                            <p className="text-xs text-[var(--muted)]">Show the AI's overall assessment summary</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={showSummaryToStudent}
                            onChange={(e) => setShowSummaryToStudent(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] hover:bg-[var(--surface)]/50 cursor-pointer">
                        <div>
                            <span className="font-medium text-sm">Strengths</span>
                            <p className="text-xs text-[var(--muted)]">Show what the student did well</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={showStrengthsToStudent}
                            onChange={(e) => setShowStrengthsToStudent(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] hover:bg-[var(--surface)]/50 cursor-pointer">
                        <div>
                            <span className="font-medium text-sm">Focus Areas</span>
                            <p className="text-xs text-[var(--muted)]">Show areas for improvement</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={showWeaknessesToStudent}
                            onChange={(e) => setShowWeaknessesToStudent(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                    </label>
                </CardContent>
            </Card>

            {/* Class Assignment */}
            <Card>
                <CardHeader>
                    <CardTitle>Assign to Classes</CardTitle>
                </CardHeader>
                <CardContent>
                    {classes.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">
                            No classes available.{" "}
                            <a href="/classes/new" className="text-[var(--primary)] underline">
                                Create a class first.
                            </a>
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {classes.map((cls) => (
                                <label
                                    key={cls.id}
                                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${selectedClassIds.includes(cls.id)
                                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedClassIds.includes(cls.id)}
                                        onChange={() => handleClassToggle(cls.id)}
                                    />
                                    <span className="font-medium text-sm">{cls.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={isSubmitting || classes.length === 0}
                >
                    {isSubmitting ? "Publishing..." : "Publish Session"}
                </Button>
            </div>
        </form>
    );
}
