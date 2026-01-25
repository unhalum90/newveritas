"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentSession {
    student_id: string;
    student_name: string;
    duration_seconds: number;
    last_activity_at: string;
}

interface Props {
    sessions: StudentSession[];
}

export function SessionMonitoring({ sessions }: Props) {
    const formatSeconds = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}m ${secs}s`;
    };

    const getStatusColor = (s: number) => {
        if (s >= 3600) return "text-red-600 bg-red-50 border-red-200"; // Over 60m
        if (s >= 900) return "text-amber-600 bg-amber-50 border-amber-200"; // Over 15m (Fatigue risk)
        return "text-green-600 bg-green-50 border-green-200";
    };

    const getStatusLabel = (s: number) => {
        if (s >= 3600) return "Limit Reached";
        if (s >= 900) return "Fatigue Risk";
        return "Active";
    };

    return (
        <Card className="border-0 bg-[var(--surface)]/50 shadow-sm backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <span>⏲️</span> Student Practice Time
                </CardTitle>
                <CardDescription>Daily practice monitoring (60m daily limit)</CardDescription>
            </CardHeader>
            <CardContent>
                {!sessions.length ? (
                    <div className="text-center py-6 text-sm text-[var(--muted)]">
                        No practice sessions recorded today.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.student_id}
                                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold">
                                        {session.student_name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{session.student_name}</div>
                                        <div className="text-[10px] text-[var(--muted)]">
                                            Last active: {new Date(session.last_activity_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{formatSeconds(session.duration_seconds)}</div>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(session.duration_seconds)}`}>
                                        {getStatusLabel(session.duration_seconds)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
