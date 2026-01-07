"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AssessmentReviewDialog } from "@/components/assessments/assessment-review-dialog";
import { ValidationDialog } from "@/components/assessments/validation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { validateAssessmentPhase1, type ValidationError, type ValidationResult } from "@/lib/validation/assessment-validator";
import { PROFILE_LIST, getProfile, applyProfile, detectOverrides, type ProfileId } from "@/lib/assessments/profiles";

type ClassRow = { id: string; name: string };
type StudentRow = { id: string; first_name: string; last_name: string; email?: string | null };
type AuthoringMode = "manual" | "upload" | "ai" | "template";

type Assessment = {
  id: string;
  class_id: string | null;
  title: string;
  subject: string | null;
  target_language: string | null;
  instructions: string | null;
  status: "draft" | "live" | "closed";
  authoring_mode: AuthoringMode;
  is_practice_mode?: boolean | null;
  classes?: { name?: string | null } | null;
  // Profile fields
  assessment_profile?: ProfileId | null;
  profile_modified?: boolean;
  profile_version?: number;
  profile_override_keys?: string[];
  assessment_integrity: {
    pause_threshold_seconds: number | null;
    tab_switch_monitor: boolean;
    shuffle_questions: boolean;
    allow_grace_restart: boolean;
    pledge_enabled: boolean;
    pledge_version: number;
    pledge_text: string | null;
    recording_limit_seconds: number;
    viewing_timer_seconds: number;
  } | null;
};

type Question = {
  id: string;
  question_text: string;
  question_type?: string | null;
  evidence_upload?: "disabled" | "optional" | "required";
  blooms_level?: string | null;
  order_index: number;
  standards?: StandardNode[];
};

type StandardsSet = {
  id: string;
  key: string;
  title: string;
  subject?: string | null;
};

type StandardNode = {
  id: string;
  code: string;
  description: string | null;
  set_id?: string | null;
  standards_sets?: { key?: string | null; title?: string | null; subject?: string | null } | null;
};

type AssessmentAsset = {
  id: string;
  assessment_id: string;
  asset_type: string;
  asset_url: string;
  generation_prompt: string | null;
  created_at: string;
};

type AudioAsset = {
  id: string;
  assessment_id: string;
  asset_type: string;
  asset_url: string;
  original_filename: string | null;
  duration_seconds: number | null;
  max_duration_seconds: number | null;
  require_full_listen: boolean;
  created_at: string;
};

type DocumentAsset = {
  id: string;
  assessment_id: string;
  asset_type: string;
  asset_url: string;
  original_filename: string | null;
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

type TemplateSummary = {
  id: string;
  title: string;
  subject: string | null;
  grade_band: string | null;
  blooms_level_avg: string | null;
  description: string | null;
  question_count: number;
};

type QuestionResponse = Question & {
  assessment_question_standards?: Array<{
    standards_nodes?: StandardNode | null;
  }>;
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
  { n: 3, label: "Assets" },
  { n: 4, label: "Questions" },
  { n: 5, label: "Rubrics" },
  { n: 6, label: "Preview" },
] as const;

type StepNumber = (typeof steps)[number]["n"];

const QUESTION_TYPE_OPTIONS = [
  { value: "open_response", label: "Open response" },
  { value: "evidence_followup", label: "Evidence follow-up (photo)" },
  { value: "artifact_followup", label: "Evidence follow-up (artifact alias)" },
  { value: "audio_followup", label: "Audio follow-up (AI question)" },
] as const;
const CUSTOM_QUESTION_TYPE = "__custom__";

const BLOOMS_OPTIONS = [
  { value: "remember", label: "Remember (recall facts)" },
  { value: "understand", label: "Understand (explain concepts)" },
  { value: "apply", label: "Apply (use in new context)" },
  { value: "analyze", label: "Analyze (examine relationships)" },
  { value: "evaluate", label: "Evaluate (judge/defend)" },
  { value: "create", label: "Create (synthesize new ideas)" },
] as const;

const MAX_AUDIO_SECONDS = 180;
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function formatSeconds(value?: number | null) {
  if (!value || !Number.isFinite(value)) return "Unknown length";
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getBloomsLabel(value?: string | null) {
  if (!value) return "Understand (default)";
  const option = BLOOMS_OPTIONS.find((item) => item.value === value);
  return option ? option.label : value;
}

function getQuestionTypeLabel(type?: string | null) {
  const normalized = (type ?? "").trim() || "open_response";
  const option = QUESTION_TYPE_OPTIONS.find((item) => item.value === normalized);
  return option ? option.label : normalized;
}

function splitQuestionType(type?: string | null) {
  const normalized = (type ?? "").trim();
  const option = QUESTION_TYPE_OPTIONS.find((item) => item.value === normalized);
  if (option) {
    return { preset: option.value, custom: "" };
  }
  if (!normalized) {
    return { preset: QUESTION_TYPE_OPTIONS[0].value, custom: "" };
  }
  return { preset: CUSTOM_QUESTION_TYPE, custom: normalized };
}

export function AssessmentWizard({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = Number(searchParams.get("step") ?? "1") || 1;
  const step = (steps.some((s) => s.n === rawStep) ? rawStep : 1) as StepNumber;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classStudents, setClassStudents] = useState<StudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<"all" | "selected">("all");
  const [assignmentStudentIds, setAssignmentStudentIds] = useState<Set<string>>(new Set());
  const [assignmentDirty, setAssignmentDirty] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentTouched, setAssignmentTouched] = useState(false);
  const [startAiPrompt, setStartAiPrompt] = useState("");
  const [startQuestionCount, setStartQuestionCount] = useState(3);
  const [startPdfFile, setStartPdfFile] = useState<File | null>(null);
  const [assetUrl, setAssetUrl] = useState("");
  const [assetPrompt, setAssetPrompt] = useState("");
  const [assetOptions, setAssetOptions] = useState<string[]>([]);
  const [audioIntro, setAudioIntro] = useState<AudioAsset | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [documentAsset, setDocumentAsset] = useState<DocumentAsset | null>(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pledgeDraft, setPledgeDraft] = useState("");
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionTypePreset, setNewQuestionTypePreset] = useState<string>(QUESTION_TYPE_OPTIONS[0].value);
  const [newQuestionTypeCustom, setNewQuestionTypeCustom] = useState("");
  const [newQuestionBloom, setNewQuestionBloom] = useState<string>("understand");
  const [newQuestionStandards, setNewQuestionStandards] = useState<StandardNode[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState("");
  const [editingQuestionTypePreset, setEditingQuestionTypePreset] = useState<string>(QUESTION_TYPE_OPTIONS[0].value);
  const [editingQuestionTypeCustom, setEditingQuestionTypeCustom] = useState("");
  const [editingQuestionBloom, setEditingQuestionBloom] = useState<string>("understand");
  const [editingQuestionStandards, setEditingQuestionStandards] = useState<StandardNode[]>([]);
  const [standardsEnabled, setStandardsEnabled] = useState(false);
  const [enabledStandardsSets, setEnabledStandardsSets] = useState<StandardsSet[]>([]);
  const [standardsSearch, setStandardsSearch] = useState("");
  const [standardsResults, setStandardsResults] = useState<StandardNode[]>([]);
  const [standardsLoading, setStandardsLoading] = useState(false);
  const [standardsError, setStandardsError] = useState<string | null>(null);
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
  const [generationWorking, setGenerationWorking] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [classTouched, setClassTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const readonly = assessment?.status !== "draft";
  const assetBusy = saving || audioUploading || documentUploading;

  useEffect(() => {
    if (!dirty && !assignmentDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [assignmentDirty, dirty]);

  useEffect(() => {
    const next =
      typeof assessment?.assessment_integrity?.pledge_text === "string" ? assessment?.assessment_integrity?.pledge_text : "";
    setPledgeDraft(next ?? "");
  }, [assessment?.assessment_integrity?.pledge_text]);

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

  useEffect(() => {
    const classId = assessment?.class_id ?? null;
    if (!classId) {
      setClassStudents([]);
      setAssignmentMode("all");
      setAssignmentStudentIds(new Set());
      return;
    }
    let active = true;
    setStudentsLoading(true);
    setAssignmentError(null);
    jsonFetch<{ students: StudentRow[] }>(`/api/classes/${classId}/students`, { cache: "no-store" })
      .then((data) => {
        if (!active) return;
        const students = data.students ?? [];
        setClassStudents(students);
        const validIds = new Set(students.map((student) => student.id));
        setAssignmentStudentIds((prev) => new Set(Array.from(prev).filter((id) => validIds.has(id))));
      })
      .catch((e) => {
        if (!active) return;
        setAssignmentError(e instanceof Error ? e.message : "Unable to load students.");
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [assessment?.class_id]);

  useEffect(() => {
    if (assessment?.authoring_mode !== "template") return;
    if (templatesLoading || templates.length) return;
    (async () => {
      setTemplateError(null);
      setTemplatesLoading(true);
      try {
        const data = await jsonFetch<{ templates: TemplateSummary[] }>("/api/assessment-templates", {
          cache: "no-store",
        });
        setTemplates(data.templates ?? []);
      } catch (e) {
        setTemplateError(e instanceof Error ? e.message : "Unable to load templates.");
      } finally {
        setTemplatesLoading(false);
      }
    })();
  }, [assessment?.authoring_mode, templates.length, templatesLoading]);

  useEffect(() => {
    let active = true;
    setStandardsError(null);
    fetch("/api/standards/teacher", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | {
            enabled?: boolean;
            sets?: Array<StandardsSet & { enabled?: boolean }>;
            error?: string;
          }
          | null;
        if (!active) return;
        if (!res.ok) {
          const message = data && typeof data.error === "string" ? data.error : "Unable to load standards.";
          throw new Error(message);
        }
        setStandardsEnabled(Boolean(data?.enabled));
        const enabledSets = (data?.sets ?? []).filter((set) => set.enabled);
        setEnabledStandardsSets(enabledSets);
      })
      .catch((err) => {
        if (!active) return;
        setStandardsError(err instanceof Error ? err.message : "Unable to load standards.");
      });
    return () => {
      active = false;
    };
  }, []);

  const standardsSubjectFilter = useMemo(() => {
    const subject = (assessment?.subject ?? "").toLowerCase();
    if (!subject) return "";
    if (subject.includes("language arts") || subject.includes("literature")) return "ELA";
    if (subject.includes("math")) return "Math";
    if (subject.includes("science")) return "Science";
    if (subject.includes("history")) return "History";
    if (subject.includes("language")) return "World Languages";
    return "";
  }, [assessment?.subject]);

  const hasStandardsAccess = standardsEnabled && enabledStandardsSets.length > 0;

  async function searchStandards() {
    if (!hasStandardsAccess) return;
    const query = standardsSearch.trim();
    if (query.length < 2) {
      setStandardsResults([]);
      return;
    }
    setStandardsLoading(true);
    setStandardsError(null);
    try {
      const params = new URLSearchParams({ q: query, limit: "50" });
      if (standardsSubjectFilter) params.set("subject", standardsSubjectFilter);
      const data = await jsonFetch<{ nodes: StandardNode[] }>(`/api/standards/nodes?${params.toString()}`, {
        cache: "no-store",
      });
      setStandardsResults(data.nodes ?? []);
    } catch (err) {
      setStandardsError(err instanceof Error ? err.message : "Unable to load standards.");
    } finally {
      setStandardsLoading(false);
    }
  }

  function addStandard(target: "new" | "edit", standard: StandardNode) {
    if (target === "new") {
      setNewQuestionStandards((prev) => (prev.some((item) => item.id === standard.id) ? prev : [...prev, standard]));
      return;
    }
    setEditingQuestionStandards((prev) =>
      prev.some((item) => item.id === standard.id) ? prev : [...prev, standard],
    );
  }

  function removeStandard(target: "new" | "edit", standardId: string) {
    if (target === "new") {
      setNewQuestionStandards((prev) => prev.filter((item) => item.id !== standardId));
      return;
    }
    setEditingQuestionStandards((prev) => prev.filter((item) => item.id !== standardId));
  }

  const load = useCallback(async () => {
    setError(null);
    const [data, q, assetResult, audioResult, documentResult, rubricsResult, assignmentsResult] = await Promise.all([
      jsonFetch<{ assessment: Assessment }>(`/api/assessments/${assessmentId}`, { cache: "no-store" }),
      jsonFetch<{ questions: QuestionResponse[] }>(`/api/assessments/${assessmentId}/questions`, { cache: "no-store" }),
      jsonFetch<{ asset: AssessmentAsset | null }>(`/api/assessments/${assessmentId}/asset`, { cache: "no-store" }).catch(
        () => ({ asset: null }),
      ),
      jsonFetch<{ asset: AudioAsset | null }>(`/api/assessments/${assessmentId}/audio`, { cache: "no-store" }).catch(() => ({
        asset: null,
      })),
      jsonFetch<{ asset: DocumentAsset | null }>(`/api/assessments/${assessmentId}/document`, { cache: "no-store" }).catch(
        () => ({ asset: null }),
      ),
      jsonFetch<{ rubrics: Rubric[] }>(`/api/assessments/${assessmentId}/rubrics`, { cache: "no-store" }).catch(() => ({ rubrics: [] })),
      jsonFetch<{ student_ids: string[] }>(`/api/assessments/${assessmentId}/assignments`, { cache: "no-store" }).catch(
        () => ({ student_ids: [] }),
      ),
    ]);

    setAssessment(data.assessment);

    const hydratedQuestions = (q.questions ?? []).map((question) => ({
      ...question,
      standards: (question.assessment_question_standards ?? [])
        .map((row) => row.standards_nodes)
        .filter(Boolean) as StandardNode[],
    }));
    setQuestions(hydratedQuestions);
    setQuestionsCount(hydratedQuestions.length);

    setAssetUrl(assetResult.asset?.asset_url ?? "");
    setAssetPrompt(assetResult.asset?.generation_prompt ?? "");
    setAudioIntro(audioResult.asset ?? null);
    setDocumentAsset(documentResult.asset ?? null);

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

    const assignedIds = new Set(assignmentsResult.student_ids ?? []);
    setAssignmentStudentIds(assignedIds);
    setAssignmentMode(assignedIds.size > 0 ? "selected" : "all");
    setAssignmentDirty(false);
    setAssignmentTouched(false);
    setAssignmentError(null);
  }, [assessmentId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Load failed."));
  }, [load]);

  const assignmentComplete = assignmentMode === "all" || assignmentStudentIds.size > 0;
  const startComplete = Boolean(assessment?.title?.trim()) && Boolean(assessment?.class_id) && assignmentComplete;
  const questionsComplete = questionsCount > 0;
  const rubricsComplete = Boolean(rubrics.reasoning && rubrics.evidence);
  const maxEnabledStep: StepNumber = !startComplete ? 1 : !questionsComplete ? 4 : !rubricsComplete ? 5 : 6;

  const persistDraft = useCallback(
    async (silent?: boolean) => {
      if (!assessment || readonly) return;
      setSaving(true);
      setError(null);
      try {
        const payload: {
          title?: string;
          class_id?: string;
          subject?: string | null;
          target_language?: string | null;
          instructions?: string | null;
          authoring_mode?: AuthoringMode;
          is_practice_mode?: boolean;
        } = {
          subject: assessment.subject ?? null,
          target_language: assessment.target_language ?? null,
          instructions: assessment.instructions ?? null,
          authoring_mode: assessment.authoring_mode,
          is_practice_mode: assessment.is_practice_mode ?? false,
        };
        if (assessment.title.trim()) payload.title = assessment.title;
        if (assessment.class_id) payload.class_id = assessment.class_id;
        await jsonFetch(`/api/assessments/${assessmentId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
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

  const persistAssignments = useCallback(
    async (silent?: boolean) => {
      if (!assessment || readonly) return;
      if (assignmentMode === "selected" && assignmentStudentIds.size === 0) {
        if (!silent) setAssignmentError("Select at least one student.");
        return;
      }
      setAssignmentSaving(true);
      setAssignmentError(null);
      try {
        const payload =
          assignmentMode === "selected"
            ? { mode: "selected", student_ids: Array.from(assignmentStudentIds) }
            : { mode: "all" };
        await jsonFetch(`/api/assessments/${assessmentId}/assignments`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        setAssignmentDirty(false);
        setLastSavedAt(Date.now());
        if (!silent) await load();
      } catch (e) {
        setAssignmentError(e instanceof Error ? e.message : "Save failed.");
      } finally {
        setAssignmentSaving(false);
      }
    },
    [assessment, assessmentId, assignmentMode, assignmentStudentIds, load, readonly],
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
      if (saving || assignmentSaving) return;
      if (dirty) void persistDraft(true);
      if (assignmentDirty) void persistAssignments(true);
    }, 3000);
    return () => {
      clearInterval(t);
    };
  }, [assessment, assignmentDirty, assignmentSaving, dirty, persistAssignments, persistDraft, readonly, saving]);

  const canContinue = useMemo(() => {
    if (!assessment) return false;
    if (step === 1) {
      if (!assessment.class_id) return false;
      if (!assessment.title.trim()) return false;
      if (!assignmentComplete) return false;
      if (assessment.authoring_mode === "upload") return Boolean(startPdfFile);
      if (assessment.authoring_mode === "ai") return startAiPrompt.trim().length >= 20;
      if (assessment.authoring_mode === "template") return Boolean(selectedTemplateId);
      return true;
    }
    return true;
  }, [assessment, assignmentComplete, selectedTemplateId, startAiPrompt, startPdfFile, step]);

  async function saveDraft() {
    await persistDraft(true);
    await persistAssignments(true);
    await load();
  }

  function openValidation(errors: ValidationError[]) {
    setValidationErrors(errors);
    setValidationOpen(true);
  }

  async function publishAssessment() {
    setError(null);
    const clientRubrics = (["reasoning", "evidence"] as const).flatMap((type) => {
      const saved = rubrics[type];
      if (!saved) return [];
      const draft = rubricDrafts[type];
      return [
        {
          id: saved.id,
          rubric_type: type,
          instructions: draft.instructions,
          scale_min: draft.scale_min,
          scale_max: draft.scale_max,
        },
      ];
    });
    const validation = validateAssessmentPhase1({ questions, rubrics: clientRubrics });
    if (!validation.can_publish) {
      openValidation(validation.critical_errors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/publish`, { method: "POST" });
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        if (payload && typeof payload === "object" && "critical_errors" in payload) {
          const result = payload as ValidationResult;
          const errors = Array.isArray(result.critical_errors) ? result.critical_errors : [];
          openValidation(errors);
          return;
        }
        throw new Error(getErrorMessage(payload));
      }
      setValidationOpen(false);
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

      // Detect profile overrides after updating integrity settings
      if (assessment?.assessment_profile && !assessment.profile_modified) {
        const updatedState = {
          ...assessment.assessment_integrity,
          ...next,
        };
        const overrides = detectOverrides(assessment.assessment_profile, {
          recording_limit_seconds: updatedState.recording_limit_seconds,
          viewing_timer_seconds: updatedState.viewing_timer_seconds,
          tab_switch_monitor: updatedState.tab_switch_monitor,
          shuffle_questions: updatedState.shuffle_questions,
          pledge_enabled: updatedState.pledge_enabled,
          pause_threshold_seconds: updatedState.pause_threshold_seconds,
          allow_grace_restart: updatedState.allow_grace_restart,
        });

        if (overrides.length > 0) {
          // Update profile_modified flag
          await jsonFetch(`/api/assessments/${assessmentId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              profile_modified: true,
              profile_override_keys: overrides,
            }),
          });
        }
      }

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

  const className = assessment?.classes?.name?.trim() || null;
  const reviewStages = useMemo(() => {
    if (!assessment) return [];
    const title = assessment.title.trim() || "Untitled";
    const mode =
      assessment.authoring_mode === "ai"
        ? "AI generated"
        : assessment.authoring_mode === "upload"
          ? "Uploaded source"
          : assessment.authoring_mode === "template"
            ? "Template"
            : "Manual";
    const subject = assessment.subject?.trim();
    const language = assessment.target_language?.trim();
    const instructions = (assessment.instructions ?? "").trim();
    const instructionsPreview =
      instructions.length > 0 ? `${instructions.slice(0, 160)}${instructions.length > 160 ? "..." : ""}` : "None";
    const integritySettings = assessment.assessment_integrity ?? {
      pause_threshold_seconds: 2.5,
      tab_switch_monitor: true,
      shuffle_questions: true,
      allow_grace_restart: false,
      pledge_enabled: false,
      pledge_version: 1,
      pledge_text: null,
      recording_limit_seconds: 60,
      viewing_timer_seconds: 20,
    };

    const assetSummary = assetUrl.trim()
      ? "Image selected"
      : assetPrompt.trim()
        ? "Image prompt provided"
        : "No image selected";
    const audioSummary = audioIntro ? "Audio intro attached" : "No audio intro";
    const documentSummary = documentAsset ? "PDF attached" : "No PDF";
    const assetDetails: string[] = [];
    if (assetUrl.trim())
      assetDetails.push(
        `Image URL: ${assetUrl.trim().slice(0, 80)}${assetUrl.trim().length > 80 ? "..." : ""}`,
      );
    if (assetPrompt.trim())
      assetDetails.push(
        `Prompt: ${assetPrompt.trim().slice(0, 120)}${assetPrompt.trim().length > 120 ? "..." : ""}`,
      );
    if (audioIntro) {
      const durationLabel = formatSeconds(audioIntro.duration_seconds);
      const audioLabel = audioIntro.original_filename ? audioIntro.original_filename.trim() : "Audio intro";
      assetDetails.push(`Audio: ${audioLabel} (${durationLabel})`);
    }
    if (documentAsset) {
      const docLabel = documentAsset.original_filename ? documentAsset.original_filename.trim() : "PDF document";
      assetDetails.push(`PDF: ${docLabel}`);
    }

    const questionDetails = questions
      .slice(0, 3)
      .map(
        (q, index) =>
          `Q${index + 1}: ${q.question_text.trim().slice(0, 120)}${q.question_text.trim().length > 120 ? "..." : ""}`,
      );

    const rubricDetails: string[] = (["reasoning", "evidence"] as const).map((type) => {
      const label = type === "reasoning" ? "Reasoning" : "Evidence";
      const draft = rubricDrafts[type];
      const scale = `${draft.scale_min}-${draft.scale_max}`;
      const hasInstructions = Boolean(draft.instructions.trim());
      const preview = draft.instructions.trim().slice(0, 120);
      const suffix = draft.instructions.trim().length > 120 ? "..." : "";
      return `${label} rubric: scale ${scale} • ${hasInstructions ? `Instructions: ${preview}${suffix}` : "Instructions missing"}`;
    });
    const integritySummary = [
      `Pausing guardrail ${integritySettings.pause_threshold_seconds !== null ? "On" : "Off"}`,
      `Focus monitor ${integritySettings.tab_switch_monitor ? "On" : "Off"}`,
      `Shuffle ${integritySettings.shuffle_questions ? "On" : "Off"}`,
      `Grace restart ${integritySettings.allow_grace_restart ? "On" : "Off"}`,
    ].join(" • ");
    const integrityDetails = [
      `Recording limit: ${integritySettings.recording_limit_seconds}s`,
      `Viewing timer: ${integritySettings.viewing_timer_seconds}s`,
      `Pledge: ${integritySettings.pledge_enabled ? "Enabled" : "Off"}`,
    ];
    const assignmentSummary =
      assignmentMode === "selected"
        ? `Assigned: ${assignmentStudentIds.size} student${assignmentStudentIds.size === 1 ? "" : "s"}`
        : "Assigned: Entire class";

    return [
      {
        step: 1,
        title: "Start",
        summary: `Title: ${title} • Class: ${className ?? "Unassigned"} • Mode: ${mode} • ${assignmentSummary}`,
        details: [subject ? `Subject: ${subject}` : null, language ? `Target language: ${language}` : null].filter(
          (item): item is string => Boolean(item),
        ),
      },
      {
        step: 2,
        title: "General Info",
        summary: `Instructions: ${instructions ? "Provided" : "Missing"} • Practice mode: ${assessment.is_practice_mode ? "On" : "Off"
          }`,
        details: instructions ? [`Instructions preview: ${instructionsPreview}`] : [],
      },
      {
        step: 3,
        title: "Assets",
        summary: `${assetSummary} • ${audioSummary} • ${documentSummary}`,
        details: assetDetails,
      },
      {
        step: 4,
        title: "Questions",
        summary: `${questions.length} question${questions.length === 1 ? "" : "s"}`,
        details: questionDetails.length ? questionDetails : ["No questions added."],
      },
      {
        step: 5,
        title: "Rubrics",
        summary: `${rubrics.reasoning ? "Reasoning" : "Reasoning missing"} • ${rubrics.evidence ? "Evidence" : "Evidence missing"}`,
        details: rubricDetails,
      },
      {
        step: 6,
        title: "Integrity & Limits",
        summary: integritySummary,
        details: integrityDetails,
      },
    ];
  }, [
    assessment,
    assignmentMode,
    assignmentStudentIds,
    audioIntro,
    assetPrompt,
    assetUrl,
    className,
    documentAsset,
    questions,
    rubrics.evidence,
    rubrics.reasoning,
    rubricDrafts,
  ]);

  if (!assessment) {
    return <div className="text-sm text-[var(--muted)]">{error ?? "Loading…"}</div>;
  }

  const integrity = assessment.assessment_integrity ?? {
    pause_threshold_seconds: 2.5,
    tab_switch_monitor: true,
    shuffle_questions: true,
    allow_grace_restart: false,
    pledge_enabled: false,
    pledge_version: 1,
    pledge_text: null,
    recording_limit_seconds: 60,
    viewing_timer_seconds: 20,
  };

  const titleError = titleTouched && !assessment.title.trim() ? "Assessment title is required." : null;
  const classError = classTouched && !assessment.class_id ? "Class is required." : null;
  const assignmentSelectionError =
    assignmentTouched && assignmentMode === "selected" && assignmentStudentIds.size === 0
      ? "Select at least one student."
      : null;
  const pausingEnabled = integrity.pause_threshold_seconds !== null;
  const questionRequiredError =
    step >= 5 && startComplete && !questionsComplete ? "Add at least one question to continue." : null;
  const canPublish =
    !readonly &&
    step === 6 &&
    startComplete &&
    questionsComplete &&
    rubricsComplete &&
    !saving &&
    !assignmentSaving &&
    !assignmentDirty;
  const studentPreviewUrl = `/student/assessments/${assessmentId}?preview=1`;

  const selectedCount = assignmentStudentIds.size;
  const assignmentDisabled = readonly || !assessment.class_id || assignmentSaving;

  function toggleAssignmentStudent(studentId: string) {
    setAssignmentStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
    setAssignmentDirty(true);
    setAssignmentTouched(true);
    setAssignmentError(null);
  }

  function selectAllStudents() {
    setAssignmentStudentIds(new Set(classStudents.map((student) => student.id)));
    setAssignmentDirty(true);
    setAssignmentTouched(true);
    setAssignmentError(null);
  }

  function clearSelectedStudents() {
    setAssignmentStudentIds(new Set());
    setAssignmentDirty(true);
    setAssignmentTouched(true);
    setAssignmentError(null);
  }

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

  function readAudioDuration(file: File) {
    return new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error("Unable to read audio duration."));
          return;
        }
        resolve(duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read audio duration."));
      };
      audio.src = url;
    });
  }

  async function handleAudioSelected(file: File) {
    if (readonly) return;
    setAudioError(null);
    setAudioUploading(true);
    try {
      const name = (file.name || "").toLowerCase();
      const type = (file.type || "").toLowerCase();
      const allowed = type.includes("audio/") || name.endsWith(".mp3") || name.endsWith(".wav");
      if (!allowed) {
        throw new Error("Audio must be MP3 or WAV.");
      }
      const duration = await readAudioDuration(file);
      if (duration > MAX_AUDIO_SECONDS) {
        throw new Error("Audio must be 3 minutes or less.");
      }
      const form = new FormData();
      form.append("file", file);
      form.append("duration_seconds", String(Math.round(duration)));
      form.append("max_duration_seconds", String(MAX_AUDIO_SECONDS));
      form.append("require_full_listen", "true");
      const res = await fetch(`/api/assessments/${assessmentId}/audio`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => null)) as { asset?: AudioAsset | null; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Audio upload failed.");
      setAudioIntro(data?.asset ?? null);
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Audio upload failed.");
    } finally {
      setAudioUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }

  async function removeAudioIntro() {
    if (readonly) return;
    setAudioError(null);
    setAudioUploading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/audio`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to remove audio.");
      setAudioIntro(null);
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Unable to remove audio.");
    } finally {
      setAudioUploading(false);
    }
  }

  async function handleDocumentSelected(file: File) {
    if (readonly) return;
    setDocumentError(null);
    setDocumentUploading(true);
    try {
      const name = (file.name || "").toLowerCase();
      const type = (file.type || "").toLowerCase();
      const allowed = type === "application/pdf" || type === "application/x-pdf" || name.endsWith(".pdf");
      if (!allowed) {
        throw new Error("Document must be a PDF.");
      }
      if (file.size > MAX_PDF_BYTES) {
        throw new Error("PDF must be 20MB or less.");
      }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/assessments/${assessmentId}/document`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => null)) as { asset?: DocumentAsset | null; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "PDF upload failed.");
      setDocumentAsset(data?.asset ?? null);
    } catch (e) {
      setDocumentError(e instanceof Error ? e.message : "PDF upload failed.");
    } finally {
      setDocumentUploading(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  }

  async function removeDocument() {
    if (readonly) return;
    setDocumentError(null);
    setDocumentUploading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/document`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to remove PDF.");
      setDocumentAsset(null);
    } catch (e) {
      setDocumentError(e instanceof Error ? e.message : "Unable to remove PDF.");
    } finally {
      setDocumentUploading(false);
    }
  }

  async function addQuestion() {
    if (!newQuestionText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const questionType =
        newQuestionTypePreset === CUSTOM_QUESTION_TYPE ? newQuestionTypeCustom.trim() : newQuestionTypePreset;
      const created = await jsonFetch<{ ok: boolean; id: string }>(`/api/assessments/${assessmentId}/questions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question_text: newQuestionText.trim(),
          question_type: questionType || null,
          blooms_level: newQuestionBloom || null,
        }),
      });
      if (standardsEnabled && newQuestionStandards.length) {
        await persistQuestionStandards(created.id, newQuestionStandards);
      }
      setNewQuestionText("");
      setNewQuestionTypePreset(QUESTION_TYPE_OPTIONS[0].value);
      setNewQuestionTypeCustom("");
      setNewQuestionBloom("understand");
      setNewQuestionStandards([]);
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
    const next = splitQuestionType(q.question_type ?? null);
    setEditingQuestionTypePreset(next.preset);
    setEditingQuestionTypeCustom(next.custom);
    setEditingQuestionBloom(q.blooms_level ?? "understand");
    setEditingQuestionStandards(q.standards ?? []);
  }

  async function saveEditedQuestion() {
    if (!editingQuestionId) return;
    setSaving(true);
    setError(null);
    try {
      const questionType =
        editingQuestionTypePreset === CUSTOM_QUESTION_TYPE ? editingQuestionTypeCustom.trim() : editingQuestionTypePreset;
      await jsonFetch(`/api/questions/${editingQuestionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question_text: editingQuestionText.trim(),
          question_type: questionType || null,
          blooms_level: editingQuestionBloom || null,
        }),
      });
      if (standardsEnabled) {
        await persistQuestionStandards(editingQuestionId, editingQuestionStandards);
      }
      setEditingQuestionId(null);
      setEditingQuestionStandards([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function persistQuestionStandards(questionId: string, standards: StandardNode[]) {
    await jsonFetch(`/api/questions/${questionId}/standards`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ standard_ids: standards.map((item) => item.id) }),
    });
  }

  async function updateEvidenceUpload(questionId: string, evidence_upload: "disabled" | "optional" | "required") {
    if (readonly) return;
    setSaving(true);
    setError(null);
    try {
      await jsonFetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evidence_upload }),
      });
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
      <AssessmentReviewDialog
        open={reviewOpen}
        stages={reviewStages}
        loading={saving}
        onClose={() => setReviewOpen(false)}
        onConfirm={() => {
          setReviewOpen(false);
          void publishAssessment();
        }}
        onEditStep={(stepToEdit) => {
          setReviewOpen(false);
          goToStep(stepToEdit as StepNumber);
        }}
      />
      <ValidationDialog open={validationOpen} errors={validationErrors} onClose={() => setValidationOpen(false)} />
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
          <Button type="button" variant="secondary" onClick={() => window.open(studentPreviewUrl, "_blank")}>
            Preview as Student
          </Button>
          <Button type="button" variant="secondary" disabled={saving || assignmentSaving || readonly} onClick={saveDraft}>
            {saving || assignmentSaving ? "Saving…" : "Save Draft"}
          </Button>
          <Button type="button" disabled={!canPublish} onClick={() => setReviewOpen(true)}>
            Publish to Class
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-6 ${step === 6 ? "lg:grid-cols-[800px_350px]" : ""}`}>
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
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors border-[var(--border)] ${active ? "bg-[var(--border)] text-[var(--text)]" : "bg-transparent text-[var(--muted)]"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[var(--primary)] hover:text-[var(--text)]"
                      }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${active
                        ? "bg-[var(--primary-strong)] text-white"
                        : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
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
                <CardDescription>Choose your assessment type, how to create it, then set the basics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assessment Profile Selector */}
                <div className="space-y-3">
                  <Label>Assessment Profile</Label>
                  <p className="text-xs text-[var(--muted)]">
                    Select the type of assessment you're creating. This sets recommended defaults for timing, integrity, and follow-ups.
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {PROFILE_LIST.map((profile) => {
                      const isSelected = assessment.assessment_profile === profile.id;
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          disabled={readonly}
                          onClick={() => {
                            // Apply profile defaults
                            const result = applyProfile(profile.id, {
                              recording_limit_seconds: assessment.assessment_integrity?.recording_limit_seconds,
                              viewing_timer_seconds: assessment.assessment_integrity?.viewing_timer_seconds,
                              tab_switch_monitor: assessment.assessment_integrity?.tab_switch_monitor,
                              shuffle_questions: assessment.assessment_integrity?.shuffle_questions,
                              pledge_enabled: assessment.assessment_integrity?.pledge_enabled,
                              pause_threshold_seconds: assessment.assessment_integrity?.pause_threshold_seconds,
                              allow_grace_restart: assessment.assessment_integrity?.allow_grace_restart,
                              socratic_enabled: undefined, // Will be applied from defaults
                              is_practice_mode: assessment.is_practice_mode ?? false,
                            }, { resetToDefaults: true });

                            setAssessment({
                              ...assessment,
                              assessment_profile: profile.id,
                              profile_modified: false,
                              profile_version: 1,
                              profile_override_keys: [],
                            });
                            setDirty(true);

                            // Update integrity settings with profile defaults
                            void updateIntegrity({
                              recording_limit_seconds: result.newState.recording_limit_seconds,
                              viewing_timer_seconds: result.newState.viewing_timer_seconds,
                              tab_switch_monitor: result.newState.tab_switch_monitor,
                              shuffle_questions: result.newState.shuffle_questions,
                              pledge_enabled: result.newState.pledge_enabled,
                              pause_threshold_seconds: result.newState.pause_threshold_seconds,
                              allow_grace_restart: result.newState.allow_grace_restart,
                            });
                          }}
                          className={`p-4 text-left rounded-lg border transition-all ${isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50"
                            } ${readonly ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <div className="font-medium text-sm">{profile.label}</div>
                          <div className="text-xs text-[var(--muted)] mt-1">{profile.description}</div>
                          <div className="text-xs text-[var(--muted)] mt-2 flex items-center gap-2">
                            <span className="inline-block px-1.5 py-0.5 bg-[var(--surface)] rounded text-[10px] uppercase tracking-wide">
                              {profile.gradeRange}
                            </span>
                            {isSelected && (
                              <span className="text-[var(--primary)] font-medium">✓ Selected</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {assessment.assessment_profile && assessment.profile_modified && (
                    <div className="text-xs text-[var(--warning)] flex items-center gap-1">
                      <span>⚠</span>
                      <span>Settings have been modified from profile defaults</span>
                    </div>
                  )}
                </div>

                {/* Authoring Mode */}
                <div className="space-y-3">
                  <Label>Authoring Mode</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(
                      [
                        { key: "manual", title: "Start from scratch", desc: "Fill out the wizard step-by-step." },
                        { key: "upload", title: "Upload existing material", desc: "Upload a PDF; we extract text and generate a draft." },
                        { key: "ai", title: "Generate with AI", desc: "Describe what you want; we generate a draft to review." },
                        { key: "template", title: "Use a template", desc: "Browse pre-built questions by subject." },
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
                              if (m.key !== "template") setSelectedTemplateId(null);
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
                      setAssignmentMode("all");
                      setAssignmentStudentIds(new Set());
                      setAssignmentDirty(true);
                      setAssignmentTouched(false);
                      setAssignmentError(null);
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

                <div className="space-y-3">
                  <Label>Assign to</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={assignmentMode === "all" ? "primary" : "secondary"}
                      disabled={assignmentDisabled}
                      onClick={() => {
                        if (assignmentDisabled) return;
                        setAssignmentMode("all");
                        setAssignmentStudentIds(new Set());
                        setAssignmentDirty(true);
                        setAssignmentTouched(true);
                        setAssignmentError(null);
                      }}
                    >
                      Entire class
                    </Button>
                    <Button
                      type="button"
                      variant={assignmentMode === "selected" ? "primary" : "secondary"}
                      disabled={assignmentDisabled}
                      onClick={() => {
                        if (assignmentDisabled) return;
                        setAssignmentMode("selected");
                        setAssignmentDirty(true);
                        setAssignmentTouched(true);
                        setAssignmentError(null);
                      }}
                    >
                      Selected students
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--muted)]">Choose everyone or a subgroup within this class.</p>

                  {assignmentMode === "selected" ? (
                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                        <span>{selectedCount} selected</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={assignmentDisabled || !classStudents.length}
                            onClick={selectAllStudents}
                          >
                            Select all
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={assignmentDisabled || selectedCount === 0}
                            onClick={clearSelectedStudents}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      {studentsLoading ? (
                        <div className="mt-3 text-xs text-[var(--muted)]">Loading students...</div>
                      ) : classStudents.length ? (
                        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-2 text-sm">
                          {classStudents.map((student) => (
                            <label key={student.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={assignmentStudentIds.has(student.id)}
                                onChange={() => toggleAssignmentStudent(student.id)}
                                disabled={assignmentDisabled}
                                aria-label={`Select ${student.first_name} ${student.last_name}`}
                              />
                              <span>
                                {student.first_name} {student.last_name}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-[var(--muted)]">No students found. Add students first.</div>
                      )}

                      {assignmentSelectionError ? (
                        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--danger)]" role="alert">
                          <span aria-hidden="true">⛔</span>
                          <span>{assignmentSelectionError}</span>
                        </div>
                      ) : null}
                      {assignmentError ? (
                        <div className="mt-3 text-sm text-[var(--danger)]" role="alert">
                          {assignmentError}
                        </div>
                      ) : null}
                    </div>
                  ) : assignmentError ? (
                    <div className="text-sm text-[var(--danger)]" role="alert">
                      {assignmentError}
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
                        className="block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--border)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--text)] hover:file:bg-[var(--primary-strong)] hover:file:text-white"
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

                {assessment.authoring_mode === "template" ? (
                  <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="text-sm font-medium text-[var(--text)]">Choose a template</div>
                    <div className="text-xs text-[var(--muted)]">Pick a starting point and customize it in the next steps.</div>
                    {templateError ? <div className="text-sm text-[var(--danger)]">{templateError}</div> : null}
                    {templatesLoading ? <div className="text-sm text-[var(--muted)]">Loading templates…</div> : null}
                    {!templatesLoading && !templates.length ? (
                      <div className="text-sm text-[var(--muted)]">No templates are available yet.</div>
                    ) : null}
                    <div className="grid grid-cols-1 gap-3">
                      {templates.map((t) => {
                        const selected = selectedTemplateId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTemplateId(t.id)}
                            className={`rounded-md border p-4 text-left transition-colors border-[var(--border)] ${selected ? "ring-2 ring-[var(--primary)]" : "hover:border-[var(--primary)]"
                              }`}
                            disabled={readonly}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-[var(--text)]">{t.title}</div>
                                <div className="mt-1 text-xs text-[var(--muted)]">
                                  {[t.subject, t.grade_band, t.blooms_level_avg ? `Bloom's: ${t.blooms_level_avg}` : null]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </div>
                                {t.description ? <div className="mt-2 text-sm text-[var(--muted)]">{t.description}</div> : null}
                              </div>
                              <div className="text-xs text-[var(--muted)]">{t.question_count} questions</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col items-end gap-2">
                  <Button
                    type="button"
                    disabled={readonly || !canContinue || generationWorking}
                    onClick={() => {
                      setTitleTouched(true);
                      setClassTouched(true);
                      if (generationWorking) return;
                      if (!assessment.title.trim() || !assessment.class_id) return;
                      if (assessment.authoring_mode === "upload") {
                        if (!startPdfFile) return;
                        void (async () => {
                          setGenerationWorking(true);
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
                            setGenerationWorking(false);
                          }
                        })();
                        return;
                      }

                      if (assessment.authoring_mode === "ai") {
                        const prompt = startAiPrompt.trim();
                        if (prompt.length < 20) return;
                        void (async () => {
                          setGenerationWorking(true);
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
                            setGenerationWorking(false);
                          }
                        })();
                        return;
                      }

                      if (assessment.authoring_mode === "template") {
                        if (!selectedTemplateId) return;
                        void (async () => {
                          setGenerationWorking(true);
                          setSaving(true);
                          setError(null);
                          try {
                            await persistDraft(true);
                            await jsonFetch(`/api/assessments/${assessmentId}/template`, {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ template_id: selectedTemplateId }),
                            });
                            await load();
                            goToStep(2);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Template apply failed.");
                          } finally {
                            setSaving(false);
                            setGenerationWorking(false);
                          }
                        })();
                        return;
                      }

                      if (dirty && !saving) void persistDraft(true);
                      goToStep(2);
                    }}
                  >
                    {assessment.authoring_mode === "ai" || assessment.authoring_mode === "upload" || assessment.authoring_mode === "template"
                      ? generationWorking
                        ? assessment.authoring_mode === "template"
                          ? "Applying…"
                          : "Generating…"
                        : assessment.authoring_mode === "template"
                          ? "Apply Template"
                          : "Generate Draft"
                      : "Continue →"}
                  </Button>
                  {generationWorking ? (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                      <span>{assessment.authoring_mode === "template" ? "Applying template…" : "Generating draft…"}</span>
                    </div>
                  ) : null}
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
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">Practice Mode</div>
                      <div className="text-xs text-[var(--muted)]">
                        Practice assessments do not record scores. Students can retry multiple times.
                      </div>
                    </div>
                    <Switch
                      checked={Boolean(assessment.is_practice_mode)}
                      onCheckedChange={(checked) => {
                        setAssessment({ ...assessment, is_practice_mode: checked });
                        setDirty(true);
                        if (!saving) void persistDraft(true);
                      }}
                      disabled={readonly || saving}
                      aria-label="Practice Mode"
                    />
                  </div>
                </div>
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
                      {["History", "Science", "Literature", "Math", "Language Arts", "World Languages", "Other"].map((v) => (
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
                <CardTitle>Assets</CardTitle>
                <CardDescription>
                  Generate options or paste a URL. Add an optional audio intro and PDF reference for students.
                </CardDescription>
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
                      disabled={assetBusy || readonly || !assetPrompt.trim()}
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
                            className={`overflow-hidden rounded-md border transition-colors border-[var(--border)] ${selected ? "ring-2 ring-[var(--primary)]" : "hover:border-[var(--primary)]"
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

                <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">Audio intro (optional)</div>
                      <div className="text-xs text-[var(--muted)]">
                        MP3 or WAV. Max length 3 minutes. If provided, students must listen before questions appear.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/wav,.mp3,.wav"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleAudioSelected(f);
                        }}
                        disabled={readonly}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={assetBusy || readonly}
                        onClick={() => audioInputRef.current?.click()}
                      >
                        {audioUploading ? "Uploading…" : audioIntro ? "Replace audio" : "Upload audio"}
                      </Button>
                    </div>
                  </div>

                  {audioIntro ? (
                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-[var(--text)]">
                          {audioIntro.original_filename?.trim() || "Audio intro"}
                        </div>
                        <div className="text-xs text-[var(--muted)]">{formatSeconds(audioIntro.duration_seconds)}</div>
                      </div>
                      <audio controls src={audioIntro.asset_url} className="mt-2 w-full" />
                      <div className="mt-3 flex items-center justify-end">
                        <Button type="button" variant="secondary" disabled={assetBusy || readonly} onClick={removeAudioIntro}>
                          Remove audio
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--muted)]">No audio uploaded yet.</div>
                  )}
                  {audioError ? <div className="text-xs text-red-500">{audioError}</div> : null}
                </div>

                <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">PDF reference (optional)</div>
                      <div className="text-xs text-[var(--muted)]">PDF only. Max size 20MB. Preview inline or open full size.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={documentInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleDocumentSelected(f);
                        }}
                        disabled={readonly}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={assetBusy || readonly}
                        onClick={() => documentInputRef.current?.click()}
                      >
                        {documentUploading ? "Uploading…" : documentAsset ? "Replace PDF" : "Upload PDF"}
                      </Button>
                    </div>
                  </div>

                  {documentAsset ? (
                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-[var(--text)]">
                          {documentAsset.original_filename?.trim() || "PDF document"}
                        </div>
                        <a
                          href={documentAsset.asset_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          Open full size
                        </a>
                      </div>
                      <div className="mt-3 h-[420px] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--background)]">
                        <iframe
                          title={documentAsset.original_filename?.trim() || "PDF document"}
                          src={documentAsset.asset_url}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <Button type="button" variant="secondary" disabled={assetBusy || readonly} onClick={removeDocument}>
                          Remove PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--muted)]">No PDF uploaded yet.</div>
                  )}
                  {documentError ? <div className="text-xs text-red-500">{documentError}</div> : null}
                </div>

                <div className="text-xs text-[var(--muted)]">
                  Assets are optional for publishing. Add an image, audio intro, or PDF if they help frame the questions.
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={assetBusy || readonly}
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
                    Clear image
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" disabled={assetBusy} onClick={() => goToStep(2)}>
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={assetBusy}
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
                        const evidenceUpload = q.evidence_upload ?? "optional";
                        return (
                          <div key={q.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                                  QUESTION {q.order_index}
                                </span>
                                <span className="text-xs text-[var(--muted)]">{getQuestionTypeLabel(q.question_type)}</span>
                                <span className="text-xs text-[var(--muted)]">• {getBloomsLabel(q.blooms_level)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {editing ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      disabled={saving}
                                      onClick={() => {
                                        setEditingQuestionId(null);
                                        setEditingQuestionStandards([]);
                                      }}
                                    >
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
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-2">
                                      <Label htmlFor={`bl-${q.id}`}>Bloom&apos;s level</Label>
                                      <select
                                        id={`bl-${q.id}`}
                                        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                                        value={editingQuestionBloom}
                                        disabled={saving}
                                        onChange={(e) => setEditingQuestionBloom(e.target.value)}
                                      >
                                        {BLOOMS_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                      <p className="text-xs text-[var(--muted)]">Tag cognitive demand for scaffolding.</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`qt-${q.id}`}>Question type</Label>
                                      <select
                                        id={`qt-${q.id}`}
                                        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                                        value={editingQuestionTypePreset}
                                        disabled={saving}
                                        onChange={(e) => setEditingQuestionTypePreset(e.target.value)}
                                      >
                                        {QUESTION_TYPE_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                        <option value={CUSTOM_QUESTION_TYPE}>Custom…</option>
                                      </select>
                                      {editingQuestionTypePreset === CUSTOM_QUESTION_TYPE ? (
                                        <Input
                                          value={editingQuestionTypeCustom}
                                          onChange={(e) => setEditingQuestionTypeCustom(e.target.value)}
                                          disabled={saving}
                                          placeholder="Type a custom question type"
                                        />
                                      ) : (
                                        <p className="text-xs text-[var(--muted)]">Choose a labeled type or switch to custom.</p>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`eu-${q.id}`}>Evidence upload</Label>
                                      <select
                                        id={`eu-${q.id}`}
                                        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                                        value={evidenceUpload}
                                        disabled={saving || readonly}
                                        onChange={(e) => void updateEvidenceUpload(q.id, e.target.value as "disabled" | "optional" | "required")}
                                      >
                                        <option value="disabled">Disabled</option>
                                        <option value="optional">Optional</option>
                                        <option value="required">Required</option>
                                      </select>
                                      <p className="text-xs text-[var(--muted)]">Students can upload a photo of their work before recording.</p>
                                    </div>
                                  </div>
                                  {standardsEnabled ? (
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-[var(--text)]">Standards</div>
                                      {enabledStandardsSets.length ? (
                                        <>
                                          {editingQuestionStandards.length ? (
                                            <div className="flex flex-wrap gap-2">
                                              {editingQuestionStandards.map((standard) => (
                                                <button
                                                  key={standard.id}
                                                  type="button"
                                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--text)]"
                                                  onClick={() => removeStandard("edit", standard.id)}
                                                >
                                                  <span>{standard.code}</span>
                                                  <span className="text-[var(--muted)]">×</span>
                                                </button>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-[var(--muted)]">No standards selected.</div>
                                          )}
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                              value={standardsSearch}
                                              onChange={(event) => setStandardsSearch(event.target.value)}
                                              placeholder="Search standards (e.g., L.K.1 or grammar)"
                                            />
                                            <Button type="button" variant="secondary" disabled={standardsLoading} onClick={searchStandards}>
                                              {standardsLoading ? "Searching…" : "Search"}
                                            </Button>
                                          </div>
                                          {standardsSubjectFilter ? (
                                            <div className="text-xs text-[var(--muted)]">
                                              Filtered by subject: {standardsSubjectFilter}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-[var(--muted)]">Select a subject in Step 2 to filter standards.</div>
                                          )}
                                          {standardsResults.length ? (
                                            <div className="max-h-48 space-y-2 overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
                                              {standardsResults.map((standard) => (
                                                <div key={standard.id} className="flex items-start justify-between gap-3">
                                                  <div>
                                                    <div className="text-xs font-semibold text-[var(--text)]">{standard.code}</div>
                                                    <div className="text-xs text-[var(--muted)]">{standard.description}</div>
                                                  </div>
                                                  <Button type="button" variant="secondary" onClick={() => addStandard("edit", standard)}>
                                                    Add
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-[var(--muted)]">
                                              Search to find standards in your enabled frameworks.
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-xs text-[var(--muted)]">Enable at least one standards set in Settings.</div>
                                      )}
                                      {standardsError ? (
                                        <div className="text-xs text-[var(--danger)]" role="alert">
                                          {standardsError}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-sm italic text-[var(--text)]">“{q.question_text}”</div>
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                      <div className="text-xs text-[var(--muted)]">Evidence upload</div>
                                      <div className="text-sm text-[var(--text)] capitalize">{evidenceUpload}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-[var(--muted)]">Bloom&apos;s level</div>
                                      <div className="text-sm text-[var(--text)]">{getBloomsLabel(q.blooms_level)}</div>
                                    </div>
                                    <div className="flex items-end justify-end sm:justify-start">
                                      <Button
                                        type="button"
                                        variant={evidenceUpload === "required" ? "secondary" : "primary"}
                                        disabled={saving || readonly}
                                        onClick={() => void updateEvidenceUpload(q.id, evidenceUpload === "required" ? "optional" : "required")}
                                      >
                                        {evidenceUpload === "required" ? "Make Optional" : "Require Evidence"}
                                      </Button>
                                    </div>
                                  </div>
                                  {standardsEnabled ? (
                                    <div className="space-y-1">
                                      <div className="text-xs text-[var(--muted)]">Standards</div>
                                      {q.standards && q.standards.length ? (
                                        <div className="flex flex-wrap gap-2">
                                          {q.standards.map((standard) => (
                                            <span
                                              key={standard.id}
                                              className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text)]"
                                            >
                                              {standard.code}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-[var(--muted)]">No standards selected.</div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
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
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="newQuestionBloom">Bloom&apos;s level</Label>
                          <select
                            id="newQuestionBloom"
                            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                            value={newQuestionBloom}
                            onChange={(e) => setNewQuestionBloom(e.target.value)}
                            disabled={readonly || saving}
                          >
                            {BLOOMS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newQuestionType">Question type</Label>
                          <select
                            id="newQuestionType"
                            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                            value={newQuestionTypePreset}
                            onChange={(e) => setNewQuestionTypePreset(e.target.value)}
                            disabled={readonly || saving}
                          >
                            {QUESTION_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                            <option value={CUSTOM_QUESTION_TYPE}>Custom…</option>
                          </select>
                          {newQuestionTypePreset === CUSTOM_QUESTION_TYPE ? (
                            <Input
                              value={newQuestionTypeCustom}
                              onChange={(e) => setNewQuestionTypeCustom(e.target.value)}
                              disabled={readonly || saving}
                              placeholder="Type a custom question type"
                            />
                          ) : (
                            <p className="text-xs text-[var(--muted)]">Use a labeled type or switch to custom.</p>
                          )}
                        </div>
                        <div className="flex items-end justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={saving}
                            onClick={() => {
                              setAddingQuestion(false);
                              setNewQuestionStandards([]);
                            }}
                          >
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
                      {standardsEnabled ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-[var(--text)]">Standards</div>
                          {enabledStandardsSets.length ? (
                            <>
                              {newQuestionStandards.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {newQuestionStandards.map((standard) => (
                                    <button
                                      key={standard.id}
                                      type="button"
                                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--text)]"
                                      onClick={() => removeStandard("new", standard.id)}
                                    >
                                      <span>{standard.code}</span>
                                      <span className="text-[var(--muted)]">×</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-[var(--muted)]">No standards selected.</div>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <Input
                                  value={standardsSearch}
                                  onChange={(event) => setStandardsSearch(event.target.value)}
                                  placeholder="Search standards (e.g., L.K.1 or grammar)"
                                />
                                <Button type="button" variant="secondary" disabled={standardsLoading} onClick={searchStandards}>
                                  {standardsLoading ? "Searching…" : "Search"}
                                </Button>
                              </div>
                              {standardsSubjectFilter ? (
                                <div className="text-xs text-[var(--muted)]">
                                  Filtered by subject: {standardsSubjectFilter}
                                </div>
                              ) : (
                                <div className="text-xs text-[var(--muted)]">Select a subject in Step 2 to filter standards.</div>
                              )}
                              {standardsResults.length ? (
                                <div className="max-h-48 space-y-2 overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
                                  {standardsResults.map((standard) => (
                                    <div key={standard.id} className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-semibold text-[var(--text)]">{standard.code}</div>
                                        <div className="text-xs text-[var(--muted)]">{standard.description}</div>
                                      </div>
                                      <Button type="button" variant="secondary" onClick={() => addStandard("new", standard)}>
                                        Add
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-[var(--muted)]">
                                  Search to find standards in your enabled frameworks.
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-[var(--muted)]">Enable at least one standards set in Settings.</div>
                          )}
                          {standardsError ? (
                            <div className="text-xs text-[var(--danger)]" role="alert">
                              {standardsError}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
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
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-[var(--muted)]">
                      {rubricsComplete ? "Review settings before publishing." : "Complete both rubrics to continue."}
                    </div>
                    <Button type="button" disabled={saving || readonly || !rubricsComplete} onClick={() => goToStep(6)}>
                      Continue →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : step === 6 ? (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Preview</CardTitle>
                <CardDescription>Review the student experience, then confirm integrity settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-[var(--muted)]">STUDENT PREVIEW</div>
                    <a
                      className="text-xs text-[var(--primary)] hover:underline"
                      href={studentPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open full size
                    </a>
                  </div>
                  <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
                    <iframe
                      title="Student preview"
                      src={studentPreviewUrl}
                      className="h-[55vh] min-h-[360px] w-full sm:h-[70vh] sm:min-h-[520px]"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    This preview mirrors the student experience. Actions stay disabled for teachers.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--muted)]">STUDENT INSTRUCTIONS</div>
                  <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--text)]">
                    {assessment.instructions?.trim() || "No instructions provided."}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-[var(--muted)]">ASSETS</div>
                  <div className="space-y-3">
                    {assetUrl.trim() ? (
                      <img
                        src={assetUrl.trim()}
                        alt="Assessment asset"
                        className="w-full rounded-md border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="text-sm text-[var(--muted)]">No image selected.</div>
                    )}

                    {audioIntro ? (
                      <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
                        <div className="text-sm font-medium text-[var(--text)]">Audio intro</div>
                        <div className="text-xs text-[var(--muted)]">
                          {(audioIntro.original_filename || "Audio intro").trim()} • {formatSeconds(audioIntro.duration_seconds)}
                        </div>
                        <audio className="mt-2 w-full" controls src={audioIntro.asset_url} />
                      </div>
                    ) : null}

                    {documentAsset ? (
                      <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
                        <div className="text-sm font-medium text-[var(--text)]">PDF document</div>
                        <div className="text-xs text-[var(--muted)]">
                          {(documentAsset.original_filename || "Document").trim()}
                        </div>
                        <a
                          className="mt-2 inline-flex text-sm text-[var(--primary)] hover:underline"
                          href={documentAsset.asset_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open full size
                        </a>
                        <div className="mt-3 h-[420px] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
                          <iframe
                            title={(documentAsset.original_filename || "Document").trim()}
                            src={documentAsset.asset_url}
                            className="h-full w-full"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-[var(--muted)]">QUESTIONS</div>
                  {questions.length ? (
                    <div className="space-y-2">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--text)]"
                        >
                          <span className="font-semibold">Q{idx + 1}.</span> {q.question_text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">No questions added yet.</div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-[var(--muted)]">RUBRICS</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
                      <div className="text-sm font-medium text-[var(--text)]">Reasoning</div>
                      <div className="mt-2 text-sm text-[var(--muted)]">
                        {rubricDrafts.reasoning.instructions.trim() || "No rubric instructions."}
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
                      <div className="text-sm font-medium text-[var(--text)]">Evidence</div>
                      <div className="mt-2 text-sm text-[var(--muted)]">
                        {rubricDrafts.evidence.instructions.trim() || "No rubric instructions."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="secondary" disabled={saving} onClick={() => goToStep(5)}>
                    ← Back
                  </Button>
                  <div className="text-sm text-[var(--muted)]">Finalize integrity settings on the right.</div>
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
                Step {step} is scaffolded. Preview and settings live in Step 6.
              </CardContent>
            </Card>
          )}
        </div>

        {step === 6 ? (
          <div className="space-y-4">
            <div className="sticky top-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integrity Shields</CardTitle>
                  <CardDescription>Review settings before publishing.</CardDescription>
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
                        <span>Grace Restart</span>
                        <span
                          className="cursor-help text-xs text-[var(--muted)]"
                          title="Allows one restart if a student pauses too long before speaking or gives an off-topic response."
                        >
                          (?)
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted)]">Allow a single restart per student</div>
                    </div>
                    <Switch
                      checked={integrity.allow_grace_restart}
                      onCheckedChange={(checked) => updateIntegrity({ allow_grace_restart: checked })}
                      disabled={saving || readonly}
                      aria-label="Grace Restart"
                    />
                  </div>

                  <div className="border-t border-[var(--border)] pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                          <span>Academic Integrity Pledge</span>
                          <span
                            className="cursor-help text-xs text-[var(--muted)]"
                            title="Shows a pledge modal before the student can start the assessment."
                          >
                            (?)
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted)]">Require students to agree before seeing questions</div>
                      </div>
                      <Switch
                        checked={integrity.pledge_enabled}
                        onCheckedChange={(checked) => updateIntegrity({ pledge_enabled: checked })}
                        disabled={saving || readonly}
                        aria-label="Academic Integrity Pledge"
                      />
                    </div>

                    {integrity.pledge_enabled ? (
                      <div className="mt-3 space-y-2">
                        <Label>Pledge text (optional)</Label>
                        <textarea
                          className="min-h-[120px] w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          value={pledgeDraft}
                          onChange={(e) => setPledgeDraft(e.target.value)}
                          onBlur={() => updateIntegrity({ pledge_text: pledgeDraft.trim() ? pledgeDraft : null })}
                          placeholder={[
                            "I have studied the material and am ready to demonstrate my understanding.",
                            "I will not use notes, websites, or other people during this assessment.",
                            "I understand this assessment measures what I know, not what I can look up.",
                            "My responses will be in my own words based on my learning.",
                          ].join("\n")}
                          disabled={saving || readonly}
                        />
                        <div className="text-xs text-[var(--muted)]">Leave blank to use the default pledge.</div>
                      </div>
                    ) : null}
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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
