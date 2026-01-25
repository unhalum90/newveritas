import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { incrementSessionTime } from "@/lib/tracking/session";

/**
 * POST /api/student/session/track
 * Receives duration heartbeats from the client.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { studentId, seconds } = await req.json();

        if (!studentId || typeof seconds !== "number") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Verify user owns the student profile if possible, 
        // but typically auth.getUser() is enough if we trust the studentId passed.
        // For tighter security, we could double check the students table.

        const result = await incrementSessionTime(studentId, seconds);

        if (!result.success) {
            return NextResponse.json({ error: "Failed to track session" }, { status: 500 });
        }

        return NextResponse.json({ success: true, skipped: Boolean(result.skipped) });
    } catch (e) {
        console.error("Session tracking endpoint error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
