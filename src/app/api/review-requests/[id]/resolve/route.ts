import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const resolveSchema = z.object({
    status: z.enum(["reviewed", "updated", "no_change"]),
    teacher_response: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id: requestId } = await ctx.params;
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
    if (role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

    const admin = createSupabaseAdminClient();

    // Get teacher record
    const { data: teacher, error: tError } = await admin
        .from("teachers")
        .select("id, workspace_id, user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (tError) return NextResponse.json({ error: tError.message }, { status: 500 });
    if (!teacher?.workspace_id) return NextResponse.json({ error: "Teacher workspace not found." }, { status: 404 });

    // Get review request with submission details
    const { data: reviewRequest, error: reqError } = await admin
        .from("student_review_requests")
        .select(`
      id, 
      submission_id, 
      student_id, 
      status,
      submissions!inner (
        id,
        assessment_id,
        assessments!inner (
          id,
          class_id,
          classes!inner (
            workspace_id
          )
        )
      )
    `)
        .eq("id", requestId)
        .maybeSingle();

    if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 });
    if (!reviewRequest) return NextResponse.json({ error: "Review request not found." }, { status: 404 });

    // Verify teacher has access to this assessment's class
    // @ts-expect-error - Supabase nested join types are complex
    const submissions = reviewRequest.submissions as {
        id: string;
        assessment_id: string;
        assessments: {
            id: string;
            class_id: string;
            classes: { workspace_id: string };
        };
    };

    if (!submissions || submissions.assessments?.classes?.workspace_id !== teacher.workspace_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (reviewRequest.status !== "pending") {
        return NextResponse.json({ error: "Review request already resolved." }, { status: 409 });
    }

    const now = new Date().toISOString();

    // Update review request
    const { data: updated, error: updateError } = await admin
        .from("student_review_requests")
        .update({
            status: parsed.data.status,
            teacher_response: parsed.data.teacher_response?.trim() || null,
            teacher_id: teacher.id,
            resolved_at: now,
        })
        .eq("id", requestId)
        .select("id, status, teacher_response, resolved_at")
        .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Log to audit trail
    try {
        await admin.rpc("log_assessment_event", {
            p_submission_id: reviewRequest.submission_id,
            p_assessment_id: submissions.assessment_id,
            p_student_id: reviewRequest.student_id,
            p_event_type: "review_resolved",
            p_actor_id: teacher.id,
            p_actor_role: "teacher",
            p_previous_value: { status: "pending" },
            p_new_value: { status: parsed.data.status },
            p_reason: parsed.data.teacher_response?.trim() || null,
        });
    } catch (auditError) {
        console.error("Audit log failed:", auditError);
    }

    const res = NextResponse.json({ ok: true, request: updated });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
}
