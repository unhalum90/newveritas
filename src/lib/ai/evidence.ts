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
  images: Buffer[];
  mimeTypes?: string[];
  questionText?: string | null;
  context?: AnalysisContext;
}) {
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

  const system =
    "You are an expert educator analyzing student evidence (photos of notes, diagrams, or work). " +
    "Perform a deep visual analysis. Look for layouts, diagrams, handwriting patterns, and structural cues, not just text. " +
    "Identify specific visual elements present in the evidence. " +
    "Do NOT use first-person pronouns (I, me, my, we, us, our). Use passive or functional phrasing. " +
    "Return ONLY JSON with keys: summary (string) and questions (array of 2 strings). Keep questions short and probing.";

  const questionText = input.questionText?.trim();
  const userPrompt = questionText
    ? `Teacher prompt:\n${questionText}\n\nAnalyze the provided evidence and generate two follow-up questions.`
    : "Analyze the provided evidence and generate two follow-up questions.";

  const images = input.images;
  const mimeTypes = input.mimeTypes || images.map(() => "image/jpeg");

  const parts: any[] = [{ text: userPrompt }];
  images.forEach((buf, i) => {
    parts.push({
      inline_data: {
        mime_type: mimeTypes[i] || "image/jpeg",
        data: buf.toString("base64"),
      },
    });
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
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
