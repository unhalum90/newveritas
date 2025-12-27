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
};

const ESTIMATED_USD_PER_TOKEN = 0.000001;

function estimateCostCents(input: Pick<LogInput, "promptTokens" | "completionTokens" | "totalTokens">) {
  const prompt = input.promptTokens ?? 0;
  const completion = input.completionTokens ?? 0;
  const total = input.totalTokens ?? prompt + completion;
  if (!Number.isFinite(total) || total <= 0) return null;
  return Math.round(total * ESTIMATED_USD_PER_TOKEN * 100);
}

export async function logOpenAiError(input: LogInput) {
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
      metadata: input.metadata ?? null,
    });
  } catch {
    // Ignore logging failures to avoid breaking runtime flows.
  }
}
