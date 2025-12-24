"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type ClassRow = { id: string; name: string };
type AuthoringMode = "manual" | "upload" | "ai";

type Assessment = {
  id: string;
  class_id: string | null;
  title: string;
  subject: string | null;
  target_language: string | null;
  instructions: string | null;
  status: "draft" | "live" | "closed";
  authoring_mode: AuthoringMode;
  socratic_enabled?: boolean;
  socratic_follow_ups?: number;
  classes?: { name?: string | null } | null;
  assessment_integrity: {
    pause_threshold_seconds: number | null;
    tab_switch_monitor: boolean;
    shuffle_questions: boolean;
    pledge_enabled?: boolean;
    recording_limit_seconds: number;
    viewing_timer_seconds: number;
  } | null;
};

type Question = {
  id: string;
  question_text: string;
  question_type?: string | null;
  order_index: number;
};

type AssessmentAsset = {
  id: string;
  assessment_id: string;
  asset_type: string;
  asset_url: string;
  generation_prompt: string | null;
  created_at: string;
};

type RubricType = "reasoning" | "evidence";
type Rubric = {
  id: string;
  assessment_id: string;
  rubric_type: RubricType;
  instructions: string;
  scale_min: number;
  scale_max: number;
  created_at: string;
};

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err) return err;
  }
  return "Request failed.";
}

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(getErrorMessage(data));
  return data as T;
}

const steps = [
  { n: 1, label: "Start" },
  { n: 2, label: "General Info" },
  { n: 3, label: "Visual Assets" },
  { n: 4, label: "Questions" },
  { n: 5, label: "Rubrics" },
] as const;

type StepNumber = (typeof steps)[number]["n"];

export function AssessmentWizard({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = Number(searchParams.get("step") ?? "1") || 1;
  const step = (steps.some((s) => s.n === rawStep) ? rawStep : 1) as StepNumber;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [startAiPrompt, setStartAiPrompt] = useState("");
  const [startQuestionCount, setStartQuestionCount] = useState(3);
  const [startPdfFile, setStartPdfFile] = useState<File | null>(null);
  const [assetUrl, setAssetUrl] = useState("");
  const [assetPrompt, setAssetPrompt] = useState("");
  const [assetOptions, setAssetOptions] = useState<string[]>([]);
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState("");
  const [editingQuestionType, setEditingQuestionType] = useState("");
  const [rubrics, setRubrics] = useState<Record<RubricType, Rubric | null>>({
    reasoning: null,
    evidence: null,
  });
  const [rubricDrafts, setRubricDrafts] = useState<Record<RubricType, { instructions: string; scale_min: number; scale_max: number }>>({
    reasoning: { instructions: "", scale_min: 1, scale_max: 5 },
    evidence: { instructions: "", scale_min: 1, scale_max: 5 },
  });
  const [rubricTouched, setRubricTouched] = useState<Record<RubricType, boolean>>({ reasoning: false, evidence: false });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [classTouched, setClassTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readonly = assessment?.status !== "draft";

  useEffect(() => {
    (async () => {
      try {
        const data = await jsonFetch<{ classes: ClassRow[] }>("/api/classes", { cache: "no-store" });
        setClasses(data.classes ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load classes.");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const [data, q, assetResult, rubricsResult] = await Promise.all([
      jsonFetch<{ assessment: Assessment }>(`/api/assessments/${assessmentId}`, { cache: "no-store" }),
      jsonFetch<{ questions: Question[] }>(`/api/assessments/${assessmentId}/questions`, { cache: "no-store" }),
      jsonFetch<{ asset: AssessmentAsset | null }>(`/api/assessments/${assessmentId}/asset`, { cache: "no-store" }).catch(
        () => ({ asset: null }),
      ),
      jsonFetch<{ rubrics: Rubric[] }>(`/api/assessments/${assessmentId}/rubrics`, { cache: "no-store" }).catch(() => ({ rubrics: [] })),
    ]);

    setAssessment(data.assessment);

    setQuestions(q.questions);
    setQuestionsCount(q.questions.length);

    setAssetUrl(assetResult.asset?.asset_url ?? "");
    setAssetPrompt(assetResult.asset?.generation_prompt ?? "");

    const next: Record<RubricType, Rubric | null> = { reasoning: null, evidence: null };
    for (const item of rubricsResult.rubrics) {
      if (item.rubric_type === "reasoning" || item.rubric_type === "evidence") next[item.rubric_type] = item;
    }
    setRubrics(next);
    setRubricDrafts({
      reasoning: next.reasoning
        ? { instructions: next.reasoning.instructions, scale_min: next.reasoning.scale_min, scale_max: next.reasoning.scale_max }
        : { instructions: "", scale_min: 1, scale_max: 5 },
      evidence: next.evidence
        ? { instructions: next.evidence.instructions, scale_min: next.evidence.scale_min, scale_max: next.evidence.scale_max }
        : { instructions: "", scale_min: 1, scale_max: 5 },
    });
  }, [assessmentId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Load failed."));
  }, [load]);

  const startComplete = Boolean(assessment?.title?.trim()) && Boolean(assessment?.class_id);
  const questionsComplete = questionsCount > 0;
  const maxEnabledStep: StepNumber = !startComplete ? 1 : !questionsComplete ? 4 : 5;

  const persistDraft = useCallback(
    async (silent?: boolean) => {
      if (!assessment || readonly) return;
      setSaving(true);
      setError(null);
      try {
        await jsonFetch(`/api/assessments/${assessmentId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            class_id: assessment.class_id,
            title: assessment.title,
            subject: assessment.subject,
            target_language: assessment.target_language,
            instructions: assessment.instructions,
            authoring_mode: assessment.authoring_mode,
            socratic_enabled: Boolean(assessment.socratic_enabled),
            socratic_follow_ups: Math.min(2, Math.max(1, Number(assessment.socratic_follow_ups ?? 1))),
          }),
        });
        setDirty(false);
        setLastSavedAt(Date.now());
        if (!silent) await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
      } finally {
        setSaving(false);
      }
    },
    [assessment, assessmentId, load, readonly],
  );

  useEffect(() => {
    if (!assessment) return;
    if (step > maxEnabledStep) {
      router.replace(`/assessments/${assessmentId}?step=${maxEnabledStep}`);
    }
  }, [assessment, assessmentId, maxEnabledStep, router, step]);

  // Autosave assessment metadata: save every 3s while dirty.
  useEffect(() => {
    if (!assessment || readonly) return;
    const t = setInterval(() => {
      if (!dirty || saving) return;
      void persistDraft(true);
    }, 3000);
    return () => {
      clearInterval(t);
    };
  }, [assessment, dirty, persistDraft, readonly, saving]);

  const canContinue = useMemo(() => {
    if (!assessment) return false;
    if (step === 1) {
      if (!assessment.class_id) return false;
      if (!assessment.title.trim()) return false;
      if (assessment.authoring_mode === "upload") return Boolean(startPdfFile);
      if (assessment.authoring_mode === "ai") return startAiPrompt.trim().length >= 20;
      return true;
    }
    return true;
  }, [assessment, startAiPrompt, startPdfFile, step]);

  async function saveDraft() {
    await persistDraft(false);
  }

  async function publish() {
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/assessments/${assessmentId}/publish`, { method: "POST" });
      router.push(`/assessments/${assessmentId}/results`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setSaving(false);
    }
  }

  async function updateIntegrity(next: Partial<NonNullable<Assessment["assessment_integrity"]>>) {
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/assessments/${assessmentId}/integrity`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSocratic(next: { socratic_enabled?: boolean; socratic_follow_ups?: number }) {
    if (readonly) return;
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          socratic_enabled: typeof next.socratic_enabled === "boolean" ? next.socratic_enabled : assessment.socratic_enabled,
          socratic_follow_ups: typeof next.socratic_follow_ups === "number" ? next.socratic_follow_ups : assessment.socratic_follow_ups,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function goToStep(n: StepNumber) {
    router.push(`/assessments/${assessmentId}?step=${n}`);
  }

  if (!assessment) {
    return <div className="text-sm text-[var(--muted)]">{error ?? "Loading…"}</div>;
  }

  const integrity = assessment.assessment_integrity ?? {
    pause_threshold_seconds: 2.5,
    tab_switch_monitor: true,
    shuffle_questions: true,
    pledge_enabled: false,
    recording_limit_seconds: 60,
    viewing_timer_seconds: 20,
  };

  const titleError = titleTouched && !assessment.title.trim() ? "Assessment title is required." : null;
  const classError = classTouched && !assessment.class_id ? "Class is required." : null;
  const pausingEnabled = integrity.pause_threshold_seconds !== null;
  const questionRequiredError =
    step >= 5 && startComplete && !questionsComplete ? "Add at least one question to continue." : null;
  const rubricsComplete = Boolean(rubrics.reasoning && rubrics.evidence);
  const canPublish =
    !readonly && step === 5 && startComplete && questionsComplete && rubricsComplete && !saving;
  const className = assessment.classes?.name?.trim() || null;

  async function saveAssetAndContinue() {
    if (readonly) return;
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/assessments/${assessmentId}/asset`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          asset_url: assetUrl.trim() || null,
          generation_prompt: assetPrompt.trim() || null,
        }),
      });
      await load();
      goToStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function generateAssetFromPrompt() {
    if (readonly) return;
    const prompt = assetPrompt.trim();
    if (!prompt) return;
    setSaving(true);
    setError(null);
    try {
      const data = await jsonFetch<{ ok: true; urls: string[] }>(`/api/assessments/${assessmentId}/asset/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, count: 3 }),
      });
      setAssetOptions(data.urls);
      // Preselect first option
      if (data.urls[0]) setAssetUrl(data.urls[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setSaving(false);
    }
  }

  async function addQuestion() {
    if (!newQuestionText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/assessments/${assessmentId}/questions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question_text: newQuestionText.trim(), question_type: newQuestionType.trim() || null }),
      });
      setNewQuestionText("");
      setNewQuestionType("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function startEditQuestion(q: Question) {
    setEditingQuestionId(q.id);
    setEditingQuestionText(q.question_text);
    setEditingQuestionType(q.question_type ?? "");
  }

  async function saveEditedQuestion() {
    if (!editingQuestionId) return;
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/questions/${editingQuestionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question_text: editingQuestionText.trim(),
          question_type: editingQuestionType.trim() || null,
        }),
      });
      setEditingQuestionId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(id: string) {
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/questions/${id}`, { method: "DELETE" });
      if (editingQuestionId === id) setEditingQuestionId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRubric(type: RubricType) {
    const draft = rubricDrafts[type];
    if (!draft.instructions.trim()) return;
    if (draft.scale_min >= draft.scale_max) {
      setError("Rubric scale must have min < max.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/assessments/${assessmentId}/rubrics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rubric_type: type,
          instructions: draft.instructions.trim(),
          scale_min: draft.scale_min,
          scale_max: draft.scale_max,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Veritas Assess Builder</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create high-integrity oral assessments{className ? ` for ${className}` : ""} • Status:{" "}
            {assessment.status.toUpperCase()} • Questions: {questionsCount}
            {lastSavedAt ? ` • Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => router.push("/assessments")}>
            Back
          </Button>
          <Button type="button" variant="secondary" disabled={saving || readonly} onClick={saveDraft}>
            {saving ? "Saving…" : "Save Draft"}
          </Button>
          <Button type="button" disabled={!canPublish} onClick={publish}>
            Publish to Class
          </Button>
        </div>
      </div>

      {error ? <div className="mb-4 text-sm text-[var(--danger)]">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[800px_350px]">
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-[var(--text)]">Builder Steps</div>
              <div className="text-xs text-[var(--muted)]">Completed steps stay clickable. Unfinished steps are disabled.</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {steps.map((s) => {
                const active = s.n === step;
                const disabled = s.n > maxEnabledStep;
                return (
                  <button
                    key={s.n}
                    type="button"
                    disabled={disabled}
                    onClick={() => goToStep(s.n)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors border-[var(--border)] ${
                      active ? "bg-[var(--border)] text-[var(--text)]" : "bg-transparent text-[var(--muted)]"
                    } ${
                      disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[var(--primary)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        active ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
                      }`}
                    >
                      {s.n}
                    </span>
                    <span className="whitespace-nowrap">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {step === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Start</CardTitle>
                <CardDescription>Choose how to create it, then set the basics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(
                    [
                      { key: "manual", title: "Start from scratch", desc: "Fill out the wizard step-by-step." },
                      { key: "upload", title: "Upload existing material", desc: "Upload a PDF; we extract text and generate a draft." },
                      { key: "ai", title: "Generate with AI", desc: "Describe what you want; we generate a draft to review." },
                    ] as const
                  ).map((m) => (
                    <Card key={m.key} className={assessment.authoring_mode === m.key ? "ring-1 ring-[var(--primary)]" : ""}>
                      <CardHeader>
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <CardDescription>{m.desc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          type="button"
                          variant={assessment.authoring_mode === m.key ? "primary" : "secondary"}
                          onClick={() => {
                            setAssessment({ ...assessment, authoring_mode: m.key });
                            if (m.key !== "ai") setStartAiPrompt("");
                            if (m.key !== "upload") setStartPdfFile(null);
                            setDirty(true);
                          }}
                          disabled={readonly}
                        >
                          {assessment.authoring_mode === m.key ? "Selected" : "Select"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <select
                    id="class"
                    className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                    value={assessment.class_id ?? ""}
                    onChange={(e) => {
                      setAssessment({ ...assessment, class_id: e.target.value || null });
                      setDirty(true);
                    }}
                    onBlur={() => setClassTouched(true)}
                    disabled={readonly}
                  >
                    <option value="">Select…</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!classes.length ? <div className="text-xs text-[var(--muted)]">No classes found. Create one first.</div> : null}
                  {classError ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--danger)]">
                      <span aria-hidden="true">⛔</span>
                      <span>{classError}</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Assessment title</Label>
                  <Input
                    id="title"
                    maxLength={100}
                    value={assessment.title}
                    onChange={(e) => {
                      setAssessment({ ...assessment, title: e.target.value });
                      setDirty(true);
                    }}
                    onBlur={() => {
                      setTitleTouched(true);
                      if (dirty && !saving) void persistDraft(true);
                    }}
                    disabled={readonly}
                  />
                  {titleError ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--danger)]">
                      <span aria-hidden="true">⛔</span>
                      <span>{titleError}</span>
                    </div>
                  ) : null}
                </div>

                {assessment.authoring_mode === "upload" ? (
                  <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdfUpload">Upload PDF</Label>
                      <input
                        id="pdfUpload"
                        type="file"
                        accept="application/pdf"
                        className="block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--border)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--text)] hover:file:bg-[var(--primary)] hover:file:text-white"
                        disabled={readonly || saving}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setStartPdfFile(f);
                        }}
                      />
                      <div className="text-xs text-[var(--muted)]">
                        We do not store the PDF; only generated questions and rubrics are saved.
                      </div>
                      {startPdfFile ? (
                        <div className="text-xs text-[var(--muted)]">
                          Selected: <span className="text-[var(--text)]">{startPdfFile.name}</span> (
                          {(startPdfFile.size / (1024 * 1024)).toFixed(2)}MB)
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pdfQCount">Number of questions</Label>
                        <select
                          id="pdfQCount"
                          className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                          value={startQuestionCount}
                          onChange={(e) => setStartQuestionCount(Number(e.target.value))}
                          disabled={readonly || saving}
                        >
                          {[1, 2, 3, 4, 5].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end justify-end">
                        <div className="text-xs text-[var(--muted)]">We&apos;ll generate title, questions, and both rubrics.</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {assessment.authoring_mode === "ai" ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="aiPrompt">Describe the assessment you want</Label>
                      <textarea
                        id="aiPrompt"
                        className="min-h-32 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                        placeholder='Example: “Create a 3-question oral assessment for 10th grade US History on causes of the Civil War. Include an image-based prompt, and rubrics for reasoning and evidence.”'
                        value={startAiPrompt}
                        onChange={(e) => setStartAiPrompt(e.target.value)}
                        disabled={readonly || saving}
                      />
                      <div className="text-xs text-[var(--muted)]">Minimum 20 characters.</div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="qCount">Number of questions</Label>
                        <select
                          id="qCount"
                          className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                          value={startQuestionCount}
                          onChange={(e) => setStartQuestionCount(Number(e.target.value))}
                          disabled={readonly || saving}
                        >
                          {[1, 2, 3, 4, 5].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end justify-end">
                        <div className="text-xs text-[var(--muted)]">
                          We&apos;ll generate title, questions, and both rubrics (plus an image prompt).
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={readonly || !canContinue}
                    onClick={() => {
                      setTitleTouched(true);
                      setClassTouched(true);
                      if (!assessment.title.trim() || !assessment.class_id) return;
                      if (assessment.authoring_mode === "upload") {
                        if (!startPdfFile) return;
                        void (async () => {
                          setSaving(true);
                          setError(null);
                          try {
                            await persistDraft(true);
                            const form = new FormData();
                            form.set("file", startPdfFile);
                            form.set("question_count", String(startQuestionCount));
                            const res = await fetch(`/api/assessments/${assessmentId}/upload`, { method: "POST", body: form });
                            const payload: unknown = await res.json().catch(() => null);
                            if (!res.ok) throw new Error(getErrorMessage(payload));
                            setStartPdfFile(null);
                            await load();
                            goToStep(2);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Upload generation failed.");
                          } finally {
                            setSaving(false);
                          }
                        })();
                        return;
                      }

                      if (assessment.authoring_mode === "ai") {
                        const prompt = startAiPrompt.trim();
                        if (prompt.length < 20) return;
                        void (async () => {
                          setSaving(true);
                          setError(null);
                          try {
                            await persistDraft(true);
                            await jsonFetch(`/api/assessments/${assessmentId}/generate`, {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ prompt, question_count: startQuestionCount }),
                            });
                            await load();
                            goToStep(2);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "AI generation failed.");
                          } finally {
                            setSaving(false);
                          }
                        })();
                        return;
                      }

                      if (dirty && !saving) void persistDraft(true);
                      goToStep(2);
                    }}
                  >
                    {assessment.authoring_mode === "ai" || assessment.authoring_mode === "upload"
                      ? saving
                        ? "Generating…"
                        : "Generate Draft"
                      : "Continue →"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : step === 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>General Info</CardTitle>
                <CardDescription>Draft saves on blur (and every 3 seconds while typing).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <select
                      id="subject"
                      className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                      value={assessment.subject ?? ""}
                      onChange={(e) => {
                        setAssessment({ ...assessment, subject: e.target.value || null });
                        setDirty(true);
                      }}
                      onBlur={() => {
                        if (dirty && !saving) void persistDraft(true);
                      }}
                      disabled={readonly}
                    >
                      <option value="">Select…</option>
                      {["History", "Science", "Literature", "Math", "Language Arts", "Other"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lang">Target language</Label>
                    <select
                      id="lang"
                      className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                      value={assessment.target_language ?? ""}
                      onChange={(e) => {
                        setAssessment({ ...assessment, target_language: e.target.value || null });
                        setDirty(true);
                      }}
                      onBlur={() => {
                        if (dirty && !saving) void persistDraft(true);
                      }}
                      disabled={readonly}
                    >
                      <option value="">Select…</option>
                      {["English US", "Spanish", "French", "Mandarin", "Arabic", "Other"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Student instructions</Label>
                  <textarea
                    id="instructions"
                    maxLength={500}
                    className="min-h-28 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                    placeholder="Explain what students should do and how to respond."
                    value={assessment.instructions ?? ""}
                    onChange={(e) => {
                      setAssessment({ ...assessment, instructions: e.target.value || null });
                      setDirty(true);
                    }}
                    onBlur={() => {
                      if (dirty && !saving) void persistDraft(true);
                    }}
                    disabled={readonly}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="secondary" disabled={saving} onClick={() => goToStep(1)}>
                    ← Back
                  </Button>
                  <Button type="button" disabled={saving || readonly} onClick={() => goToStep(3)}>
                    Continue →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : step === 3 ? (
            <Card>
              <CardHeader>
                <CardTitle>Visual Assets</CardTitle>
                <CardDescription>Generate options or paste a URL. Choose one image to anchor the assessment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assetPrompt">Image description (optional)</Label>
                  <textarea
                    id="assetPrompt"
                    maxLength={1000}
                    className="min-h-24 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                    placeholder="e.g., “A factory floor during the 1850s…”"
                    value={assetPrompt}
                    onChange={(e) => setAssetPrompt(e.target.value)}
                    disabled={readonly}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-[var(--muted)]">
                      Use this prompt to generate an image, or paste your own URL below.
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={saving || readonly || !assetPrompt.trim()}
                      onClick={generateAssetFromPrompt}
                    >
                      {saving ? "Generating…" : "Generate 3 Options"}
                    </Button>
                  </div>
                </div>

                {assetOptions.length ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-[var(--text)]">Choose an option</div>
                      <div className="text-xs text-[var(--muted)]">Click to select</div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {assetOptions.map((url) => {
                        const selected = url === assetUrl.trim();
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setAssetUrl(url)}
                            className={`overflow-hidden rounded-md border transition-colors border-[var(--border)] ${
                              selected ? "ring-2 ring-[var(--primary)]" : "hover:border-[var(--primary)]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Generated option" className="h-40 w-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="assetUrl">Image URL</Label>
                  <Input
                    id="assetUrl"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder="https://…"
                    disabled={readonly}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    If you generate an image, this will auto-fill. You can also paste a public image URL.
                  </p>
                </div>

                {assetUrl.trim() ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-[var(--text)]">Preview</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl.trim()}
                      alt="Selected assessment asset"
                      className="max-h-72 w-full rounded-md border border-[var(--border)] object-cover"
                    />
                  </div>
                ) : null}

                <div className="text-xs text-[var(--muted)]">
                  Visuals are optional for publishing. Add one if you want an image-based anchor prompt.
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving || readonly}
                    onClick={async () => {
                      setSaving(true);
                      setError(null);
                      try {
                        await jsonFetch(`/api/assessments/${assessmentId}/asset`, {
                          method: "PUT",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ asset_url: null, generation_prompt: null }),
                        });
                        await load();
                        setAssetOptions([]);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Save failed.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Clear
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" disabled={saving} onClick={() => goToStep(2)}>
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        if (!assetUrl.trim()) {
                          goToStep(4);
                          return;
                        }
                        void saveAssetAndContinue();
                      }}
                    >
                      {assetUrl.trim() ? "Save & Continue →" : "Continue →"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : step === 4 ? (
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add at least one question. You can edit later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[var(--text)]">Question list</div>
                    <div className="text-xs text-[var(--muted)]">{questionsCount} total</div>
                  </div>

                  {questions.length ? (
                    <div className="space-y-3">
                      {questions.map((q) => {
                        const editing = editingQuestionId === q.id;
                        return (
                          <div key={q.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                                  QUESTION {q.order_index}
                                </span>
                                <span className="text-xs text-[var(--muted)]">{q.question_type ?? "open_response"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {editing ? (
                                  <>
                                    <Button type="button" variant="secondary" disabled={saving} onClick={() => setEditingQuestionId(null)}>
                                      Cancel
                                    </Button>
                                    <Button type="button" disabled={saving || !editingQuestionText.trim()} onClick={saveEditedQuestion}>
                                      Save
                                    </Button>
                                  </>
                                ) : (
                                  <Button type="button" variant="secondary" disabled={saving || readonly} onClick={() => startEditQuestion(q)}>
                                    Edit
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disabled={saving || readonly}
                                  onClick={() => deleteQuestion(q.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>

                            <div className="mt-3 space-y-3">
                              {editing ? (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor={`q-${q.id}`}>Question text</Label>
                                    <textarea
                                      id={`q-${q.id}`}
                                      maxLength={500}
                                      className="min-h-20 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                                      value={editingQuestionText}
                                      onChange={(e) => setEditingQuestionText(e.target.value)}
                                      disabled={saving}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label htmlFor={`qt-${q.id}`}>Question type</Label>
                                      <Input
                                        id={`qt-${q.id}`}
                                        value={editingQuestionType}
                                        onChange={(e) => setEditingQuestionType(e.target.value)}
                                        disabled={saving}
                                      />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm italic text-[var(--text)]">“{q.question_text}”</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">No questions yet.</div>
                  )}
                </div>

                {addingQuestion ? (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="text-sm font-medium text-[var(--text)]">Add Question to Bank</div>
                    <div className="mt-3 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="newQuestionText">Question text</Label>
                        <textarea
                          id="newQuestionText"
                          maxLength={500}
                          className="min-h-24 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          disabled={readonly || saving}
                          placeholder="Type the question prompt students will see…"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="newQuestionType">Question type</Label>
                          <Input
                            id="newQuestionType"
                            value={newQuestionType}
                            onChange={(e) => setNewQuestionType(e.target.value)}
                            disabled={readonly || saving}
                            placeholder="open_response"
                          />
                        </div>
                        <div className="flex items-end justify-end gap-2">
                          <Button type="button" variant="secondary" disabled={saving} onClick={() => setAddingQuestion(false)}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            disabled={readonly || saving || !newQuestionText.trim()}
                            onClick={async () => {
                              await addQuestion();
                              setAddingQuestion(false);
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={readonly || saving}
                    onClick={() => setAddingQuestion(true)}
                    className="w-full rounded-md border border-dashed border-[var(--border)] bg-transparent px-4 py-4 text-sm text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--text)] disabled:opacity-50"
                  >
                    + Add Question to Bank
                  </button>
                )}

                {questionRequiredError ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--danger)]">
                    <span aria-hidden="true">⛔</span>
                    <span>{questionRequiredError}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="secondary" disabled={saving} onClick={() => goToStep(3)}>
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || readonly || questionsCount < 1}
                    onClick={() => goToStep(5)}
                  >
                    Continue →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : step === 5 ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Rubrics & Dual Scorer</CardTitle>
                    <CardDescription>Define instructions for both scorers (Reasoning + Evidence).</CardDescription>
                  </div>
                  <div className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    Consensus Active
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {(["reasoning", "evidence"] as const).map((type) => {
                  const draft = rubricDrafts[type];
                  const touched = rubricTouched[type];
                  const hasError = touched && !draft.instructions.trim();
                  return (
                    <div key={type} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[var(--text)]">
                            {type === "reasoning" ? "Scorer 1: Reasoning & Synthesis" : "Scorer 2: Evidence & Factual Accuracy"}
                          </div>
                          <div className="text-xs text-[var(--muted)]">
                            {type === "reasoning"
                              ? "Evaluates logic, critical thinking, and connectivity."
                              : "Evaluates recall, accuracy, and specific evidence."}
                          </div>
                        </div>
                        <div className="text-xs text-[var(--muted)]">{type === "reasoning" ? "AGENT ALPHA" : "AGENT BETA"}</div>
                      </div>

                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`rubric-${type}`}>Instructions</Label>
                          <textarea
                            id={`rubric-${type}`}
                            maxLength={500}
                            className="min-h-24 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                            placeholder={
                              type === "reasoning"
                                ? "What should a strong reasoning response include?"
                                : "What counts as strong evidence in the response?"
                            }
                            value={draft.instructions}
                            onChange={(e) =>
                              setRubricDrafts((prev) => ({ ...prev, [type]: { ...prev[type], instructions: e.target.value } }))
                            }
                            onBlur={() => {
                              setRubricTouched((prev) => ({ ...prev, [type]: true }));
                              if (draft.instructions.trim()) void saveRubric(type);
                            }}
                            disabled={readonly || saving}
                          />
                          {hasError ? (
                            <div className="flex items-center gap-2 text-sm text-[var(--danger)]">
                              <span aria-hidden="true">⛔</span>
                              <span>Instructions are required.</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Scale min</Label>
                            <select
                              className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              value={draft.scale_min}
                              onChange={(e) =>
                                setRubricDrafts((prev) => ({
                                  ...prev,
                                  [type]: { ...prev[type], scale_min: Number(e.target.value) },
                                }))
                              }
                              disabled={readonly || saving}
                            >
                              {[1, 2, 3, 4, 5].map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Scale max</Label>
                            <select
                              className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              value={draft.scale_max}
                              onChange={(e) =>
                                setRubricDrafts((prev) => ({
                                  ...prev,
                                  [type]: { ...prev[type], scale_max: Number(e.target.value) },
                                }))
                              }
                              disabled={readonly || saving}
                            >
                              {[1, 2, 3, 4, 5].map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end justify-end">
                            <Button type="button" disabled={saving || readonly || !draft.instructions.trim()} onClick={() => saveRubric(type)}>
                              Save {type === "reasoning" ? "Reasoning" : "Evidence"}
                            </Button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-[var(--muted)]">GRADING SCALE (1–5)</div>
                            <button type="button" className="text-xs text-[var(--primary)] hover:underline" disabled>
                              Edit Descriptors
                            </button>
                          </div>
                          <div className="mt-2 grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <div
                                key={v}
                                className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-4 text-center"
                              >
                                <div className="text-lg font-semibold text-[var(--text)]">{v}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                                  {v === 1 ? "Poor" : v === 3 ? "Average" : v === 5 ? "Elite" : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="secondary" disabled={saving} onClick={() => goToStep(4)}>
                    ← Back
                  </Button>
                  <div className="text-sm text-[var(--muted)]">
                    {rubricsComplete ? "Ready to publish." : "Complete both rubrics to publish."}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{steps.find((s) => s.n === step)?.label}</CardTitle>
                <CardDescription>Coming next as we implement Sprint 2/3.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted)]">
                Step {step} is scaffolded. Step 1 proves the wizard + autosave + global integrity panel.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrity Shields</CardTitle>
                <CardDescription>Global settings (save immediately).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                      <span>Pausing Guardrail</span>
                      <span
                        className="cursor-help text-xs text-[var(--muted)]"
                        title="Flags long pauses (silence) while the student is responding."
                      >
                        (?)
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">Flag silence &gt; 2.5s</div>
                  </div>
                  <Switch
                    checked={pausingEnabled}
                    onCheckedChange={(checked) =>
                      updateIntegrity({ pause_threshold_seconds: checked ? 2.5 : null })
                    }
                    disabled={saving || readonly}
                    aria-label="Pausing Guardrail"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                      <span>Focus Monitor</span>
                      <span
                        className="cursor-help text-xs text-[var(--muted)]"
                        title="Tracks when students switch tabs or leave the assessment."
                      >
                        (?)
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">Track browser tab switching</div>
                  </div>
                  <Switch
                    checked={integrity.tab_switch_monitor}
                    onCheckedChange={(checked) => updateIntegrity({ tab_switch_monitor: checked })}
                    disabled={saving || readonly}
                    aria-label="Focus Monitor"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                      <span>Dynamic Shuffle</span>
                      <span
                        className="cursor-help text-xs text-[var(--muted)]"
                        title="Randomizes question order per student to reduce sharing answers."
                      >
                        (?)
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">Randomize question order</div>
                  </div>
                  <Switch
                    checked={integrity.shuffle_questions}
                    onCheckedChange={(checked) => updateIntegrity({ shuffle_questions: checked })}
                    disabled={saving || readonly}
                    aria-label="Dynamic Shuffle"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                      <span>Integrity Pledge</span>
                      <span
                        className="cursor-help text-xs text-[var(--muted)]"
                        title="Shows a pledge modal before the student can start. Recommended for higher-ed/high-stakes assessments."
                      >
                        (?)
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">Require pledge before starting</div>
                  </div>
                  <Switch
                    checked={Boolean(integrity.pledge_enabled)}
                    onCheckedChange={(checked) => updateIntegrity({ pledge_enabled: checked })}
                    disabled={saving || readonly}
                    aria-label="Integrity Pledge"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recording Limits</CardTitle>
                <CardDescription>Global response timers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Recording limit</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    value={integrity.recording_limit_seconds}
                    onChange={(e) => updateIntegrity({ recording_limit_seconds: Number(e.target.value) })}
                    disabled={saving || readonly}
                  >
                    {[30, 60, 90, 120, 180].map((v) => (
                      <option key={v} value={v}>
                        {v}s
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Viewing timer (Retell)</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    value={integrity.viewing_timer_seconds}
                    onChange={(e) => updateIntegrity({ viewing_timer_seconds: Number(e.target.value) })}
                    disabled={saving || readonly}
                  >
                    {[10, 15, 20, 30].map((v) => (
                      <option key={v} value={v}>
                        {v}s
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Socratic Mode</CardTitle>
                <CardDescription>Generate follow-up questions from student responses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">Enable follow-ups</div>
                    <div className="text-xs text-[var(--muted)]">Adds 1–2 AI follow-up questions per student.</div>
                  </div>
                  <Switch
                    checked={Boolean(assessment.socratic_enabled)}
                    onCheckedChange={(checked) => updateSocratic({ socratic_enabled: checked })}
                    disabled={saving || readonly}
                    aria-label="Enable Socratic Mode"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Follow-ups per student</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    value={Math.min(2, Math.max(1, Number(assessment.socratic_follow_ups ?? 1)))}
                    onChange={(e) => updateSocratic({ socratic_follow_ups: Number(e.target.value) })}
                    disabled={saving || readonly || !assessment.socratic_enabled}
                  >
                    {[1, 2].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-[var(--muted)]">
                    v1 assumes a single base question; follow-ups are generated during the live assessment.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
