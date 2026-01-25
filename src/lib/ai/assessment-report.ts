import { z } from "zod";

import { logOpenAiCall, logOpenAiError } from "@/lib/ops/api-logging";

type OpenAiLogContext = {
  assessmentId?: string | null;
  teacherId?: string | null;
  classId?: string | null;
};

type EvidenceExcerpt = {
  excerpt_id: string;
  question_id: string;
  question_order: number;
  question_text: string;
  student_label: string;
  transcript_snippet: string;
};

const insightSchema = z.object({
  misconceptions: z
    .array(
      z.object({
        claim_id: z.string().min(1).max(64),
        claim: z.string().min(1).max(280),
        prevalence: z.number().min(0).max(1),
        confidence: z.enum(["high", "medium", "low"]),
        root_cause: z.string().max(400).nullable().optional(),
        teacher_explanation: z.string().min(1).max(400),
        evidence_refs: z.array(z.string().min(1)).min(1).max(6),
      }),
    )
    .max(5)
    .default([]),
  reasoning_patterns: z.object({
    summary: z.string().min(1).max(600),
    strengths: z.array(z.string().min(1).max(200)).max(6).default([]),
    gaps: z.array(z.string().min(1).max(200)).max(6).default([]),
  }),
  evidence_patterns: z.object({
    summary: z.string().min(1).max(600),
    strengths: z.array(z.string().min(1).max(200)).max(6).default([]),
    gaps: z.array(z.string().min(1).max(200)).max(6).default([]),
  }),
  engagement_indicators: z.object({
    summary: z.string().min(1).max(400),
    indicators: z.array(z.string().min(1).max(200)).max(6).default([]),
    note: z.string().min(1).max(300),
  }),
  question_effectiveness: z.object({
    summary: z.string().min(1).max(600),
    revisions: z
      .array(
        z.object({
          question_id: z.string().min(1),
          suggestion: z.string().min(1).max(300),
        }),
      )
      .max(10)
      .default([]),
  }),
  suggested_actions: z
    .array(
      z.object({
        action_id: z.string().min(1).max(64),
        category: z.enum(["whole_class", "small_group", "extension", "follow_up"]),
        action: z.string().min(1).max(280),
        estimated_minutes: z.number().int().min(0).max(120).nullable().optional(),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    )
    .max(6)
    .default([]),
});

export type AssessmentReportInsights = z.infer<typeof insightSchema>;

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

function sanitizeInsights(
  insights: AssessmentReportInsights,
  validExcerptIds: Set<string>,
  validQuestionIds: Set<string>,
) {
  const misconceptions = insights.misconceptions
    .map((m) => ({
      ...m,
      evidence_refs: m.evidence_refs.filter((id) => validExcerptIds.has(id)).slice(0, 6),
    }))
    .filter((m) => m.evidence_refs.length > 0);

  const questionRevisions = insights.question_effectiveness.revisions
    .filter((r) => validQuestionIds.has(r.question_id))
    .slice(0, 10);

  return {
    ...insights,
    misconceptions,
    question_effectiveness: {
      ...insights.question_effectiveness,
      revisions: questionRevisions,
    },
  };
}

export async function generateAssessmentReportInsights(input: {
  assessment: {
    title: string;
    subject: string | null;
    target_language: string | null;
    instructions: string | null;
  };
  rubrics: Array<{ rubric_type: string; instructions: string; scale_min: number; scale_max: number }>;
  metrics: {
    data_quality: Record<string, unknown>;
    rubric_distributions: Record<string, unknown>;
    question_effectiveness: Record<string, unknown>;
  };
  excerpts: EvidenceExcerpt[];
  context?: OpenAiLogContext;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.ANALYSIS_MODEL || "gpt-4o-mini-2024-07-18";
  const startedAt = Date.now();

  const schema = `{
  "misconceptions": [{
    "claim_id": "string",
    "claim": "string",
    "prevalence": 0.0,
    "confidence": "high|medium|low",
    "root_cause": "string|null",
    "teacher_explanation": "string",
    "evidence_refs": ["excerpt_id"]
  }],
  "reasoning_patterns": { "summary": "string", "strengths": ["string"], "gaps": ["string"] },
  "evidence_patterns": { "summary": "string", "strengths": ["string"], "gaps": ["string"] },
  "engagement_indicators": {
    "summary": "string",
    "indicators": ["string"],
    "note": "string"
  },
  "question_effectiveness": {
    "summary": "string",
    "revisions": [{ "question_id": "string", "suggestion": "string" }]
  },
  "suggested_actions": [{
    "action_id": "string",
    "category": "whole_class|small_group|extension|follow_up",
    "action": "string",
    "estimated_minutes": 0,
    "confidence": "high|medium|low"
  }]
}`;

  const system =
    "You are an instructional analysis assistant. Return ONLY JSON (no markdown) matching the schema. " +
    "Use evidence_refs with excerpt_id values provided. " +
    "Do not infer emotion, motivation, or attitude. " +
    "Do not name students. Use provided student labels only when necessary. " +
    "Do NOT use first-person pronouns (I, me, my, we, us, our) in any text fields. Use objective, professional language.";

  const payload = {
    assessment: input.assessment,
    rubrics: input.rubrics,
    metrics: input.metrics,
    excerpts: input.excerpts,
  };

  const user = `Use the following data to produce assessment-level insights.
Return JSON ONLY. Schema:
${schema}

Data:
${JSON.stringify(payload)}`;

  async function callOpenAi(phase: "generation" | "repair", prompt: string) {
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
            { role: "user", content: prompt },
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
        operation: "assessment_report",
        assessmentId: input.context?.assessmentId,
        teacherId: input.context?.teacherId,
        metadata: { phase, error: message },
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
        operation: "assessment_report",
        assessmentId: input.context?.assessmentId,
        teacherId: input.context?.teacherId,
        metadata: { phase, error: msg },
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
      operation: "assessment_report",
      assessmentId: input.context?.assessmentId,
      teacherId: input.context?.teacherId,
      status: "success",
      metadata: { phase },
    });

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("OpenAI returned empty response.");
    return content;
  }

  const initialText = await callOpenAi("generation", user);
  const validExcerptIds = new Set(input.excerpts.map((e) => e.excerpt_id));
  const validQuestionIds = new Set(input.excerpts.map((e) => e.question_id));

  function parse(text: string) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      const extracted = extractFirstJsonObject(text);
      if (!extracted) throw new Error("AI output was not valid JSON.");
      parsedJson = JSON.parse(extracted);
    }
    const parsed = insightSchema.safeParse(parsedJson);
    if (!parsed.success) throw parsed.error;
    return sanitizeInsights(parsed.data, validExcerptIds, validQuestionIds);
  }

  try {
    return { insights: parse(initialText), raw: initialText, model };
  } catch {
    const repairPrompt = `Fix the JSON to match the schema exactly. Return JSON only.
Schema:
${schema}

Original:
${initialText}`;
    const repairText = await callOpenAi("repair", repairPrompt);
    return { insights: parse(repairText), raw: repairText, model };
  }
}
