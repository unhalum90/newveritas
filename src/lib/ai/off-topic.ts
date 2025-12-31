import { logOpenAiCall, logOpenAiError } from "@/lib/ops/api-logging";

type OffTopicContext = {
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

export async function detectOffTopic(input: {
  questionText: string;
  transcript: string;
  context?: OffTopicContext;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_OFF_TOPIC_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini-2024-07-18";
  const startedAt = Date.now();

  const system =
    "You are a strict evaluator. Return ONLY JSON with keys: off_topic (boolean) and confidence (number 0-1).";
  const user = `Question:
${input.questionText}

Student transcript:
${input.transcript}

Is the response completely off-topic?`;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
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
      operation: "off_topic_detection",
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
  const usage = data?.usage;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI request failed.";
    await logOpenAiError({
      model,
      route: "/v1/chat/completions",
      statusCode: res.status,
      latencyMs: Date.now() - startedAt,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      operation: "off_topic_detection",
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
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    operation: "off_topic_detection",
    assessmentId: input.context?.assessmentId,
    studentId: input.context?.studentId,
    submissionId: input.context?.submissionId,
    questionId: input.context?.questionId,
  });

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  try {
    const parsed = JSON.parse(content) as { off_topic?: unknown; confidence?: unknown };
    return {
      offTopic: parsed.off_topic === true,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
    };
  } catch {
    return null;
  }
}
