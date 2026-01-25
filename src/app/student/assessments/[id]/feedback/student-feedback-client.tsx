"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchoolLocale } from "@/hooks/use-school-locale";

type FeedbackQuestion = {
  id: string;
  order_index: number;
  question_text: string;
  question_type: string | null;
  response:
  | {
    signed_url: string;
    duration_seconds: number | null;
    created_at: string;
    transcript: string | null;
  }
  | null;
  evidence:
  | {
    signed_url: string;
    mime_type: string | null;
    file_size_bytes: number | null;
    width_px: number | null;
    height_px: number | null;
    uploaded_at: string;
  }
  | null;
  scores:
  | {
    reasoning: { score: number | null; justification: string | null };
    evidence: { score: number | null; justification: string | null };
  }
  | null;
};

type FeedbackPayload = {
  assessment: { id: string; title: string; instructions: string | null };
  student: { name: string };
  submission: {
    id: string;
    submitted_at: string | null;
    published_at: string | null;
    teacher_comment: string | null;
    final_score: number | null;
    review_status: string | null;
  };
  questions: FeedbackQuestion[];
};

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function StudentFeedbackClient({ assessmentId }: { assessmentId: string }) {
  const [payload, setPayload] = useState<FeedbackPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { hideScores } = useSchoolLocale();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/student/assessments/${assessmentId}/feedback`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as FeedbackPayload | { error?: string } | null;
        if (!res.ok || !data || "error" in data) throw new Error((data as { error?: string })?.error ?? "Unable to load.");
        setPayload(data as FeedbackPayload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [assessmentId]);

  const scoreLabel = useMemo(() => {
    if (!payload) return "—";
    if (hideScores) return "";
    return typeof payload.submission.final_score === "number"
      ? payload.submission.final_score.toFixed(2)
      : "—";
  }, [payload, hideScores]);

  return (
    <div className="relative min-h-screen px-6 py-10 pb-20">
      {/* Sparkle background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-background dark:to-background" />

      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] font-semibold text-indigo-500">Verified Feedback</div>
            <h1 className="mt-2 text-3xl font-light text-[var(--text)]">
              {payload?.assessment.title ?? "Feedback Report"}
            </h1>
            <p className="mt-1 text-[var(--muted)]">
              {payload?.student.name ? `For ${payload.student.name}` : "Teacher-reviewed assessment"}
            </p>
          </div>
          <Link href="/student">
            <Button type="button" variant="secondary" className="backdrop-blur-sm bg-white/50 border-[var(--border)]">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {error ? <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{error}</div> : null}
        {loading ? <div className="text-sm text-[var(--muted)] animate-pulse">Loading feedback report...</div> : null}

        {payload ? (
          <div className="space-y-8">
            <Card className="border-indigo-100 bg-white/50 backdrop-blur-sm shadow-md overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400" />
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{hideScores ? "Assessment Feedback" : "Assessment Score"}</CardTitle>
                    <CardDescription>
                      {payload.submission.published_at
                        ? `Released ${formatDateTime(payload.submission.published_at)}`
                        : "Score Preview"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {payload.submission.review_status === 'published' && (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Verified
                      </span>
                    )}
                    {!hideScores && <div className="text-4xl font-light text-[var(--text)] tracking-tight">{scoreLabel}</div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-[var(--surface)]/50 rounded-lg border border-[var(--border)] italic text-[var(--text)]">
                  "{payload.submission.teacher_comment?.trim()
                    ? payload.submission.teacher_comment
                    : "Your teacher will leave encouragement and next steps here."}"
                </div>
              </CardContent>
            </Card>

            {payload.assessment.instructions ? (
              <Card className="border-[var(--border)] bg-[var(--surface)]/50 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Assessment instructions</CardTitle>
                  <CardDescription>Reference the expectations for this task.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-[var(--text)]">
                  {payload.assessment.instructions}
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-6">
              {payload.questions.map((q) => (
                <Card key={q.id} className="border-[var(--border)] bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
                  <CardHeader className="bg-[var(--surface)]/30 border-b border-[var(--border)] pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="text-lg font-medium">Question {q.order_index}</CardTitle>
                      <span className="text-xs font-mono uppercase text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded border border-[var(--border)]">{q.question_type ?? "open_response"}</span>
                    </div>
                    <CardDescription className="pt-2 text-[var(--text)] font-normal leading-relaxed">{q.question_text}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {q.response ? (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-[var(--muted)]">Your Audio Response</label>
                          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 p-4">
                            <audio controls src={q.response.signed_url} className="h-10 w-full mb-3" />
                            <div className="flex justify-between text-xs text-[var(--muted)]">
                              <span>{q.response.duration_seconds ? `${q.response.duration_seconds}s` : ""}</span>
                              <span>{q.response.created_at ? `Uploaded ${formatDateTime(q.response.created_at)}` : ""}</span>
                            </div>
                            {q.response.transcript ? (
                              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                                <span className="text-xs uppercase text-[var(--muted)] block mb-1">Transcript</span>
                                <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">{q.response.transcript}</p>
                              </div>
                            ) : (
                              <div className="mt-3 text-xs text-[var(--muted)] italic">Transcript pending.</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--muted)] italic p-4 bg-[var(--surface)]/30 rounded-lg border border-dashed border-[var(--border)]">No recording submitted for this question.</div>
                      )}

                      {q.evidence ? (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-[var(--muted)]">Evidence</label>
                          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={q.evidence.signed_url}
                              alt="Student evidence"
                              className="w-full rounded-md object-contain bg-black/5"
                            />
                            <div className="mt-2 text-xs text-[var(--muted)] text-right">
                              Uploaded {formatDateTime(q.evidence.uploaded_at) ?? ""}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {q.scores ? (
                      <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-[var(--border)]">
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                          <div className="flex items-center justify-between text-xs text-indigo-700 mb-2">
                            <span className="font-semibold uppercase tracking-wider">Reasoning</span>
                            {!hideScores && (
                              <span className="font-bold text-lg bg-white px-2 py-0.5 rounded shadow-sm">
                                {q.scores.reasoning.score ?? "—"}<span className="text-sm text-indigo-400 font-normal">/5</span>
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">
                            {q.scores.reasoning.justification ?? "Feedback pending."}
                          </div>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                          <div className="flex items-center justify-between text-xs text-emerald-700 mb-2">
                            <span className="font-semibold uppercase tracking-wider">Evidence</span>
                            {!hideScores && (
                              <span className="font-bold text-lg bg-white px-2 py-0.5 rounded shadow-sm">
                                {q.scores.evidence.score ?? "—"}<span className="text-sm text-emerald-400 font-normal">/5</span>
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">
                            {q.scores.evidence.justification ?? "Feedback pending."}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--muted)] italic p-4 text-center">Scoring details pending.</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
