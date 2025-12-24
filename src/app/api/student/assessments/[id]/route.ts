import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, class_id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

  const { data: assessment, error: aError } = await admin
    .from("assessments")
    .select("id, class_id, title, instructions, status, published_at, selected_asset_id, assessment_integrity(*)")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.class_id !== student.class_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (assessment.status !== "live") return NextResponse.json({ error: "Not available." }, { status: 409 });

  const { data: asset, error: assetError } = await admin
    .from("assessment_assets")
    .select("asset_url, generation_prompt, created_at")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });

  const { data: questionIds, error: qIdError } = await admin
    .from("assessment_questions")
    .select("id, order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  if (qIdError) return NextResponse.json({ error: qIdError.message }, { status: 500 });
  const totalCount = (questionIds ?? []).length;

  const { data: latestSubmission, error: subError } = await admin
    .from("submissions")
    .select("id, status, started_at, submitted_at")
    .eq("assessment_id", assessmentId)
    .eq("student_id", student.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  // Only return the current question (not the full question bank) to reduce pre-viewing answers.
  let answeredCount = 0;
  let currentQuestion:
    | { id: string; order_index: number; question_text: string; question_type: string | null; evidence_upload: string | null }
    | null = null;

  if (latestSubmission?.status === "started" && totalCount > 0) {
    const { data: answered, error: answeredError } = await admin
      .from("submission_responses")
      .select("question_id")
      .eq("submission_id", latestSubmission.id);

    if (answeredError) return NextResponse.json({ error: answeredError.message }, { status: 500 });
    const answeredSet = new Set((answered ?? []).map((r) => r.question_id));
    answeredCount = answeredSet.size;

    const next = (questionIds ?? []).find((q) => !answeredSet.has(q.id)) ?? null;
    if (next) {
      const { data: qRow, error: qError } = await admin
        .from("assessment_questions")
        .select("id, question_text, question_type, order_index, evidence_upload")
        .eq("id", next.id)
        .maybeSingle();
      if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
      if (qRow) currentQuestion = qRow;
    }
  }

  const res = NextResponse.json({
    assessment: {
      id: assessment.id,
      title: assessment.title,
      instructions: assessment.instructions,
      published_at: assessment.published_at,
      integrity: assessment.assessment_integrity,
      asset_url: asset?.asset_url ?? null,
      question_count: totalCount,
      current_question: currentQuestion,
    },
    progress: { answered_count: answeredCount, total_count: totalCount },
    latest_submission: latestSubmission ?? null,
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
