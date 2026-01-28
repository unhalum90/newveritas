"use client";

import { useEffect, useRef, useState } from "react";

type UseSessionTimerProps = {
    studentId: string;
    heartbeatIntervalMs?: number; // Default 30s
    breakIntervalMs?: number; // Default 15m
    dailyLimitMs?: number; // Default 60m
};

export function useSessionTimer({
    studentId,
    heartbeatIntervalMs = 30000,
    breakIntervalMs = 900000, // 15 minutes
    dailyLimitMs = 3600000, // 60 minutes
}: UseSessionTimerProps) {
    const [totalSecondsToday, setTotalSecondsToday] = useState<number | null>(null);
    const [sessionStartTime] = useState<number>(() => Date.now());
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [showBreakSuggestion, setShowBreakSuggestion] = useState(false);
    const lastHeartbeatTime = useRef<number | null>(null);
    const hasSuggestedBreak = useRef(false);

    // 1. Initial Fetch of today's time
    useEffect(() => {
        async function fetchDailyTime() {
            try {
                const res = await fetch(`/api/student/session/status?studentId=${studentId}`);
                const data = await res.json();
                if (data && typeof data.duration_seconds === 'number') {
                    setTotalSecondsToday(data.duration_seconds);
                    if (data.duration_seconds >= dailyLimitMs / 1000) {
                        setIsLimitReached(true);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch session status", e);
            }
        }
        fetchDailyTime();
    }, [studentId, dailyLimitMs]);

    // 2. Heartbeat & Break Logic
    useEffect(() => {
        if (isLimitReached) return;

        const interval = setInterval(async () => {
            const now = Date.now();
            if (lastHeartbeatTime.current === null) {
                lastHeartbeatTime.current = now;
            }
            const sessionElapsedMs = now - sessionStartTime;
            const heartbeatElapsedS = Math.floor((now - lastHeartbeatTime.current) / 1000);

            if (heartbeatElapsedS >= heartbeatIntervalMs / 1000) {
                // Send heartbeat
                try {
                    const res = await fetch("/api/student/session/track", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ studentId, seconds: heartbeatElapsedS }),
                    });
                    if (res.ok) {
                        lastHeartbeatTime.current = now;
                        setTotalSecondsToday(prev => {
                            if (prev === null) return heartbeatElapsedS;
                            const newTotal = prev + heartbeatElapsedS;
                            if (newTotal >= dailyLimitMs / 1000) {
                                setIsLimitReached(true);
                            }
                            return newTotal;
                        });
                    }
                } catch (e) {
                    console.error("Heartbeat failed", e);
                }
            }

            // Check for break suggestion
            if (!hasSuggestedBreak.current && sessionElapsedMs >= breakIntervalMs) {
                setShowBreakSuggestion(true);
                hasSuggestedBreak.current = true;
            }

        }, 5000); // Check every 5s

        return () => clearInterval(interval);
    }, [studentId, isLimitReached, sessionStartTime, heartbeatIntervalMs, breakIntervalMs, dailyLimitMs]);

    return {
        totalSecondsToday,
        isLimitReached,
        showBreakSuggestion,
        setShowBreakSuggestion,

    };
}
