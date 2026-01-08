import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const requestReviewSchema = z.object({
    student_note: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id: submissionId } = await ctx.params;
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
    if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const parsed = requestReviewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

    const admin = createSupabaseAdminClient();

    // Get student record
    const { data: student, error: studentError } = await admin
        .from("students")
        .select("id, class_id, auth_user_id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

    if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    // Get submission and verify ownership
    const { data: submission, error: subError } = await admin
        .from("submissions")
        .select("id, student_id, assessment_id, review_status")
        .eq("id", submissionId)
        .maybeSingle();

    if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
    if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    if (submission.student_id !== student.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only request review if feedback has been published
    if (submission.review_status !== "published") {
        return NextResponse.json({ error: "Feedback must be published before requesting review." }, { status: 409 });
    }

    // Check if review request already exists
    const { data: existingRequest } = await admin
        .from("student_review_requests")
        .select("id, status")
        .eq("submission_id", submissionId)
        .maybeSingle();

    if (existingRequest) {
        return NextResponse.json({
            error: `Review already requested. Status: ${existingRequest.status}`,
            existing: true
        }, { status: 409 });
    }

    // Create review request
    const { data: reviewRequest, error: insertError } = await admin
        .from("student_review_requests")
        .insert({
            submission_id: submissionId,
            student_id: student.id,
            student_note: parsed.data.student_note?.trim() || null,
            status: "pending",
        })
        .select("id, status, created_at")
        .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // Log to audit trail
    try {
        await admin.rpc("log_assessment_event", {
            p_submission_id: submissionId,
            p_assessment_id: submission.assessment_id,
            p_student_id: student.id,
            p_event_type: "review_requested",
            p_actor_id: student.id,
            p_actor_role: "student",
            p_previous_value: null,
            p_new_value: { request_id: reviewRequest.id },
            p_reason: parsed.data.student_note?.trim() || null,
        });
    } catch (auditError) {
        console.error("Audit log failed:", auditError);
    }

    const res = NextResponse.json({ ok: true, request: reviewRequest });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id: submissionId } = await ctx.params;
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient();

    // Get review request status
    const { data: reviewRequest, error: requestError } = await admin
        .from("student_review_requests")
        .select("id, status, student_note, teacher_response, resolved_at, created_at")
        .eq("submission_id", submissionId)
        .maybeSingle();

    if (requestError) return NextResponse.json({ error: requestError.message }, { status: 500 });

    const res = NextResponse.json({ ok: true, request: reviewRequest });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
}
