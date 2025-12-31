import { NextResponse, type NextRequest } from "next/server";

import { getUserRole } from "@/lib/auth/roles";
import { isAudioFollowup } from "@/lib/assessments/question-types";
import { DEFAULT_PLEDGE_TEXT } from "@/lib/integrity/pledge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(data.user);
  const preview = request.nextUrl.searchParams.get("preview") === "1";

  const admin = createSupabaseAdminClient();

  if (preview && role === "teacher") {
    const { data: teacher, error: teacherError } = await admin
      .from("teachers")
      .select("id, workspace_id, disabled")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (teacherError) return NextResponse.json({ error: teacherError.message }, { status: 500 });
    if (!teacher || teacher.disabled) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: assessment, error: aError } = await admin
      .from("assessments")
      .select("id, class_id, title, instructions, status, published_at, selected_asset_id, is_practice_mode, assessment_integrity(*)")
      .eq("id", assessmentId)
      .maybeSingle();

    if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
    if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const { data: klass, error: classError } = await admin
      .from("classes")
      .select("id, workspace_id")
      .eq("id", assessment.class_id)
      .maybeSingle();
    if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
    if (!klass || klass.workspace_id !== teacher.workspace_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

    const res = NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        instructions: assessment.instructions,
        published_at: assessment.published_at,
        is_practice_mode: Boolean(assessment.is_practice_mode),
        grace_restart_used: false,
        integrity: assessment.assessment_integrity,
        asset_url: asset?.asset_url ?? null,
        question_count: totalCount,
        current_question: null,
        pledge: { enabled: false },
      },
      progress: { answered_count: 0, total_count: totalCount },
      latest_submission: null,
      student: {
        consent_audio: true,
        consent_audio_at: null,
        consent_revoked_at: null,
        disabled: false,
      },
    });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, class_id, consent_audio, consent_audio_at, consent_revoked_at, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) {
    if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });

  const { data: assessment, error: aError } = await admin
    .from("assessments")
      .select("id, class_id, title, instructions, status, published_at, selected_asset_id, is_practice_mode, assessment_integrity(*)")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.class_id !== student.class_id) {
    return NextResponse.json({ error: "Assessment not assigned to this student." }, { status: 403 });
  }
  if (assessment.status !== "live") return NextResponse.json({ error: "Not available." }, { status: 409 });

  const { data: restartEvent, error: restartError } = await admin
    .from("assessment_restart_events")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("student_id", student.id)
    .maybeSingle();
  if (restartError) return NextResponse.json({ error: restartError.message }, { status: 500 });

  const { data: asset, error: assetError } = await admin
    .from("assessment_assets")
    .select("asset_url, generation_prompt, created_at")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });

  const { data: questionRows, error: qIdError } = await admin
    .from("assessment_questions")
    .select("id, order_index, question_type")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  if (qIdError) return NextResponse.json({ error: qIdError.message }, { status: 500 });
  const totalCount = (questionRows ?? []).length;

  const { data: latestSubmission, error: subError } = await admin
    .from("submissions")
    .select(
      "id, status, started_at, submitted_at, review_status, published_at, teacher_comment, final_score_override, integrity_pledge_accepted_at, integrity_pledge_version",
    )
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

  const pledgeEnabled = Boolean((assessment.assessment_integrity as { pledge_enabled?: boolean } | null)?.pledge_enabled);
  const pledgeAccepted = Boolean(latestSubmission?.integrity_pledge_accepted_at);

  if (latestSubmission?.status === "started" && totalCount > 0 && (!pledgeEnabled || pledgeAccepted)) {
    const { data: answered, error: answeredError } = await admin
      .from("submission_responses")
      .select("question_id, response_stage")
      .eq("submission_id", latestSubmission.id);

    if (answeredError) return NextResponse.json({ error: answeredError.message }, { status: 500 });
    const stagesByQuestion = new Map<string, Set<string>>();
    for (const row of answered ?? []) {
      if (!row.question_id) continue;
      const stage = typeof row.response_stage === "string" && row.response_stage ? row.response_stage : "primary";
      const existing = stagesByQuestion.get(row.question_id) ?? new Set<string>();
      existing.add(stage);
      stagesByQuestion.set(row.question_id, existing);
    }

    const answeredSet = new Set<string>();
    for (const row of questionRows ?? []) {
      const stages = stagesByQuestion.get(row.id) ?? new Set<string>();
      if (isAudioFollowup(row.question_type)) {
        if (stages.has("followup")) answeredSet.add(row.id);
      } else if (stages.size > 0) {
        answeredSet.add(row.id);
      }
    }
    answeredCount = answeredSet.size;

    const next = (questionRows ?? []).find((q) => !answeredSet.has(q.id)) ?? null;
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
      is_practice_mode: Boolean(assessment.is_practice_mode),
      grace_restart_used: Boolean(restartEvent),
      integrity: assessment.assessment_integrity,
      asset_url: asset?.asset_url ?? null,
      question_count: totalCount,
      current_question: currentQuestion,
      pledge: pledgeEnabled
        ? {
            enabled: true,
            version:
              typeof (assessment.assessment_integrity as { pledge_version?: unknown } | null)?.pledge_version === "number"
                ? ((assessment.assessment_integrity as { pledge_version?: number }).pledge_version as number)
                : 1,
            text:
              typeof (assessment.assessment_integrity as { pledge_text?: unknown } | null)?.pledge_text === "string" &&
              ((assessment.assessment_integrity as { pledge_text?: string }).pledge_text ?? "").trim()
                ? ((assessment.assessment_integrity as { pledge_text?: string }).pledge_text as string)
                : DEFAULT_PLEDGE_TEXT,
            accepted_at: latestSubmission?.integrity_pledge_accepted_at ?? null,
          }
        : { enabled: false },
    },
    progress: { answered_count: answeredCount, total_count: totalCount },
    latest_submission: latestSubmission ?? null,
    student: {
      consent_audio: Boolean(student.consent_audio),
      consent_audio_at: student.consent_audio_at ?? null,
      consent_revoked_at: student.consent_revoked_at ?? null,
      disabled: Boolean(student.disabled),
    },
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
