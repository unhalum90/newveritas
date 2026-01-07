"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function RetryGradingButton({ submissionId }: { submissionId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRetry = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/studylab/submission/${submissionId}/regrade`, { method: "POST" });
            if (!res.ok) {
                alert("Failed to regrade.");
                return;
            }
            router.refresh();
        } catch (e) {
            alert("Error retrying grading.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleRetry} disabled={loading} variant="secondary">
            {loading ? "Grading..." : "Retry AI Grading"}
        </Button>
    );
}
