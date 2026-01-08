"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AssessmentReportPanel } from "@/components/assessments/assessment-report-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SubmissionRow = {
  id: string;
  student_id: string;
  student_name: string;
  status: "started" | "submitted" | "restarted";
  started_at: string;
  submitted_at: string | null;
  scoring_status?: string | null;
  scoring_error?: string | null;
  review_status?: string | null;
  published_at?: string | null;
  final_score_override?: number | null;
  teacher_comment?: string | null;
  response_count: number;
  avg_score?: number | null;
  reasoning_avg?: number | null;
  evidence_avg?: number | null;
  integrity_flag_count?: number | null;
  restart_reason?: string | null;
  restart_at?: string | null;
};

type AssessmentMeta = {
  id: string;
  title: string;
  status: string;
  is_practice_mode?: boolean | null;
};

type AssessmentSummary = {
  total_submissions: number;
  submitted_count: number;
  scoring_complete_count: number;
  scoring_error_count: number;
  completion_rate: number;
  avg_score: number | null;
  avg_time_to_score_seconds: number | null;
  restart_count?: number | null;
};

type QuestionWithResponse = {
  id: string;
  order_index: number;
  question_text: string;
  question_type: string | null;
  blooms_level?: string | null;
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

type IntegrityEvent = {
  id: string;
  event_type: string;
  duration_ms: number | null;
  question_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
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
    review_status?: string | null;
    published_at?: string | null;
    final_score_override?: number | null;
    teacher_comment?: string | null;
    integrity_pledge_accepted_at?: string | null;
    integrity_pledge_ip_address?: string | null;
    integrity_pledge_version?: number | null;
  };
  integrity_events: IntegrityEvent[];
  questions: QuestionWithResponse[];
};

function isSubmissionDetail(x: unknown): x is SubmissionDetail {
  if (!x || typeof x !== "object") return false;
  const obj = x as { submission?: unknown; questions?: unknown; integrity_events?: unknown };
  if (!obj.submission || typeof obj.submission !== "object") return false;
  if (!Array.isArray(obj.questions)) return false;
  if (obj.integrity_events != null && !Array.isArray(obj.integrity_events)) return false;
  return true;
}

function formatTime(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function formatDurationMs(ms: number | null | undefined) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return null;
  const seconds = ms / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  return `${Math.round(seconds)}s`;
}

function formatIntegrityLabel(eventType: string) {
  if (eventType === "fast_start") return "Started fast";
  if (eventType === "slow_start") return "Paused too long";
  if (eventType === "long_pause") return "Long pause";
  if (eventType === "tab_switch") return "Left tab";
  if (eventType === "screenshot_attempt") return "Screenshot attempt";
  return eventType;
}

const fillerTokens = new Set([
  "um",
  "uh",
  "umm",
  "uhh",
  "er",
  "ah",
  "hmm",
  "like",
  "okay",
  "ok",
  "well",
  "so",
  "you",
  "know",
  "i",
  "mean",
]);

const TAB_SWITCH_COUNT_THRESHOLD = 3;
const TAB_SWITCH_DURATION_THRESHOLD_MS = 20000;

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function shouldSuppressFastStart(transcript: string, questionText: string) {
  const tokens = tokenize(transcript.replace(/\(pause\s+\d+(?:\.\d+)?s\)/gi, " "));
  const meaningful = tokens.filter((t) => t.length > 2 && !fillerTokens.has(t));
  if (!meaningful.length) return true;
  const questionTokens = new Set(tokenize(questionText).filter((t) => t.length > 2));
  const overlap = meaningful.filter((t) => questionTokens.has(t)).length;
  const overlapRatio = overlap / meaningful.length;
  const nonQuestion = meaningful.filter((t) => !questionTokens.has(t));
  if (overlapRatio >= 0.6 && meaningful.length <= 6) return true;
  if (nonQuestion.length < 2 && meaningful.length <= 4) return true;
  return false;
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
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseComment, setReleaseComment] = useState("");
  const [releaseOverride, setReleaseOverride] = useState("");
  const [overrideReasonCategory, setOverrideReasonCategory] = useState("");
  const [overrideReasonNote, setOverrideReasonNote] = useState("");
  const [releaseWorking, setReleaseWorking] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [releaseNotice, setReleaseNotice] = useState<string | null>(null);

  const selectedSubmission = useMemo(
    () => submissions.find((s) => s.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );
  const isPracticeMode = Boolean(assessment?.is_practice_mode);

  const visibleSubmissions = useMemo(() => {
    if (!showFlaggedOnly) return submissions;
    return submissions.filter((s) => (s.integrity_flag_count ?? 0) > 0);
  }, [showFlaggedOnly, submissions]);

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
      restart_reason: s.restart_reason ?? "",
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

  useEffect(() => {
    if (!detail) {
      setReleaseComment("");
      setReleaseOverride("");
      setOverrideReasonCategory("");
      setOverrideReasonNote("");
      setReleaseError(null);
      setReleaseNotice(null);
      return;
    }
    setReleaseComment(detail.submission.teacher_comment ?? "");
    setReleaseOverride(
      typeof detail.submission.final_score_override === "number"
        ? String(detail.submission.final_score_override)
        : "",
    );
    setOverrideReasonCategory("");
    setOverrideReasonNote("");
    setReleaseError(null);
    setReleaseNotice(null);
  }, [detail?.submission.id]);

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

  const questionIndexById = useMemo(() => {
    if (!detail) return new Map<string, number>();
    return new Map(detail.questions.map((q) => [q.id, q.order_index]));
  }, [detail]);

  const questionContextById = useMemo(() => {
    if (!detail) return new Map<string, { question_text: string; transcript: string | null }>();
    return new Map(
      detail.questions.map((q) => [
        q.id,
        { question_text: q.question_text, transcript: q.response?.transcript ?? null },
      ]),
    );
  }, [detail]);

  const integrityFlags = useMemo(() => {
    if (!detail?.integrity_events?.length) return [];
    const tabSwitches = detail.integrity_events.filter((event) => event.event_type === "tab_switch");
    const screenshotAttempts = detail.integrity_events.filter((event) => event.event_type === "screenshot_attempt");
    const tabSwitchTotalMs = tabSwitches.reduce((sum, event) => sum + (event.duration_ms ?? 0), 0);
    const flags: Array<{ id: string; label: string; details: string; created_at: string }> = [];

    if (
      tabSwitches.length > TAB_SWITCH_COUNT_THRESHOLD ||
      tabSwitchTotalMs > TAB_SWITCH_DURATION_THRESHOLD_MS
    ) {
      flags.push({
        id: "tab_switch_summary",
        label: "Tab switches",
        details: `${tabSwitches.length} switch${tabSwitches.length === 1 ? "" : "es"} • ${formatDurationMs(tabSwitchTotalMs) ?? "0s"} away`,
        created_at: tabSwitches.at(-1)?.created_at ?? "",
      });
    }

    if (screenshotAttempts.length) {
      flags.push({
        id: "screenshot_summary",
        label: "Screenshot attempt",
        details: `${screenshotAttempts.length} attempt${screenshotAttempts.length === 1 ? "" : "s"}`,
        created_at: screenshotAttempts.at(-1)?.created_at ?? "",
      });
    }

    const perEventFlags = detail.integrity_events
      .filter((event) => event.event_type !== "tab_switch" && event.event_type !== "screenshot_attempt")
      .map((event) => {
        if (event.event_type === "fast_start" && event.question_id) {
          const context = questionContextById.get(event.question_id);
          if (context?.transcript && shouldSuppressFastStart(context.transcript, context.question_text)) {
            return null;
          }
        }
        const duration = formatDurationMs(event.duration_ms);
        const questionIndex = event.question_id ? questionIndexById.get(event.question_id) : null;
        const parts = [duration, questionIndex ? `Q${questionIndex}` : null].filter(Boolean) as string[];
        if (event.event_type === "fast_start" && event.question_id) {
          const context = questionContextById.get(event.question_id);
          if (!context?.transcript) parts.push("transcript pending");
        }
        const label =
          event.event_type === "fast_start"
            ? "Started fast"
            : event.event_type === "tab_switch"
              ? "Left tab"
              : event.event_type === "slow_start"
                ? "Paused too long"
                : event.event_type === "long_pause"
                  ? "Long pause"
                  : event.event_type === "screenshot_attempt"
                    ? "Screenshot attempt"
                    : event.event_type;

        return {
          id: event.id,
          label,
          details: parts.join(" • "),
          created_at: event.created_at,
        };
      });

    return flags.concat(
      perEventFlags.filter(Boolean) as Array<{ id: string; label: string; details: string; created_at: string }>,
    );
  }, [detail?.integrity_events, questionContextById, questionIndexById]);

  const integrityTimeline = useMemo(() => {
    if (!detail?.integrity_events?.length) return [];
    return detail.integrity_events.map((event) => {
      const questionIndex = event.question_id ? questionIndexById.get(event.question_id) : null;
      const parts = [
        formatIntegrityLabel(event.event_type),
        questionIndex ? `Q${questionIndex}` : null,
        formatDurationMs(event.duration_ms),
      ].filter(Boolean) as string[];
      return {
        id: event.id,
        summary: parts.join(" • "),
        timestamp: formatTime(event.created_at) ?? "Unknown time",
      };
    });
  }, [detail?.integrity_events, questionIndexById]);

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
    if (isPracticeMode) return;
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

  async function handleRelease() {
    if (!selectedSubmissionId || !detail) return;
    setReleaseWorking(true);
    setReleaseError(null);
    setReleaseNotice(null);
    try {
      const overrideValue = releaseOverride.trim();
      const override = overrideValue.length ? Number(overrideValue) : null;
      if (overrideValue.length > 0 && Number.isNaN(override)) {
        throw new Error("Final score override must be a number.");
      }
      if (typeof override === "number" && (override < 0 || override > 5)) {
        throw new Error("Final score override must be between 0 and 5.");
      }

      const res = await fetch(`/api/submissions/${selectedSubmissionId}/release`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teacher_comment: releaseComment.trim() || null,
          final_score_override: typeof override === "number" ? override : null,
          override_reason_category: overrideReasonCategory || null,
          override_reason: overrideReasonNote.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Release failed.");
      const refreshed = await fetch(`/api/submissions/${selectedSubmissionId}/responses`, { cache: "no-store" });
      const refreshedData = (await refreshed.json().catch(() => null)) as unknown;
      if (refreshed.ok && isSubmissionDetail(refreshedData)) setDetail(refreshedData);
      const resList = await fetch(`/api/assessments/${assessmentId}/submissions`, { cache: "no-store" });
      const listData = (await resList.json().catch(() => null)) as
        | { submissions?: SubmissionRow[]; error?: string }
        | null;
      if (resList.ok && listData?.submissions) setSubmissions(listData.submissions);
      setReleaseNotice("Feedback released to student.");
    } catch (e) {
      setReleaseError(e instanceof Error ? e.message : "Release failed.");
    } finally {
      setReleaseWorking(false);
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
            {isPracticeMode ? " • Practice mode" : ""}
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
              {typeof summary.restart_count === "number" ? (
                <div className="mt-2 text-xs text-[var(--muted)]">Grace restarts used: {summary.restart_count}</div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Class Avg</CardTitle>
              <CardDescription>Across scored submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--text)]">
                {isPracticeMode ? "Practice" : typeof summary.avg_score === "number" ? summary.avg_score.toFixed(2) : "—"}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">{isPracticeMode ? "Not scored" : "out of 5"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
              <CardDescription>Complete / errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[var(--text)]">
                {isPracticeMode ? "—" : summary.scoring_complete_count}
                {!isPracticeMode ? <span className="text-[var(--muted)]"> / </span> : null}
                {!isPracticeMode ? summary.scoring_error_count : null}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {isPracticeMode ? "Practice mode" : "complete / error"}
              </div>
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

      <AssessmentReportPanel assessmentId={assessmentId} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>Pick a student attempt to review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-[var(--muted)]">
                {showFlaggedOnly ? "Showing flagged submissions only." : "Showing all submissions."}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>Flagged only</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-[var(--border)]"
                  checked={showFlaggedOnly}
                  onChange={(e) => setShowFlaggedOnly(e.target.checked)}
                  aria-label="Show flagged submissions only"
                />
              </div>
            </div>
            {!visibleSubmissions.length ? (
              <div className="text-sm text-[var(--muted)]">No submissions yet.</div>
            ) : (
              visibleSubmissions.map((s) => {
                const active = s.id === selectedSubmissionId;
                const flagCount = s.integrity_flag_count ?? 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubmissionId(s.id)}
                    className={`w-full rounded-md border px-3 py-3 text-left transition-colors border-[var(--border)] ${active ? "ring-1 ring-[var(--primary)]" : "hover:border-[var(--primary)]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--text)]">{s.student_name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-[var(--muted)]">{s.status.toUpperCase()}</div>
                        {s.status === "submitted" ? (
                          isPracticeMode ? (
                            <div className="rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] text-[var(--primary)]">
                              PRACTICE
                            </div>
                          ) : (
                            <div
                              className={`rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] ${s.scoring_status === "complete"
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
                          )
                        ) : null}
                        {s.review_status === "published" ? (
                          <div className="rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] text-[var(--primary)]">
                            PUBLISHED
                          </div>
                        ) : null}
                        {s.restart_reason ? (
                          <div className="rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] text-[var(--muted)]">
                            RESTART ({s.restart_reason.replace("_", " ")})
                          </div>
                        ) : null}
                        {flagCount > 0 ? (
                          <div className="rounded-full border px-2 py-0.5 text-[11px] border-[var(--border)] text-[var(--danger)]">
                            {flagCount} FLAG{flagCount === 1 ? "" : "S"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {formatTime(s.submitted_at) ? `Submitted ${formatTime(s.submitted_at)}` : `Started ${formatTime(s.started_at)}`}
                      {" • "}
                      {s.response_count} recordings
                      {" • "}
                      {isPracticeMode ? "Practice attempt" : `Avg ${typeof s.avg_score === "number" ? s.avg_score.toFixed(2) : "—"}`}
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
                disabled={isPracticeMode || !selectedSubmissionId || rescoring}
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
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Integrity Flags
                  </div>
                  {integrityFlags.length ? (
                    <div className="mt-2 space-y-1 text-[var(--text)]">
                      {integrityFlags.map((flag) => (
                        <div key={flag.id} className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-medium">{flag.label}</div>
                          <div className="text-[11px] text-[var(--muted)]">{flag.details}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-[var(--muted)]">No integrity flags detected.</div>
                  )}
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Integrity Timeline
                  </div>
                  {integrityTimeline.length ? (
                    <div className="mt-2 space-y-1 text-[var(--text)]">
                      {integrityTimeline.map((event) => (
                        <div key={event.id} className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs">{event.summary}</div>
                          <div className="text-[11px] text-[var(--muted)]">{event.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-[var(--muted)]">No integrity events logged.</div>
                  )}
                </div>
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
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">Release grade</div>
                      <div className="text-xs text-[var(--muted)]">Publish verified feedback to the student.</div>
                    </div>
                    {detail.submission.review_status === "published" ? (
                      <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--primary)]">
                        Published
                      </span>
                    ) : null}
                  </div>
                  {detail.submission.published_at ? (
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      Published {formatTime(detail.submission.published_at) ?? ""}
                    </div>
                  ) : null}
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-semibold text-[var(--muted)]">Teacher growth note</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]"
                      placeholder="Add encouragement, specific feedback, or next steps."
                      value={releaseComment}
                      onChange={(e) => setReleaseComment(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-semibold text-[var(--muted)]">Final score override (optional)</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
                      placeholder="Leave blank to use the computed average."
                      value={releaseOverride}
                      onChange={(e) => setReleaseOverride(e.target.value)}
                    />
                  </div>
                  {releaseOverride.trim() ? (
                    <>
                      <div className="mt-3 space-y-2">
                        <label className="text-xs font-semibold text-[var(--muted)]">Override reason (required when overriding)</label>
                        <select
                          className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
                          value={overrideReasonCategory}
                          onChange={(e) => setOverrideReasonCategory(e.target.value)}
                        >
                          <option value="">Select a reason...</option>
                          <option value="accent_dialect">Accent/dialect variation</option>
                          <option value="audio_quality">Audio quality (mic noise, poor recording)</option>
                          <option value="accommodation">Speech impediment/accommodation</option>
                          <option value="off_task">Off-task response</option>
                          <option value="other">Other (explain below)</option>
                        </select>
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="text-xs font-semibold text-[var(--muted)]">
                          {overrideReasonCategory === "other" ? "Explanation (required)" : "Additional notes (optional)"}
                        </label>
                        <textarea
                          rows={2}
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]"
                          placeholder="Explain why you're adjusting the AI score..."
                          value={overrideReasonNote}
                          onChange={(e) => setOverrideReasonNote(e.target.value)}
                        />
                      </div>
                    </>
                  ) : null}
                  {detail.submission.scoring_status !== "complete" ? (
                    <div className="mt-3 text-xs text-[var(--muted)]">
                      Scoring must complete before you can release feedback.
                    </div>
                  ) : null}
                  {releaseError ? <div className="mt-3 text-sm text-[var(--danger)]">{releaseError}</div> : null}
                  {releaseNotice ? <div className="mt-3 text-sm text-[var(--primary)]">{releaseNotice}</div> : null}
                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      type="button"
                      disabled={releaseWorking || detail.submission.scoring_status !== "complete"}
                      onClick={handleRelease}
                    >
                      {releaseWorking ? "Releasing…" : "Release Grade"}
                    </Button>
                  </div>
                </div>
                {detail.questions.map((q) => (
                  <div key={q.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--text)]">Question {q.order_index}</div>
                      <div className="text-xs text-[var(--muted)]">{q.question_type ?? "open_response"}</div>
                    </div>
                    <div className="mt-2 text-sm italic text-[var(--text)]">“{q.question_text}”</div>
                    {q.blooms_level ? (
                      <div className="mt-1 text-xs text-[var(--muted)]">Bloom&apos;s level: {q.blooms_level}</div>
                    ) : null}
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
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold border-[var(--border)] ${q.scores?.reasoning.score == null
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
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold border-[var(--border)] ${q.scores?.evidence.score == null
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
