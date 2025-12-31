import { isAudioFollowup, isEvidenceFollowup } from "@/lib/assessments/question-types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logOpenAiCall, logOpenAiError } from "@/lib/ops/api-logging";

type OpenAiLogContext = {
  operation: string;
  assessmentId?: string | null;
  studentId?: string | null;
  submissionId?: string | null;
  questionId?: string | null;
  audioDurationSeconds?: number | null;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (v) return v;
  if (name === "GOOGLE_API_KEY") {
    const alt = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (alt) return alt;
  }
  throw new Error(`Missing ${name}.`);
}

function getEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function isGeminiEnabled() {
  const v = (process.env.ENABLE_GEMINI || process.env.GEMINI_ENABLED || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function clampScore(v: number) {
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(5, Math.round(v)));
}

function coerceScore(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function getGeminiTextFromResponse(data: unknown) {
  const text = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> } | null)
    ?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("Gemini returned empty response.");
  return text;
}

function parseEvidenceFollowups(raw: unknown) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { summary?: unknown; questions?: unknown };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((q) => (typeof q === "string" ? q.trim() : "")).filter((q) => q.length > 0)
      : [];
    if (!summary && questions.length === 0) return null;
    return { summary, questions };
  } catch {
    return null;
  }
}

function isGeminiApiKeyUnsupportedError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("api keys are not supported") ||
    m.includes("credentials_missing") ||
    m.includes("expected oauth2") ||
    m.includes("insufficient authentication scopes")
  );
}

function getGeminiApiKeyHelp(message: string) {
  const m = message.toLowerCase();
  if (
    m.includes("api keys are not supported") ||
    m.includes("expected oauth2") ||
    m.includes("credentials_missing") ||
    m.includes("insufficient authentication scopes")
  ) {
    return [
      "Gemini rejected API-key auth for this request.",
      "Use a Google AI Studio key (not a Vertex-only setup) and call `generativelanguage.googleapis.com` with `?key=...`.",
      "For local-only testing, verify with:",
      "curl -sS \"https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_API_KEY\" | head",
    ].join(" ");
  }
  return null;
}

function getGeminiModelFallback(model: string) {
  // Some preview/Vertex-only models reject AI Studio API keys.
  if (model.includes("preview") || model.includes("exp") || model.startsWith("gemini-3")) return "gemini-2.5-flash";
  return model;
}

async function geminiGenerateJson(model: string, system: string, parts: Array<Record<string, unknown>>) {
  const apiKey = requireEnv("GOOGLE_API_KEY");
  const safeModel = getGeminiModelFallback(model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    safeModel,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      typeof (data as { error?: { message?: unknown } } | null)?.error?.message === "string"
        ? ((data as { error?: { message?: string } }).error?.message as string)
        : "Gemini request failed.";
    throw new Error(msg);
  }

  return JSON.parse(getGeminiTextFromResponse(data)) as unknown;
}

async function openaiGenerateJson(model: string, system: string, user: string, context?: OpenAiLogContext) {
  const apiKey = requireEnv("OPENAI_API_KEY");

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logOpenAiError({
      model,
      route: "/v1/chat/completions",
      statusCode: null,
      latencyMs: Date.now() - startedAt,
      operation: context?.operation,
      assessmentId: context?.assessmentId,
      studentId: context?.studentId,
      submissionId: context?.submissionId,
      questionId: context?.questionId,
      metadata: { error: message },
    });
    throw error;
  }

  const data = (await res.json().catch(() => null)) as
    | {
        error?: { message?: unknown };
        choices?: Array<{ message?: { content?: unknown } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }
    | null;
  const usage = data?.usage;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI request failed.";
    await logOpenAiError({
      model,
      route: "/v1/chat/completions",
      statusCode: res.status,
      latencyMs: Date.now() - startedAt,
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
      operation: context?.operation,
      assessmentId: context?.assessmentId,
      studentId: context?.studentId,
      submissionId: context?.submissionId,
      questionId: context?.questionId,
      metadata: { error: msg },
    });
    throw new Error(msg);
  }

  await logOpenAiCall({
    model,
    route: "/v1/chat/completions",
    statusCode: res.status,
    latencyMs: Date.now() - startedAt,
    promptTokens: usage?.prompt_tokens ?? null,
    completionTokens: usage?.completion_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,
    operation: context?.operation,
    assessmentId: context?.assessmentId,
    studentId: context?.studentId,
    submissionId: context?.submissionId,
    questionId: context?.questionId,
    status: "success",
  });

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenAI returned empty response.");
  return JSON.parse(text) as unknown;
}

const PAUSE_MARKER_SECONDS = 5;
const PAUSE_MARKER_REGEX = /\(pause\s+\d+(?:\.\d+)?s\)/gi;

function stripPauseMarkers(text: string) {
  return text.replace(PAUSE_MARKER_REGEX, " ").replace(/\s+/g, " ").trim();
}

function buildTranscriptWithPauses(data: unknown) {
  const obj = data as { segments?: Array<{ words?: Array<{ start?: number; end?: number; word?: string }> }> };
  const words: Array<{ start: number; end: number; word: string }> = [];
  for (const segment of obj.segments ?? []) {
    for (const entry of segment.words ?? []) {
      if (typeof entry.start !== "number" || typeof entry.end !== "number") continue;
      if (typeof entry.word !== "string") continue;
      const text = entry.word.trim();
      if (!text) continue;
      words.push({ start: entry.start, end: entry.end, word: text });
    }
  }
  if (!words.length) return null;
  const parts: string[] = [];
  let prevEnd: number | null = null;
  for (const word of words) {
    if (prevEnd != null) {
      const gap = word.start - prevEnd;
      if (gap >= PAUSE_MARKER_SECONDS) {
        parts.push(`(pause ${gap.toFixed(1)}s)`);
      }
    }
    parts.push(word.word);
    prevEnd = word.end;
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

async function transcribeWithOpenAi(audioBytes: Buffer, mimeType: string, context?: OpenAiLogContext) {
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
  const filename = `audio.${ext}`;

  form.append("model", model);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("file", new Blob([new Uint8Array(audioBytes)], { type: mimeType }), filename);

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logOpenAiError({
      model,
      route: "/v1/audio/transcriptions",
      statusCode: null,
      latencyMs: Date.now() - startedAt,
      operation: context?.operation,
      assessmentId: context?.assessmentId,
      studentId: context?.studentId,
      submissionId: context?.submissionId,
      questionId: context?.questionId,
      audioDurationSeconds: context?.audioDurationSeconds ?? null,
      metadata: { error: message },
    });
    throw error;
  }

  const data = (await res.json().catch(() => null)) as
    | { error?: { message?: unknown }; text?: unknown; segments?: unknown }
    | null;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI transcription failed.";
    await logOpenAiError({
      model,
      route: "/v1/audio/transcriptions",
      statusCode: res.status,
      latencyMs: Date.now() - startedAt,
      operation: context?.operation,
      assessmentId: context?.assessmentId,
      studentId: context?.studentId,
      submissionId: context?.submissionId,
      questionId: context?.questionId,
      audioDurationSeconds: context?.audioDurationSeconds ?? null,
      metadata: { error: msg },
    });
    throw new Error(msg);
  }

  await logOpenAiCall({
    model,
    route: "/v1/audio/transcriptions",
    statusCode: res.status,
    latencyMs: Date.now() - startedAt,
    operation: context?.operation,
    assessmentId: context?.assessmentId,
    studentId: context?.studentId,
    submissionId: context?.submissionId,
    questionId: context?.questionId,
    audioDurationSeconds: context?.audioDurationSeconds ?? null,
    status: "success",
  });

  const transcriptWithPauses = buildTranscriptWithPauses(data);
  if (transcriptWithPauses) return transcriptWithPauses;

  const transcript = data?.text;
  if (typeof transcript !== "string") throw new Error("OpenAI transcription returned empty response.");
  return transcript.trim();
}

async function transcribeWithGemini(audioBytes: Buffer, mimeType: string) {
  const model = process.env.GEMINI_TRANSCRIBE_MODEL || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const system = "You are a transcription engine. Return ONLY JSON: {\"transcript\": \"...\"}. No markdown.";
  const user = "Transcribe the audio verbatim. If unclear, do your best; do not invent content.";
  const b64 = audioBytes.toString("base64");

  const data = await geminiGenerateJson(model, system, [
    { text: user },
    { inline_data: { mime_type: mimeType, data: b64 } },
  ]);

  const transcript = (data as { transcript?: unknown } | null)?.transcript;
  if (typeof transcript !== "string") throw new Error("Transcription failed.");
  return transcript.trim();
}

async function transcribeAudio(audioBytes: Buffer, mimeType: string, context?: OpenAiLogContext) {
  // Prefer OpenAI for transcription (most reliable with API keys).
  if (process.env.OPENAI_API_KEY) return transcribeWithOpenAi(audioBytes, mimeType, context);

  if (!isGeminiEnabled()) {
    throw new Error(
      "Transcription is not configured. Set OPENAI_API_KEY (recommended), or enable Gemini by setting ENABLE_GEMINI=1 and GOOGLE_API_KEY (AI Studio key).",
    );
  }

  try {
    return await transcribeWithGemini(audioBytes, mimeType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isGeminiApiKeyUnsupportedError(msg)) {
      const help = getGeminiApiKeyHelp(msg);
      throw new Error(
        `Gemini transcription failed due to auth. ${help ?? ""} Set OPENAI_API_KEY to use OpenAI transcription instead.`,
      );
    }
    throw e;
  }
}

function parseScoreOutput(data: unknown) {
  const obj = data as {
    reasoning?: { score?: unknown; justification?: unknown };
    evidence?: { score?: unknown; justification?: unknown };
  } | null;

  const rScore = coerceScore(obj?.reasoning?.score);
  const eScore = coerceScore(obj?.evidence?.score);
  const rJust = obj?.reasoning?.justification;
  const eJust = obj?.evidence?.justification;

  if (typeof rScore !== "number" || typeof eScore !== "number") throw new Error("Scoring output invalid.");
  if (typeof rJust !== "string" || typeof eJust !== "string") throw new Error("Scoring output invalid.");

  return {
    reasoning: { score: clampScore(rScore), justification: rJust.slice(0, 1000) },
    evidence: { score: clampScore(eScore), justification: eJust.slice(0, 1000) },
  };
}

async function scoreWithOpenAi(input: {
  questionText: string;
  transcript: string;
  rubricReasoning: string;
  rubricEvidence: string;
  context?: OpenAiLogContext;
}) {
  const model = process.env.OPENAI_SCORE_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5-mini-2025-08-07";
  const system =
    "You are a strict grader. Return ONLY JSON: reasoning{score,justification}, evidence{score,justification}. Scores are integers 1-5.";
  const user = `Question:
${input.questionText}

Student transcript:
${input.transcript}

Reasoning rubric instructions:
${input.rubricReasoning}

Evidence rubric instructions:
${input.rubricEvidence}

Rules:
- Provide a score 1-5 for each rubric.
- Justification must quote or reference transcript specifics.
- If transcript is empty or irrelevant, score low with clear explanation.`;

  const data = await openaiGenerateJson(
    model,
    system,
    user,
    input.context ?? { operation: "student_evaluation" },
  );
  return parseScoreOutput(data);
}

async function scoreWithGemini(input: {
  questionText: string;
  transcript: string;
  rubricReasoning: string;
  rubricEvidence: string;
}) {
  const model = process.env.GEMINI_SCORE_MODEL || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const system =
    "You are a strict grader. Return ONLY JSON: reasoning{score,justification}, evidence{score,justification}. Scores are integers 1-5.";

  const user = `Question:
${input.questionText}

Student transcript:
${input.transcript}

Reasoning rubric instructions:
${input.rubricReasoning}

Evidence rubric instructions:
${input.rubricEvidence}

Rules:
- Provide a score 1-5 for each rubric.
- Justification must quote or reference transcript specifics.
- If transcript is empty or irrelevant, score low with clear explanation.`;

  const data = await geminiGenerateJson(model, system, [{ text: user }]);
  return parseScoreOutput(data);
}

function reconcile(primary: ReturnType<typeof parseScoreOutput>, review: ReturnType<typeof parseScoreOutput>) {
  const reconcileOne = (p: { score: number; justification: string }, r: { score: number; justification: string }) => {
    if (p.score === r.score) {
      return {
        score: p.score,
        justification: `${p.justification}\n\nGemini review (agree): ${r.justification}`.slice(0, 1200),
      };
    }
    const diff = Math.abs(p.score - r.score);
    if (diff === 1) {
      const avg = clampScore((p.score + r.score) / 2);
      return {
        score: avg,
        justification: `OpenAI: ${p.justification}\n\nGemini review: ${r.justification}\n\nFinal score chosen: ${avg} (minor disagreement)`.slice(
          0,
          1200,
        ),
      };
    }
    // Large disagreement: trust the reviewer, but keep the primary context for transparency.
    return {
      score: r.score,
      justification: `OpenAI: ${p.justification}\n\nGemini review: ${r.justification}\n\nFinal score chosen: ${r.score} (review override)`.slice(
        0,
        1200,
      ),
    };
  };

  return {
    reasoning: reconcileOne(primary.reasoning, review.reasoning),
    evidence: reconcileOne(primary.evidence, review.evidence),
  };
}

export async function scoreSubmission(submissionId: string) {
  const admin = createSupabaseAdminClient();

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, assessment_id, student_id, status, scoring_status")
    .eq("id", submissionId)
    .maybeSingle();
  if (subError) throw subError;
  if (!submission) throw new Error("Submission not found.");
  if (submission.status !== "submitted") throw new Error("Submission is not submitted.");

  const now = new Date().toISOString();
  if (submission.scoring_status === "complete") return;

  const { data: started, error: startError } = await admin
    .from("submissions")
    .update({ scoring_status: "running", scoring_started_at: now, scoring_error: null })
    .eq("id", submissionId)
    .in("scoring_status", ["pending", "error"])
    .select("id")
    .maybeSingle();
  if (startError) throw startError;
  if (!started && submission.scoring_status !== "running") return;

  try {
    const { data: questions, error: qError } = await admin
      .from("assessment_questions")
      .select("id, order_index, question_text, question_type")
      .eq("assessment_id", submission.assessment_id)
      .order("order_index", { ascending: true });
    if (qError) throw qError;

    const { data: rubrics, error: rError } = await admin
      .from("rubrics")
      .select("rubric_type, instructions")
      .eq("assessment_id", submission.assessment_id);
    if (rError) throw rError;
    const rubricReasoning = (rubrics ?? []).find((r) => r.rubric_type === "reasoning")?.instructions ?? "";
    const rubricEvidence = (rubrics ?? []).find((r) => r.rubric_type === "evidence")?.instructions ?? "";
    if (!rubricReasoning || !rubricEvidence) throw new Error("Rubrics missing.");

    const { data: responses, error: respError } = await admin
      .from("submission_responses")
      .select(
        "id, question_id, storage_bucket, storage_path, mime_type, transcript, duration_seconds, response_stage, ai_followup_question",
      )
      .eq("submission_id", submissionId);
    if (respError) throw respError;

    const byQuestion = new Map<
      string,
      {
        primary?: (typeof responses)[number];
        followup?: (typeof responses)[number];
      }
    >();
    for (const r of responses ?? []) {
      const entry = byQuestion.get(r.question_id) ?? {};
      const stage = r.response_stage === "followup" ? "followup" : "primary";
      if (!entry[stage]) entry[stage] = r;
      byQuestion.set(r.question_id, entry);
    }

    const { data: evidenceRows } = await admin
      .from("evidence_images")
      .select("question_id, ai_description")
      .eq("submission_id", submissionId);
    const evidenceByQuestion = new Map<string, { ai_description: string | null }>();
    for (const e of evidenceRows ?? []) evidenceByQuestion.set(e.question_id, { ai_description: e.ai_description ?? null });

    const bucketFallback = process.env.SUPABASE_RECORDINGS_BUCKET || "student-recordings";
    let attempted = 0;
    let scored = 0;
    let errorCount = 0;
    let firstError: string | null = null;

    const loadTranscript = async (
      resp: (typeof responses)[number],
      questionId: string,
      optional = false,
    ): Promise<string | null> => {
      let transcript = resp.transcript ?? "";
      if (transcript.trim()) return transcript;

      const bucket = resp.storage_bucket || bucketFallback;
      const { data: file, error: dlError } = await admin.storage.from(bucket).download(resp.storage_path);
      if (dlError) {
        if (optional) return null;
        throw dlError;
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = resp.mime_type || "audio/webm";
      try {
        transcript = await transcribeAudio(buf, mime, {
          operation: "transcription",
          assessmentId: submission.assessment_id,
          studentId: submission.student_id,
          submissionId,
          questionId,
          audioDurationSeconds: resp.duration_seconds ?? null,
        });
        await admin.from("submission_responses").update({ transcript }).eq("id", resp.id);
        return transcript;
      } catch (e) {
        if (optional) return null;
        throw e;
      }
    };

    for (const q of questions ?? []) {
      const respSet = byQuestion.get(q.id);
      const primaryResp = respSet?.primary ?? null;
      if (!primaryResp) continue;
      attempted += 1;

      let transcript = "";
      try {
        const primaryTranscript = await loadTranscript(primaryResp, q.id);
        transcript = primaryTranscript ?? "";
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Transcription failed.";
        console.error("Transcription failed", { submissionId, questionId: q.id }, e);
        errorCount += 1;
        firstError ??= msg;
        continue;
      }

      let followupPrompt =
        typeof primaryResp.ai_followup_question === "string" ? primaryResp.ai_followup_question.trim() : "";
      if (isAudioFollowup(q.question_type)) {
        const followupResp = respSet?.followup ?? null;
        if (followupResp) {
          try {
            const followupTranscript = await loadTranscript(followupResp, q.id, true);
            if (followupTranscript) {
              transcript = `Primary response:\n${transcript}\n\nFollow-up response:\n${followupTranscript}`;
            }
          } catch {
            // Best-effort follow-up transcription.
          }
        }
      }

      const scoringTranscript = stripPauseMarkers(transcript);

      if (!scoringTranscript.trim()) {
        errorCount += 1;
        firstError ??= "Empty transcript.";
        continue;
      }

      let primary: Awaited<ReturnType<typeof scoreWithOpenAi>>;
      try {
        let questionText = q.question_text;
        if (isAudioFollowup(q.question_type) && followupPrompt) {
          questionText = `${questionText}\n\nFollow-up prompt:\n${followupPrompt}`.trim();
        }
        if (isEvidenceFollowup(q.question_type)) {
          const evidence = evidenceByQuestion.get(q.id);
          const followups = parseEvidenceFollowups(evidence?.ai_description ?? null);
          if (followups) {
            const summary = followups.summary ? `Evidence summary:\n${followups.summary}\n\n` : "";
            const bullets = followups.questions.length
              ? `Evidence follow-up questions:\n${followups.questions.map((item) => `- ${item}`).join("\n")}\n\n`
              : "";
            if (summary || bullets) {
              questionText = `${q.question_text}\n\n${summary}${bullets}`.trim();
            }
          }
        }
        if (process.env.OPENAI_API_KEY) {
          primary = await scoreWithOpenAi({
            questionText,
            transcript: scoringTranscript,
            rubricReasoning,
            rubricEvidence,
            context: {
              operation: "student_evaluation",
              assessmentId: submission.assessment_id,
              studentId: submission.student_id,
              submissionId,
              questionId: q.id,
            },
          });
        } else {
          if (!isGeminiEnabled()) {
            throw new Error(
              "Scoring is not configured. Set OPENAI_API_KEY (recommended), or enable Gemini by setting ENABLE_GEMINI=1 and GOOGLE_API_KEY (AI Studio key).",
            );
          }
          primary = await scoreWithGemini({
            questionText: q.question_text,
            transcript: scoringTranscript,
            rubricReasoning,
            rubricEvidence,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Scoring failed.";
        console.error("Scoring failed", { submissionId, questionId: q.id }, e);
        errorCount += 1;
        firstError ??= msg;
        continue;
      }

      let final = primary;
      if (
        isGeminiEnabled() &&
        (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY)
      ) {
        try {
          const reviewModel = process.env.GEMINI_REVIEW_MODEL || "gemini-2.5-flash";
          const system =
            "You are a strict grading reviewer. Return ONLY JSON: reasoning{score,justification}, evidence{score,justification}. Scores are integers 1-5.";
          const user = `Review the following grading and correct if needed.

Question:
${q.question_text}

Student transcript:
${transcript}

Reasoning rubric instructions:
${rubricReasoning}

Evidence rubric instructions:
${rubricEvidence}

Primary (OpenAI) scoring:
${JSON.stringify(primary)}

Rules:
- If you agree, keep the same scores.
- If you disagree, adjust scores and explain why, quoting transcript specifics.
- Keep justifications concise.`;

          const reviewJson = await geminiGenerateJson(reviewModel, system, [{ text: user }]);
          const review = parseScoreOutput(reviewJson);
          final = reconcile(primary, review);
        } catch (e) {
          console.error("Gemini review failed", { submissionId, questionId: q.id }, e);
        }
      }

      await admin.from("question_scores").upsert(
        [
          {
            submission_id: submissionId,
            question_id: q.id,
            scorer_type: "reasoning",
            score: final.reasoning.score,
            justification: final.reasoning.justification,
          },
          {
            submission_id: submissionId,
            question_id: q.id,
            scorer_type: "evidence",
            score: final.evidence.score,
            justification: final.evidence.justification,
          },
        ],
        { onConflict: "submission_id,question_id,scorer_type" },
      );
      scored += 1;
    }

    if (!attempted) throw new Error("No recordings found for this submission.");
    if (scored === 0) throw new Error(firstError ?? "Scoring failed for all questions.");

    if (errorCount > 0) {
      await admin
        .from("submissions")
        .update({
          scoring_status: "error",
          scoring_error: `${errorCount} question(s) failed during transcription/scoring. ${firstError ?? ""}`.trim().slice(0, 800),
        })
        .eq("id", submissionId);
      return;
    }

    await admin
      .from("submissions")
      .update({ scoring_status: "complete", scored_at: new Date().toISOString(), scoring_error: null })
      .eq("id", submissionId);
  } catch (e) {
    await admin
      .from("submissions")
      .update({
        scoring_status: "error",
        scoring_error: e instanceof Error ? e.message.slice(0, 800) : "Scoring failed.",
      })
      .eq("id", submissionId);
    throw e;
  }
}
