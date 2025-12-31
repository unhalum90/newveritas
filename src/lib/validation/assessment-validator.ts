export type ValidationErrorType = "scale_mismatch" | "empty_question" | "empty_rubric" | "no_rubrics";

export type ValidationError = {
  type: ValidationErrorType;
  message: string;
  rubric_id?: string;
  question_id?: string;
};

export type ValidationResult = {
  can_publish: boolean;
  critical_errors: ValidationError[];
};

export type ValidationRubric = {
  id?: string | null;
  rubric_type?: string | null;
  instructions?: string | null;
  scale_min?: number | null;
  scale_max?: number | null;
};

export type ValidationQuestion = {
  id?: string | null;
  question_text?: string | null;
};

const REQUIRED_RUBRIC_TYPES = ["reasoning", "evidence"] as const;

function extractReferencedRange(instructions: string) {
  const rangePattern = /\b(\d+)\s*[–—-]\s*(\d+)\b/g;
  let min: number | null = null;
  let max: number | null = null;

  for (const match of instructions.matchAll(rangePattern)) {
    const start = Number.parseInt(match[1], 10);
    const end = Number.parseInt(match[2], 10);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    const rangeMin = Math.min(start, end);
    const rangeMax = Math.max(start, end);
    min = min === null ? rangeMin : Math.min(min, rangeMin);
    max = max === null ? rangeMax : Math.max(max, rangeMax);
  }

  if (min === null || max === null) return null;
  return { min, max };
}

export function validateAssessmentPhase1({
  questions,
  rubrics,
}: {
  questions: ValidationQuestion[];
  rubrics: ValidationRubric[];
}): ValidationResult {
  const critical_errors: ValidationError[] = [];

  const presentTypes = new Set(
    rubrics.map((rubric) => rubric.rubric_type).filter((type): type is string => Boolean(type)),
  );
  const missingTypes = REQUIRED_RUBRIC_TYPES.filter((type) => !presentTypes.has(type));
  if (missingTypes.length > 0) {
    const message =
      missingTypes.length === REQUIRED_RUBRIC_TYPES.length
        ? "No rubrics have been defined."
        : `Missing required rubric${missingTypes.length > 1 ? "s" : ""}: ${missingTypes.join(", ")}.`;
    critical_errors.push({ type: "no_rubrics", message });
  }

  for (const rubric of rubrics) {
    const instructions = rubric.instructions?.trim() ?? "";
    if (!instructions) {
      critical_errors.push({
        type: "empty_rubric",
        rubric_id: rubric.id ?? undefined,
        message: "Rubric instructions cannot be empty.",
      });
      continue;
    }

    if (typeof rubric.scale_min !== "number" || typeof rubric.scale_max !== "number") continue;

    const referencedRange = extractReferencedRange(instructions);
    if (!referencedRange) continue;

    if (referencedRange.min !== rubric.scale_min || referencedRange.max !== rubric.scale_max) {
      critical_errors.push({
        type: "scale_mismatch",
        rubric_id: rubric.id ?? undefined,
        message: `Rubric instructions reference ${referencedRange.min}-${referencedRange.max}, but scale is ${rubric.scale_min}-${rubric.scale_max}.`,
      });
    }
  }

  for (const question of questions) {
    const text = question.question_text?.trim() ?? "";
    if (!text) {
      critical_errors.push({
        type: "empty_question",
        question_id: question.id ?? undefined,
        message: "Question text cannot be empty.",
      });
    }
  }

  return {
    can_publish: critical_errors.length === 0,
    critical_errors,
  };
}
