import { NextResponse, type NextRequest } from "next/server";

import { isAudioFollowup, isEvidenceFollowup } from "@/lib/assessments/question-types";
import { processResponseAsync } from "@/lib/assessments/process-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

function getBucket() {
  return process.env.SUPABASE_RECORDINGS_BUCKET || "student-recordings";
}

async function ensureBucket(admin: ReturnType<typeof createSupabaseAdminClient>, bucket: string) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.name === bucket)) return;
  const { error: createError } = await admin.storage.createBucket(bucket, { public: false });
  if (createError) throw createError;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();

  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, student_id, assessment_id, status, integrity_pledge_accepted_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: responses, error: rError } = await admin
    .from("submission_responses")
    .select(
      "id, submission_id, question_id, storage_bucket, storage_path, mime_type, duration_seconds, created_at, response_stage, ai_followup_question, processing_status, processing_error",
    )
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });

  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  const bucket = getBucket();
  const signed: Array<Record<string, unknown>> = [];
  for (const r of responses ?? []) {
    const { data: signedUrl, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUrl(r.storage_path, 60 * 60);
    if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });
    signed.push({ ...r, signed_url: signedUrl.signedUrl });
  }

  const res = NextResponse.json({ responses: signed });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  const questionId = String(form.get("question_id") ?? "");
  const durationSecondsRaw = form.get("duration_seconds");
  const durationSeconds =
    typeof durationSecondsRaw === "string" && durationSecondsRaw ? Number(durationSecondsRaw) : null;

  const file = form.get("file");
  if (!questionId) return NextResponse.json({ error: "Missing question_id." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, consent_audio, consent_revoked_at, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });
  if (!student.consent_audio || student.consent_revoked_at) {
    return NextResponse.json({ error: "Audio consent required." }, { status: 409 });
  }

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, student_id, assessment_id, status, integrity_pledge_accepted_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (submission.status !== "started") return NextResponse.json({ error: "Cannot upload after submit." }, { status: 409 });

  const { data: integrity, error: iError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled, allow_grace_restart")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  let pledgeAcceptedAt = submission.integrity_pledge_accepted_at;
  if (integrity?.pledge_enabled && !pledgeAcceptedAt) {
    const { data: priorPledge, error: pledgeError } = await admin
      .from("submissions")
      .select("integrity_pledge_accepted_at")
      .eq("assessment_id", submission.assessment_id)
      .eq("student_id", student.id)
      .not("integrity_pledge_accepted_at", "is", null)
      .order("integrity_pledge_accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pledgeError) return NextResponse.json({ error: pledgeError.message }, { status: 500 });
    pledgeAcceptedAt = priorPledge?.integrity_pledge_accepted_at ?? null;
  }
  if (integrity?.pledge_enabled && !pledgeAcceptedAt) {
    return NextResponse.json({ error: "Accept the academic integrity pledge before answering." }, { status: 409 });
  }

  const allowGraceRestart = Boolean(integrity?.allow_grace_restart);
  let restartUsed = false;
  if (allowGraceRestart) {
    const { data: restartEvent, error: restartError } = await admin
      .from("assessment_restart_events")
      .select("id")
      .eq("assessment_id", submission.assessment_id)
      .eq("student_id", student.id)
      .maybeSingle();
    if (restartError) return NextResponse.json({ error: restartError.message }, { status: 500 });
    restartUsed = Boolean(restartEvent);
  }

  // Validate question belongs to the assessment.
  const { data: q, error: qError } = await admin
    .from("assessment_questions")
    .select("id, question_text, evidence_upload, question_type")
    .eq("id", questionId)
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  if (!q) return NextResponse.json({ error: "Invalid question." }, { status: 400 });

  // Enforce sequential answering: only allow upload for the next unanswered question.
  const { data: ordered, error: orderedError } = await admin
    .from("assessment_questions")
    .select("id, order_index, question_type")
    .eq("assessment_id", submission.assessment_id)
    .order("order_index", { ascending: true });
  if (orderedError) return NextResponse.json({ error: orderedError.message }, { status: 500 });

  const { data: answered, error: answeredError } = await admin
    .from("submission_responses")
    .select("question_id, response_stage")
    .eq("submission_id", submissionId);
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
  for (const row of ordered ?? []) {
    const stages = stagesByQuestion.get(row.id) ?? new Set<string>();
    if (isAudioFollowup(row.question_type)) {
      if (stages.has("followup")) answeredSet.add(row.id);
    } else if (stages.size > 0) {
      answeredSet.add(row.id);
    }
  }

  const stagesForQuestion = stagesByQuestion.get(questionId) ?? new Set<string>();
  const isAudioFollowupQuestion = isAudioFollowup(q.question_type);
  let responseStage: "primary" | "followup" = "primary";
  if (isAudioFollowupQuestion) {
    if (stagesForQuestion.has("followup")) {
      return NextResponse.json({ error: "Follow-up already recorded for this question." }, { status: 409 });
    }
    if (stagesForQuestion.has("primary")) {
      responseStage = "followup";
    }
  } else if (stagesForQuestion.size > 0) {
    return NextResponse.json({ error: "This question has already been answered. Re-recording is not allowed." }, { status: 409 });
  }

  const next = (ordered ?? []).find((row) => !answeredSet.has(row.id)) ?? null;
  if (!next) return NextResponse.json({ error: "All questions are already answered." }, { status: 409 });
  if (next.id !== questionId) {
    return NextResponse.json({ error: "You must answer questions in order." }, { status: 409 });
  }

  // Enforce evidence requirement (upload happens before recording).
  if (q.evidence_upload === "required" || isEvidenceFollowup(q.question_type)) {
    const { data: evidence, error: eError } = await admin
      .from("evidence_images")
      .select("id")
      .eq("submission_id", submissionId)
      .eq("question_id", questionId)
      .maybeSingle();
    if (eError) return NextResponse.json({ error: eError.message }, { status: 500 });
    if (!evidence) return NextResponse.json({ error: "Evidence image is required for this question." }, { status: 409 });
  }

  const bucket = getBucket();
  await ensureBucket(admin, bucket);

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "audio/webm" ? "webm" : file.type === "audio/ogg" ? "ogg" : "bin";
  const path = `${submissionId}/${questionId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Determine if async processing is needed
  const shouldGenerateFollowup = isAudioFollowupQuestion && responseStage === "primary";
  const canEvaluateRestart = allowGraceRestart && !restartUsed && responseStage === "primary";
  const needsAsyncProcessing = shouldGenerateFollowup || canEvaluateRestart;

  // Insert response immediately with processing status
  const insertPayload = {
    submission_id: submissionId,
    question_id: questionId,
    storage_bucket: bucket,
    storage_path: path,
    mime_type: file.type || null,
    duration_seconds: Number.isFinite(durationSeconds) ? Math.max(0, Math.round(durationSeconds as number)) : null,
    response_stage: responseStage,
    processing_status: needsAsyncProcessing ? "pending" : "complete",
    processing_started_at: needsAsyncProcessing ? new Date().toISOString() : null,
  };

  const { data: row, error: insertError } = await admin
    .from("submission_responses")
    .insert(insertPayload)
    .select(
      "id, submission_id, question_id, storage_bucket, storage_path, mime_type, duration_seconds, created_at, response_stage, ai_followup_question, processing_status",
    )
    .single();

  if (insertError) {
    const msg = insertError.message.toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "This question has already been answered. Re-recording is not allowed." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Link evidence images to this response (best-effort)
  try {
    await admin
      .from("evidence_images")
      .update({ submission_response_id: row.id })
      .eq("submission_id", submissionId)
      .eq("question_id", questionId)
      .is("submission_response_id", null);
  } catch {
    // best-effort; the evidence row is optional
  }

  // Fire off async processing (non-blocking)
  if (needsAsyncProcessing) {
    void processResponseAsync(row.id, {
      audioPath: path,
      bucket,
      mimeType: file.type || "audio/webm",
      questionId,
      questionText: q.question_text,
      questionType: q.question_type,
      shouldGenerateFollowup,
      canEvaluateRestart,
      context: {
        submissionId,
        assessmentId: submission.assessment_id,
        studentId: student.id,
      },
    });
  }

  const { data: signedUrl, error: signedError } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  // Return immediately with processing flag
  const res = NextResponse.json({
    ok: true,
    processing: needsAsyncProcessing,
    response: { ...row, signed_url: signedUrl.signedUrl },
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
