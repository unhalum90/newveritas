"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReportPayload = {
  id: string;
  status: string;
  generated_at: string;
  student_count: number | null;
  completion_rate: number | null;
  avg_reasoning_score: number | null;
  avg_evidence_score: number | null;
  avg_response_length_words: number | null;
  data_quality: Record<string, unknown> | null;
  misconceptions?: unknown;
  reasoning_patterns?: unknown;
  evidence_patterns?: unknown;
  engagement_indicators?: unknown;
  question_effectiveness?: unknown;
  suggested_actions?: unknown;
  evidence_index?: unknown;
  ai_model_version?: string | null;
  report_version: number | null;
  processing_time_seconds: number | null;
};

type ReportResponse = {
  report: ReportPayload | null;
  stale?: boolean;
  error?: string;
};

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number") return "N/A";
  return value.toFixed(digits);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asObjectArray<T>(value: unknown, guard: (v: unknown) => boolean): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(guard) as T[];
}

export function AssessmentReportPanel({ assessmentId }: { assessmentId: string }) {
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/report`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as ReportResponse | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to load report.");
      setReport(data?.report ?? null);
      setStale(Boolean(data?.stale));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  const dataQuality = useMemo(() => (isRecord(report?.data_quality) ? report?.data_quality : null), [report]);
  const warnings = useMemo(() => asStringArray(dataQuality?.warnings), [dataQuality]);
  const qualityLevel = dataQuality?.quality_level === "limited" ? "LIMITED" : "GOOD";
  const llmMode = typeof dataQuality?.llm_mode === "string" ? dataQuality.llm_mode : null;

  const misconceptions = useMemo(() => {
    type Item = {
      claim_id: string;
      claim: string;
      prevalence: number;
      confidence: string;
      root_cause?: string | null;
      teacher_explanation: string;
      evidence_refs: string[];
    };
    return asObjectArray<Item>(report?.misconceptions, (entry) => {
      if (!isRecord(entry)) return false;
      return (
        typeof entry.claim_id === "string" &&
        typeof entry.claim === "string" &&
        typeof entry.teacher_explanation === "string" &&
        Array.isArray(entry.evidence_refs)
      );
    });
  }, [report?.misconceptions]);

  const reasoningPatterns = useMemo(() => {
    if (!isRecord(report?.reasoning_patterns)) return null;
    return report?.reasoning_patterns as Record<string, unknown>;
  }, [report?.reasoning_patterns]);

  const evidencePatterns = useMemo(() => {
    if (!isRecord(report?.evidence_patterns)) return null;
    return report?.evidence_patterns as Record<string, unknown>;
  }, [report?.evidence_patterns]);

  const engagementIndicators = useMemo(() => {
    if (!isRecord(report?.engagement_indicators)) return null;
    return report?.engagement_indicators as Record<string, unknown>;
  }, [report?.engagement_indicators]);

  const questionEffectiveness = useMemo(() => {
    if (!isRecord(report?.question_effectiveness)) return null;
    const base = report?.question_effectiveness as Record<string, unknown>;
    if (isRecord(base.narrative)) {
      return {
        summary: base.narrative.summary,
        revisions: Array.isArray(base.narrative.revisions) ? base.narrative.revisions : [],
      };
    }
    return base;
  }, [report?.question_effectiveness]);

  const suggestedActions = useMemo(() => {
    type Item = {
      action_id: string;
      category: string;
      action: string;
      estimated_minutes?: number | null;
      confidence: string;
    };
    return asObjectArray<Item>(report?.suggested_actions, (entry) => {
      if (!isRecord(entry)) return false;
      return typeof entry.action_id === "string" && typeof entry.action === "string";
    });
  }, [report?.suggested_actions]);

  const evidenceIndex = useMemo(() => {
    if (!isRecord(report?.evidence_index)) return null;
    const excerpts = isRecord(report.evidence_index)
      ? asObjectArray<Record<string, unknown>>(report.evidence_index.excerpts, (entry) => isRecord(entry))
      : [];
    const byId = new Map<string, Record<string, unknown>>();
    for (const row of excerpts) {
      if (typeof row.excerpt_id === "string") byId.set(row.excerpt_id, row);
    }
    return { excerpts, byId };
  }, [report?.evidence_index]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/generate-report`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Report generation failed.");
      await loadLatest();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Assessment Report</CardTitle>
          <CardDescription>Class-level insights for this assessment.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] text-[var(--muted)]">
            {report ? `V${report.report_version ?? 1}` : "NO REPORT"}
          </div>
          <Button type="button" variant="secondary" onClick={handleGenerate} disabled={generating}>
            {report ? "Regenerate" : "Generate Report"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <div className="text-sm text-[var(--muted)]">Loading report...</div> : null}
        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
        {!loading && !report ? (
          <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.4)] p-4 text-sm text-[var(--muted)]">
            Generate a class report to see rubric distributions, question effectiveness, and action-ready
            patterns.
          </div>
        ) : null}
        {report ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span>Data quality: {qualityLevel}</span>
              {llmMode ? <span> - LLM mode: {llmMode.replace("_", " ")}</span> : null}
              {stale ? <span className="text-[var(--danger)]"> - Scores updated since report</span> : null}
            </div>
            {warnings.length ? (
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-3 text-xs text-[var(--muted)]">
                {warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-3">
                <div className="text-xs text-[var(--muted)]">Completion rate</div>
                <div className="mt-1 text-lg font-semibold text-[var(--text)]">
                  {formatPercent(report.completion_rate)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-3">
                <div className="text-xs text-[var(--muted)]">Avg reasoning score</div>
                <div className="mt-1 text-lg font-semibold text-[var(--text)]">
                  {formatNumber(report.avg_reasoning_score)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-3">
                <div className="text-xs text-[var(--muted)]">Avg evidence score</div>
                <div className="mt-1 text-lg font-semibold text-[var(--text)]">
                  {formatNumber(report.avg_evidence_score)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-3">
                <div className="text-xs text-[var(--muted)]">Avg response length</div>
                <div className="mt-1 text-lg font-semibold text-[var(--text)]">
                  {report.avg_response_length_words ?? "N/A"} words
                </div>
              </div>
            </div>
            <div className="text-xs text-[var(--muted)]">
              Generated {new Date(report.generated_at).toLocaleString()}
              {typeof report.processing_time_seconds === "number"
                ? ` - ${Math.round(report.processing_time_seconds)}s`
                : ""}
              {report.ai_model_version ? ` - ${report.ai_model_version}` : ""}
            </div>

            {llmMode === "metrics_only" ? (
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-3 text-xs text-[var(--muted)]">
                Advanced insights are unavailable due to data quality thresholds. Add more submissions or
                transcripts and regenerate.
              </div>
            ) : null}

            {misconceptions.length ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text)]">Misconceptions</div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {misconceptions.map((m) => {
                    const prevalence = Math.round(m.prevalence * 100);
                    const confidence = m.confidence?.toUpperCase?.() ?? "LOW";
                    return (
                      <div
                        key={m.claim_id}
                        className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-4 text-sm text-[var(--muted)]"
                      >
                        <div className="text-sm font-semibold text-[var(--text)]">{m.claim}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Prevalence: {Number.isFinite(prevalence) ? `${prevalence}%` : "N/A"} - Confidence: {confidence}
                        </div>
                        <div className="mt-2 text-sm text-[var(--muted)]">{m.teacher_explanation}</div>
                        {m.root_cause ? (
                          <div className="mt-2 text-xs text-[var(--muted)]">Root cause: {m.root_cause}</div>
                        ) : null}
                        {evidenceIndex && m.evidence_refs?.length ? (
                          <details className="mt-3 text-xs text-[var(--muted)]">
                            <summary className="cursor-pointer">View evidence</summary>
                            <div className="mt-2 space-y-2">
                              {m.evidence_refs.map((id) => {
                                const excerpt = evidenceIndex.byId.get(id);
                                if (!excerpt) return null;
                                const order = asNumber(excerpt.question_order);
                                const label = typeof excerpt.student_label === "string" ? excerpt.student_label : "Student";
                                const snippet =
                                  typeof excerpt.transcript_snippet === "string" ? excerpt.transcript_snippet : "";
                                return (
                                  <div key={id} className="rounded-md border border-white/10 p-2">
                                    <div className="text-[var(--muted)]">
                                      {order ? `Q${order}` : "Question"} - {label}
                                    </div>
                                    <div className="mt-1 text-[var(--text)]">{snippet}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {reasoningPatterns || evidencePatterns ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {reasoningPatterns ? (
                  <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-4 text-sm text-[var(--muted)]">
                    <div className="text-sm font-semibold text-[var(--text)]">Reasoning patterns</div>
                    {typeof reasoningPatterns.summary === "string" ? (
                      <div className="mt-2">{reasoningPatterns.summary}</div>
                    ) : null}
                    {Array.isArray(reasoningPatterns.strengths) && reasoningPatterns.strengths.length ? (
                      <div className="mt-2">
                        <div className="text-xs text-[var(--muted)]">Strengths</div>
                        <div className="mt-1 space-y-1">
                          {reasoningPatterns.strengths
                            .filter((s: unknown): s is string => typeof s === "string")
                            .map((s: string) => (
                              <div key={s}>- {s}</div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    {Array.isArray(reasoningPatterns.gaps) && reasoningPatterns.gaps.length ? (
                      <div className="mt-2">
                        <div className="text-xs text-[var(--muted)]">Gaps</div>
                        <div className="mt-1 space-y-1">
                          {reasoningPatterns.gaps
                            .filter((s: unknown): s is string => typeof s === "string")
                            .map((s: string) => (
                              <div key={s}>- {s}</div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {evidencePatterns ? (
                  <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-4 text-sm text-[var(--muted)]">
                    <div className="text-sm font-semibold text-[var(--text)]">Evidence patterns</div>
                    {typeof evidencePatterns.summary === "string" ? (
                      <div className="mt-2">{evidencePatterns.summary}</div>
                    ) : null}
                    {Array.isArray(evidencePatterns.strengths) && evidencePatterns.strengths.length ? (
                      <div className="mt-2">
                        <div className="text-xs text-[var(--muted)]">Strengths</div>
                        <div className="mt-1 space-y-1">
                          {evidencePatterns.strengths
                            .filter((s: unknown): s is string => typeof s === "string")
                            .map((s: string) => (
                              <div key={s}>- {s}</div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    {Array.isArray(evidencePatterns.gaps) && evidencePatterns.gaps.length ? (
                      <div className="mt-2">
                        <div className="text-xs text-[var(--muted)]">Gaps</div>
                        <div className="mt-1 space-y-1">
                          {evidencePatterns.gaps
                            .filter((s: unknown): s is string => typeof s === "string")
                            .map((s: string) => (
                              <div key={s}>- {s}</div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {engagementIndicators ? (
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-4 text-sm text-[var(--muted)]">
                <div className="text-sm font-semibold text-[var(--text)]">Engagement indicators</div>
                {typeof engagementIndicators.summary === "string" ? (
                  <div className="mt-2">{engagementIndicators.summary}</div>
                ) : null}
                {Array.isArray(engagementIndicators.indicators) && engagementIndicators.indicators.length ? (
                  <div className="mt-2 space-y-1">
                    {engagementIndicators.indicators
                      .filter((s: unknown): s is string => typeof s === "string")
                      .map((s: string) => (
                        <div key={s}>- {s}</div>
                      ))}
                  </div>
                ) : null}
                {typeof engagementIndicators.note === "string" ? (
                  <div className="mt-2 text-xs text-[var(--muted)]">{engagementIndicators.note}</div>
                ) : null}
              </div>
            ) : null}

            {questionEffectiveness ? (
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-4 text-sm text-[var(--muted)]">
                <div className="text-sm font-semibold text-[var(--text)]">Question effectiveness</div>
                {typeof questionEffectiveness.summary === "string" ? (
                  <div className="mt-2">{questionEffectiveness.summary}</div>
                ) : null}
                {Array.isArray(questionEffectiveness.revisions) && questionEffectiveness.revisions.length ? (
                  <div className="mt-2 space-y-2">
                    {questionEffectiveness.revisions
                      .filter(
                        (r: unknown): r is { question_id: string; suggestion: string } =>
                          isRecord(r) && typeof r.question_id === "string" && typeof r.suggestion === "string",
                      )
                      .map((r) => (
                        <div key={`${r.question_id}-${r.suggestion}`} className="rounded-md border border-white/10 p-2">
                          <div className="text-xs text-[var(--muted)]">Question {r.question_id}</div>
                          <div className="mt-1 text-[var(--text)]">{r.suggestion}</div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {suggestedActions.length ? (
              <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.35)] p-4 text-sm text-[var(--muted)]">
                <div className="text-sm font-semibold text-[var(--text)]">Suggested actions</div>
                <div className="mt-2 space-y-2">
                  {suggestedActions.map((action) => (
                    <div key={action.action_id} className="rounded-md border border-white/10 p-3">
                      <div className="text-[var(--text)]">{action.action}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        {typeof action.category === "string"
                          ? action.category.replace("_", " ")
                          : "action"}{" "}
                        -{" "}
                        {typeof action.confidence === "string"
                          ? action.confidence.toUpperCase()
                          : "LOW"}
                        {typeof action.estimated_minutes === "number"
                          ? ` - ${action.estimated_minutes} min`
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
