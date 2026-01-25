import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { trackEngagementEvent, EngagementEventType } from "@/lib/tracking/engagement";

export async function POST(request: NextRequest) {
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId, submissionId, eventType } = body as {
        assessmentId: string;
        submissionId?: string;
        eventType: EngagementEventType;
    };

    if (!assessmentId || !eventType) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find student ID
    const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

    if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const result = await trackEngagementEvent({
        studentId: student.id,
        assessmentId,
        submissionId,
        eventType,
    });

    const response = NextResponse.json(result);
    pendingCookies.apply(response);
    return response;
}
