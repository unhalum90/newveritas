import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";

import { analyzeEvidenceImage } from "@/lib/ai/evidence";
import { isEvidenceFollowup } from "@/lib/assessments/question-types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

function getEvidenceBucket() {
  return process.env.SUPABASE_EVIDENCE_BUCKET || "student-evidence";
}

async function ensureBucket(admin: ReturnType<typeof createSupabaseAdminClient>, bucket: string) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.name === bucket)) return;
  const { error: createError } = await admin.storage.createBucket(bucket, { public: false });
  if (createError) throw createError;
}

function normalizeEvidenceSetting(value: unknown) {
  if (value === "disabled" || value === "optional" || value === "required") return value;
  return null;
}

function isAllowedImage(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "image/heic" || type === "image/heif") return true;
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".heic") || name.endsWith(".heif");
}

async function processImageToJpeg(input: Uint8Array) {
  const image = sharp(input).rotate().resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true });
  const metadata = await image.metadata().catch(() => ({} as { width?: number; height?: number }));
  const buffer = await image.toBuffer();
  return { buffer, width: metadata.width ?? null, height: metadata.height ?? null };
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const questionId = request.nextUrl.searchParams.get("question_id") ?? "";
  if (!questionId) return NextResponse.json({ error: "Missing question_id." }, { status: 400 });

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

  const { data: integrity, error: iError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  if (integrity?.pledge_enabled && !submission.integrity_pledge_accepted_at) {
    return NextResponse.json({ error: "Accept the academic integrity pledge before starting." }, { status: 409 });
  }

  const { data: evidence, error: eError } = await admin
    .from("evidence_images")
    .select(
      "id, storage_bucket, storage_path, mime_type, file_size_bytes, width_px, height_px, uploaded_at, created_at, ai_description, analyzed_at",
    )
    .eq("submission_id", submissionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (eError) return NextResponse.json({ error: eError.message }, { status: 500 });
  if (!evidence) {
    const res = NextResponse.json({ evidence: null });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const { data: signedUrl, error: signedError } = await admin.storage
    .from(evidence.storage_bucket)
    .createSignedUrl(evidence.storage_path, 60 * 60);
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  const res = NextResponse.json({ evidence: { ...evidence, signed_url: signedUrl.signedUrl } });
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
  const file = form.get("file");
  if (!questionId) return NextResponse.json({ error: "Missing question_id." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });
  if (!isAllowedImage(file)) return NextResponse.json({ error: "Invalid format. Use JPG, PNG, or HEIC." }, { status: 415 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 413 });

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
    return NextResponse.json({ error: "Accept the academic integrity pledge before starting." }, { status: 409 });
  }

  // Validate question belongs to the assessment and evidence upload is enabled.
  const { data: q, error: qError } = await admin
    .from("assessment_questions")
    .select("id, evidence_upload, question_type, question_text")
    .eq("id", questionId)
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  if (!q) return NextResponse.json({ error: "Invalid question." }, { status: 400 });

  const evidenceSetting = isEvidenceFollowup(q.question_type) ? "required" : normalizeEvidenceSetting(q.evidence_upload) ?? "optional";
  if (evidenceSetting === "disabled") return NextResponse.json({ error: "Evidence upload is disabled for this question." }, { status: 409 });

  // Enforce sequential answering: only allow evidence for the next unanswered question.
  const { data: ordered, error: orderedError } = await admin
    .from("assessment_questions")
    .select("id, order_index")
    .eq("assessment_id", submission.assessment_id)
    .order("order_index", { ascending: true });
  if (orderedError) return NextResponse.json({ error: orderedError.message }, { status: 500 });

  const { data: answered, error: answeredError } = await admin.from("submission_responses").select("question_id").eq("submission_id", submissionId);
  if (answeredError) return NextResponse.json({ error: answeredError.message }, { status: 500 });
  const answeredSet = new Set((answered ?? []).map((r) => r.question_id));
  if (answeredSet.has(questionId)) return NextResponse.json({ error: "This question has already been answered." }, { status: 409 });

  const next = (ordered ?? []).find((row) => !answeredSet.has(row.id)) ?? null;
  if (!next) return NextResponse.json({ error: "All questions are already answered." }, { status: 409 });
  if (next.id !== questionId) return NextResponse.json({ error: "You must answer questions in order." }, { status: 409 });

  const bucket = getEvidenceBucket();
  await ensureBucket(admin, bucket);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const processed = await processImageToJpeg(bytes);
  const out = processed.buffer;

  const safeName = (file.name || "").replace(/[^\w.\- ]+/g, "_").slice(0, 160);
  const path = `${submission.assessment_id}/${student.id}/${questionId}_${Date.now()}.jpg`;

  // If replacing, delete the previous object to avoid unbounded storage growth.
  const { data: existing } = await admin
    .from("evidence_images")
    .select("storage_bucket, storage_path")
    .eq("submission_id", submissionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing?.storage_path && existing.storage_path !== path) {
    await admin.storage.from(existing.storage_bucket || bucket).remove([existing.storage_path]).catch(() => null);
  }

  const { error: uploadError } = await admin.storage.from(bucket).upload(path, out, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const upsertPayload = {
    submission_id: submissionId,
    question_id: questionId,
    submission_response_id: null,
    original_filename: safeName || null,
    storage_bucket: bucket,
    storage_path: path,
    file_size_bytes: out.byteLength,
    mime_type: "image/jpeg",
    width_px: processed.width,
    height_px: processed.height,
    uploaded_at: new Date().toISOString(),
    deleted_at: null,
    ai_description: null,
    analyzed_at: null,
  };

  const { data: row, error: upsertError } = await admin
    .from("evidence_images")
    .upsert(upsertPayload, { onConflict: "submission_id,question_id" })
    .select(
      "id, submission_id, question_id, storage_bucket, storage_path, mime_type, file_size_bytes, width_px, height_px, uploaded_at, ai_description, analyzed_at",
    )
    .single();

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  let analysis = row.ai_description ? row.ai_description : null;
  let analyzedAt = row.analyzed_at ? row.analyzed_at : null;
  if (isEvidenceFollowup(q.question_type) && process.env.OPENAI_API_KEY) {
    const ai = await analyzeEvidenceImage({
      image: out,
      questionText: q.question_text,
      context: {
        assessmentId: submission.assessment_id,
        studentId: student.id,
        submissionId,
        questionId,
      },
    });
    if (ai) {
      analysis = JSON.stringify(ai);
      analyzedAt = new Date().toISOString();
      try {
        await admin
          .from("evidence_images")
          .update({ ai_description: analysis, analyzed_at: analyzedAt })
          .eq("id", row.id);
      } catch {
        // Best-effort: analysis metadata is optional.
      }
    }
  }

  if (isEvidenceFollowup(q.question_type) && !analysis) {
    analysis = JSON.stringify({ summary: "AI questions unavailable. Continue with the prompt.", questions: [] });
    analyzedAt = new Date().toISOString();
    try {
      await admin
        .from("evidence_images")
        .update({ ai_description: analysis, analyzed_at: analyzedAt })
        .eq("id", row.id);
    } catch {
      // Best-effort: analysis metadata is optional.
    }
  }

  const { data: signedUrl, error: signedError } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  const res = NextResponse.json({
    ok: true,
    evidence: { ...row, ai_description: analysis, analyzed_at: analyzedAt, signed_url: signedUrl.signedUrl },
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const questionId = request.nextUrl.searchParams.get("question_id") ?? "";
  if (!questionId) return NextResponse.json({ error: "Missing question_id." }, { status: 400 });

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
  if (submission.status !== "started") return NextResponse.json({ error: "Cannot modify after submit." }, { status: 409 });

  const { data: integrity, error: iError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  if (integrity?.pledge_enabled && !submission.integrity_pledge_accepted_at) {
    return NextResponse.json({ error: "Accept the academic integrity pledge before starting." }, { status: 409 });
  }

  // Disallow changes after the audio response for this question exists.
  const { data: responseExists, error: rError } = await admin
    .from("submission_responses")
    .select("id")
    .eq("submission_id", submissionId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });
  if (responseExists) return NextResponse.json({ error: "Cannot change evidence after recording." }, { status: 409 });

  const { data: evidence, error: eError } = await admin
    .from("evidence_images")
    .select("id, storage_bucket, storage_path")
    .eq("submission_id", submissionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (eError) return NextResponse.json({ error: eError.message }, { status: 500 });
  if (!evidence) {
    const res = NextResponse.json({ ok: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  if (evidence.storage_path) {
    await admin.storage.from(evidence.storage_bucket || getEvidenceBucket()).remove([evidence.storage_path]).catch(() => null);
  }

  const { error: updateError } = await admin
    .from("evidence_images")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", evidence.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
