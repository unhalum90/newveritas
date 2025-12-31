"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    return typeof payload.submission.final_score === "number"
      ? payload.submission.final_score.toFixed(2)
      : "—";
  }, [payload]);

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-10 text-[var(--text)]">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Verified Feedback</div>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">
              {payload?.assessment.title ?? "Feedback Report"}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {payload?.student.name ? `For ${payload.student.name}` : "Teacher-reviewed assessment"}
            </p>
          </div>
          <Link href="/student">
            <Button type="button" variant="secondary">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {loading ? <div className="text-sm text-[var(--muted)]">Loading…</div> : null}

        {payload ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Teacher verified score</CardTitle>
                    <CardDescription>
                      {payload.submission.published_at
                        ? `Released ${formatDateTime(payload.submission.published_at)}`
                        : "Released"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Verified
                    </span>
                    <div className="text-2xl font-semibold text-[var(--text)]">{scoreLabel}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[var(--text)]">
                  {payload.submission.teacher_comment?.trim()
                    ? payload.submission.teacher_comment
                    : "Your teacher will leave encouragement and next steps here."}
                </div>
              </CardContent>
            </Card>

            {payload.assessment.instructions ? (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment instructions</CardTitle>
                  <CardDescription>Reference the expectations for this task.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-[var(--text)]">
                  {payload.assessment.instructions}
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-4">
              {payload.questions.map((q) => (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle>Question {q.order_index}</CardTitle>
                      <span className="text-xs text-[var(--muted)]">{q.question_type ?? "open_response"}</span>
                    </div>
                    <CardDescription>{q.question_text}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {q.response ? (
                      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                        <audio controls src={q.response.signed_url} className="h-10 w-full" />
                        <div className="mt-2 text-xs text-[var(--muted)]">
                          {q.response.duration_seconds ? `${q.response.duration_seconds}s` : ""}
                          {q.response.created_at ? ` • Uploaded ${formatDateTime(q.response.created_at)}` : ""}
                        </div>
                        {q.response.transcript ? (
                          <div className="mt-3 text-sm text-[var(--text)] whitespace-pre-wrap">{q.response.transcript}</div>
                        ) : (
                          <div className="mt-3 text-xs text-[var(--muted)]">Transcript pending.</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--muted)]">No recording submitted for this question.</div>
                    )}

                    {q.evidence ? (
                      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="text-xs font-semibold text-[var(--muted)]">Evidence image</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.evidence.signed_url}
                          alt="Student evidence"
                          className="mt-2 max-h-64 w-full rounded-md object-contain"
                        />
                        <div className="mt-2 text-xs text-[var(--muted)]">
                          Uploaded {formatDateTime(q.evidence.uploaded_at) ?? ""}
                        </div>
                      </div>
                    ) : null}

                    {q.scores ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                            <span>Reasoning</span>
                            <span className="font-semibold text-[var(--text)]">
                              {q.scores.reasoning.score ?? "—"}/5
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-[var(--text)] whitespace-pre-wrap">
                            {q.scores.reasoning.justification ?? "Feedback pending."}
                          </div>
                        </div>
                        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                            <span>Evidence</span>
                            <span className="font-semibold text-[var(--text)]">
                              {q.scores.evidence.score ?? "—"}/5
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-[var(--text)] whitespace-pre-wrap">
                            {q.scores.evidence.justification ?? "Feedback pending."}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--muted)]">Scoring details pending.</div>
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
