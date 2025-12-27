import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

function getRecordingsBucket() {
  return process.env.SUPABASE_RECORDINGS_BUCKET || "student-recordings";
}

function getEvidenceBucket() {
  return process.env.SUPABASE_EVIDENCE_BUCKET || "student-evidence";
}

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

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
    .select("id, class_id, first_name, last_name")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

  const { data: assessment, error: aError } = await admin
    .from("assessments")
    .select("id, class_id, title, instructions")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.class_id !== student.class_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select(
      "id, status, submitted_at, review_status, published_at, teacher_comment, final_score_override",
    )
    .eq("assessment_id", assessmentId)
    .eq("student_id", student.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  if (submission.review_status !== "published") {
    return NextResponse.json({ error: "Feedback not released yet." }, { status: 403 });
  }

  const { data: questions, error: qError } = await admin
    .from("assessment_questions")
    .select("id, order_index, question_text, question_type")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  const { data: responses, error: rError } = await admin
    .from("submission_responses")
    .select("id, submission_id, question_id, storage_path, mime_type, duration_seconds, created_at, transcript")
    .eq("submission_id", submission.id);

  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  const { data: evidenceRows, error: eError } = await admin
    .from("evidence_images")
    .select("question_id, storage_bucket, storage_path, mime_type, file_size_bytes, width_px, height_px, uploaded_at")
    .eq("submission_id", submission.id);
  if (eError) return NextResponse.json({ error: eError.message }, { status: 500 });

  const { data: scores, error: scError } = await admin
    .from("question_scores")
    .select("question_id, scorer_type, score, justification")
    .eq("submission_id", submission.id);

  if (scError) return NextResponse.json({ error: scError.message }, { status: 500 });

  const bucket = getRecordingsBucket();
  const responseByQuestion = new Map<
    string,
    {
      signed_url: string;
      duration_seconds: number | null;
      created_at: string;
      transcript: string | null;
    }
  >();
  for (const r of responses ?? []) {
    const { data: signedUrl, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUrl(r.storage_path, 60 * 60);
    if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });
    responseByQuestion.set(r.question_id, {
      signed_url: signedUrl.signedUrl,
      duration_seconds: r.duration_seconds ?? null,
      created_at: r.created_at,
      transcript: typeof r.transcript === "string" && r.transcript.trim() ? r.transcript : null,
    });
  }

  const evidenceByQuestion = new Map<
    string,
    {
      signed_url: string;
      mime_type: string | null;
      file_size_bytes: number | null;
      width_px: number | null;
      height_px: number | null;
      uploaded_at: string;
    }
  >();
  for (const e of evidenceRows ?? []) {
    const bucket = (e.storage_bucket as string | null) || getEvidenceBucket();
    const path = e.storage_path as string;
    if (!path) continue;
    const { data: signedUrl, error: signedError } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });
    evidenceByQuestion.set(e.question_id, {
      signed_url: signedUrl.signedUrl,
      mime_type: typeof e.mime_type === "string" && e.mime_type ? e.mime_type : null,
      file_size_bytes: typeof e.file_size_bytes === "number" ? e.file_size_bytes : null,
      width_px: typeof e.width_px === "number" ? e.width_px : null,
      height_px: typeof e.height_px === "number" ? e.height_px : null,
      uploaded_at: e.uploaded_at,
    });
  }

  const scoresByQuestion = new Map<
    string,
    {
      reasoning: { score: number | null; justification: string | null };
      evidence: { score: number | null; justification: string | null };
    }
  >();
  for (const row of scores ?? []) {
    const key = row.question_id;
    const curr = scoresByQuestion.get(key) ?? {
      reasoning: { score: null, justification: null },
      evidence: { score: null, justification: null },
    };
    if (row.scorer_type === "reasoning") {
      curr.reasoning = { score: row.score ?? null, justification: row.justification ?? null };
    } else if (row.scorer_type === "evidence") {
      curr.evidence = { score: row.score ?? null, justification: row.justification ?? null };
    }
    scoresByQuestion.set(key, curr);
  }

  const scoreValues = (scores ?? []).map((s) => s.score).filter((n): n is number => typeof n === "number");
  const computedScore = avg(scoreValues);
  const finalScore =
    typeof submission.final_score_override === "number" ? submission.final_score_override : computedScore;

  const res = NextResponse.json({
    assessment: {
      id: assessment.id,
      title: assessment.title,
      instructions: assessment.instructions,
    },
    student: {
      name: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Student",
    },
    submission: {
      id: submission.id,
      submitted_at: submission.submitted_at,
      published_at: submission.published_at,
      teacher_comment: submission.teacher_comment ?? null,
      final_score: finalScore,
      review_status: submission.review_status,
    },
    questions: (questions ?? []).map((q) => ({
      ...q,
      response: responseByQuestion.get(q.id) ?? null,
      evidence: evidenceByQuestion.get(q.id) ?? null,
      scores: scoresByQuestion.get(q.id) ?? null,
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
