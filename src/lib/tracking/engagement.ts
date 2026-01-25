import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type EngagementEventType = "started" | "paused" | "resumed" | "submitted";

export async function trackEngagementEvent(input: {
    studentId: string;
    assessmentId: string;
    submissionId?: string;
    eventType: EngagementEventType;
}) {
    const admin = createSupabaseAdminClient();

    const { error } = await admin.from("engagement_events").insert({
        student_id: input.studentId,
        assessment_id: input.assessmentId,
        submission_id: input.submissionId,
        event_type: input.eventType,
    });

    if (error) {
        console.error("Failed to track engagement event:", error);
        return { success: false, error };
    }

    return { success: true };
}

export async function getEngagementMetrics(submissionId: string) {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
        .from("engagement_events")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: true });

    if (error || !data) {
        return { error: "Failed to fetch engagement events" };
    }

    // Calculate total active time
    let totalActiveMs = 0;
    let lastResumeTime: number | null = null;
    let reEngagementCount = 0;

    data.forEach((event) => {
        const timestamp = new Date(event.created_at).getTime();

        if (event.event_type === "started" || event.event_type === "resumed") {
            lastResumeTime = timestamp;
            if (event.event_type === "resumed") reEngagementCount++;
        } else if ((event.event_type === "paused" || event.event_type === "submitted") && lastResumeTime) {
            totalActiveMs += timestamp - lastResumeTime;
            lastResumeTime = null;
        }
    });

    return {
        totalTimeSpentMinutes: Math.round(totalActiveMs / 60000),
        reEngagementCount,
        events: data,
    };
}
