import { NextResponse, type NextRequest } from "next/server";

import { isEvidenceFollowup } from "@/lib/assessments/question-types";
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
    .select("id, submission_id, question_id, storage_bucket, storage_path, mime_type, duration_seconds, created_at")
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
    .select("pledge_enabled")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  if (integrity?.pledge_enabled && !submission.integrity_pledge_accepted_at) {
    return NextResponse.json({ error: "Accept the academic integrity pledge before answering." }, { status: 409 });
  }

  // Validate question belongs to the assessment.
  const { data: q, error: qError } = await admin
    .from("assessment_questions")
    .select("id, evidence_upload, question_type")
    .eq("id", questionId)
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  if (!q) return NextResponse.json({ error: "Invalid question." }, { status: 400 });

  // Enforce sequential answering: only allow upload for the next unanswered question.
  const { data: ordered, error: orderedError } = await admin
    .from("assessment_questions")
    .select("id, order_index")
    .eq("assessment_id", submission.assessment_id)
    .order("order_index", { ascending: true });
  if (orderedError) return NextResponse.json({ error: orderedError.message }, { status: 500 });

  const { data: answered, error: answeredError } = await admin
    .from("submission_responses")
    .select("question_id")
    .eq("submission_id", submissionId);
  if (answeredError) return NextResponse.json({ error: answeredError.message }, { status: 500 });
  const answeredSet = new Set((answered ?? []).map((r) => r.question_id));

  if (answeredSet.has(questionId)) {
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

  const insertPayload = {
    submission_id: submissionId,
    question_id: questionId,
    storage_bucket: bucket,
    storage_path: path,
    mime_type: file.type || null,
    duration_seconds: Number.isFinite(durationSeconds) ? Math.max(0, Math.round(durationSeconds as number)) : null,
  };

  const { data: row, error: insertError } = await admin
    .from("submission_responses")
    .insert(insertPayload)
    .select("id, submission_id, question_id, storage_bucket, storage_path, mime_type, duration_seconds, created_at")
    .single();

  if (insertError) {
    const msg = insertError.message.toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "This question has already been answered. Re-recording is not allowed." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // If the student uploaded evidence before recording, link it to this response row.
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

  const { data: signedUrl, error: signedError } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, response: { ...row, signed_url: signedUrl.signedUrl } });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
