import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDailySessionTime } from "@/lib/tracking/session";

/**
 * GET /api/student/session/status?studentId=...
 * Returns today's practice duration for a student.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
        }

        const duration_seconds = await getDailySessionTime(studentId);

        return NextResponse.json({ duration_seconds });
    } catch (e) {
        console.error("Session status endpoint error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
