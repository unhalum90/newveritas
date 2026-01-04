"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AssessmentListItem = {
  id: string;
  title: string;
  published_at: string | null;
  asset_url: string | null;
  is_practice_mode?: boolean | null;
  latest_submission:
    | {
        id: string;
        status: "started" | "submitted" | "restarted";
        started_at: string;
        submitted_at: string | null;
        review_status?: string | null;
        published_at?: string | null;
      }
    | null;
};

const walkthroughSteps = [
  {
    title: "Welcome to Practice Space",
    body:
      "This guided walkthrough helps you learn how SayVeritas works before your first graded assessment.",
    tips: ["Take your time.", "You can repeat practice assessments whenever you want."],
  },
  {
    title: "How the assessment flow works",
    body:
      "You will see one question at a time, record your answer, and move forward when you are ready.",
    tips: ["Speak clearly and stay on topic.", "Short pauses are okay."],
  },
  {
    title: "What the AI looks for",
    body:
      "Scoring focuses on reasoning and evidence. The goal is to explain how you got your answer.",
    tips: ["Use examples or details to support your ideas.", "Explain why your evidence matters."],
  },
  {
    title: "After you submit",
    body:
      "Your practice assessment is scored automatically and feedback appears in your results.",
    tips: ["Review the feedback to improve.", "Practice again to build confidence."],
  },
] as const;

function formatDate(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export function StudentPracticeClient() {
  const [stepIndex, setStepIndex] = useState(0);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeStep = walkthroughSteps[stepIndex];
  const lastStep = stepIndex === walkthroughSteps.length - 1;

  const feedbackReady = useMemo(
    () => assessments.some((a) => a.latest_submission?.review_status === "published"),
    [assessments],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/practice", { cache: "no-store" });
        const payload = (await res.json().catch(() => null)) as { assessments?: AssessmentListItem[]; error?: string } | null;
        if (!res.ok || !payload?.assessments) throw new Error(payload?.error ?? "Unable to load practice assessments.");
        setAssessments(payload.assessments);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Practice Space</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Learn the SayVeritas flow, then try a mock assessment with instant feedback.
            </p>
          </div>
          <Link href="/student">
            <Button type="button" variant="secondary">
              Back to dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {stepIndex + 1} of {walkthroughSteps.length}
            </CardTitle>
            <CardDescription>{activeStep.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[var(--muted)]">
            <p>{activeStep.body}</p>
            <ul className="space-y-2">
              {activeStep.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="text-[var(--text)]">-</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStepIndex((idx) => Math.max(idx - 1, 0))}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStepIndex((idx) => Math.min(idx + 1, walkthroughSteps.length - 1))}
                disabled={lastStep}
              >
                Next
              </Button>
              {lastStep ? (
                <a href="#practice" className="text-sm font-semibold text-emerald-700 hover:opacity-80">
                  Go to practice assessments {"->"}
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {feedbackReady ? (
          <Card>
            <CardHeader>
              <CardTitle>Practice feedback ready</CardTitle>
              <CardDescription>Open a practice assessment to review your scores.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section id="practice" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Mock assessments</h2>
            <p className="text-sm text-zinc-600">
              Choose a practice assessment below. Each one is designed to be easy to answer while showcasing your reasoning.
            </p>
          </div>

          {error ? (
            <div className="text-sm text-red-600" role="alert">
              {error}
            </div>
          ) : null}
          {loading ? <div className="text-sm text-zinc-600">Loading practice assessments...</div> : null}

          {!loading && !assessments.length ? (
            <Card>
              <CardHeader>
                <CardTitle>No practice assessments available yet</CardTitle>
                <CardDescription>Check back soon or ask your teacher to enable practice mode.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="overflow-hidden">
                  {assessment.asset_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assessment.asset_url} alt={`${assessment.title} cover`} className="h-40 w-full object-cover" />
                  ) : null}
                  <CardHeader>
                    <CardTitle>{assessment.title}</CardTitle>
                    <CardDescription>
                      {formatDate(assessment.published_at)
                        ? `Updated ${formatDate(assessment.published_at)}`
                        : "Ready to practice"}
                      {assessment.latest_submission
                        ? ` - ${assessment.latest_submission.review_status === "published" ? "Feedback ready" : `Last: ${assessment.latest_submission.status}`}`
                        : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={
                        assessment.latest_submission?.review_status === "published"
                          ? `/student/assessments/${assessment.id}/feedback`
                          : `/student/assessments/${assessment.id}`
                      }
                    >
                      <Button type="button" className="w-full">
                        {assessment.latest_submission?.review_status === "published"
                          ? "View Feedback"
                          : assessment.latest_submission?.status === "started"
                            ? "Continue"
                            : "Start Practice"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
