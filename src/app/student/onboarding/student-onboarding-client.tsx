"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OnboardingStatus = {
  completed: boolean;
  completed_at: string | null;
};

type MeResponse = {
  onboarding?: OnboardingStatus;
  error?: string;
};

type Step = "intro" | "record" | "playback" | "done";

export function StudentOnboardingClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const limitSeconds = 10;

  const questionText =
    "Practice question: Say your name and one thing you’re excited to learn this week. Keep it under 10 seconds.";

  const canProceedToPlayback = useMemo(() => Boolean(audioUrl), [audioUrl]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/me", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as MeResponse | null;
        if (!res.ok) throw new Error(data?.error ?? "Unable to load profile.");
        if (data?.onboarding?.completed) {
          router.replace("/student");
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    if (recordingSeconds >= limitSeconds && mediaRecorder?.state === "recording") {
      mediaRecorder.stop();
    }
  }, [limitSeconds, mediaRecorder, recording, recordingSeconds]);

  async function beginRecording() {
    setRecordingError(null);
    setError(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const chunks: BlobPart[] = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (!blob.size) {
          setRecordingError("No audio captured. Try again.");
          setRecording(false);
          setMediaRecorder(null);
          return;
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecording(false);
        setMediaRecorder(null);
        setStep("playback");
      };

      setMediaRecorder(recorder);
      setRecording(true);
      setStep("record");
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

  async function completeOnboarding() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/student/onboarding", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to finish onboarding.");
      setStep("done");
      router.replace("/student");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to finish onboarding.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Welcome to Veritas</h1>
          <p className="mt-1 text-sm text-zinc-600">Quick audio check (first time only).</p>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {loading ? <div className="text-sm text-zinc-600">Loading…</div> : null}

        {!loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Practice Assessment</CardTitle>
              <CardDescription>
                This is just a test so you can confirm your microphone works. This recording is not submitted to your
                teacher.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-900">{questionText}</div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900">
                    {step === "playback" ? "Playback" : "Record"}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {recording ? `Recording: ${recordingSeconds}s / ${limitSeconds}s` : `Limit: ${limitSeconds}s`}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!recording ? (
                    <Button type="button" disabled={working} onClick={beginRecording}>
                      {audioUrl ? "Re-record" : "Start Recording"}
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" disabled={working} onClick={stopRecording}>
                      Stop
                    </Button>
                  )}

                  {recordingError ? <span className="text-sm text-red-600">{recordingError}</span> : null}
                </div>

                {audioUrl ? (
                  <div className="mt-4 space-y-3">
                    <audio controls src={audioUrl} className="w-full" />
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="secondary" disabled={working} onClick={beginRecording}>
                        Try Again
                      </Button>
                      <Button type="button" disabled={working || !canProceedToPlayback} onClick={completeOnboarding}>
                        {working ? "Finishing…" : "Audio Works — Continue"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

