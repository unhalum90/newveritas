import { logOpenAiCall, logOpenAiError } from "@/lib/ops/api-logging";

export type EvidenceAnalysis = {
  summary: string;
  questions: string[];
};

type AnalysisContext = {
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

function parseAnalysis(raw: unknown): EvidenceAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const summary = (raw as { summary?: unknown }).summary;
  const questions = (raw as { questions?: unknown }).questions;
  const summaryText = typeof summary === "string" ? summary.trim() : "";
  const list = Array.isArray(questions) ? questions : [];
  const cleaned = list
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter((q) => q.length > 0)
    .slice(0, 2);
  if (!summaryText && cleaned.length === 0) return null;
  return {
    summary: summaryText || "Summary unavailable.",
    questions: cleaned.length ? cleaned : [],
  };
}

export async function analyzeEvidenceImage(input: {
  image: Buffer;
  questionText?: string | null;
  context?: AnalysisContext;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.ANALYSIS_MODEL || "gpt-4o-mini-2024-07-18";
  const startedAt = Date.now();

  const dataUrl = `data:image/jpeg;base64,${input.image.toString("base64")}`;
  const questionText = input.questionText?.trim();
  const prompt = questionText
    ? `Teacher prompt:\n${questionText}\n\nGenerate two follow-up questions about the evidence.`
    : "Generate two follow-up questions about the evidence.";
  const system =
    "You review a photo of student evidence. Return ONLY JSON with keys: summary (string) and questions (array of 2 strings). Keep questions short and specific.";

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
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
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
      operation: "evidence_analysis",
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
      operation: "evidence_analysis",
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
    operation: "evidence_analysis",
    assessmentId: input.context?.assessmentId,
    studentId: input.context?.studentId,
    submissionId: input.context?.submissionId,
    questionId: input.context?.questionId,
  });

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    return parseAnalysis(parsed);
  } catch {
    return null;
  }
}
