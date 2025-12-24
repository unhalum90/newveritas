import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { generateSocraticFollowup } from "@/lib/ai/socratic-followup";

function getBucket() {
  return process.env.SUPABASE_RECORDINGS_BUCKET || "student-recordings";
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (typeof v === "string" && v.trim()) return v.trim();
  throw new Error(`Missing ${name}.`);
}

function getEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function transcribeWithOpenAi(audioBytes: Buffer, mimeType: string) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = getEnv("OPENAI_TRANSCRIBE_MODEL") ?? "whisper-1";

  const form = new FormData();
  const ext =
    mimeType.includes("webm")
      ? "webm"
      : mimeType.includes("mpeg")
        ? "mp3"
        : mimeType.includes("wav")
          ? "wav"
          : "bin";

  form.append("model", model);
  form.append("file", new Blob([new Uint8Array(audioBytes)], { type: mimeType }), `audio.${ext}`);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = (await res.json().catch(() => null)) as
    | { error?: { message?: unknown }; text?: unknown }
    | null;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI transcription failed.";
    throw new Error(msg);
  }

  const transcript = data?.text;
  if (typeof transcript !== "string") throw new Error("OpenAI transcription returned empty response.");
  return transcript.trim();
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
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

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
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, student_id, assessment_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (submission.status !== "started") return NextResponse.json({ error: "Cannot upload after submit." }, { status: 409 });

  const { data: integrity, error: integrityError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (integrityError) return NextResponse.json({ error: integrityError.message }, { status: 500 });
  if (integrity?.pledge_enabled && !submission.integrity_pledge_accepted_at) {
    return NextResponse.json({ error: "Accept the integrity pledge before recording." }, { status: 409 });
  }

  // Validate question belongs to the assessment.
  const { data: q, error: qError } = await admin
    .from("assessment_questions")
    .select("id, submission_id, order_index, question_text, kind")
    .eq("id", questionId)
    .eq("assessment_id", submission.assessment_id)
    .or(`submission_id.is.null,submission_id.eq.${submissionId}`)
    .maybeSingle();

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  if (!q) return NextResponse.json({ error: "Invalid question." }, { status: 400 });

  // Enforce sequential answering: only allow upload for the next unanswered question.
  const { data: ordered, error: orderedError } = await admin
    .from("assessment_questions")
    .select("id, order_index, submission_id")
    .eq("assessment_id", submission.assessment_id)
    .or(`submission_id.is.null,submission_id.eq.${submissionId}`)
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

  // Transcribe immediately so we can generate Socratic follow-ups without waiting for teacher-side scoring.
  let transcript: string | null = null;
  if (process.env.OPENAI_API_KEY) {
    try {
      transcript = await transcribeWithOpenAi(bytes, file.type || "audio/webm");
      if (transcript) {
        await admin.from("submission_responses").update({ transcript }).eq("id", row.id);
      }
    } catch (e) {
      console.error("Transcription failed", { submissionId, questionId }, e);
      transcript = null;
    }
  }

  // If Socratic mode is enabled, generate follow-up question(s) for this submission (sequential, no preview).
  try {
    const { data: aRow, error: aError } = await admin
      .from("assessments")
      .select("id, title, instructions, socratic_enabled, socratic_follow_ups")
      .eq("id", submission.assessment_id)
      .maybeSingle();
    if (aError) throw aError;

    const socraticEnabled = Boolean(aRow?.socratic_enabled);
    const followUpTarget = typeof aRow?.socratic_follow_ups === "number" ? aRow.socratic_follow_ups : 0;

    if (socraticEnabled && followUpTarget > 0) {
      // Base question (v1 Socratic): exactly one initial question.
      const { data: baseQuestion, error: baseError } = await admin
        .from("assessment_questions")
        .select("id, order_index, question_text")
        .eq("assessment_id", submission.assessment_id)
        .is("submission_id", null)
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (baseError) throw baseError;
      if (!baseQuestion) throw new Error("Socratic mode requires a base question.");

      const { data: followUps, error: fError } = await admin
        .from("assessment_questions")
        .select("id, order_index, question_text")
        .eq("assessment_id", submission.assessment_id)
        .eq("submission_id", submissionId)
        .order("order_index", { ascending: true });
      if (fError) throw fError;

      const existingFollowUps = followUps ?? [];
      const baseOrderIndex = typeof baseQuestion.order_index === "number" ? baseQuestion.order_index : 1;
      const expectedCurrentOrderIndex = baseOrderIndex + existingFollowUps.length;

      // Only generate the next follow-up after the student answers the current last question in the chain.
      if (
        typeof q.order_index === "number" &&
        q.order_index === expectedCurrentOrderIndex &&
        existingFollowUps.length < followUpTarget
      ) {
        const nextOrderIndex = q.order_index + 1;

        // If this follow-up already exists (retry, etc), don't generate again.
        const { data: existingNext, error: existingNextError } = await admin
          .from("assessment_questions")
          .select("id")
          .eq("assessment_id", submission.assessment_id)
          .eq("submission_id", submissionId)
          .eq("order_index", nextOrderIndex)
          .maybeSingle();
        if (existingNextError) throw existingNextError;

        if (!existingNext) {
          const { data: priorResponses, error: prError } = await admin
            .from("submission_responses")
            .select("question_id, transcript")
            .eq("submission_id", submissionId);
          if (prError) throw prError;

          const priorTranscripts = (priorResponses ?? [])
            .filter((r) => r.question_id !== questionId && typeof r.transcript === "string" && r.transcript.trim())
            .map((r) => (r.transcript as string).trim());

          const currentTranscript = transcript?.trim();
          const safeTranscript = currentTranscript && currentTranscript.length ? currentTranscript : "(transcript unavailable)";

          let followupText = "Can you be more specific and give concrete evidence for your answer?";
          let followupType: string | null = "open_response";

          try {
            const ai = await generateSocraticFollowup({
              assessmentTitle: aRow?.title ?? "Assessment",
              assessmentInstructions: aRow?.instructions ?? null,
              baseQuestionText: baseQuestion.question_text,
              priorQuestionText: q.question_text,
              transcript: safeTranscript,
              priorTranscripts,
            });
            followupText = ai.question_text;
            followupType = typeof ai.question_type === "string" && ai.question_type.trim() ? ai.question_type : "open_response";
          } catch (e) {
            console.error("Follow-up generation failed; using fallback.", { submissionId, questionId }, e);
          }

          const insertQuestion = {
            assessment_id: submission.assessment_id,
            submission_id: submissionId,
            kind: "followup",
            parent_question_id: questionId,
            order_index: nextOrderIndex,
            question_text: followupText,
            question_type: followupType,
          };

          const { error: insQError } = await admin.from("assessment_questions").insert(insertQuestion);
          if (insQError) {
            const msg = insQError.message.toLowerCase();
            if (!msg.includes("duplicate") && !msg.includes("unique")) throw insQError;
          }
        }
      }
    }
  } catch (e) {
    // Never block the student's submission after recording is uploaded.
    console.error("Socratic follow-up pipeline failed", { submissionId, questionId }, e);
  }

  const { data: signedUrl, error: signedError } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, response: { ...row, signed_url: signedUrl.signedUrl } });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
