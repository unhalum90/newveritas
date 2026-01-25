"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PrivacyNoticeModalProps = {
    userId: string;
    userType: "teacher" | "student";
    lastShown: string | null; // ISO timestamp or null
};

const PRIVACY_VERSION = "v1";
const DAYS_BETWEEN_NOTICES = 30;

function shouldShowNotice(lastShown: string | null): boolean {
    if (!lastShown) return true;
    const last = new Date(lastShown);
    const now = new Date();
    const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= DAYS_BETWEEN_NOTICES;
}

export function PrivacyNoticeModal({ userId, userType, lastShown }: PrivacyNoticeModalProps) {
    const [open, setOpen] = useState(false);
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (shouldShowNotice(lastShown)) {
            setOpen(true);
        }
    }, [lastShown]);

    async function handleAcknowledge() {
        if (!checked || loading) return;
        setLoading(true);
        try {
            await fetch("/api/privacy-notice/acknowledge", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ userId, userType, version: PRIVACY_VERSION }),
            });
            setOpen(false);
        } catch (e) {
            console.error("Failed to acknowledge privacy notice", e);
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-notice-title"
        >
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle id="privacy-notice-title">Privacy Notice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-[var(--muted)]">
                        SayVeritas collects and processes data to provide voice-based learning assessments.
                    </p>

                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-dim)] p-4 text-sm">
                        <h4 className="font-semibold mb-2">Data We Collect:</h4>
                        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
                            <li>Audio recordings of student responses</li>
                            <li>Transcripts generated from audio</li>
                            <li>Assessment scores and feedback</li>
                            <li>Usage metadata (login times, session duration)</li>
                        </ul>
                    </div>

                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-dim)] p-4 text-sm">
                        <h4 className="font-semibold mb-2">Your Rights:</h4>
                        <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
                            <li>Request access to your data</li>
                            <li>Request deletion of your data</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                    </div>

                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-dim)] p-4 text-sm">
                        <h4 className="font-semibold mb-2">Retention Period:</h4>
                        <p className="text-[var(--muted)]">
                            Audio recordings are deleted after 30 days. Transcripts and scores may be retained for up to 90 days for educational purposes.
                        </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="rounded border-[var(--border)]"
                        />
                        <span>I understand and acknowledge this privacy notice</span>
                    </label>

                    <div className="flex justify-end">
                        <Button onClick={handleAcknowledge} disabled={!checked || loading}>
                            {loading ? "Saving..." : "I Understand"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
