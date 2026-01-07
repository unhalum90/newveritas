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

const PROMPT_TEMPLATES = [
    { id: "summary", label: "One-sentence summary", text: "Summarize these notes in one sentence." },
    { id: "relationship", label: "Explain the relationship", text: "Explain how concept A connects to concept B." },
    { id: "example", label: "New example", text: "Use these notes to solve one new example." },
    { id: "misconception", label: "Misconception check", text: "What's one likely misunderstanding, and why?" },
    { id: "custom", label: "Custom prompt", text: "" },
];

const RUBRIC_TEMPLATES = [
    { id: "default", label: "Default (Accuracy, Reasoning, Clarity, Transfer)" },
];

export function FormativeCreateForm({ teacherId, classes }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [selectedPromptId, setSelectedPromptId] = useState("summary");
    const [customPrompt, setCustomPrompt] = useState("");
    const [rubricTemplate, setRubricTemplate] = useState("default");
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState("");
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

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

        if (publishNow && selectedClassIds.length === 0) {
            setError("Select at least one class to publish.");
            return;
        }

        setIsSubmitting(true);

        try {
            const promptText = selectedPromptId === "custom"
                ? customPrompt
                : PROMPT_TEMPLATES.find((p) => p.id === selectedPromptId)?.text ?? "";

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
                    promptTemplate: promptText,
                    rubricTemplate,
                    dueAt,
                    status: publishNow ? "live" : "draft",
                    classIds: publishNow ? selectedClassIds : [],
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create activity.");
            }

            const { activityId } = await response.json();
            router.push(`/formative/${activityId}`);
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

            {/* Title */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Chapter 5 Note Check"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
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
                </CardContent>
            </Card>

            {/* Prompt Template */}
            <Card>
                <CardHeader>
                    <CardTitle>Voice Prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-[var(--muted)]">
                        Choose a prompt template that students will respond to while recording.
                    </p>
                    <div className="space-y-2">
                        {PROMPT_TEMPLATES.map((template) => (
                            <label
                                key={template.id}
                                className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${selectedPromptId === template.id
                                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="promptTemplate"
                                    value={template.id}
                                    checked={selectedPromptId === template.id}
                                    onChange={() => setSelectedPromptId(template.id)}
                                    className="mt-0.5"
                                />
                                <div>
                                    <span className="font-medium text-sm">{template.label}</span>
                                    {template.text && (
                                        <p className="text-xs text-[var(--muted)] mt-0.5">&quot;{template.text}&quot;</p>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>

                    {selectedPromptId === "custom" && (
                        <div>
                            <Label htmlFor="customPrompt">Your Custom Prompt</Label>
                            <textarea
                                id="customPrompt"
                                placeholder="Enter your prompt for students..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="mt-1 h-24 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rubric */}
            <Card>
                <CardHeader>
                    <CardTitle>Scoring Rubric</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[var(--muted)] mb-3">
                        The micro-rubric used for quick scoring (0–3 scale per dimension).
                    </p>
                    <div className="space-y-2">
                        {RUBRIC_TEMPLATES.map((rubric) => (
                            <label
                                key={rubric.id}
                                className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${rubricTemplate === rubric.id
                                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="rubricTemplate"
                                    value={rubric.id}
                                    checked={rubricTemplate === rubric.id}
                                    onChange={() => setRubricTemplate(rubric.id)}
                                />
                                <span className="font-medium text-sm">{rubric.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
                        <div className="rounded bg-[var(--surface)] border border-[var(--border)] p-2">
                            <div className="font-medium">Accuracy</div>
                            <div className="text-[var(--muted)]">0–3</div>
                        </div>
                        <div className="rounded bg-[var(--surface)] border border-[var(--border)] p-2">
                            <div className="font-medium">Reasoning</div>
                            <div className="text-[var(--muted)]">0–3</div>
                        </div>
                        <div className="rounded bg-[var(--surface)] border border-[var(--border)] p-2">
                            <div className="font-medium">Clarity</div>
                            <div className="text-[var(--muted)]">0–3</div>
                        </div>
                        <div className="rounded bg-[var(--surface)] border border-[var(--border)] p-2">
                            <div className="font-medium">Transfer</div>
                            <div className="text-[var(--muted)]">0–3</div>
                        </div>
                    </div>
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
                    {isSubmitting ? "Publishing..." : "Publish Now"}
                </Button>
            </div>
        </form>
    );
}
