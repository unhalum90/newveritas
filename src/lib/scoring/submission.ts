import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

async function openaiGenerateJson(model: string, system: string, user: string) {
  const apiKey = requireEnv("OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = (await res.json().catch(() => null)) as
    | {
        error?: { message?: unknown };
        choices?: Array<{ message?: { content?: unknown } }>;
      }
    | null;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI request failed.";
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenAI returned empty response.");
  return JSON.parse(text) as unknown;
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
  const filename = `audio.${ext}`;

  form.append("model", model);
  form.append("file", new Blob([new Uint8Array(audioBytes)], { type: mimeType }), filename);

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

async function transcribeAudio(audioBytes: Buffer, mimeType: string) {
  // Prefer OpenAI for transcription (most reliable with API keys).
  if (process.env.OPENAI_API_KEY) return transcribeWithOpenAi(audioBytes, mimeType);

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

  const data = await openaiGenerateJson(model, system, user);
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
      .select("id, order_index, question_text")
      .eq("assessment_id", submission.assessment_id)
      .or(`submission_id.is.null,submission_id.eq.${submissionId}`)
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
      .select("id, question_id, storage_bucket, storage_path, mime_type, transcript")
      .eq("submission_id", submissionId);
    if (respError) throw respError;

    const byQuestion = new Map<string, (typeof responses)[number]>();
    for (const r of responses ?? []) byQuestion.set(r.question_id, r);

    const bucketFallback = process.env.SUPABASE_RECORDINGS_BUCKET || "student-recordings";
    let attempted = 0;
    let scored = 0;
    let errorCount = 0;
    let firstError: string | null = null;

    for (const q of questions ?? []) {
      const resp = byQuestion.get(q.id);
      if (!resp) continue;
      attempted += 1;

      let transcript = resp.transcript ?? "";
      if (!transcript) {
        const bucket = resp.storage_bucket || bucketFallback;
        const { data: file, error: dlError } = await admin.storage.from(bucket).download(resp.storage_path);
        if (dlError) throw dlError;
        const buf = Buffer.from(await file.arrayBuffer());
        const mime = resp.mime_type || "audio/webm";
        try {
          transcript = await transcribeAudio(buf, mime);
          await admin.from("submission_responses").update({ transcript }).eq("id", resp.id);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Transcription failed.";
          console.error("Transcription failed", { submissionId, questionId: q.id }, e);
          errorCount += 1;
          firstError ??= msg;
          continue;
        }
      }

      if (!transcript.trim()) {
        errorCount += 1;
        firstError ??= "Empty transcript.";
        continue;
      }

      let primary: Awaited<ReturnType<typeof scoreWithOpenAi>>;
      try {
        if (process.env.OPENAI_API_KEY) {
          primary = await scoreWithOpenAi({
            questionText: q.question_text,
            transcript,
            rubricReasoning,
            rubricEvidence,
          });
        } else {
          if (!isGeminiEnabled()) {
            throw new Error(
              "Scoring is not configured. Set OPENAI_API_KEY (recommended), or enable Gemini by setting ENABLE_GEMINI=1 and GOOGLE_API_KEY (AI Studio key).",
            );
          }
          primary = await scoreWithGemini({
            questionText: q.question_text,
            transcript,
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
