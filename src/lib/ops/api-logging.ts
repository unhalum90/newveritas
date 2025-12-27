import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LogInput = {
  model?: string | null;
  route: string;
  statusCode?: number | null;
  latencyMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  metadata?: Record<string, unknown> | null;
  operation?: string | null;
  assessmentId?: string | null;
  studentId?: string | null;
  teacherId?: string | null;
  schoolId?: string | null;
  submissionId?: string | null;
  questionId?: string | null;
  audioDurationSeconds?: number | null;
  status?: "success" | "error" | "timeout";
};

const ESTIMATED_USD_PER_TOKEN = 0.000001;
const WHISPER_USD_PER_MINUTE = 0.006;
const MODEL_COSTS_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.6 },
  "gpt-4o-mini-2025-08-07": { input: 0.15, output: 0.6 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

function estimateCostCents(input: Pick<LogInput, "model" | "promptTokens" | "completionTokens" | "totalTokens" | "audioDurationSeconds">) {
  const model = (input.model ?? "").toLowerCase();
  if (model.startsWith("whisper")) {
    if (typeof input.audioDurationSeconds !== "number" || input.audioDurationSeconds <= 0) return null;
    const costUsd = (input.audioDurationSeconds / 60) * WHISPER_USD_PER_MINUTE;
    return Math.round(costUsd * 100);
  }
  const prompt = input.promptTokens ?? 0;
  const completion = input.completionTokens ?? 0;
  const total = input.totalTokens ?? prompt + completion;
  if (!Number.isFinite(total) || total <= 0) return null;
  const modelCost = MODEL_COSTS_PER_MILLION[model];
  if (modelCost && Number.isFinite(prompt) && Number.isFinite(completion)) {
    const costUsd = (prompt / 1_000_000) * modelCost.input + (completion / 1_000_000) * modelCost.output;
    return Math.round(costUsd * 100);
  }
  return Math.round(total * ESTIMATED_USD_PER_TOKEN * 100);
}

function buildMetadata(input: LogInput) {
  const meta: Record<string, unknown> = { ...(input.metadata ?? {}) };
  if (input.operation) meta.operation = input.operation;
  if (input.status) meta.status = input.status;
  if (input.assessmentId) meta.assessment_id = input.assessmentId;
  if (input.studentId) meta.student_id = input.studentId;
  if (input.teacherId) meta.teacher_id = input.teacherId;
  if (input.schoolId) meta.school_id = input.schoolId;
  if (input.submissionId) meta.submission_id = input.submissionId;
  if (input.questionId) meta.question_id = input.questionId;
  if (typeof input.audioDurationSeconds === "number") meta.audio_duration_seconds = input.audioDurationSeconds;
  return Object.keys(meta).length ? meta : null;
}

export async function logOpenAiCall(input: LogInput) {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("api_logs").insert({
      provider: "openai",
      model: input.model ?? null,
      route: input.route,
      status_code: input.statusCode ?? null,
      latency_ms: input.latencyMs ?? null,
      prompt_tokens: input.promptTokens ?? null,
      completion_tokens: input.completionTokens ?? null,
      total_tokens: input.totalTokens ?? null,
      cost_cents: estimateCostCents(input),
      metadata: buildMetadata(input),
    });
  } catch {
    // Ignore logging failures to avoid breaking runtime flows.
  }
}

export async function logOpenAiError(input: LogInput) {
  await logOpenAiCall({ ...input, status: "error" });
}
