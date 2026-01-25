"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useSessionTimer } from "@/hooks/use-session-timer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Label } from "@/components/ui/label";

interface Activity {
    id: string;
    title: string;
    prompt_template: string | null;
    due_at: string | null;
    status: string;
    require_artifact?: boolean;
    max_artifact_count?: number;
    type?: "pulse" | "studylab";
}

interface Submission {
    id: string;
    status: string;
    artifact_url: string | null;
    audio_url: string | null;
    submitted_at: string | null;
}

interface Score {
    accuracy: number | null;
    reasoning: number | null;
    clarity: number | null;
    transfer: number | null;
    overall: number | null;
}

interface Feedback {
    comment: string;
    needs_resubmission: boolean;
    created_at: string;
}

interface Props {
    activity: Activity;
    submission: Submission | null;
    studentId: string;
    feedback: Feedback | null;
    score: Score | null;
    hasIepAccommodations?: boolean;
}

// Input mode types for accessibility
type InputMode = "scan" | "voice_memo" | "digital" | "skeleton";

const INPUT_MODE_LABELS: Record<InputMode, { title: string; description: string; icon: string }> = {
    scan: {
        title: "Scan Notes",
        description: "Upload a photo of your handwritten notes",
        icon: "📷",
    },
    voice_memo: {
        title: "Voice Memo",
        description: "I don't have notes—let me tell you what I remember",
        icon: "🎤",
    },
    digital: {
        title: "Type Answer",
        description: "Type your answer directly",
        icon: "⌨️",
    },
    skeleton: {
        title: "Help Me Start",
        description: "I need a prompt to get started",
        icon: "💡",
    },
};

export function FormativeSubmitClient({
    activity,
    submission,
    studentId,
    feedback,
    score,
    hasIepAccommodations = false,
}: Props) {
    const { isLimitReached, showBreakSuggestion, setShowBreakSuggestion } = useSessionTimer({ studentId });
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Accessibility settings
    const [inputMode, setInputMode] = useState<InputMode>("scan");
    const [cameraAnxietyMode, setCameraAnxietyMode] = useState(false);
    const [highContrastMode, setHighContrastMode] = useState(false);
    const [useDyslexicFont, setUseDyslexicFont] = useState(false);

    // File upload state (for scan mode) - supports up to 3 pages
    const [artifactFiles, setArtifactFiles] = useState<File[]>([]);
    const [artifactPreviews, setArtifactPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Use activity's max_artifact_count, default to 1 if not set
    const MAX_ARTIFACT_FILES = activity.max_artifact_count || 1;

    // Digital notes state (for digital mode)
    const [digitalNotes, setDigitalNotes] = useState("");

    // Voice memo seed state (for voice_memo mode)
    const [voiceMemoBlob, setVoiceMemoBlob] = useState<Blob | null>(null);
    const [voiceMemoUrl, setVoiceMemoUrl] = useState<string | null>(null);

    // Audio recording state
    const [activeRecordingType, setActiveRecordingType] = useState<"voice_memo" | "explanation" | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // Load accessibility preferences from localStorage
    useEffect(() => {
        const savedPrefs = localStorage.getItem("studylab_accessibility");
        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                if (prefs.cameraAnxietyMode) setCameraAnxietyMode(true);
                if (prefs.highContrastMode) setHighContrastMode(true);
                if (prefs.useDyslexicFont) setUseDyslexicFont(true);
            } catch { }
        }
    }, []);

    // Save accessibility preferences
    const saveAccessibilityPrefs = () => {
        localStorage.setItem(
            "studylab_accessibility",
            JSON.stringify({ cameraAnxietyMode, highContrastMode, useDyslexicFont })
        );
    };

    useEffect(() => {
        saveAccessibilityPrefs();
    }, [cameraAnxietyMode, highContrastMode, useDyslexicFont]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        // Calculate how many more files we can add
        const remainingSlots = MAX_ARTIFACT_FILES - artifactFiles.length;
        const filesToAdd = Math.min(files.length, remainingSlots);

        for (let i = 0; i < filesToAdd; i++) {
            const file = files[i];
            newFiles.push(file);
            if (file.type.startsWith("image/")) {
                newPreviews.push(URL.createObjectURL(file));
            } else {
                newPreviews.push(""); // Empty string for non-image files
            }
        }

        setArtifactFiles(prev => [...prev, ...newFiles]);
        setArtifactPreviews(prev => [...prev, ...newPreviews]);

        // Reset input so same file can be selected again
        e.target.value = "";
    };

    const removeArtifactFile = (index: number) => {
        setArtifactFiles(prev => prev.filter((_, i) => i !== index));
        setArtifactPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const startRecording = async (type: "voice_memo" | "explanation") => {
        try {
            console.log("Starting recording of type:", type);
            // Try with raw constraints first to avoid processing silences
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: true // Keep AGC as it usually helps
                }
            });

            const tracks = stream.getAudioTracks();
            console.log("Microphone access granted. Tracks:", tracks.map(t => ({
                label: t.label,
                enabled: t.enabled,
                muted: t.muted, // if true, hardware is muted
                readyState: t.readyState,
                settings: t.getSettings()
            })));

            // Detect supported mime type
            const mimeType = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/aac'
            ].find(type => MediaRecorder.isTypeSupported(type)) || '';

            const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            // Always setup AudioContext for diagnostics, even if cameraAnxietyMode is off
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const updateAudioLevel = () => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((total, val) => total + val, 0) / dataArray.length;
                    setAudioLevel(average / 255);
                    if (Math.random() < 0.05) {
                        console.log("Live Level:", average, "Muted:", tracks[0].muted);
                    }
                }
                animationRef.current = requestAnimationFrame(updateAudioLevel);
            };
            updateAudioLevel();

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                    console.log("Audio chunk received:", e.data.size, "Total chunks:", chunks.length, "Total size:", chunks.reduce((acc, c) => acc + c.size, 0));
                }
            };

            mediaRecorder.onerror = (e) => {
                console.error("MediaRecorder error:", e);
                setError("Recording error occurred: " + ((e as any).error?.message || "Unknown recorder error"));
            };

            mediaRecorder.onstop = () => {
                const finalMimeType = mimeType || 'audio/webm';
                const blob = new Blob(chunks, { type: finalMimeType });
                console.log("Recording stopped. Total chunks:", chunks.length, "Final blob size:", blob.size, "Type:", finalMimeType);

                if (blob.size === 0) {
                    setError("The recording was empty. Please check your microphone permissions and try again.");
                } else if (type === "voice_memo") {
                    setVoiceMemoBlob(blob);
                    setVoiceMemoUrl(URL.createObjectURL(blob));
                } else {
                    setAudioBlob(blob);
                    setAudioUrl(URL.createObjectURL(blob));
                }
                stream.getTracks().forEach((track) => track.stop());
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                setAudioLevel(0);
                setActiveRecordingType(null);
            };

            setActiveRecordingType(type);
            setRecordingTime(0);
            mediaRecorder.start(500);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Recording start error", err);
            setError("Could not access microphone. Error: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && activeRecordingType) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const resetRecording = (isVoiceMemo = false) => {
        if (isVoiceMemo) {
            setVoiceMemoBlob(null);
            setVoiceMemoUrl(null);
        } else {
            setAudioBlob(null);
            setAudioUrl(null);
        }
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getSimplifiedPrompt = () => {
        if (hasIepAccommodations) {
            return "Tell me in your own words one thing you learned from today's lesson.";
        }
        return activity.prompt_template || "Explain what you learned in 30 seconds.";
    };

    const isPulse = activity.type === "pulse";
    const availableModes: InputMode[] = isPulse
        ? ["digital", "voice_memo"]
        : ["scan", "voice_memo", "digital", "skeleton"];

    // Update labels for Pulse vs StudyLab
    const getModeLabel = (mode: InputMode) => {
        if (isPulse && mode === "digital") return { ...INPUT_MODE_LABELS.digital, title: "Type Answer", description: "Type your answer directly" };
        if (isPulse && mode === "voice_memo") return { ...INPUT_MODE_LABELS.voice_memo, title: "Record Answer", description: "Speak your answer directly" };
        return INPUT_MODE_LABELS[mode];
    };

    const handleSubmit = async () => {
        // Validate based on input mode
        if (inputMode === "scan" && artifactFiles.length === 0 && !isPulse) {
            setError("Please upload at least one page of your notes.");
            return;
        }
        if (inputMode === "digital" && !digitalNotes.trim()) {
            setError("Please type your answer.");
            return;
        }
        if (inputMode === "voice_memo" && !voiceMemoBlob) {
            setError("Please record your answer.");
            return;
        }

        // For non-voice-memo modes in StudyLab, require the explanation audio
        // Pulse activities DO NOT require separate explanation audio
        if (!isPulse && inputMode !== "voice_memo" && !audioBlob) {
            setError("Please record your voice explanation.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("activityId", activity.id);
            formData.append("studentId", studentId);
            formData.append("inputMode", inputMode);

            // Use voice memo as the audio explanation if in voice_memo mode
            const finalAudioBlob = inputMode === "voice_memo" ? voiceMemoBlob : audioBlob;

            if (!finalAudioBlob && !isPulse) {
                throw new Error("Missing audio recording.");
            }

            // Determine extension if audio exists
            if (finalAudioBlob) {
                const ext = finalAudioBlob.type.includes("mp4") ? "mp4" : "webm";
                formData.append("audio", finalAudioBlob, `recording.${ext}`);
            }

            if (inputMode === "scan" && artifactFiles.length > 0) {
                // Append all artifact files
                artifactFiles.forEach((file, index) => {
                    formData.append(`artifact_${index}`, file);
                });
                formData.append("artifactCount", String(artifactFiles.length));
            } else if (inputMode === "digital") {
                formData.append("digitalNotes", digitalNotes);
            } else if (inputMode === "voice_memo" && voiceMemoBlob) {
                const vmExt = voiceMemoBlob.type.includes("mp4") ? "mp4" : "webm";
                formData.append("voiceMemo", voiceMemoBlob, `voice_memo.${vmExt}`);
            } else if (inputMode === "skeleton") {
                formData.append("usedSkeleton", "true");
            }

            const response = await fetch("/api/formative/submit", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit.");
            }

            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Dynamic class for accessibility
    const accessibilityClasses = [
        highContrastMode && "high-contrast",
        useDyslexicFont && "font-opendyslexic",
    ]
        .filter(Boolean)
        .join(" ");

    // Already submitted
    if (submission?.status === "submitted" || submission?.status === "reviewed") {
        return (
            <div className={`space-y-6 ${accessibilityClasses}`} role="main" aria-label="Submission status">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600" role="status" aria-live="polite">
                            ✓ Submitted
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-[var(--muted)]">
                            You submitted this activity on{" "}
                            {submission.submitted_at
                                ? new Date(submission.submitted_at).toLocaleString()
                                : "N/A"}
                        </p>
                    </CardContent>
                </Card>

                {feedback && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Teacher Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">{feedback.comment}</p>
                            {feedback.needs_resubmission && (
                                <div
                                    className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700"
                                    role="alert"
                                >
                                    Your teacher has requested a resubmission.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Pulse is sentiment-only, no scores displayed */}
            </div>
        );
    }

    // Default to 'digital' for Pulse if current mode is not available
    useEffect(() => {
        if (isPulse && !availableModes.includes(inputMode)) {
            setInputMode("digital");
        }
    }, [isPulse, availableModes, inputMode]);

    // Daily Limit Lock Screen
    if (isLimitReached) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-red-200 bg-red-50 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">⏳</span>
                        </div>
                        <CardTitle className="text-red-900">Daily Limit Reached</CardTitle>
                        <CardDescription className="text-red-700">
                            You've practiced for 60 minutes today.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-red-800">
                            Great job on your learning today! To keep your progress fresh and avoid burnout,
                            please take a break and resume tomorrow.
                        </p>
                        <Link href="/student">
                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${accessibilityClasses}`} role="main" aria-label="Submit formative activity">
            {/* Break Suggestion Alert */}
            {showBreakSuggestion && (
                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">☕</span>
                        <div>
                            <p className="font-bold">Time for a break?</p>
                            <p className="text-sm opacity-90">Great work! Take a 5-minute break before continuing.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-blue-700"
                        onClick={() => setShowBreakSuggestion(false)}
                    >
                        Dismiss
                    </Button>
                </div>
            )}
            {/* Accessibility Settings - Collapsible Dropdown (Hide for Pulse to simplify) */}
            {!isPulse && (
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors list-none">
                        <span aria-hidden="true">⚙️</span>
                        <span>Accessibility</span>
                        <span className="ml-1 text-xs group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cameraAnxietyMode}
                                    onChange={(e) => setCameraAnxietyMode(e.target.checked)}
                                    aria-describedby="camera-anxiety-desc"
                                />
                                <span>Audio visualizer only</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={highContrastMode}
                                    onChange={(e) => setHighContrastMode(e.target.checked)}
                                />
                                <span>High contrast</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useDyslexicFont}
                                    onChange={(e) => setUseDyslexicFont(e.target.checked)}
                                />
                                <span>Dyslexia-friendly font</span>
                            </label>
                        </div>
                        <p id="camera-anxiety-desc" className="text-xs text-[var(--muted)] mt-2">
                            Audio visualizer replaces the camera view with sound wave bars.
                        </p>
                    </div>
                </details>
            )}

            {error && (
                <div
                    className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700"
                    role="alert"
                    aria-live="assertive"
                >
                    {error}
                </div>
            )}

            {/* Prompt */}
            {activity.prompt_template && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Task</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm italic" aria-label="Task prompt">
                            &quot;{hasIepAccommodations ? getSimplifiedPrompt() : activity.prompt_template}&quot;
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Input Mode Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>How would you like to share your thinking?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="grid grid-cols-2 gap-3"
                        role="radiogroup"
                        aria-label="Choose how to submit your work"
                    >
                        {availableModes.map((mode) => {
                            const { title, description, icon } = getModeLabel(mode);
                            const isSelected = inputMode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setInputMode(mode)}
                                    className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isSelected
                                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                                        }`}
                                    role="radio"
                                    aria-checked={isSelected}
                                    aria-label={title}
                                >
                                    <span className="text-2xl" aria-hidden="true">
                                        {icon}
                                    </span>
                                    <span className="font-medium text-sm">{title}</span>
                                    <span className="text-xs text-[var(--muted)]">{description}</span>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step 1: Input based on mode */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isPulse
                            ? (inputMode === 'voice_memo' ? 'Record Answer' : 'Write Answer')
                            : (inputMode === 'voice_memo' ? 'Record Voice Memo' : `Step 1: ${INPUT_MODE_LABELS[inputMode].title}`)
                        }
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {inputMode === "scan" && (
                        <>
                            <p className="text-sm text-[var(--muted)]">
                                {MAX_ARTIFACT_FILES === 1
                                    ? "Take a photo or upload a scan of your work."
                                    : `Take photos or upload scans of your work (up to ${MAX_ARTIFACT_FILES} photos).`
                                }
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                multiple
                                onChange={handleFileChange}
                                className="sr-only"
                                aria-label="Upload artifact files"
                                id="artifact-upload"
                            />

                            {/* Show uploaded files */}
                            {artifactFiles.length > 0 && (
                                <div className="grid grid-cols-3 gap-3">
                                    {artifactFiles.map((file, index) => (
                                        <div key={index} className="relative group">
                                            {artifactPreviews[index] ? (
                                                <img
                                                    src={artifactPreviews[index]}
                                                    alt={`Page ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg border border-[var(--border)]"
                                                />
                                            ) : (
                                                <div className="w-full h-32 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                                                    <div className="text-center">
                                                        <span className="text-2xl" aria-hidden="true">📄</span>
                                                        <p className="text-xs text-[var(--muted)] truncate px-2">{file.name}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeArtifactFile(index)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                aria-label={`Remove page ${index + 1}`}
                                            >
                                                ✕
                                            </button>
                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                                                {index + 1}/{artifactFiles.length}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add more button or initial button */}
                            {artifactFiles.length < MAX_ARTIFACT_FILES && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {artifactFiles.length === 0
                                        ? "📷 Choose Files or Take Photos"
                                        : `📷 Add More (${artifactFiles.length}/${MAX_ARTIFACT_FILES})`}
                                </Button>
                            )}

                            {artifactFiles.length >= MAX_ARTIFACT_FILES && (
                                <p className="text-xs text-[var(--muted)]">
                                    Maximum {MAX_ARTIFACT_FILES} {MAX_ARTIFACT_FILES === 1 ? 'photo' : 'photos'} uploaded. Remove a photo to add a different one.
                                </p>
                            )}
                        </>
                    )}

                    {inputMode === "digital" && (
                        <>
                            <p className="text-sm text-[var(--muted)]">
                                {isPulse ? "Type your answer below." : "Type your notes, key points, or summary in the box below."}
                            </p>
                            <Label htmlFor="digital-notes" className="sr-only">
                                Your digital notes
                            </Label>
                            <textarea
                                id="digital-notes"
                                placeholder="• Key point 1&#10;• Key point 2&#10;• Connection I noticed..."
                                value={digitalNotes}
                                onChange={(e) => setDigitalNotes(e.target.value)}
                                className="h-40 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                aria-describedby="digital-notes-hint"
                            />
                            <p id="digital-notes-hint" className="text-xs text-[var(--muted)]">
                                {isPulse ? "Be concise." : "Use bullet points or short sentences. Aim for 3–5 key ideas."}
                            </p>
                        </>
                    )}

                    {inputMode === "voice_memo" && (
                        <>
                            <p className="text-sm text-[var(--muted)]">
                                That&apos;s okay! Tell me in 30 seconds what you remember most from today&apos;s lesson.
                            </p>
                            {voiceMemoUrl ? (
                                <div className="space-y-3">
                                    <audio src={voiceMemoUrl} controls className="w-full" aria-label="Your voice memo" />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => resetRecording(true)}
                                        >
                                            Re-record memo
                                        </Button>
                                        <a
                                            href={voiceMemoUrl}
                                            download="voice-memo-debug.webm"
                                            className="text-xs text-blue-600 underline flex items-center"
                                        >
                                            Download for Debug
                                        </a>
                                    </div>
                                    <p className="text-xs text-green-600 font-medium">Recording details saved. Ready to submit!</p>
                                </div>
                            ) : activeRecordingType === 'voice_memo' ? (
                                <div className="space-y-3 text-center">
                                    <div
                                        className="h-16 flex items-end justify-center gap-1"
                                        aria-label={`Recording: ${formatTime(recordingTime)}`}
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2 bg-[var(--primary,#3b82f6)] rounded-full transition-all border border-blue-400/20"
                                                style={{
                                                    height: `${Math.max(8, audioLevel * 64 + Math.random() * 20)}px`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {!cameraAnxietyMode && (
                                        <div className="text-sm font-mono text-red-500 animate-pulse">
                                            🔴 {formatTime(recordingTime)}
                                        </div>
                                    )}
                                    <Button type="button" onClick={stopRecording}>
                                        ⏹ Stop Recording
                                    </Button>
                                </div>
                            ) : (
                                <Button type="button" variant="secondary" onClick={() => startRecording("voice_memo")}>
                                    🎤 Record Voice Memo (30s)
                                </Button>
                            )}
                        </>
                    )}

                    {inputMode === "skeleton" && (
                        <>
                            <p className="text-sm text-[var(--muted)]">
                                No worries! Here&apos;s a starter question to help you begin:
                            </p>
                            <div className="rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                                <p className="font-medium">Starter Prompt:</p>
                                <p className="mt-1 italic">&quot;{getSimplifiedPrompt()}&quot;</p>
                            </div>
                            <p className="text-xs text-[var(--muted)]">
                                Think about this question, then record your thoughts in Step 2.
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: Record Audio Explanation (Hidden for Voice Memo mode AND Pulse activities) */}
            {!isPulse && inputMode !== "voice_memo" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Record Your Explanation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-[var(--muted)]">
                            {hasIepAccommodations
                                ? "Speak for 30–60 seconds explaining your thinking."
                                : "Speak for 60–120 seconds explaining your thinking."}
                        </p>

                        {audioUrl ? (
                            <div className="space-y-3">
                                <audio src={audioUrl} controls className="w-full" aria-label="Your recorded explanation" />
                                <div className="flex gap-2 items-center">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => resetRecording()}>
                                        Re-record
                                    </Button>
                                    <a
                                        href={audioUrl}
                                        download="explanation-debug.webm"
                                        className="text-xs text-blue-600 underline"
                                    >
                                        Download for Debug
                                    </a>
                                </div>
                            </div>
                        ) : activeRecordingType === 'explanation' ? (
                            <div className="space-y-3 text-center">
                                <div
                                    className="h-16 flex items-end justify-center gap-1"
                                    aria-label={`Recording: ${formatTime(recordingTime)}`}
                                    role="status"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 bg-[var(--primary)] rounded-full transition-all"
                                            style={{
                                                height: `${Math.max(8, audioLevel * 64 + Math.random() * 20)}px`,
                                            }}
                                        />
                                    ))}
                                </div>
                                {!cameraAnxietyMode && (
                                    <div className="text-sm font-mono text-red-500 animate-pulse">
                                        🔴 {formatTime(recordingTime)}
                                    </div>
                                )}
                                <Button type="button" onClick={stopRecording}>
                                    ⏹ Stop Recording
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" variant="secondary" onClick={() => startRecording("explanation")}>
                                🎙 Start Recording
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || (inputMode !== "voice_memo" && !audioBlob) || (inputMode === "voice_memo" && !voiceMemoBlob)}
                    aria-describedby="submit-hint"
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>
            <p id="submit-hint" className="text-xs text-[var(--muted)] text-right">
                {inputMode === "voice_memo" ? "Ready to submit your voice memo." : "Make sure you've completed both steps before submitting."}
            </p>
        </div>
    );
}
