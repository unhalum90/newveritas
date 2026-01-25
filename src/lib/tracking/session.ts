import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupabaseTableError = { code?: string; message?: string };

let hasWarnedMissingSessionTable = false;

function isMissingSessionTrackingTable(error: SupabaseTableError | null | undefined) {
    if (!error) return false;
    if (error.code === "PGRST205") return true;
    if (!error.message) return false;
    return (
        error.message.includes("session_tracking") &&
        error.message.includes("schema cache")
    );
}

function warnMissingSessionTrackingTable(error: SupabaseTableError) {
    if (hasWarnedMissingSessionTable) return;
    hasWarnedMissingSessionTable = true;
    console.warn(
        "Session tracking table missing; skipping heartbeat writes. Apply migration 010_add_session_tracking.sql.",
        error,
    );
}

/**
 * Increments the student's practice duration for today.
 * Handles upserting into the session_tracking table.
 */
export async function incrementSessionTime(studentId: string, seconds: number) {
    const admin = createSupabaseAdminClient();
    const today = new Date().toISOString().split("T")[0];

    try {
        // We use a raw SQL approach or Supabase upsert with increment if possible.
        // Since Supabase doesn't natively support "increment on conflict" via JS client easily without RPC,
        // we'll fetch then update, or use a RPC if many concurrent heartbeats are expected.
        // For now, a fetch-then-upsert is fine given the low frequency (every 30-60s).

        const { data: existing, error: fetchError } = await admin
            .from("session_tracking")
            .select("id, duration_seconds")
            .eq("student_id", studentId)
            .eq("date", today)
            .maybeSingle();

        if (fetchError) {
            if (isMissingSessionTrackingTable(fetchError)) {
                warnMissingSessionTrackingTable(fetchError);
                return { success: true, skipped: true };
            }
            throw fetchError;
        }

        if (existing) {
            const { error: updateError } = await admin
                .from("session_tracking")
                .update({
                    duration_seconds: existing.duration_seconds + seconds,
                    last_activity_at: new Date().toISOString(),
                } as any)
                .eq("id", existing.id);
            if (updateError) {
                if (isMissingSessionTrackingTable(updateError)) {
                    warnMissingSessionTrackingTable(updateError);
                    return { success: true, skipped: true };
                }
                throw updateError;
            }
        } else {
            const { error: insertError } = await admin.from("session_tracking").insert({
                student_id: studentId,
                date: today,
                duration_seconds: seconds,
                sessions_count: 1,
                last_activity_at: new Date().toISOString(),
            });
            if (insertError) {
                if (isMissingSessionTrackingTable(insertError)) {
                    warnMissingSessionTrackingTable(insertError);
                    return { success: true, skipped: true };
                }
                throw insertError;
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to increment session time:", error);
        return { success: false, error };
    }
}

/**
 * Gets the total practice time for a student today.
 */
export async function getDailySessionTime(studentId: string) {
    const admin = createSupabaseAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await admin
        .from("session_tracking")
        .select("duration_seconds")
        .eq("student_id", studentId)
        .eq("date", today)
        .maybeSingle();

    if (error) {
        if (isMissingSessionTrackingTable(error)) {
            warnMissingSessionTrackingTable(error);
            return 0;
        }
        console.error("Failed to get daily session time:", error);
        return 0;
    }

    return data?.duration_seconds ?? 0;
}
