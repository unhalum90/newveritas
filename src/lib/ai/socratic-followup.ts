import { z } from "zod";

function requireEnv(name: string) {
  const v = process.env[name];
  if (typeof v === "string" && v.trim()) return v.trim();
  throw new Error(`Missing ${name}.`);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    const s = v.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

const followupSchema = z.object({
  question_text: z.string().min(1).max(600),
  question_type: z.string().optional().nullable(),
});

function parseFollowupJson(text: string) {
  const json = JSON.parse(text) as unknown;
  const parsed = followupSchema.safeParse(json);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

async function openAiJsonWithModel(prompt: string, model: string) {
  const apiKey = requireEnv("OPENAI_API_KEY");

  const schema = `{
  "question_text": "string",
  "question_type": "string|null"
}`;

  const system = `You generate a single Socratic follow-up question for an oral assessment.
Return ONLY JSON (no markdown, no code fences) matching this schema exactly:
${schema}

Hard rules:
- "question_text" MUST be a non-empty string.
- "question_type" MUST be a short identifier like "open_response" or null.
- Do not include extra keys.`;

  async function callOpenAi(messages: Array<{ role: "system" | "user"; content: string }>) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages,
      }),
    });

    const data = (await res.json().catch(() => null)) as
      | { error?: { message?: unknown; code?: unknown }; choices?: Array<{ message?: { content?: unknown } }> }
      | null;

    if (!res.ok) {
      const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI request failed.";
      const code = typeof data?.error?.code === "string" ? data.error.code : null;
      const err = new Error(msg) as Error & { code?: string | null };
      err.code = code;
      throw err;
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("OpenAI returned empty response.");
    return text;
  }

  const initialText = await callOpenAi([
    { role: "system", content: system },
    { role: "user", content: prompt },
  ]);

  try {
    return parseFollowupJson(initialText);
  } catch {
    const repairText = await callOpenAi([
      {
        role: "system",
        content: `Fix the following JSON so it matches this schema EXACTLY:
${schema}
Return ONLY JSON.`,
      },
      { role: "user", content: `Original JSON:\n${initialText}` },
    ]);
    return parseFollowupJson(repairText);
  }
}

function isLikelyModelAccessError(message: string, code: string | null) {
  const m = message.toLowerCase();
  if (code === "model_not_found") return true;
  return m.includes("does not have access") || m.includes("model_not_found") || m.includes("not found");
}

export async function generateSocraticFollowup(input: {
  assessmentTitle: string;
  assessmentInstructions: string | null;
  baseQuestionText: string;
  priorQuestionText?: string | null;
  transcript: string;
  priorTranscripts?: string[];
}) {
  const models = uniqueStrings([
    process.env.OPENAI_FOLLOWUP_MODEL,
    process.env.OPENAI_TEXT_MODEL,
    "gpt-5-mini-2025-08-07",
    "gpt-4o",
    "gpt-4o-mini",
  ]);

  const priorTranscriptBlock =
    input.priorTranscripts && input.priorTranscripts.length
      ? `\n\nEarlier transcript(s):\n${input.priorTranscripts.map((t, i) => `(${i + 1}) ${t}`).join("\n")}`
      : "";

  const prompt = `Context:
- Assessment title: ${input.assessmentTitle}
- Student instructions: ${input.assessmentInstructions ? input.assessmentInstructions : "(none)"}
- Base question: ${input.baseQuestionText}
- Prior question (if any): ${input.priorQuestionText ? input.priorQuestionText : "(none)"}

Student transcript (most recent response):
${input.transcript}${priorTranscriptBlock}

Task:
Generate ONE follow-up oral question that:
- is directly grounded in the student's transcript,
- forces specificity, reasoning, or evidence (not trivia),
- can be answered without outside research,
- is a single question (no multi-part lists),
- is concise (<= 2 sentences).

Return JSON with:
- question_text
- question_type (use \"open_response\" unless you have a better short identifier).`;

  let lastError: unknown = null;
  for (const model of models) {
    try {
      return await openAiJsonWithModel(prompt, model);
    } catch (e) {
      lastError = e;
      const message = e instanceof Error ? e.message : String(e);
      const code = (e as { code?: unknown } | null)?.code;
      if (typeof message === "string" && isLikelyModelAccessError(message, typeof code === "string" ? code : null)) {
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new Error("OpenAI request failed.");
}

