type AssessmentMetrics = {
  studentCount: number;
  submittedCount: number;
  completionRate: number;
  avgReasoningScore: number | null;
  avgEvidenceScore: number | null;
  avgResponseLengthWords: number | null;
  dataQuality: Record<string, unknown>;
  rubricDistributions: Record<string, unknown>;
  questionEffectiveness: Record<string, unknown>;
  maxScoredAt: string | null;
};

type QuestionRow = {
  id: string;
  order_index: number;
  question_text: string;
};

type ScoreRow = {
  submission_id: string;
  question_id: string;
  scorer_type: string;
  score: number | null;
};

type ResponseRow = {
  submission_id: string;
  question_id: string;
  transcript: string | null;
};

type SubmissionRow = {
  id: string;
  student_id: string;
  status: string;
  scored_at: string | null;
};

type RubricRow = {
  rubric_type: string;
  scale_min: number;
  scale_max: number;
};

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function pearson(xs: number[], ys: number[]) {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const meanX = avg(xs);
  const meanY = avg(ys);
  if (meanX == null || meanY == null) return null;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  if (!denom) return null;
  return num / denom;
}

function countWords(text: string) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

export async function buildAssessmentMetrics(
  supabase: {
    from: (table: string) => {
      select: (columns: string) => any;
    };
  },
  assessmentId: string,
  classId: string,
): Promise<AssessmentMetrics> {
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", classId);
  if (studentsError) throw studentsError;
  const studentCount = (students ?? []).length;

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("id, student_id, status, scored_at")
    .eq("assessment_id", assessmentId);
  if (submissionsError) throw submissionsError;

  const submitted = (submissions as SubmissionRow[]).filter((s) => s.status === "submitted");
  const submittedCount = submitted.length;
  const completionRate = studentCount ? submittedCount / studentCount : submittedCount ? 1 : 0;

  const submissionIds = submitted.map((s) => s.id);
  const { data: responses, error: responsesError } =
    submissionIds.length > 0
      ? await supabase
          .from("submission_responses")
          .select("submission_id, question_id, transcript")
          .in("submission_id", submissionIds)
      : { data: [], error: null };
  if (responsesError) throw responsesError;

  const responseRows = (responses as ResponseRow[]) ?? [];
  const transcriptWordCounts: number[] = [];
  let missingTranscriptCount = 0;
  for (const row of responseRows) {
    if (!row.transcript) {
      missingTranscriptCount += 1;
      continue;
    }
    transcriptWordCounts.push(countWords(row.transcript));
  }

  const totalResponses = responseRows.length;
  const avgResponseLengthWords =
    transcriptWordCounts.length > 0 ? Math.round(avg(transcriptWordCounts) ?? 0) : null;
  const transcriptMissingRate = totalResponses ? missingTranscriptCount / totalResponses : 0;

  const { data: scores, error: scoresError } =
    submissionIds.length > 0
      ? await supabase
          .from("question_scores")
          .select("submission_id, question_id, scorer_type, score")
          .in("submission_id", submissionIds)
      : { data: [], error: null };
  if (scoresError) throw scoresError;

  const scoreRows = (scores as ScoreRow[]) ?? [];
  const reasoningScores: number[] = [];
  const evidenceScores: number[] = [];
  const scoreBuckets = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const row of scoreRows) {
    if (typeof row.score !== "number") continue;
    if (row.scorer_type === "reasoning") reasoningScores.push(row.score);
    if (row.scorer_type === "evidence") evidenceScores.push(row.score);
    const byQuestion = scoreBuckets.get(row.submission_id) ?? new Map<string, { sum: number; count: number }>();
    const bucket = byQuestion.get(row.question_id) ?? { sum: 0, count: 0 };
    bucket.sum += row.score;
    bucket.count += 1;
    byQuestion.set(row.question_id, bucket);
    scoreBuckets.set(row.submission_id, byQuestion);
  }

  const avgReasoningScore = avg(reasoningScores);
  const avgEvidenceScore = avg(evidenceScores);

  const { data: questions, error: questionsError } = await supabase
    .from("assessment_questions")
    .select("id, order_index, question_text")
    .eq("assessment_id", assessmentId);
  if (questionsError) throw questionsError;

  const { data: rubrics, error: rubricsError } = await supabase
    .from("rubrics")
    .select("rubric_type, scale_min, scale_max")
    .eq("assessment_id", assessmentId);
  if (rubricsError) throw rubricsError;

  const rubricRows = (rubrics as RubricRow[]) ?? [];
  const maxScale = rubricRows.reduce((m, r) => Math.max(m, r.scale_max), 5);

  const rubricDistributions: Record<string, unknown> = {};
  for (const rubric of rubricRows) {
    const scoresForType = scoreRows
      .filter((row) => row.scorer_type === rubric.rubric_type && typeof row.score === "number")
      .map((row) => row.score as number);
    const distribution: Record<string, number> = {};
    for (let score = rubric.scale_min; score <= rubric.scale_max; score += 1) {
      distribution[String(score)] = scoresForType.filter((v) => v === score).length;
    }
    const threshold = Math.round((rubric.scale_min + rubric.scale_max) / 2);
    const belowThreshold = scoresForType.filter((v) => v < threshold).length;
    const belowThresholdRate = scoresForType.length ? belowThreshold / scoresForType.length : 0;
    rubricDistributions[rubric.rubric_type] = {
      scale_min: rubric.scale_min,
      scale_max: rubric.scale_max,
      mean: avg(scoresForType),
      median: median(scoresForType),
      distribution,
      threshold,
      below_threshold_rate: belowThresholdRate,
      watchlist: belowThresholdRate >= 0.3,
    };
  }

  const totalScoreBySubmission = new Map<string, number>();
  for (const [submissionId, byQuestion] of scoreBuckets.entries()) {
    const allScores: number[] = [];
    for (const bucket of byQuestion.values()) {
      if (bucket.count) allScores.push(bucket.sum / bucket.count);
    }
    const totalAvg = avg(allScores);
    if (typeof totalAvg === "number") totalScoreBySubmission.set(submissionId, totalAvg);
  }

  const questionEffectivenessItems = (questions as QuestionRow[])
    .map((question) => {
      const xs: number[] = [];
      const ys: number[] = [];
      const perSubmissionScores: number[] = [];
      for (const submissionId of submissionIds) {
        const byQuestion = scoreBuckets.get(submissionId);
        const bucket = byQuestion?.get(question.id);
        if (!bucket || !bucket.count) continue;
        const qScore = bucket.sum / bucket.count;
        perSubmissionScores.push(qScore);
        const totalScore = totalScoreBySubmission.get(submissionId);
        if (typeof totalScore === "number") {
          xs.push(qScore);
          ys.push(totalScore);
        }
      }
      const meanScore = avg(perSubmissionScores);
      const difficulty = typeof meanScore === "number" && maxScale ? meanScore / maxScale : null;
      const discrimination = pearson(xs, ys);
      return {
        question_id: question.id,
        order_index: question.order_index,
        question_text: question.question_text,
        mean_score: meanScore,
        difficulty,
        discrimination,
        flags: {
          too_easy: typeof difficulty === "number" ? difficulty > 0.9 : false,
          too_hard: typeof difficulty === "number" ? difficulty < 0.3 : false,
          low_discrimination: typeof discrimination === "number" ? discrimination < 0.2 : false,
        },
      };
    })
    .sort((a, b) => a.order_index - b.order_index);

  const reportWarnings: string[] = [];
  let qualityLevel: "good" | "limited" = "good";
  let llmMode: "metrics_only" | "low_confidence" | "full" = "full";
  if (submittedCount < 8) {
    reportWarnings.push("Low response count (metrics only).");
    qualityLevel = "limited";
    llmMode = "metrics_only";
  } else if (submittedCount < 15) {
    reportWarnings.push("Limited response count (low confidence).");
    llmMode = "low_confidence";
  }
  if (transcriptMissingRate > 0.3) {
    reportWarnings.push("High transcript missing rate.");
    qualityLevel = "limited";
  }

  const dataQuality = {
    quality_level: qualityLevel,
    submission_count: submittedCount,
    student_count: studentCount,
    completion_rate: completionRate,
    response_count: totalResponses,
    transcript_missing_rate: transcriptMissingRate,
    llm_mode: llmMode,
    warnings: reportWarnings,
  };

  const maxScoredAt = (submissions as SubmissionRow[])
    .map((s) => s.scored_at)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1) ?? null;

  return {
    studentCount,
    submittedCount,
    completionRate,
    avgReasoningScore,
    avgEvidenceScore,
    avgResponseLengthWords,
    dataQuality,
    rubricDistributions,
    questionEffectiveness: {
      max_scale: maxScale,
      items: questionEffectivenessItems,
    },
    maxScoredAt,
  };
}
