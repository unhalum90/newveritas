import { logOpenAiCall, logOpenAiError } from "@/lib/ops/api-logging";

type FollowupContext = {
  assessmentId?: string | null;
  studentId?: string | null;
  submissionId?: string | null;
  questionId?: string | null;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (v) return v;
  throw new Error(`Missing ${name}.`);
}

export async function transcribeAudioForFollowup(input: {
  audio: Buffer;
  mimeType: string;
  context?: FollowupContext;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";
  const startedAt = Date.now();

  const form = new FormData();
  const ext =
    input.mimeType.includes("webm")
      ? "webm"
      : input.mimeType.includes("mpeg")
        ? "mp3"
        : input.mimeType.includes("wav")
          ? "wav"
          : "bin";
  const filename = `audio.${ext}`;

  form.append("model", model);
  form.append("file", new Blob([new Uint8Array(input.audio)], { type: input.mimeType }), filename);

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
      operation: "audio_followup_transcription",
      assessmentId: input.context?.assessmentId,
      studentId: input.context?.studentId,
      submissionId: input.context?.submissionId,
      questionId: input.context?.questionId,
      metadata: { error: message },
    });
    return null;
  }

  const data = (await res.json().catch(() => null)) as { error?: { message?: unknown }; text?: unknown } | null;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI transcription failed.";
    await logOpenAiError({
      model,
      route: "/v1/audio/transcriptions",
      statusCode: res.status,
      latencyMs: Date.now() - startedAt,
      operation: "audio_followup_transcription",
      assessmentId: input.context?.assessmentId,
      studentId: input.context?.studentId,
      submissionId: input.context?.submissionId,
      questionId: input.context?.questionId,
      metadata: { error: msg },
    });
    return null;
  }

  await logOpenAiCall({
    model,
    route: "/v1/audio/transcriptions",
    statusCode: res.status,
    latencyMs: Date.now() - startedAt,
    operation: "audio_followup_transcription",
    assessmentId: input.context?.assessmentId,
    studentId: input.context?.studentId,
    submissionId: input.context?.submissionId,
    questionId: input.context?.questionId,
  });

  const transcript = typeof data?.text === "string" ? data.text.trim() : "";
  return transcript || null;
}

export async function generateAudioFollowup(input: {
  questionText: string;
  transcript: string;
  context?: FollowupContext;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_FOLLOWUP_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini-2024-07-18";
  const startedAt = Date.now();

  const system =
    "You are a Socratic tutor. Return ONLY JSON with key: question (string). Ask one concise follow-up question.";
  const user = `Original prompt:
${input.questionText}

Student transcript:
${input.transcript}

Generate one follow-up question that probes reasoning or evidence.`;

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
      operation: "audio_followup_generation",
      assessmentId: input.context?.assessmentId,
      studentId: input.context?.studentId,
      submissionId: input.context?.submissionId,
      questionId: input.context?.questionId,
      metadata: { error: message },
    });
    return null;
  }

  const data = (await res.json().catch(() => null)) as
    | {
        error?: { message?: unknown };
        choices?: Array<{ message?: { content?: unknown } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }
    | null;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI request failed.";
    await logOpenAiError({
      model,
      route: "/v1/chat/completions",
      statusCode: res.status,
      latencyMs: Date.now() - startedAt,
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
      totalTokens: data?.usage?.total_tokens,
      operation: "audio_followup_generation",
      assessmentId: input.context?.assessmentId,
      studentId: input.context?.studentId,
      submissionId: input.context?.submissionId,
      questionId: input.context?.questionId,
      metadata: { error: msg },
    });
    return null;
  }

  await logOpenAiCall({
    model,
    route: "/v1/chat/completions",
    statusCode: res.status,
    latencyMs: Date.now() - startedAt,
    promptTokens: data?.usage?.prompt_tokens,
    completionTokens: data?.usage?.completion_tokens,
    totalTokens: data?.usage?.total_tokens,
    operation: "audio_followup_generation",
    assessmentId: input.context?.assessmentId,
    studentId: input.context?.studentId,
    submissionId: input.context?.submissionId,
    questionId: input.context?.questionId,
  });

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  try {
    const parsed = JSON.parse(content) as { question?: unknown };
    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    return question || null;
  } catch {
    return null;
  }
}
