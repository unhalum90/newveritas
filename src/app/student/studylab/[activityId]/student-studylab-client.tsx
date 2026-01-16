"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface Activity {
    id: string;
    title: string;
    prompt_template?: string;
    max_turns?: number;
    // Feedback visibility settings (default to true for backwards compatibility)
    show_score_to_student?: boolean;
    show_summary_to_student?: boolean;
    show_strengths_to_student?: boolean;
    show_weaknesses_to_student?: boolean;
}

interface Student {
    id: string;
}

interface SubmissionData {
    history?: { role: string; content: string }[];
    grading?: {
        score?: number;
        summary?: string;
        feedback?: {
            strengths?: string[];
            improvements?: string[];
        };
    };
}

interface Submission {
    status: string;
    submission_data?: SubmissionData;
}

interface Props {
    activity: Activity;
    student: Student;
    initialSubmission: Submission | null;
}
export function StudentStudylabClient({ activity, student, initialSubmission }: Props) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_FILES = 3;
    const [imagePaths, setImagePaths] = useState<string[]>([]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        const remainingSlots = MAX_FILES - selectedFiles.length;
        const filesToAdd = Math.min(files.length, remainingSlots);

        for (let i = 0; i < filesToAdd; i++) {
            const file = files[i];
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        setSelectedFiles(prev => [...prev, ...newFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);

        // Reset input
        e.target.value = "";
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const [isStarting, setIsStarting] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Chat State
    type Message = { role: "ai" | "user"; content: string };
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // TTS State
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Load mute preference
    useEffect(() => {
        const saved = localStorage.getItem("studylab_muted");
        if (saved === "true") setIsMuted(true);
    }, []);

    // Save mute preference
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem("studylab_muted", String(newMuted));
        if (newMuted) stopSpeaking();
    };

    // Initialize Audio on mount
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => setIsPlaying(false);
    }, []);

    const unlockAudio = () => {
        // Mobile Autoplay Unlock: Play silence
        if (audioRef.current) {
            // Short silent MP3
            audioRef.current.src = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFQAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhUAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhUAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//8AAAAA//8AAAAA//8AAAAA//8AAAAA";
            audioRef.current.load();
            audioRef.current.play().catch(() => { });
        }
    }

    const speakText = async (text: string) => {
        if (!audioRef.current || isMuted) return;

        try {
            stopSpeaking();
            setIsPlaying(true);

            // Stream from Backend
            const res = await fetch("/api/studylab/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice: "alloy" })
            });

            if (!res.ok) throw new Error("TTS Failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            audioRef.current.src = url;
            audioRef.current.load(); // refresh for iOS
            await audioRef.current.play();

        } catch (error) {
            console.error("TTS Error:", error);
            setIsPlaying(false);
            // Fallback
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };

    // Auto-speak new AI messages
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'ai') {
            speakText(lastMsg.content);
        }
    }, [messages]);

    // Self Rating State
    const [selfRating, setSelfRating] = useState<number | null>(null);

    const handleSubmitSession = async () => {
        if (selfRating === null) {
            alert("Please rate your confidence before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/studylab/session/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    activityId: activity.id,
                    studentId: student.id,
                    history: messages,
                    selfRating, // Send rating
                    imagePath: imagePaths.join(",") // Send artifact paths for teacher review
                })
            });

            if (!res.ok) throw new Error("Failed to submit");

            // Redirect to dashboard
            window.location.href = "/student";
        } catch (e) {
            console.error("Submit error", e);
            alert("Failed to submit session. Please try again.");
            setIsSubmitting(false);
        }
    };

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isProcessing, isComplete]);

    const handleStartSession = async () => {
        if (selectedFiles.length === 0) return;

        // Unlock mobile audio context
        unlockAudio();

        setIsStarting(true);

        try {
            const formData = new FormData();
            selectedFiles.forEach((file, i) => {
                formData.append(`file_${i}`, file);
            });
            formData.append("fileCount", String(selectedFiles.length));
            formData.append("activityId", activity.id);

            const res = await fetch("/api/studylab/session/start", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to start session");

            const data = await res.json();
            if (data.message) {
                setMessages([{ role: "ai", content: data.message }]);
                setIsSessionActive(true);
                setImagePaths(data.imagePaths || []);
            }
        } catch (error) {
            console.error("Start Session Error:", error);
            alert("Failed to start session. Please try again.");
        } finally {
            setIsStarting(false);
        }
    };

    const handleToggleRecording = async () => {
        if (isComplete) return;

        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            setIsProcessing(true);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Detect supported mimeType
                let mimeType = "audio/webm";
                if (MediaRecorder.isTypeSupported("audio/webm")) {
                    mimeType = "audio/webm";
                } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                    mimeType = "audio/mp4";
                } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
                    mimeType = "audio/ogg";
                }

                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunksRef.current, { type: mimeType });

                    // Stop tracks
                    stream.getTracks().forEach(track => track.stop());

                    try {
                        const formData = new FormData();
                        formData.append("file", blob);
                        formData.append("activityId", activity.id);
                        formData.append("history", JSON.stringify(messages)); // Send context

                        const res = await fetch("/api/studylab/session/chat", {
                            method: "POST",
                            body: formData,
                        });

                        if (!res.ok) throw new Error("Failed to process audio");

                        const data = await res.json();

                        // Update Chat
                        setMessages(prev => [
                            ...prev,
                            { role: "user", content: data.transcript, audioPath: data.audioPath },
                            { role: "ai", content: data.message }
                        ]);

                        if (data.isComplete) {
                            setIsComplete(true);
                        }

                    } catch (error) {
                        console.error("Chat Error:", error);
                        alert("Thinking failed. Please try again.");
                    } finally {
                        setIsProcessing(false);
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Microphone Error:", err);
                alert("Could not access microphone.");
            }
        }
    };

    const [showNotes, setShowNotes] = useState(false);
    const maxTurns = activity.max_turns || 6;
    const currentTurn = Math.ceil(messages.length / 2);

    // Render Results View if submitted
    if (initialSubmission && initialSubmission.status !== 'assigned') {
        const data = initialSubmission.submission_data || {};
        const history = data.history || [];
        const grading = data.grading || null;

        return (
            <div className="min-h-screen bg-zinc-50 p-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <Link href="/student" className="flex items-center text-sm text-zinc-500 hover:text-zinc-900">
                        <span className="mr-2">←</span>
                        Back to Dashboard
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">{activity.title}</h1>
                        <p className="mt-1 text-zinc-600">Session Results</p>
                    </div>

                    {grading && (
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <span>🤖</span> AI Assessment
                                </CardTitle>
                                {/* Show score only if enabled (default true for backwards compat) */}
                                {(activity.show_score_to_student !== false) && grading.score && (
                                    <div className={`px-4 py-1 rounded-full text-sm font-bold bg-white shadow-sm
                                        ${grading.score >= 3 ? 'text-green-700' :
                                            grading.score === 2 ? 'text-yellow-700' : 'text-red-700'}`}>
                                        Score: {grading.score} / 4
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Show summary only if enabled */}
                                {(activity.show_summary_to_student !== false) && grading.summary && (
                                    <p className="text-zinc-800 leading-relaxed">{grading.summary}</p>
                                )}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Show strengths only if enabled */}
                                    {(activity.show_strengths_to_student !== false) && grading.feedback?.strengths && grading.feedback.strengths.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                                            <ul className="list-disc list-inside text-sm text-zinc-700 space-y-1">
                                                {grading.feedback.strengths.map((s: string, i: number) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Show focus areas only if enabled */}
                                    {(activity.show_weaknesses_to_student !== false) && grading.feedback?.improvements && grading.feedback.improvements.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-amber-700 mb-2">Focus Areas</h4>
                                            <ul className="list-disc list-inside text-sm text-zinc-700 space-y-1">
                                                {grading.feedback.improvements.map((s: string, i: number) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {/* If no feedback sections are visible, show a minimal message */}
                                {(activity.show_score_to_student === false) &&
                                    (activity.show_summary_to_student === false) &&
                                    (activity.show_strengths_to_student === false) &&
                                    (activity.show_weaknesses_to_student === false) && (
                                        <p className="text-zinc-500 italic text-center">Session completed. Your teacher will provide feedback.</p>
                                    )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Chat Transcript</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                            {history.length > 0 ? history.map((msg: { role: string; content: string }, i: number) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-800'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-zinc-500 italic">No transcript available.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isSessionActive) {
        return (
            <div className="min-h-screen bg-zinc-50 p-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="flex items-center justify-between">
                        <Link href="/student" className="flex items-center text-sm text-zinc-500 hover:text-zinc-900">
                            <span className="mr-2">←</span>
                            Back to Dashboard
                        </Link>
                        {/* Progress */}
                        <div className="text-sm font-medium text-zinc-500">
                            Turn {currentTurn} of {maxTurns}
                        </div>
                    </div>

                    <Card className="h-[600px] flex flex-col bg-slate-50 relative overflow-hidden">
                        {/* Notes Overlay */}
                        {showNotes && previews.length > 0 && (
                            <div className="absolute inset-0 z-50 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
                                <img src={previews[0]} alt="Notes" className="max-h-[85%] object-contain rounded bg-white" />
                                <Button
                                    variant="secondary"
                                    className="mt-4"
                                    onClick={() => setShowNotes(false)}
                                >
                                    Close Notes
                                </Button>
                            </div>
                        )}

                        <CardHeader className="border-b bg-white py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <span className="text-xl">🎓</span>
                                        Study Partner
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {activity.title}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={toggleMute}
                                        className="text-xs"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? "🔇" : "🔊"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowNotes(!showNotes)}
                                        className="text-xs"
                                    >
                                        {showNotes ? "Hide Notes" : "View Notes 📝"}
                                    </Button>
                                    {/* End Session moved to header for better mobile UX */}
                                    {!isComplete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to end this session early? Your progress will be saved.")) {
                                                    setIsComplete(true);
                                                }
                                            }}
                                        >
                                            End Early
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-zinc-100 h-1 mt-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-500"
                                    style={{ width: `${Math.min((currentTurn / maxTurns) * 100, 100)}%` }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        p-4 max-w-[85%] text-base leading-relaxed shadow-sm
                                        ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                                            : 'bg-white border border-zinc-200 text-zinc-800 rounded-2xl rounded-tl-none relative group'}
                                    `}>
                                        <p>{msg.content}</p>
                                        {msg.role === 'ai' && (
                                            <button
                                                onClick={() => speakText(msg.content)}
                                                className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-zinc-600"
                                                title="Replay Audio"
                                            >
                                                🔊
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isProcessing && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="bg-zinc-100 p-4 rounded-2xl rounded-tl-none text-zinc-400 text-sm">
                                        Thinking...
                                    </div>
                                </div>
                            )}

                            {isComplete && (
                                <div className="flex justify-center my-4">
                                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
                                        Session Complete! Great work.
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </CardContent>

                        {/* Audio Interface */}
                        <div className="p-6 border-t bg-white flex flex-col items-center justify-center gap-4">
                            {!isComplete ? (
                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="relative group cursor-pointer" onClick={handleToggleRecording}>
                                        {isRecording && (
                                            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                                        )}
                                        <Button
                                            size="lg"
                                            disabled={isProcessing}
                                            className={`relative h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${isProcessing ? "bg-zinc-300" :
                                                isRecording ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                                                }`}
                                        >
                                            <span className="text-2xl">
                                                {isProcessing ? "⏳" : isRecording ? "⏹️" : "🎙️"}
                                            </span>
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-8 w-full justify-center">
                                        <p className="text-sm text-zinc-500 font-medium text-center">
                                            {isProcessing ? "Processing..." : isRecording ? "Tap to Stop" : "Tap to Speak"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    {/* Self Reflection Rating */}
                                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                                        <label className="block text-sm font-medium text-blue-900 mb-2 text-center">
                                            How confident do you feel about this topic now?
                                        </label>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => setSelfRating(rating)}
                                                    className={`
                                                        w-10 h-10 rounded-full text-sm font-semibold transition-all
                                                        ${selfRating === rating
                                                            ? "bg-blue-600 text-white scale-110 shadow-md ring-2 ring-blue-200"
                                                            : "bg-white text-zinc-600 border border-zinc-200 hover:border-blue-300 hover:bg-blue-50"}
                                                    `}
                                                    title={rating === 1 ? "Very Weak" : rating === 5 ? "Very Strong" : ""}
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-xs text-blue-800/60 px-4 mt-1">
                                            <span>Very Weak</span>
                                            <span>Very Strong</span>
                                        </div>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full min-w-[200px]"
                                        onClick={handleSubmitSession}
                                        disabled={isSubmitting || selfRating === null}
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit & Return to Dashboard"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-3xl space-y-6">
                <Link href="/student" className="flex items-center text-sm text-zinc-500 hover:text-zinc-900">
                    <span className="mr-2">←</span>
                    Back to Dashboard
                </Link>

                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">{activity.title}</h1>
                    <p className="mt-1 text-zinc-600">StudyLab Session</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                        <CardDescription>
                            {activity.prompt_template || "Upload an image of your notes to begin the session."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Card className="border-blue-500/20 bg-black/40 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-blue-400">
                                    <span>Ready to study?</span>
                                    <span className="text-xs font-normal text-blue-500/60">Upload photos of your notes (up to 3)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center gap-6">
                                    {previews.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                                            {previews.map((src, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={src}
                                                        alt={`Preview ${idx + 1}`}
                                                        className="w-full h-48 object-cover rounded-xl border border-blue-500/30 shadow-lg shadow-blue-500/10"
                                                    />
                                                    <button
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-black/80 text-red-500 rounded-full border border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-md text-[10px] text-blue-300 backdrop-blur-sm border border-blue-500/20">
                                                        Page {idx + 1}
                                                    </div>
                                                </div>
                                            ))}
                                            {previews.length < MAX_FILES && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full h-48 border-2 border-dashed border-blue-500/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <span className="text-blue-400">＋</span>
                                                    </div>
                                                    <span className="text-xs text-blue-500/60 font-medium">Add another page</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="cursor-pointer group flex flex-col items-center justify-center p-12 border-2 border-dashed border-blue-500/20 rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all w-full md:w-3/4"
                                        >
                                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <span className="text-3xl">📷</span>
                                            </div>
                                            <p className="text-blue-400 font-medium text-lg">Snap or Upload Notes</p>
                                            <p className="text-blue-500/60 text-sm mt-1">Diagrams, handwriting, or text are all welcome</p>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    <Button
                                        size="lg"
                                        className="w-full md:w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-500/20 border-t border-white/20 transition-all active:scale-95 disabled:opacity-50"
                                        onClick={handleStartSession}
                                        disabled={selectedFiles.length === 0 || isStarting}
                                    >
                                        {isStarting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Analyzing notes...
                                            </span>
                                        ) : (
                                            "✨ Analyze & Connect"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
