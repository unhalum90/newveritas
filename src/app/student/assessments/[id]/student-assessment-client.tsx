"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAudioFollowup, isEvidenceFollowup } from "@/lib/assessments/question-types";

type EvidenceUploadSetting = "disabled" | "optional" | "required";

type Integrity = {
  pause_threshold_seconds: number | null;
  tab_switch_monitor: boolean;
  shuffle_questions: boolean;
  allow_grace_restart?: boolean | null;
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
  is_practice_mode?: boolean | null;
  grace_restart_used?: boolean | null;
  integrity: Integrity | null;
  asset_url: string | null;
  audio_intro?: {
    asset_url: string;
    original_filename: string | null;
    duration_seconds: number | null;
    max_duration_seconds: number | null;
    require_full_listen: boolean;
  } | null;
  document_pdf?: {
    asset_url: string;
    original_filename: string | null;
  } | null;
  question_count: number;
  current_question: Question | null;
  pledge?: Pledge;
};

type Submission = {
  id: string;
  status: "started" | "submitted" | "restarted";
  started_at: string;
  submitted_at: string | null;
  review_status?: string | null;
  published_at?: string | null;
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
  ai_description?: string | null;
  analyzed_at?: string | null;
};

type ResponseRow = {
  id: string;
  question_id: string;
  duration_seconds: number | null;
  created_at: string;
  signed_url: string;
  response_stage?: "primary" | "followup" | null;
  ai_followup_question?: string | null;
  processing_status?: "pending" | "transcribing" | "generating" | "complete" | "error" | null;
  processing_error?: string | null;
};

type StudentAccess = {
  consent_audio: boolean;
  consent_audio_at: string | null;
  consent_revoked_at: string | null;
  disabled: boolean;
};

const FAST_START_THRESHOLD_MS = 3000;
const SLOW_START_THRESHOLD_MS = 6000;
const GRACE_RESTART_THRESHOLD_MS = 10000;
const LONG_PAUSE_THRESHOLD_MS = 10000;
const AUDIO_ACTIVITY_THRESHOLD = 0.03;
const FOLLOWUP_POLL_INTERVAL_MS = 1500;
const FOLLOWUP_TIMEOUT_MS = 10000;
const FALLBACK_FOLLOWUP_QUESTION = "Tell me one more detail about your reasoning.";

function formatDuration(value?: number | null) {
  if (!value || !Number.isFinite(value)) return "Length unknown";
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function normalizeEvidenceSetting(v: unknown): EvidenceUploadSetting {
  if (v === "disabled" || v === "optional" || v === "required") return v;
  return "optional";
}

function parseEvidenceAnalysis(raw?: string | null) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as { summary?: unknown; questions?: unknown };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((q) => (typeof q === "string" ? q.trim() : "")).filter((q) => q.length > 0)
      : [];
    if (!summary && questions.length === 0) return null;
    return { summary, questions };
  } catch {
    return null;
  }
}

export function StudentAssessmentClient({ assessmentId, preview = false }: { assessmentId: string; preview?: boolean }) {
  const previewMode = Boolean(preview);
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [latest, setLatest] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [pledgeWorking, setPledgeWorking] = useState(false);
  const [pledgeError, setPledgeError] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentWorking, setConsentWorking] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [studentAccess, setStudentAccess] = useState<StudentAccess | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [evidenceByQuestion, setEvidenceByQuestion] = useState<Record<string, EvidenceRow | null>>({});
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [audioIntroCompleted, setAudioIntroCompleted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [restartPrompt, setRestartPrompt] = useState<{ reason: "slow_start" | "off_topic"; questionId: string } | null>(null);
  const [restartWorking, setRestartWorking] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const pdfDialogTitleId = useId();
  const pdfCloseRef = useRef<HTMLButtonElement | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const autoRecordQuestionId = useRef<string | null>(null);
  const autoSubmitAttemptedRef = useRef(false);
  const practiceRedirectedRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const hiddenQuestionIdRef = useRef<string | null>(null);
  const slowStartEligibleRef = useRef(false);
  const questionShownAtRef = useRef<number | null>(null);
  const questionShownIdRef = useRef<string | null>(null);
  const questionShownSubmissionIdRef = useRef<string | null>(null);
  // Recording chunks are kept in a local buffer during capture.
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  const activeQuestion = assessment?.current_question ?? null;
  const audioIntro = assessment?.audio_intro ?? null;
  const documentPdf = assessment?.document_pdf ?? null;
  const pdfInlineUrl = useMemo(() => {
    if (!documentPdf?.asset_url) return "";
    const url = documentPdf.asset_url;
    const viewerFlags = "toolbar=0&navpanes=0&scrollbar=0&view=FitH";
    return url.includes("#") ? `${url}&${viewerFlags}` : `${url}#${viewerFlags}`;
  }, [documentPdf?.asset_url]);

  useEffect(() => {
    if (pdfOpen) pdfCloseRef.current?.focus();
  }, [pdfOpen]);
  const requireAudioIntro = Boolean(audioIntro && (audioIntro.require_full_listen ?? true));
  const isPracticeMode = Boolean(assessment?.is_practice_mode);
  const feedbackReady = latest?.review_status === "published";
  const pledgeRequired = useMemo(() => {
    if (previewMode) return false;
    if (!assessment?.pledge || assessment.pledge.enabled !== true) return false;
    if (!latest || latest.status !== "started") return false;
    return !assessment.pledge.accepted_at;
  }, [assessment?.pledge, latest, previewMode]);

  const accessRestricted = Boolean(studentAccess?.disabled) && !previewMode;
  const consentRequired = useMemo(() => {
    if (previewMode) return false;
    if (!studentAccess) return false;
    if (studentAccess.disabled) return false;
    return !studentAccess.consent_audio || Boolean(studentAccess.consent_revoked_at);
  }, [studentAccess, previewMode]);
  const canGraceRestart =
    !previewMode && Boolean(assessment?.integrity?.allow_grace_restart) && !Boolean(assessment?.grace_restart_used);
  const audioGateActive = Boolean(latest?.status === "started" && requireAudioIntro && !audioIntroCompleted);

  useEffect(() => {
    if (!activeQuestion) {
      questionShownAtRef.current = null;
      questionShownIdRef.current = null;
      questionShownSubmissionIdRef.current = null;
      return;
    }
    const canTrack =
      !previewMode &&
      latest?.status === "started" &&
      !audioGateActive &&
      !accessRestricted &&
      !consentRequired &&
      !pledgeRequired;
    if (!canTrack) {
      questionShownAtRef.current = null;
      questionShownIdRef.current = null;
      questionShownSubmissionIdRef.current = null;
      return;
    }
    const submissionId = latest?.id ?? null;
    if (questionShownIdRef.current !== activeQuestion.id || questionShownSubmissionIdRef.current !== submissionId) {
      questionShownAtRef.current = Date.now();
      questionShownIdRef.current = activeQuestion.id;
      questionShownSubmissionIdRef.current = submissionId;
    }
  }, [
    activeQuestion?.id,
    accessRestricted,
    audioGateActive,
    consentRequired,
    latest?.id,
    latest?.status,
    pledgeRequired,
    previewMode,
  ]);

  useEffect(() => {
    if (pledgeRequired && !consentRequired) setPledgeOpen(true);
    else setPledgeOpen(false);
  }, [consentRequired, pledgeRequired]);

  useEffect(() => {
    if (consentRequired) setConsentOpen(true);
    else setConsentOpen(false);
  }, [consentRequired]);

  useEffect(() => {
    if (!requireAudioIntro) {
      setAudioIntroCompleted(true);
      return;
    }
    setAudioIntroCompleted(false);
  }, [audioIntro?.asset_url, audioIntro?.require_full_listen, latest?.id, requireAudioIntro]);

  const activeEvidence = useMemo(() => {
    if (!activeQuestion) return null;
    return evidenceByQuestion[activeQuestion.id] ?? null;
  }, [activeQuestion, evidenceByQuestion]);

  const isAudioFollowupQuestion = useMemo(() => isAudioFollowup(activeQuestion?.question_type), [activeQuestion?.question_type]);

  const activeResponses = useMemo(() => {
    if (!activeQuestion) return [];
    return responses.filter((r) => r.question_id === activeQuestion.id);
  }, [activeQuestion, responses]);

  const activePrimaryResponse = useMemo(
    () => activeResponses.find((r) => r.response_stage !== "followup") ?? null,
    [activeResponses],
  );
  const activeFollowupResponse = useMemo(
    () => activeResponses.find((r) => r.response_stage === "followup") ?? null,
    [activeResponses],
  );

  // Check if follow-up is still being generated
  const isFollowupProcessing = useMemo(() => {
    if (!activePrimaryResponse) return false;
    const status = activePrimaryResponse.processing_status;
    return status === "pending" || status === "transcribing" || status === "generating";
  }, [activePrimaryResponse]);

  // Compute the follow-up prompt (with fallback for timeout or error)
  const [fallbackFollowupActive, setFallbackFollowupActive] = useState(false);
  const followupPrompt = useMemo(() => {
    // If we have an AI-generated follow-up, use it
    if (typeof activePrimaryResponse?.ai_followup_question === "string" && activePrimaryResponse.ai_followup_question.trim()) {
      return activePrimaryResponse.ai_followup_question.trim();
    }
    // If processing failed or timed out, use fallback
    if (fallbackFollowupActive || activePrimaryResponse?.processing_status === "error") {
      return FALLBACK_FOLLOWUP_QUESTION;
    }
    return "";
  }, [activePrimaryResponse?.ai_followup_question, activePrimaryResponse?.processing_status, fallbackFollowupActive]);

  // Poll for async follow-up completion
  useEffect(() => {
    if (!latest || latest.status !== "started") return;
    if (!activePrimaryResponse) return;
    if (!isFollowupProcessing) return;

    // Poll for completion
    const pollInterval = setInterval(() => {
      void refreshResponses(latest.id);
    }, FOLLOWUP_POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [latest?.id, latest?.status, activePrimaryResponse?.id, isFollowupProcessing]);

  // Timeout fallback for slow processing
  useEffect(() => {
    if (!isFollowupProcessing) {
      setFallbackFollowupActive(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (isFollowupProcessing) {
        console.warn("Follow-up processing timeout, using fallback");
        setFallbackFollowupActive(true);
      }
    }, FOLLOWUP_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isFollowupProcessing, activePrimaryResponse?.id]);

  const followupNeeded = Boolean(isAudioFollowupQuestion && activePrimaryResponse && !activeFollowupResponse);

  const isEvidenceFollowupQuestion = useMemo(() => isEvidenceFollowup(activeQuestion?.question_type), [activeQuestion?.question_type]);

  const evidenceSetting = useMemo(() => {
    const setting = normalizeEvidenceSetting(activeQuestion?.evidence_upload);
    return isEvidenceFollowupQuestion ? "required" : setting;
  }, [activeQuestion?.evidence_upload, isEvidenceFollowupQuestion]);

  const evidenceAnalysis = useMemo(() => parseEvidenceAnalysis(activeEvidence?.ai_description ?? null), [activeEvidence?.ai_description]);

  const completedCount = useMemo(() => {
    if (followupNeeded) {
      return Math.max(0, responses.length - 1);
    }
    return responses.length;
  }, [followupNeeded, responses.length]);

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

  const logIntegrityEvent = useCallback(
    async (
      submissionId: string,
      payload: {
        event_type: "tab_switch" | "fast_start" | "slow_start" | "long_pause" | "screenshot_attempt";
        duration_ms?: number | null;
        question_id?: string | null;
        metadata?: Record<string, unknown> | null;
      },
    ) => {
      try {
        await fetch(`/api/student/submissions/${submissionId}/integrity`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Ignore integrity logging failures to avoid blocking students.
      }
    },
    [],
  );

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
    const previewQuery = previewMode ? "?preview=1" : "";
    const res = await fetch(`/api/student/assessments/${assessmentId}${previewQuery}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as
      | {
        assessment?: Assessment;
        latest_submission?: Submission | null;
        progress?: { answered_count?: number; total_count?: number };
        student?: StudentAccess;
        error?: string;
      }
      | null;
    if (!res.ok || !data?.assessment) throw new Error(data?.error ?? "Unable to load assessment.");
    setAssessment(data.assessment);
    setLatest(data.latest_submission ?? null);
    setStudentAccess(data.student ?? null);
    if (data.latest_submission?.status === "started") {
      await refreshResponses(data.latest_submission.id);
    } else {
      setResponses([]);
      setEvidenceByQuestion({});
    }
  }, [assessmentId, previewMode]);

  async function acceptPledge() {
    if (previewMode) {
      setPledgeError("Preview mode only.");
      return;
    }
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

  async function acceptConsent() {
    if (previewMode) {
      setConsentError("Preview mode only.");
      return;
    }
    setConsentWorking(true);
    setConsentError(null);
    try {
      const res = await fetch("/api/student/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to save consent.");
      await refreshAssessment();
      setConsentOpen(false);
    } catch (e) {
      setConsentError(e instanceof Error ? e.message : "Unable to save consent.");
    } finally {
      setConsentWorking(false);
    }
  }

  async function confirmRestart() {
    if (!restartPrompt || !latest) return;
    setRestartWorking(true);
    setRestartError(null);
    try {
      const res = await fetch(`/api/student/submissions/${latest.id}/restart`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: restartPrompt.reason, question_id: restartPrompt.questionId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to restart.");
      setRestartPrompt(null);
      await refreshAssessment();
    } catch (e) {
      setRestartError(e instanceof Error ? e.message : "Unable to restart.");
    } finally {
      setRestartWorking(false);
    }
  }

  function dismissRestart() {
    setRestartPrompt(null);
    setRestartError(null);
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
    if (previewMode) {
      setError("Preview mode only.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      if (accessRestricted) throw new Error("Your access has been restricted. Contact your teacher.");
      if (consentRequired) throw new Error("Provide audio consent to begin this assessment.");
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
    if (previewMode) {
      setError("Preview mode only.");
      return;
    }
    if (!latest) return;
    setWorking(true);
    setError(null);
    try {
      if (accessRestricted) throw new Error("Your access has been restricted. Contact your teacher.");
      if (consentRequired) throw new Error("Provide audio consent to submit this assessment.");
      if (pledgeRequired) throw new Error("Accept the academic integrity pledge to continue.");
      if (!canSubmitAttempt) {
        throw new Error("Record a response for every question before submitting.");
      }
      const res = await fetch(`/api/student/submissions/${latest.id}/submit`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to submit.");
      setLatest({ ...latest, status: "submitted", submitted_at: new Date().toISOString() });
      if (isPracticeMode) {
        await refreshAssessment();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit.");
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    if (!latest || latest.status !== "started") {
      autoSubmitAttemptedRef.current = false;
      return;
    }
    if (restartPrompt) return;
    if (accessRestricted || consentRequired) return;
    if (!canSubmitAttempt || working) return;
    if (autoSubmitAttemptedRef.current) return;
    autoSubmitAttemptedRef.current = true;
    void submit();
  }, [accessRestricted, canSubmitAttempt, consentRequired, latest?.status, restartPrompt, working]);

  useEffect(() => {
    if (previewMode || !isPracticeMode) return;
    if (!latest || latest.status !== "submitted") return;
    if (feedbackReady) return;
    const interval = setInterval(() => {
      refreshAssessment().catch(() => null);
    }, 2000);
    return () => clearInterval(interval);
  }, [feedbackReady, isPracticeMode, latest?.status, previewMode, refreshAssessment]);

  useEffect(() => {
    if (previewMode || !isPracticeMode) return;
    if (!latest || latest.status !== "submitted") return;
    if (!feedbackReady) return;
    if (practiceRedirectedRef.current) return;
    practiceRedirectedRef.current = true;
    router.replace(`/student/assessments/${assessmentId}/feedback`);
  }, [assessmentId, feedbackReady, isPracticeMode, latest?.status, previewMode, router]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!latest || latest.status !== "started") return;
    if (!assessment?.integrity?.tab_switch_monitor) return;

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        hiddenQuestionIdRef.current = activeQuestion?.id ?? null;
        return;
      }
      if (hiddenAtRef.current == null) return;
      const durationMs = Date.now() - hiddenAtRef.current;
      const questionId = hiddenQuestionIdRef.current;
      hiddenAtRef.current = null;
      hiddenQuestionIdRef.current = null;
      if (durationMs <= 0) return;
      void logIntegrityEvent(latest.id, {
        event_type: "tab_switch",
        duration_ms: durationMs,
        question_id: questionId ?? null,
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeQuestion?.id, assessment?.integrity?.tab_switch_monitor, latest, logIntegrityEvent]);

  useEffect(() => {
    if (!latest || latest.status !== "started") return;
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "PrintScreen") return;
      void logIntegrityEvent(latest.id, {
        event_type: "screenshot_attempt",
        question_id: activeQuestion?.id ?? null,
      });
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [activeQuestion?.id, latest, logIntegrityEvent]);

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
    if (accessRestricted) {
      setRecordingError("Your access has been restricted. Contact your teacher.");
      return;
    }
    if (consentRequired) {
      setRecordingError("Provide audio consent before recording.");
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

    slowStartEligibleRef.current = false;
    const recordedQuestionId = activeQuestion.id;
    if (!isAudioFollowupQuestion && activePrimaryResponse) {
      setRecordingError("This question has already been answered.");
      return;
    }
    if (isAudioFollowupQuestion && activeFollowupResponse) {
      setRecordingError("This follow-up has already been answered.");
      return;
    }
    if (isAudioFollowupQuestion && activePrimaryResponse && !followupPrompt) {
      setRecordingError("Generating a follow-up question. Try again shortly.");
      return;
    }

    const evidenceSetting = isEvidenceFollowup(activeQuestion.question_type) ? "required" : normalizeEvidenceSetting(activeQuestion.evidence_upload);
    if (evidenceSetting === "required" && !activeEvidence) {
      setRecordingError("Upload the required evidence image before recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const audioSamples = new Uint8Array(analyser.fftSize);
      const audioMonitorStartedAt = Date.now();
      let slowStartLogged = false;
      let firstSoundAt: number | null = null;
      let lastSoundAt: number | null = null;
      let pauseActive = false;
      let audioMonitorId: number | null = null;

      const stopAudioMonitor = () => {
        if (audioMonitorId != null) cancelAnimationFrame(audioMonitorId);
        source.disconnect();
        analyser.disconnect();
        void audioContext.close();
      };

      const monitorAudio = () => {
        if (recorder.state !== "recording") return;
        analyser.getByteTimeDomainData(audioSamples);
        let sumSquares = 0;
        for (let i = 0; i < audioSamples.length; i += 1) {
          const v = (audioSamples[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / audioSamples.length);
        const now = Date.now();
        if (rms > AUDIO_ACTIVITY_THRESHOLD) {
          if (firstSoundAt == null) {
            firstSoundAt = now;
            const questionShownAt = questionShownAtRef.current ?? audioMonitorStartedAt;
            const startDeltaMs = now - questionShownAt;
            if (startDeltaMs > 0 && startDeltaMs <= FAST_START_THRESHOLD_MS) {
              void logIntegrityEvent(latest.id, {
                event_type: "fast_start",
                duration_ms: startDeltaMs,
                question_id: recordedQuestionId,
                metadata: { threshold_ms: FAST_START_THRESHOLD_MS },
              });
            }
          }
          lastSoundAt = now;
          pauseActive = false;
        }
        if (
          canGraceRestart &&
          !slowStartEligibleRef.current &&
          firstSoundAt == null &&
          now - audioMonitorStartedAt >= GRACE_RESTART_THRESHOLD_MS
        ) {
          slowStartEligibleRef.current = true;
        }
        if (!slowStartLogged && firstSoundAt == null && now - audioMonitorStartedAt >= SLOW_START_THRESHOLD_MS) {
          slowStartLogged = true;
          void logIntegrityEvent(latest.id, {
            event_type: "slow_start",
            duration_ms: now - audioMonitorStartedAt,
            question_id: recordedQuestionId,
            metadata: { threshold_ms: SLOW_START_THRESHOLD_MS },
          });
        }
        if (firstSoundAt != null) {
          const lastAudioAt = lastSoundAt ?? firstSoundAt;
          const silentMs = now - lastAudioAt;
          const dynamicPauseThreshold = (assessment?.integrity?.pause_threshold_seconds ?? 10) * 1000;

          if (!pauseActive && silentMs >= dynamicPauseThreshold) {
            pauseActive = true;
            void logIntegrityEvent(latest.id, {
              event_type: "long_pause",
              duration_ms: silentMs,
              question_id: recordedQuestionId,
              metadata: { threshold_ms: dynamicPauseThreshold },
            });
          }
        }
        audioMonitorId = requestAnimationFrame(monitorAudio);
      };
      audioMonitorId = requestAnimationFrame(monitorAudio);

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };
      recorder.onstop = async () => {
        const durationMs =
          recordingStartedAtRef.current != null ? Date.now() - recordingStartedAtRef.current : recordingSeconds * 1000;
        try {
          stopAudioMonitor();
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: "audio/webm" });
          if (!blob.size) return;

          const form = new FormData();
          form.set("question_id", activeQuestion.id);
          form.set("duration_seconds", String(recordingSeconds));
          form.set("file", new File([blob], "response.webm", { type: "audio/webm" }));

          setWorking(true);
          const res = await fetch(`/api/student/submissions/${latest.id}/responses`, { method: "POST", body: form });
          const data = (await res.json().catch(() => null)) as
            | { error?: string; restart_hint?: { reason?: "off_topic"; confidence?: number | null } | null }
            | null;
          if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
          const slowStartEligible = slowStartEligibleRef.current;
          await refreshAssessment();
          if (canGraceRestart) {
            if (data?.restart_hint?.reason === "off_topic") {
              setRestartPrompt({ reason: "off_topic", questionId: recordedQuestionId });
            } else if (slowStartEligible) {
              setRestartPrompt({ reason: "slow_start", questionId: recordedQuestionId });
            }
            slowStartEligibleRef.current = false;
          }
        } catch (e) {
          setRecordingError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          recordingStartedAtRef.current = null;
          setWorking(false);
          setRecording(false);
          setMediaRecorder(null);
        }
      };

      setMediaRecorder(recorder);
      recordingStartedAtRef.current = Date.now();
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

  useEffect(() => {
    if (!activeQuestion) {
      autoRecordQuestionId.current = null;
      return;
    }
    if (autoRecordQuestionId.current === activeQuestion.id) return;
    if (recording || working) return;
    if (!latest || latest.status !== "started") return;
    if (audioGateActive) return;
    if (accessRestricted || consentRequired || pledgeRequired) return;
    const readyForRecording = isAudioFollowupQuestion
      ? !activePrimaryResponse || (followupNeeded && Boolean(followupPrompt))
      : !activePrimaryResponse;
    if (!readyForRecording) return;
    const nextEvidenceSetting = isEvidenceFollowup(activeQuestion.question_type) ? "required" : normalizeEvidenceSetting(activeQuestion.evidence_upload);
    if (nextEvidenceSetting === "required" && !activeEvidence) return;

    autoRecordQuestionId.current = activeQuestion.id;
    void beginRecording();
  }, [
    activeEvidence?.id,
    activeQuestion?.id,
    activePrimaryResponse?.id,
    activeFollowupResponse?.id,
    followupPrompt,
    followupNeeded,
    latest?.status,
    isAudioFollowupQuestion,
    pledgeRequired,
    consentRequired,
    accessRestricted,
    audioGateActive,
    recording,
    working,
  ]);

  async function handleEvidenceSelected(file: File) {
    if (!latest || latest.status !== "started") {
      setEvidenceError("Start the assessment before uploading evidence.");
      return;
    }
    if (accessRestricted) {
      setEvidenceError("Your access has been restricted. Contact your teacher.");
      return;
    }
    if (consentRequired) {
      setEvidenceError("Provide audio consent before uploading evidence.");
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
    if (accessRestricted) {
      setEvidenceError("Your access has been restricted. Contact your teacher.");
      return;
    }
    if (consentRequired) {
      setEvidenceError("Provide audio consent before removing evidence.");
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
  const recordingProgress = recordingLimitSeconds
    ? Math.min(100, Math.round((recordingSeconds / recordingLimitSeconds) * 100))
    : 0;

  return (
    <div className="relative min-h-screen px-6 py-10 pb-20">
      {/* Sparkle background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-background dark:to-background" />

      <div className="mx-auto w-full max-w-4xl space-y-6">
        {consentOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950/90 p-6 text-zinc-100 shadow-2xl backdrop-blur-md">
              <div className="text-lg font-semibold">Audio Consent</div>
              <div className="mt-1 text-sm text-zinc-300">
                We record your response audio to share with your teacher and to provide feedback. You can revoke this consent at any time.
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                <li>Your recordings are used only for this assessment.</li>
                <li>We do not train AI models on student recordings.</li>
                <li>You can contact your teacher to revoke access.</li>
              </ul>
              {consentError ? (
                <div className="mt-3 text-sm text-red-300" role="alert">
                  {consentError}
                </div>
              ) : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" disabled={consentWorking} onClick={acceptConsent} className="bg-white text-black hover:bg-zinc-200">
                  {consentWorking ? "Saving…" : "I Agree"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {assessment?.pledge?.enabled === true && pledgeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950/90 p-6 text-zinc-100 shadow-2xl backdrop-blur-md">
              <div className="text-lg font-semibold">Academic Integrity Pledge</div>
              <div className="mt-1 text-sm text-zinc-300">
                Please read and accept before starting. You won’t see questions until you agree.
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                {assessment.pledge.text.split("\n").map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              {pledgeError ? (
                <div className="mt-3 text-sm text-red-300" role="alert">
                  {pledgeError}
                </div>
              ) : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" disabled={pledgeWorking} onClick={acceptPledge} className="bg-white text-black hover:bg-zinc-200">
                  {pledgeWorking ? "Saving…" : "I Agree"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {restartPrompt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950/90 p-6 text-zinc-100 shadow-2xl backdrop-blur-md">
              <div className="text-lg font-semibold">Need a restart?</div>
              <div className="mt-1 text-sm text-zinc-300">
                {restartPrompt.reason === "slow_start"
                  ? "It looks like you needed extra time before speaking. You can restart once if you want a fresh attempt."
                  : "Your response seems off-topic. You can restart once to try again, or continue with this attempt."}
              </div>
              {restartError ? <div className="mt-3 text-sm text-red-300">{restartError}</div> : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" disabled={restartWorking} onClick={dismissRestart} className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800">
                  {restartPrompt.reason === "off_topic" ? "Submit anyway" : "Continue"}
                </Button>
                <Button type="button" disabled={restartWorking} onClick={confirmRestart} className="bg-white text-black hover:bg-zinc-200">
                  {restartWorking ? "Restarting…" : "Restart assessment"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-[var(--text)]">{assessment?.title ?? "Assessment"}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {latest ? `Attempt: ${latest.status}` : "Start when you’re ready."}
              {isPracticeMode ? " • Practice mode" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/student">
              <Button type="button" variant="secondary" className="bg-white/50 backdrop-blur-sm border-[var(--border)]">
                Back
              </Button>
            </Link>
          </div>
        </div>

        {previewMode ? <div className="text-sm text-[var(--muted)] bg-amber-50 border border-amber-100 p-2 rounded-md">Preview mode: student actions are disabled.</div> : null}
        {error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md" role="alert">
            {error}
          </div>
        ) : null}
        {accessRestricted ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md" role="alert">
            Your access has been restricted. Contact your teacher for help.
          </div>
        ) : null}
        {loading ? <div className="text-sm text-[var(--muted)] animate-pulse">Loading assessment...</div> : null}

        {assessment ? (
          <div className="space-y-6">
            {assessment.asset_url ? (
              <Card className="overflow-hidden border-0 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assessment.asset_url} alt={`${assessment.title} cover`} className="h-48 w-full object-cover" />
              </Card>
            ) : null}

            {documentPdf ? (
              <Card className="overflow-hidden border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm shadow-sm">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Reference PDF</CardTitle>
                    <CardDescription>Review the document before you start.</CardDescription>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setPdfOpen(true)}>
                    Full screen
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {documentPdf.original_filename?.trim() || "Attached PDF"}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <iframe
                      title="Reference PDF"
                      src={pdfInlineUrl}
                      className="h-[520px] w-full"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Scroll to zoom or open full screen for detail.</span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => window.open(documentPdf.asset_url, "_blank", "noopener,noreferrer")}
                    >
                      Open in new tab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {documentPdf && pdfOpen ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby={pdfDialogTitleId}
                tabIndex={-1}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setPdfOpen(false);
                }}
              >
                <div className="flex h-full w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,23,42,0.95)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-[var(--muted)]" id={pdfDialogTitleId}>
                      {documentPdf.original_filename?.trim() || "Attached PDF"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.open(documentPdf.asset_url, "_blank", "noopener,noreferrer")}
                        className="text-white hover:bg-white/10"
                      >
                        Open in new tab
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setPdfOpen(false)}
                        ref={pdfCloseRef}
                        className="bg-white text-black hover:bg-zinc-200 border-0"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <iframe title="Reference PDF" src={pdfInlineUrl} className="h-full w-full" />
                  </div>
                </div>
              </div>
            ) : null}

            <Card className="border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>This is an assessment. Questions are revealed one at a time after you start.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted)] leading-relaxed">
                {assessment.instructions?.trim() ? assessment.instructions : "No instructions provided."}
              </CardContent>
            </Card>

            {!started ? (
              <Card className="border-[var(--border)] bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm shadow-md">
                <CardHeader>
                  <CardTitle className="text-indigo-900">Ready?</CardTitle>
                  <CardDescription className="text-indigo-700">
                    This assessment has {total} question{total === 1 ? "" : "s"}. Once you start, you will see one question at a time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="text-sm text-indigo-600/80">When you click Start, you should be ready to answer immediately.</div>
                  <Button
                    type="button"
                    disabled={previewMode || working || (latest?.status === "submitted" && !isPracticeMode) || accessRestricted || consentRequired}
                    onClick={startOrResume}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-md"
                  >
                    {working ? "Starting…" : "Start Assessment"}
                  </Button>
                </CardContent>
              </Card>
            ) : latest?.status === "submitted" ? (
              <Card className="border-emerald-100 bg-emerald-50/50 backdrop-blur-sm shadow-sm">
                <CardHeader>
                  <CardTitle className="text-emerald-900">{isPracticeMode ? "Practice Complete" : "Submitted"}</CardTitle>
                  <CardDescription className="text-emerald-700">
                    {isPracticeMode
                      ? "This was a practice attempt. You can try again whenever you're ready."
                      : "Your responses have been submitted."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-emerald-600/80">
                    {isPracticeMode
                      ? feedbackReady
                        ? "Your practice feedback is ready."
                        : "Scoring your practice attempt now. This usually takes under a minute."
                      : feedbackReady
                        ? "Your teacher has released verified feedback."
                        : "Your teacher will review and release feedback soon."}
                  </div>
                  {feedbackReady ? (
                    <Link href={`/student/assessments/${assessmentId}/feedback`}>
                      <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">View Feedback</Button>
                    </Link>
                  ) : null}
                  {isPracticeMode ? (
                    <Button
                      type="button"
                      disabled={previewMode || working || accessRestricted || consentRequired}
                      onClick={startOrResume}
                      variant="secondary"
                    >
                      {working ? "Starting…" : "Start Another Attempt"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : audioGateActive && audioIntro ? (
              <Card className="border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm shadow-sm">
                <CardHeader>
                  <CardTitle>Audio Intro</CardTitle>
                  <CardDescription>Listen to the full audio before your questions appear.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text)]">
                    <span>{audioIntro.original_filename?.trim() || "Audio intro"}</span>
                    <span>{formatDuration(audioIntro.duration_seconds)}</span>
                  </div>
                  <audio
                    controls
                    src={audioIntro.asset_url}
                    className="w-full rounded-md shadow-sm"
                    onEnded={() => setAudioIntroCompleted(true)}
                  />
                  <div className="text-xs text-[var(--muted)]">Once the audio finishes, your first question will appear.</div>
                </CardContent>
              </Card>
            ) : activeQuestion ? (
              <Card className="border-[var(--border)] bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm shadow-xl ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>
                    Question {activeQuestion.order_index} of {total}
                  </CardTitle>
                  <CardDescription>Progress: {attempted}/{total} completed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                      {followupNeeded ? "Follow-up question" : "Question"}
                    </div>
                    <div className="mt-3 text-lg font-medium text-[var(--text)] leading-relaxed">
                      {followupNeeded && followupPrompt ? followupPrompt : activeQuestion.question_text}
                    </div>
                  </div>

                  {isAudioFollowupQuestion && followupNeeded ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900 animate-in fade-in slide-in-from-top-2">
                      <div className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">AI follow-up prompt</div>
                      {followupPrompt ? (
                        <div className="mt-2 text-base text-emerald-900 font-medium">{followupPrompt}</div>
                      ) : (
                        <div className="mt-2 text-sm text-emerald-700 italic">Generating follow-up question…</div>
                      )}
                    </div>
                  ) : null}

                  {evidenceSetting !== "disabled" ? (
                    <div className="rounded-xl border border-[var(--border)] bg-white/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--text)]">Evidence</div>
                          <div className="mt-0.5 text-xs text-[var(--muted)]">
                            {evidenceSetting === "required"
                              ? isEvidenceFollowupQuestion
                                ? "Required. Upload to generate follow-up questions."
                                : "Required before recording."
                              : "Optional. Upload a photo of your work."}
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
                              disabled={working || evidenceUploading}
                              onClick={() => evidenceInputRef.current?.click()}
                              className="bg-white border-[var(--border)]"
                            >
                              {evidenceUploading ? "Uploading…" : "Upload Evidence"}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={working || evidenceUploading}
                              onClick={removeEvidence}
                              className="bg-white border-[var(--border)]"
                            >
                              {evidenceUploading ? "Removing…" : "Remove"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {evidenceLoading ? <div className="mt-3 text-xs text-[var(--muted)] animate-pulse">Loading evidence…</div> : null}
                      {evidenceError ? (
                        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100" role="alert">
                          {evidenceError}
                        </div>
                      ) : null}
                      {activeEvidence ? (
                        <div className="mt-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeEvidence.signed_url}
                            alt="Evidence upload preview"
                            className="max-h-80 w-full rounded-lg border border-[var(--border)] object-contain bg-white shadow-sm"
                          />
                          <div className="mt-2 text-xs text-[var(--muted)] text-right">
                            Uploaded {new Date(activeEvidence.uploaded_at).toLocaleString()}
                          </div>
                          {isEvidenceFollowupQuestion ? (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900">
                              <div className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">AI Analysis</div>
                              {evidenceAnalysis ? (
                                <>
                                  {evidenceAnalysis.summary ? (
                                    <div className="mt-2 text-sm text-emerald-800">{evidenceAnalysis.summary}</div>
                                  ) : null}
                                  {evidenceAnalysis.questions.length ? (
                                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-emerald-900 font-medium">
                                      {evidenceAnalysis.questions.map((item, idx) => (
                                        <li key={`${activeEvidence.id}-followup-${idx}`}>{item}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="mt-2 text-xs text-emerald-700 italic">No follow-up questions generated.</div>
                                  )}
                                </>
                              ) : (
                                <div className="mt-2 text-xs text-emerald-700 italic animate-pulse">Analyzing image...</div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-[var(--text)]">
                        {followupNeeded ? "Record your follow-up response" : "Record your response"}
                      </div>
                      <div className="text-xs font-mono text-[var(--muted)] bg-[var(--surface)] px-2 py-1 rounded">
                        {recording ? `${recordingSeconds}s / ${recordingLimitSeconds}s` : `Limit: ${recordingLimitSeconds}s`}
                      </div>
                    </div>
                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-100 shadow-inner">
                      <div
                        className={`h-full transition-all duration-300 ${recording ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-300"}`}
                        style={{ width: `${recording ? recordingProgress : 0}%` }}
                      />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      {recording ? (
                        <div className="flex items-center gap-2">
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                          <span className="text-sm text-red-600 font-medium animate-pulse">Recording...</span>
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--muted)]">
                          Recording starts automatically when the question appears.
                        </div>
                      )}

                      {recording ? (
                        <Button type="button" variant="secondary" disabled={working} onClick={stopRecording} className="bg-red-600 text-white hover:bg-red-700 border-0 shadow-md">
                          Stop Recording
                        </Button>
                      ) : null}

                      {working ? <span className="text-sm text-zinc-600">Saving response...</span> : null}
                    </div>
                    {recordingError ? (
                      <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100" role="alert">
                        {recordingError}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-indigo-100 bg-indigo-50/50 backdrop-blur-sm shadow-md text-center py-8">
                <CardHeader>
                  <CardTitle className="text-indigo-900 text-2xl">All questions answered!</CardTitle>
                  <CardDescription className="text-indigo-700 text-lg">You're ready to submit.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                  <div className="text-sm text-indigo-600/80 max-w-md">You cannot change responses after submitting. Make sure you are happy with your answers.</div>
                  <Button type="button" disabled={working || !canSubmitAttempt} onClick={submit} className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    Submit Assessment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
