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
  mimeType?: string;
  questionText?: string | null;
  context?: AnalysisContext;
}) {
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

  const system =
    "You review a student evidence file (photo or PDF). Return ONLY JSON with keys: summary (string) and questions (array of 2 strings). Keep questions short and specific.";

  const questionText = input.questionText?.trim();
  const userPrompt = questionText
    ? `Teacher prompt:\n${questionText}\n\nGenerate two follow-up questions about the evidence.`
    : "Generate two follow-up questions about the evidence.";

  const mimeType = input.mimeType || "image/jpeg";
  const b64 = input.image.toString("base64");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{
          role: "user",
          parts: [
            { text: userPrompt },
            { inline_data: { mime_type: mimeType, data: b64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      throw new Error(data?.error?.message ?? "Gemini evidence analysis failed.");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) return null;

    const parsed = JSON.parse(text) as unknown;
    return parseAnalysis(parsed);
  } catch (error) {
    console.error("Gemini evidence analysis failed", error);
    return null;
  }
}
