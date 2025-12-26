"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SubmissionRow = {
  id: string;
  student_id: string;
  student_name: string;
  status: "started" | "submitted";
  started_at: string;
  submitted_at: string | null;
  scoring_status?: string | null;
  scoring_error?: string | null;
  response_count: number;
  avg_score?: number | null;
  reasoning_avg?: number | null;
  evidence_avg?: number | null;
};

type AssessmentMeta = {
  id: string;
  title: string;
  status: string;
};

type AssessmentSummary = {
  total_submissions: number;
  submitted_count: number;
  scoring_complete_count: number;
  scoring_error_count: number;
  completion_rate: number;
  avg_score: number | null;
  avg_time_to_score_seconds: number | null;
};

type QuestionWithResponse = {
  id: string;
  order_index: number;
  question_text: string;
  question_type: string | null;
  response: { signed_url: string; duration_seconds: number | null; created_at: string; transcript: string | null } | null;
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

type SubmissionDetail = {
  submission: {
    id: string;
    status: string;
    student_name: string;
    scoring_status?: string | null;
    scoring_started_at?: string | null;
    scored_at?: string | null;
    scoring_error?: string | null;
    integrity_pledge_accepted_at?: string | null;
    integrity_pledge_ip_address?: string | null;
    integrity_pledge_version?: number | null;
  };
  questions: QuestionWithResponse[];
};

function isSubmissionDetail(x: unknown): x is SubmissionDetail {
  if (!x || typeof x !== "object") return false;
  const obj = x as { submission?: unknown; questions?: unknown };
  if (!obj.submission || typeof obj.submission !== "object") return false;
  if (!Array.isArray(obj.questions)) return false;
  return true;
}

function formatTime(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  const headers = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );
  const esc = (v: unknown) => {
    const str = v == null ? "" : String(v);
    const needs = /[",\n]/.test(str);
    const inner = str.replace(/"/g, '""');
    return needs ? `"${inner}"` : inner;
  };
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AssessmentResultsClient({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<AssessmentMeta | null>(null);
  const [summary, setSummary] = useState<AssessmentSummary | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubmission = useMemo(
    () => submissions.find((s) => s.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  const exportRows = useMemo(() => {
    return submissions.map((s) => ({
      student_name: s.student_name,
      status: s.status,
      scoring_status: s.scoring_status ?? "",
      avg_score: typeof s.avg_score === "number" ? s.avg_score.toFixed(2) : "",
      recordings: s.response_count,
      started_at: formatTime(s.started_at) ?? "",
      submitted_at: formatTime(s.submitted_at) ?? "",
      scoring_error: s.scoring_status === "error" ? s.scoring_error ?? "" : "",
    }));
  }, [submissions]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/assessments/${assessmentId}/submissions`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | { assessment?: AssessmentMeta; summary?: AssessmentSummary; submissions?: SubmissionRow[]; error?: string }
          | null;
        if (!res.ok || !data?.assessment) throw new Error(data?.error ?? "Unable to load submissions.");
        setAssessment(data.assessment);
        setSummary(data.summary ?? null);
        setSubmissions(data.submissions ?? []);
        if (!selectedSubmissionId && data.submissions?.length) setSelectedSubmissionId(data.submissions[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  useEffect(() => {
    if (!selectedSubmissionId) {
      setDetail(null);
      return;
    }
    (async () => {
      setDetailLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/submissions/${selectedSubmissionId}/responses`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) {
          const err = (data as { error?: unknown } | null)?.error;
          throw new Error(typeof err === "string" && err ? err : "Unable to load submission.");
        }
        if (!isSubmissionDetail(data)) throw new Error("Unable to load submission.");
        setDetail(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load submission.");
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedSubmissionId]);

  const scoringPending = useMemo(() => {
    if (!detail) return false;
    if (detail.submission.status !== "submitted") return false;
    if (detail.submission.scoring_status === "error") return false;
    if (detail.submission.scoring_status === "complete") return false;
    return detail.questions.some((q) => {
      if (!q.response) return false;
      const transcriptPending = !q.response.transcript;
      const reasoningPending = q.scores?.reasoning?.score == null || !q.scores?.reasoning?.justification;
      const evidencePending = q.scores?.evidence?.score == null || !q.scores?.evidence?.justification;
      return transcriptPending || reasoningPending || evidencePending;
    });
  }, [detail]);

  useEffect(() => {
    if (!selectedSubmissionId) return;
    if (detailLoading || rescoring) return;
    if (!scoringPending) return;

    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/submissions/${selectedSubmissionId}/responses`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as unknown;
        if (res.ok && isSubmissionDetail(data)) setDetail(data);
      } catch {
        // ignore; we'll retry
      }
    }, 4000);

    return () => window.clearInterval(id);
  }, [detailLoading, rescoring, scoringPending, selectedSubmissionId]);

  async function handleRescore() {
    if (!selectedSubmissionId) return;
    setRescoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${selectedSubmissionId}/score?force=1`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Re-score failed.");
      const refreshed = await fetch(`/api/submissions/${selectedSubmissionId}/responses`, { cache: "no-store" });
      const refreshedData = (await refreshed.json().catch(() => null)) as unknown;
      if (refreshed.ok && isSubmissionDetail(refreshedData)) setDetail(refreshedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-score failed.");
    } finally {
      setRescoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Results</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {assessment?.title ? `${assessment.title} • ` : ""}
            {submissions.length} submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!submissions.length}
            onClick={() => downloadCsv(`${assessment?.title ?? "assessment"}-results.csv`, exportRows)}
          >
            Export CSV
          </Button>
          <Link href={`/assessments/${assessmentId}?step=1`}>
            <Button type="button" variant="secondary">
              Back to Builder
            </Button>
          </Link>
        </div>
      </div>

      {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
      {loading ? <div className="text-sm text-[var(--muted)]">Loading…</div> : null}

      {summary ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion</CardTitle>
              <CardDescription>Submitted / total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--text)]">
                {summary.submitted_count}/{summary.total_submissions}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">{Math.round(summary.completion_rate * 100)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Class Avg</CardTitle>
              <CardDescription>Across scored submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--text)]">
                {typeof summary.avg_score === "number" ? summary.avg_score.toFixed(2) : "—"}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">out of 5</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
              <CardDescription>Complete / errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--text)]">
                {summary.scoring_complete_count}
                <span className="text-[var(--muted)]"> / </span>
                {summary.scoring_error_count}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">complete / error</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Time To Score</CardTitle>
              <CardDescription>Avg seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--text)]">
                {typeof summary.avg_time_to_score_seconds === "number"
                  ? Math.round(summary.avg_time_to_score_seconds)
                  : "—"}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">seconds</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>Pick a student attempt to review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!submissions.length ? (
              <div className="text-sm text-[var(--muted)]">No submissions yet.</div>
            ) : (
              submissions.map((s) => {
                const active = s.id === selectedSubmissionId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubmissionId(s.id)}
                    className={`w-full rounded-md border px-3 py-3 text-left transition-colors border-[var(--border)] ${
                      active ? "ring-1 ring-[var(--primary)]" : "hover:border-[var(--primary)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--text)]">{s.student_name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-[var(--muted)]">{s.status.toUpperCase()}</div>
                        {s.status === "submitted" ? (
                          <div
                            className={`rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] ${
                              s.scoring_status === "complete"
                                ? "text-[var(--success)]"
                                : s.scoring_status === "error"
                                  ? "text-[var(--danger)]"
                                  : "text-[var(--muted)]"
                            }`}
                            title={s.scoring_status === "error" ? s.scoring_error ?? "Scoring failed." : undefined}
                          >
                            {s.scoring_status === "complete"
                              ? "SCORED"
                              : s.scoring_status === "error"
                                ? "SCORE ERROR"
                                : "SCORING…"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {formatTime(s.submitted_at) ? `Submitted ${formatTime(s.submitted_at)}` : `Started ${formatTime(s.started_at)}`}
                      {" • "}
                      {s.response_count} recordings
                      {" • "}
                      Avg {typeof s.avg_score === "number" ? s.avg_score.toFixed(2) : "—"}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Review</CardTitle>
              <Button
                type="button"
                variant="secondary"
                disabled={!selectedSubmissionId || rescoring}
                onClick={handleRescore}
              >
                {rescoring ? "Re-scoring…" : "Re-score"}
              </Button>
            </div>
            <CardDescription>
              {selectedSubmission ? `${selectedSubmission.student_name} • ${selectedSubmission.status.toUpperCase()}` : "Select a submission"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailLoading ? <div className="text-sm text-[var(--muted)]">Loading submission…</div> : null}
            {!detailLoading && detail ? (
              <div className="space-y-4">
                {detail.submission.integrity_pledge_accepted_at ? (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--muted)]">
                    Integrity pledge accepted {formatTime(detail.submission.integrity_pledge_accepted_at)}
                    {detail.submission.integrity_pledge_version ? ` • v${detail.submission.integrity_pledge_version}` : ""}
                    {detail.submission.integrity_pledge_ip_address ? ` • IP ${detail.submission.integrity_pledge_ip_address}` : ""}
                  </div>
                ) : null}
                {detail.submission.scoring_status === "error" ? (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">
                    Scoring failed{detail.submission.scoring_error ? `: ${detail.submission.scoring_error}` : "."} You can try{" "}
                    <span className="font-semibold">Re-score</span>.
                  </div>
                ) : null}
                {scoringPending ? (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--muted)]">
                    Scoring in progress… this view auto-refreshes.
                  </div>
                ) : null}
                {detail.questions.map((q) => (
                  <div key={q.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--text)]">Question {q.order_index}</div>
                      <div className="text-xs text-[var(--muted)]">{q.question_type ?? "open_response"}</div>
                    </div>
                    <div className="mt-2 text-sm italic text-[var(--text)]">“{q.question_text}”</div>
                    <div className="mt-3">
                      {q.evidence ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-[var(--muted)]">Student Evidence</div>
                            <div className="flex items-center gap-3 text-xs">
                              <a
                                href={q.evidence.signed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--primary)] hover:underline"
                              >
                                View full size
                              </a>
                              <a
                                href={q.evidence.signed_url}
                                download={`evidence_question_${q.order_index}.jpg`}
                                className="text-[var(--primary)] hover:underline"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.evidence.signed_url}
                            alt={`Evidence for question ${q.order_index}`}
                            className="max-h-72 w-full rounded-md border border-[var(--border)] object-contain"
                          />
                          <div className="text-xs text-[var(--muted)]">Uploaded {formatTime(q.evidence.uploaded_at)}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-[var(--muted)]">No evidence image submitted.</div>
                      )}
                    </div>
                    <div className="mt-3">
                      {q.response ? (
                        <div className="space-y-2">
                          <audio controls src={q.response.signed_url} className="h-10 w-full" />
                          <div className="text-xs text-[var(--muted)]">
                            {q.response.duration_seconds ? `${q.response.duration_seconds}s` : ""}{" "}
                            {q.response.created_at ? `• Uploaded ${formatTime(q.response.created_at)}` : ""}
                          </div>
                          {q.response.transcript ? (
                            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
                              <div className="text-xs font-semibold text-[var(--muted)]">Transcript</div>
                              <div className="mt-1 whitespace-pre-wrap">{q.response.transcript}</div>
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--muted)]">Transcript pending…</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--muted)]">No recording submitted for this question.</div>
                      )}
                    </div>

                    {q.response ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-[var(--muted)]">Reasoning</div>
                            <div
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold border-[var(--border)] ${
                                q.scores?.reasoning.score == null
                                  ? "bg-[var(--background)] text-[var(--muted)]"
                                  : "bg-[var(--background)] text-[var(--primary)]"
                              }`}
                            >
                              {q.scores?.reasoning.score ?? "—"}/5
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-[var(--text)] whitespace-pre-wrap">
                            {q.scores?.reasoning.justification ?? "Scoring pending…"}
                          </div>
                        </div>
                        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-[var(--muted)]">Evidence</div>
                            <div
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold border-[var(--border)] ${
                                q.scores?.evidence.score == null
                                  ? "bg-[var(--background)] text-[var(--muted)]"
                                  : "bg-[var(--background)] text-[var(--primary)]"
                              }`}
                            >
                              {q.scores?.evidence.score ?? "—"}/5
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-[var(--text)] whitespace-pre-wrap">
                            {q.scores?.evidence.justification ?? "Scoring pending…"}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
