import { z } from "zod";

import { logOpenAiError } from "@/lib/ops/api-logging";

const aiOutputSchema = z.object({
  title: z.string().min(1).max(100),
  subject: z.string().min(1).max(50).nullable().optional(),
  target_language: z.string().min(1).max(50).nullable().optional(),
  instructions: z.string().min(1).max(500).nullable().optional(),
  image_prompt: z.string().min(1).max(400).nullable().optional(),
  questions: z
    .array(
      z.object({
        question_text: z.string().min(1).max(500),
        question_type: z.string().max(50).nullable().optional(),
      }),
    )
    .min(1)
    .max(5),
  rubrics: z.object({
    reasoning: z.string().min(1).max(500),
    evidence: z.string().min(1).max(500),
  }),
});

export type AssessmentDraft = z.infer<typeof aiOutputSchema>;

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}.`);
  return v;
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  const out: string[] = [];
  for (const v of values) {
    const s = v?.trim();
    if (!s) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function isLikelyModelAccessError(message: string, code?: string | null) {
  if (code === "model_not_found") return true;
  const m = message.toLowerCase();
  return m.includes("does not have access to model") || m.includes("model_not_found");
}

function normalizeAiDraftJson(input: unknown) {
  const obj = input && typeof input === "object" ? (input as Record<string, unknown>) : null;
  if (!obj) return input;

  const coerceText = (value: unknown): string | null => {
    if (typeof value === "string") {
      const s = value.trim();
      return s ? s : null;
    }
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    const candidates = [v.instructions, v.text, v.prompt, v.rubric, v.description, v.content, v.guidance, v.criteria];
    for (const c of candidates) {
      if (typeof c === "string") {
        const s = c.trim();
        if (s) return s;
      }
      if (Array.isArray(c)) {
        const parts = c
          .filter((x) => typeof x === "string")
          .map((x) => (x as string).trim())
          .filter(Boolean);
        if (parts.length) return parts.join("\n");
      }
    }
    return null;
  };

  const title = obj.title ?? obj.name ?? obj.assessment_title ?? obj.assessmentName;
  const subject = obj.subject ?? obj.topic ?? null;
  const target_language = obj.target_language ?? obj.targetLanguage ?? obj.language ?? null;
  const instructions = obj.instructions ?? obj.student_instructions ?? obj.studentInstructions ?? null;
  const image_prompt = obj.image_prompt ?? obj.imagePrompt ?? obj.visual_prompt ?? obj.visualPrompt ?? null;

  const rawQuestionsCandidate = obj.questions ?? obj.question_bank ?? obj.questionBank ?? obj.items ?? null;
  let rawQuestionsList: unknown[] | null = null;
  if (Array.isArray(rawQuestionsCandidate)) {
    rawQuestionsList = rawQuestionsCandidate;
  } else if (rawQuestionsCandidate && typeof rawQuestionsCandidate === "object") {
    const asObj = rawQuestionsCandidate as Record<string, unknown>;
    const keys = Object.keys(asObj);
    const looksNumeric = keys.every((k) => /^\d+$/.test(k));
    const ordered = looksNumeric ? keys.sort((a, b) => Number(a) - Number(b)) : keys.sort();
    rawQuestionsList = ordered.map((k) => asObj[k]);
  } else {
    const extracted: Array<{ idx: number; value: unknown }> = [];
    for (const [k, v] of Object.entries(obj)) {
      const m = k.match(/^(?:question|q)[_ ]?(\d+)$/i);
      if (!m) continue;
      const idx = Number(m[1]);
      if (!Number.isFinite(idx)) continue;
      extracted.push({ idx, value: v });
    }
    if (extracted.length) rawQuestionsList = extracted.sort((a, b) => a.idx - b.idx).map((x) => x.value);
  }

  const questions = Array.isArray(rawQuestionsList)
    ? rawQuestionsList
        .map((q): { question_text: unknown; question_type?: unknown } | null => {
          if (typeof q === "string") return { question_text: q };
          if (!q || typeof q !== "object") return null;
          const qo = q as Record<string, unknown>;
          const question_text = qo.question_text ?? qo.questionText ?? qo.text ?? qo.question ?? qo.prompt ?? qo.content ?? qo.stem;
          const question_type = qo.question_type ?? qo.questionType ?? qo.type ?? qo.kind;
          return { question_text, question_type };
        })
        .filter(Boolean)
    : rawQuestionsCandidate;

  let rubrics: unknown = obj.rubrics;
  if (!rubrics || typeof rubrics !== "object") {
    const reasoning =
      obj.reasoning ??
      obj.reasoning_rubric ??
      obj.reasoningRubric ??
      obj.logic_rubric ??
      obj.logicRubric ??
      obj.scorer_reasoning ??
      obj.scorerReasoning;
    const evidence =
      obj.evidence ??
      obj.evidence_rubric ??
      obj.evidenceRubric ??
      obj.factual_rubric ??
      obj.factualRubric ??
      obj.scorer_evidence ??
      obj.scorerEvidence;
    if (typeof reasoning === "string" || typeof evidence === "string") {
      rubrics = {
        reasoning: coerceText(reasoning) ?? "",
        evidence: coerceText(evidence) ?? "",
      };
    }
  }

  if (Array.isArray(rubrics)) {
    const next: Record<string, string> = {};
    for (const r of rubrics) {
      if (!r || typeof r !== "object") continue;
      const ro = r as Record<string, unknown>;
      const t = ro.rubric_type ?? ro.rubricType ?? ro.type;
      const text = coerceText(ro.instructions ?? ro.text ?? ro.prompt);
      if (typeof t === "string" && typeof text === "string") next[t] = text;
    }
    rubrics = {
      reasoning: next.reasoning ?? next.logic ?? "",
      evidence: next.evidence ?? next.factual ?? "",
    };
  }

  if (rubrics && typeof rubrics === "object" && !Array.isArray(rubrics)) {
    const r = rubrics as Record<string, unknown>;
    rubrics = {
      reasoning: coerceText(r.reasoning ?? r.logic) ?? "",
      evidence: coerceText(r.evidence ?? r.factual) ?? "",
    };
  }

  return { title, subject, target_language, instructions, image_prompt, questions, rubrics };
}

function parseAndValidateAiJson(text: string, expectedQuestionCount?: number) {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    const extracted = extractFirstJsonObject(text);
    if (!extracted) throw new Error("AI output was not valid JSON.");
    parsedJson = JSON.parse(extracted);
  }

  const normalized = normalizeAiDraftJson(parsedJson);
  const parsed = aiOutputSchema.safeParse(normalized);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join(" • ");
    throw new Error(`AI output was not in the expected format. ${issues}`);
  }

  if (expectedQuestionCount && parsed.data.questions.length !== expectedQuestionCount) {
    if (parsed.data.questions.length > expectedQuestionCount) {
      parsed.data.questions = parsed.data.questions.slice(0, expectedQuestionCount);
    } else {
      throw new Error(
        `AI output did not include the requested number of questions. Expected ${expectedQuestionCount}, got ${parsed.data.questions.length}.`,
      );
    }
  }

  return parsed.data;
}

async function openAiJsonWithModel(prompt: string, questionCount: number, model: string) {
  const apiKey = requireEnv("OPENAI_API_KEY");

  const schema = `{
  "title": "string",
  "subject": "string|null",
  "target_language": "string|null",
  "instructions": "string|null",
  "image_prompt": "string|null",
  "questions": [{"question_text":"string","question_type":"string|null"}],
  "rubrics": {"reasoning":"string","evidence":"string"}
}`;

  const system = `You generate drafts for an oral assessment builder.
Return ONLY JSON (no markdown, no code fences) matching this schema exactly:
${schema}

Hard rules:
- "questions" MUST be an array of objects, never an object/dict.
- Each question MUST have "question_text" as a non-empty string.
- "rubrics.reasoning" and "rubrics.evidence" MUST be plain strings (not objects/arrays).`;

  const user = `Teacher request:
${prompt}

Generate exactly ${questionCount} questions.
Question types should be short identifiers like "open_response" unless the teacher specifies otherwise.
Target language is optional; if not specified return null.
Subject is optional; if not specified return null.
Instructions should be student-facing and <= 500 characters.`;

  async function callOpenAi(messages: Array<{ role: "system" | "user"; content: string }>) {
    const startedAt = Date.now();
    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model, response_format: { type: "json_object" }, messages }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await logOpenAiError({
        model,
        route: "/v1/chat/completions",
        statusCode: null,
        latencyMs: Date.now() - startedAt,
        metadata: { error: message },
      });
      throw error;
    }

    const data = (await res.json().catch(() => null)) as
      | {
          error?: { message?: unknown; code?: unknown };
          choices?: Array<{ message?: { content?: unknown } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        }
      | null;
    const usage = data?.usage;

    if (!res.ok) {
      const msg = typeof data?.error?.message === "string" ? data.error.message : "OpenAI request failed.";
      const code = typeof data?.error?.code === "string" ? data.error.code : null;
      const err = new Error(msg) as Error & { code?: string | null };
      err.code = code;
      await logOpenAiError({
        model,
        route: "/v1/chat/completions",
        statusCode: res.status,
        latencyMs: Date.now() - startedAt,
        promptTokens: usage?.prompt_tokens ?? null,
        completionTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        metadata: { error: msg, code },
      });
      throw err;
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("OpenAI returned empty response.");
    return text;
  }

  const initialText = await callOpenAi([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  try {
    return parseAndValidateAiJson(initialText, questionCount);
  } catch {
    const repairText = await callOpenAi([
      {
        role: "system",
        content: `Fix the following JSON so it matches this schema EXACTLY:
${schema}
Return ONLY JSON.`,
      },
      {
        role: "user",
        content: `Original JSON:
${initialText}

Constraints:
- Keep the original intent/content.
- Ensure exactly ${questionCount} questions.
- Ensure rubrics.reasoning and rubrics.evidence are strings.`,
      },
    ]);
    return parseAndValidateAiJson(repairText, questionCount);
  }
}

export async function generateAssessmentDraftFromPrompt(prompt: string, questionCount: number) {
  const models = uniqueStrings([process.env.OPENAI_TEXT_MODEL, process.env.OPENAI_SCORE_MODEL, "gpt-5-mini-2025-08-07", "gpt-4o", "gpt-4o-mini"]);
  let lastError: unknown = null;

  for (const model of models) {
    try {
      return await openAiJsonWithModel(prompt, questionCount, model);
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
