"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EvidenceUploadSetting = "disabled" | "optional" | "required";

type Integrity = {
  pause_threshold_seconds: number | null;
  tab_switch_monitor: boolean;
  shuffle_questions: boolean;
  recording_limit_seconds: number;
  viewing_timer_seconds: number;
};

type Pledge =
  | { enabled: false }
  | { enabled: true; version: number; text: string; accepted_at: string | null };

type Question = {
  id: string;
  question_text: string;
  question_type: string | null;
  order_index: number;
  evidence_upload?: EvidenceUploadSetting | null;
};

type Assessment = {
  id: string;
  title: string;
  instructions: string | null;
  published_at: string | null;
  integrity: Integrity | null;
  asset_url: string | null;
  question_count: number;
  current_question: Question | null;
  pledge?: Pledge;
};

type Submission = {
  id: string;
  status: "started" | "submitted";
  started_at: string;
  submitted_at: string | null;
};

type EvidenceRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  width_px: number | null;
  height_px: number | null;
  uploaded_at: string;
  signed_url: string;
};

type ResponseRow = {
  id: string;
  question_id: string;
  duration_seconds: number | null;
  created_at: string;
  signed_url: string;
};

function normalizeEvidenceSetting(v: unknown): EvidenceUploadSetting {
  if (v === "disabled" || v === "optional" || v === "required") return v;
  return "optional";
}

export function StudentAssessmentClient({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [latest, setLatest] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [pledgeWorking, setPledgeWorking] = useState(false);
  const [pledgeError, setPledgeError] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [evidenceByQuestion, setEvidenceByQuestion] = useState<Record<string, EvidenceRow | null>>({});
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // Recording chunks are kept in a local buffer during capture.
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  const activeQuestion = assessment?.current_question ?? null;
  const pledgeRequired = useMemo(() => {
    if (!assessment?.pledge || assessment.pledge.enabled !== true) return false;
    if (!latest || latest.status !== "started") return false;
    return !assessment.pledge.accepted_at;
  }, [assessment?.pledge, latest]);

  useEffect(() => {
    if (pledgeRequired) setPledgeOpen(true);
    else setPledgeOpen(false);
  }, [pledgeRequired]);

  const activeEvidence = useMemo(() => {
    if (!activeQuestion) return null;
    return evidenceByQuestion[activeQuestion.id] ?? null;
  }, [activeQuestion, evidenceByQuestion]);

  const activeResponse = useMemo(() => {
    if (!activeQuestion) return null;
    return responses.find((r) => r.question_id === activeQuestion.id) ?? null;
  }, [activeQuestion, responses]);

  const completedCount = useMemo(() => responses.length, [responses.length]);

  const canSubmitAttempt = useMemo(() => {
    if (!assessment?.question_count) return false;
    if (!latest || latest.status !== "started") return false;
    return completedCount >= assessment.question_count && assessment.current_question === null;
  }, [assessment?.current_question, assessment?.question_count, completedCount, latest]);

  const recordingLimitSeconds = assessment?.integrity?.recording_limit_seconds ?? 60;

  async function refreshResponses(submissionId: string) {
    const res = await fetch(`/api/student/submissions/${submissionId}/responses`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as { responses?: ResponseRow[]; error?: string } | null;
    if (!res.ok) throw new Error(data?.error ?? "Unable to load responses.");
    setResponses(data?.responses ?? []);
  }

  async function refreshEvidence(submissionId: string, questionId: string) {
    setEvidenceLoading(true);
    setEvidenceError(null);
    try {
      const res = await fetch(`/api/student/submissions/${submissionId}/evidence?question_id=${encodeURIComponent(questionId)}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as { evidence?: EvidenceRow | null; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to load evidence.");
      setEvidenceByQuestion((prev) => ({ ...prev, [questionId]: data?.evidence ?? null }));
    } catch (e) {
      setEvidenceError(e instanceof Error ? e.message : "Unable to load evidence.");
    } finally {
      setEvidenceLoading(false);
    }
  }

  const refreshAssessment = useCallback(async () => {
    const res = await fetch(`/api/student/assessments/${assessmentId}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as
      | {
          assessment?: Assessment;
          latest_submission?: Submission | null;
          progress?: { answered_count?: number; total_count?: number };
          error?: string;
        }
      | null;
    if (!res.ok || !data?.assessment) throw new Error(data?.error ?? "Unable to load assessment.");
    setAssessment(data.assessment);
    setLatest(data.latest_submission ?? null);
    if (data.latest_submission?.status === "started") {
      await refreshResponses(data.latest_submission.id);
    } else {
      setResponses([]);
      setEvidenceByQuestion({});
    }
  }, [assessmentId]);

  async function acceptPledge() {
    if (!latest || latest.status !== "started") return;
    setPledgeWorking(true);
    setPledgeError(null);
    try {
      const res = await fetch(`/api/student/submissions/${latest.id}/pledge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to accept pledge.");
      await refreshAssessment();
      setPledgeOpen(false);
    } catch (e) {
      setPledgeError(e instanceof Error ? e.message : "Unable to accept pledge.");
    } finally {
      setPledgeWorking(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshAssessment();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAssessment]);

  useEffect(() => {
    if (!latest || latest.status !== "started") return;
    if (!activeQuestion) return;
    void refreshEvidence(latest.id, activeQuestion.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id, latest?.status, activeQuestion?.id]);

  async function startOrResume() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/student/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assessment_id: assessmentId }),
      });
      const data = (await res.json().catch(() => null)) as { submission?: Submission; error?: string } | null;
      if (!res.ok || !data?.submission) throw new Error(data?.error ?? "Unable to start.");
      setLatest(data.submission);
      await refreshAssessment();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start.");
    } finally {
      setWorking(false);
    }
  }

  async function submit() {
    if (!latest) return;
    setWorking(true);
    setError(null);
    try {
      if (pledgeRequired) throw new Error("Accept the academic integrity pledge to continue.");
      if (!canSubmitAttempt) {
        throw new Error("Record a response for every question before submitting.");
      }
      const res = await fetch(`/api/student/submissions/${latest.id}/submit`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to submit.");
      setLatest({ ...latest, status: "submitted", submitted_at: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit.");
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    if (recordingSeconds >= recordingLimitSeconds && mediaRecorder?.state === "recording") {
      mediaRecorder.stop();
    }
  }, [mediaRecorder, recording, recordingLimitSeconds, recordingSeconds]);

  async function beginRecording() {
    setRecordingError(null);
    const chunks: BlobPart[] = [];
    setRecordingSeconds(0);

    if (!latest || latest.status !== "started") {
      setRecordingError("Start the assessment before recording.");
      return;
    }
    if (pledgeRequired) {
      setRecordingError("Accept the academic integrity pledge to begin.");
      return;
    }
    if (!activeQuestion) {
      setRecordingError("No question selected.");
      return;
    }
    if (activeResponse) {
      setRecordingError("This question has already been answered.");
      return;
    }

    const evidenceSetting = normalizeEvidenceSetting(activeQuestion.evidence_upload);
    if (evidenceSetting === "required" && !activeEvidence) {
      setRecordingError("Upload the required evidence image before recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };
      recorder.onstop = async () => {
        try {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: "audio/webm" });
          if (!blob.size) return;

          const form = new FormData();
          form.set("question_id", activeQuestion.id);
          form.set("duration_seconds", String(recordingSeconds));
          form.set("file", new File([blob], "response.webm", { type: "audio/webm" }));

          setWorking(true);
          const res = await fetch(`/api/student/submissions/${latest.id}/responses`, { method: "POST", body: form });
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
          await refreshAssessment();
        } catch (e) {
          setRecordingError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          setWorking(false);
          setRecording(false);
          setMediaRecorder(null);
        }
      };

      setMediaRecorder(recorder);
      setRecording(true);
      recorder.start();
    } catch (e) {
      setRecordingError(e instanceof Error ? e.message : "Microphone permission denied.");
    }
  }

  function stopRecording() {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.stop();
    }
  }

  async function handleEvidenceSelected(file: File) {
    if (!latest || latest.status !== "started") {
      setEvidenceError("Start the assessment before uploading evidence.");
      return;
    }
    if (pledgeRequired) {
      setEvidenceError("Accept the academic integrity pledge to continue.");
      return;
    }
    if (!activeQuestion) return;
    setEvidenceUploading(true);
    setEvidenceError(null);
    try {
      const form = new FormData();
      form.set("question_id", activeQuestion.id);
      form.set("file", file);

      const res = await fetch(`/api/student/submissions/${latest.id}/evidence`, { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as { evidence?: EvidenceRow | null; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Evidence upload failed.");
      setEvidenceByQuestion((prev) => ({ ...prev, [activeQuestion.id]: data?.evidence ?? null }));
    } catch (e) {
      setEvidenceError(e instanceof Error ? e.message : "Evidence upload failed.");
    } finally {
      setEvidenceUploading(false);
    }
  }

  async function removeEvidence() {
    if (!latest || latest.status !== "started") return;
    if (pledgeRequired) {
      setEvidenceError("Accept the academic integrity pledge to continue.");
      return;
    }
    if (!activeQuestion) return;
    setEvidenceUploading(true);
    setEvidenceError(null);
    try {
      const res = await fetch(
        `/api/student/submissions/${latest.id}/evidence?question_id=${encodeURIComponent(activeQuestion.id)}`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to remove evidence.");
      setEvidenceByQuestion((prev) => ({ ...prev, [activeQuestion.id]: null }));
      if (evidenceInputRef.current) evidenceInputRef.current.value = "";
    } catch (e) {
      setEvidenceError(e instanceof Error ? e.message : "Unable to remove evidence.");
    } finally {
      setEvidenceUploading(false);
    }
  }

  const total = assessment?.question_count ?? 0;
  const attempted = completedCount;
  const started = latest?.status === "started";
  const evidenceSetting = normalizeEvidenceSetting(activeQuestion?.evidence_upload);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {assessment?.pledge?.enabled === true && pledgeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
              <div className="text-lg font-semibold">Academic Integrity Pledge</div>
              <div className="mt-1 text-sm text-zinc-300">
                Please read and accept before starting. You won’t see questions until you agree.
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                {assessment.pledge.text.split("\n").map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              {pledgeError ? <div className="mt-3 text-sm text-red-300">{pledgeError}</div> : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" disabled={pledgeWorking} onClick={acceptPledge}>
                  {pledgeWorking ? "Saving…" : "I Agree"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{assessment?.title ?? "Assessment"}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {latest ? `Attempt: ${latest.status}` : "Start when you’re ready."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/student">
              <Button type="button" variant="secondary">
                Back
              </Button>
            </Link>
            <Button type="button" disabled={working || latest?.status === "submitted"} onClick={startOrResume}>
              {working ? "Working…" : latest?.status === "started" ? "Resume" : "Start"}
            </Button>
          </div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {loading ? <div className="text-sm text-zinc-600">Loading…</div> : null}

        {assessment ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {assessment.asset_url ? (
                <Card className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assessment.asset_url} alt="" className="h-72 w-full object-cover" />
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                  <CardDescription>This is an assessment. Questions are revealed one at a time after you start.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-zinc-700">
                  {assessment.instructions?.trim() ? assessment.instructions : "No instructions provided."}
                </CardContent>
              </Card>

              {!started ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Ready?</CardTitle>
                    <CardDescription>
                      This assessment has {total} question{total === 1 ? "" : "s"}. Once you start, you will see one question at a time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="text-sm text-zinc-700">When you click Start, you should be ready to answer immediately.</div>
                    <Button type="button" disabled={working || latest?.status === "submitted"} onClick={startOrResume}>
                      {working ? "Starting…" : "Start Assessment"}
                    </Button>
                  </CardContent>
                </Card>
              ) : latest?.status === "submitted" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Submitted</CardTitle>
                    <CardDescription>Your responses have been submitted.</CardDescription>
                  </CardHeader>
                </Card>
              ) : activeQuestion ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Question {activeQuestion.order_index} of {total}
                    </CardTitle>
                    <CardDescription>Progress: {attempted}/{total} completed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border border-zinc-200 bg-white p-4">
                      <div className="text-sm text-zinc-900">{activeQuestion.question_text}</div>
                    </div>

                    {evidenceSetting !== "disabled" ? (
                      <div className="rounded-md border border-zinc-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-zinc-900">Evidence</div>
                            <div className="mt-0.5 text-xs text-zinc-600">
                              {evidenceSetting === "required" ? "Required before recording." : "Optional. Upload a photo of your work."}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              ref={evidenceInputRef}
                              type="file"
                              accept="image/*,.jpg,.jpeg,.png,.heic,.heif"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void handleEvidenceSelected(f);
                              }}
                            />
                            {!activeEvidence ? (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={working || recording || evidenceUploading}
                                onClick={() => evidenceInputRef.current?.click()}
                              >
                                {evidenceUploading ? "Uploading…" : "Upload Evidence"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={working || recording || evidenceUploading}
                                onClick={removeEvidence}
                              >
                                {evidenceUploading ? "Removing…" : "Remove"}
                              </Button>
                            )}
                          </div>
                        </div>

                        {evidenceLoading ? <div className="mt-3 text-xs text-zinc-600">Loading evidence…</div> : null}
                        {evidenceError ? <div className="mt-3 text-sm text-red-600">{evidenceError}</div> : null}
                        {activeEvidence ? (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeEvidence.signed_url}
                              alt="Evidence upload preview"
                              className="max-h-72 w-full rounded-md border border-zinc-200 object-contain"
                            />
                            <div className="mt-2 text-xs text-zinc-600">
                              Uploaded {new Date(activeEvidence.uploaded_at).toLocaleString()}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-zinc-900">Record your response</div>
                        <div className="text-xs text-zinc-600">
                          {recording ? `Recording: ${recordingSeconds}s / ${recordingLimitSeconds}s` : `Limit: ${recordingLimitSeconds}s`}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!recording ? (
                          <Button
                            type="button"
                            disabled={
                              working ||
                              latest?.status !== "started" ||
                              (evidenceSetting === "required" && !activeEvidence) ||
                              evidenceUploading
                            }
                            onClick={beginRecording}
                          >
                            Start Recording
                          </Button>
                        ) : (
                          <Button type="button" variant="secondary" disabled={working} onClick={stopRecording}>
                            Stop
                          </Button>
                        )}
                        {working ? <span className="text-sm text-zinc-600">Saving…</span> : null}
                      </div>
                      {recordingError ? <div className="mt-2 text-sm text-red-600">{recordingError}</div> : null}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>All questions answered</CardTitle>
                    <CardDescription>Submit your assessment to finish.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="text-sm text-zinc-700">You cannot change responses after submitting.</div>
                    <Button type="button" disabled={working || !canSubmitAttempt} onClick={submit}>
                      Submit
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integrity</CardTitle>
                  <CardDescription>These settings are enforced by your teacher.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-700">
                  <div>Pausing guardrail: {assessment.integrity?.pause_threshold_seconds ? "On" : "Off"}</div>
                  <div>Focus monitor: {assessment.integrity?.tab_switch_monitor ? "On" : "Off"}</div>
                  <div>Dynamic shuffle: {assessment.integrity?.shuffle_questions ? "On" : "Off"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Limits</CardTitle>
                  <CardDescription>Response timers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-700">
                  <div>Recording limit: {assessment.integrity?.recording_limit_seconds ?? 60}s</div>
                  <div>Viewing timer (Retell): {assessment.integrity?.viewing_timer_seconds ?? 20}s</div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
