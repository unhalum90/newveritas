import { NextResponse, type NextRequest } from "next/server";

import { generateAssessmentReportInsights } from "@/lib/ai/assessment-report";
import { buildAssessmentMetrics } from "@/lib/reports/assessment-analysis";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

type ResponseRow = {
  submission_id: string;
  question_id: string;
  transcript: string | null;
};

type SubmissionRow = {
  id: string;
  student_id: string;
  status: string;
};

type QuestionRow = {
  id: string;
  order_index: number;
  question_text: string;
};

function studentLabel(index: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let n = index;
  let label = "";
  do {
    label = letters[n % 26] + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Student ${label}`;
}

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 3)}...`;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, class_id, title, subject, target_language, instructions")
    .eq("id", assessmentId)
    .maybeSingle();

  if (assessmentError) return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (teacherError) return NextResponse.json({ error: teacherError.message }, { status: 500 });

  const start = Date.now();
  try {
    const metrics = await buildAssessmentMetrics(supabase, assessmentId, assessment.class_id);
    const dataQuality = { ...(metrics.dataQuality as Record<string, unknown>) };
    const warningList = Array.isArray(dataQuality.warnings) ? [...dataQuality.warnings] : [];
    const llmMode = typeof dataQuality.llm_mode === "string" ? dataQuality.llm_mode : "full";

    const { data: questions, error: questionsError } = await supabase
      .from("assessment_questions")
      .select("id, order_index, question_text")
      .eq("assessment_id", assessmentId)
      .order("order_index", { ascending: true });
    if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });

    const { data: rubrics, error: rubricsError } = await supabase
      .from("rubrics")
      .select("rubric_type, instructions, scale_min, scale_max")
      .eq("assessment_id", assessmentId);
    if (rubricsError) return NextResponse.json({ error: rubricsError.message }, { status: 500 });

    const questionList = (questions as QuestionRow[]) ?? [];
    const questionById = new Map(questionList.map((q) => [q.id, q]));

    let insights:
      | Awaited<ReturnType<typeof generateAssessmentReportInsights>>["insights"]
      | null = null;
    let aiRaw: string | null = null;
    let aiModel: string | null = null;
    let evidenceIndex: { excerpts: Array<Record<string, unknown>> } | null = null;
    let excerptRows: Array<{
      id: string;
      submission_id: string;
      question_id: string;
      transcript_text: string | null;
    }> = [];

    if (llmMode !== "metrics_only") {
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("id, student_id, status")
        .eq("assessment_id", assessmentId)
        .order("started_at", { ascending: true });
      if (submissionsError) return NextResponse.json({ error: submissionsError.message }, { status: 500 });

      const submitted = (submissions as SubmissionRow[]).filter((s) => s.status === "submitted");
      const submissionIds = submitted.map((s) => s.id);
      const studentIds = Array.from(new Set(submitted.map((s) => s.student_id)));
      const labelByStudent = new Map<string, string>();
      studentIds.forEach((id, index) => labelByStudent.set(id, studentLabel(index)));
      const studentBySubmission = new Map(submitted.map((s) => [s.id, s.student_id]));

      const { data: responses, error: responsesError } =
        submissionIds.length > 0
          ? await supabase
              .from("submission_responses")
              .select("submission_id, question_id, transcript")
              .in("submission_id", submissionIds)
          : { data: [], error: null };
      if (responsesError) return NextResponse.json({ error: responsesError.message }, { status: 500 });

      const responseRows = (responses as ResponseRow[]) ?? [];
      const byQuestion = new Map<string, ResponseRow[]>();
      for (const row of responseRows) {
        if (!row.transcript) continue;
        const list = byQuestion.get(row.question_id) ?? [];
        list.push(row);
        byQuestion.set(row.question_id, list);
      }

      const excerptInsertRows: Array<{
        assessment_id: string;
        submission_id: string;
        question_id: string;
        transcript_text: string;
        start_ms: number | null;
        end_ms: number | null;
        asr_confidence: number | null;
      }> = [];

      const MAX_EXCERPTS_PER_QUESTION = 10;
      const MAX_TRANSCRIPT_CHARS = 1200;
      for (const [questionId, rows] of byQuestion.entries()) {
        const sample = rows.slice(0, MAX_EXCERPTS_PER_QUESTION);
        for (const row of sample) {
          const transcript = row.transcript?.trim();
          if (!transcript) continue;
          excerptInsertRows.push({
            assessment_id: assessmentId,
            submission_id: row.submission_id,
            question_id: questionId,
            transcript_text: truncateText(transcript, MAX_TRANSCRIPT_CHARS),
            start_ms: null,
            end_ms: null,
            asr_confidence: null,
          });
        }
      }

      if (!excerptInsertRows.length) {
        warningList.push("Insufficient transcripts for LLM insights.");
        dataQuality.llm_mode = "metrics_only";
      } else {
        const { data: inserted, error: excerptError } = await supabase
          .from("assessment_report_excerpts")
          .insert(excerptInsertRows)
          .select("id, submission_id, question_id, transcript_text");
        if (excerptError) return NextResponse.json({ error: excerptError.message }, { status: 500 });
        excerptRows = inserted ?? [];

        const promptExcerpts = excerptRows.map((row) => {
          const question = questionById.get(row.question_id);
          const studentId = studentBySubmission.get(row.submission_id) ?? "";
          return {
            excerpt_id: row.id,
            question_id: row.question_id,
            question_order: question?.order_index ?? 0,
            question_text: question?.question_text ?? "",
            student_label: labelByStudent.get(studentId) ?? "Student",
            transcript_snippet: row.transcript_text ?? "",
          };
        });

        evidenceIndex = {
          excerpts: promptExcerpts.map((row) => ({
            excerpt_id: row.excerpt_id,
            question_id: row.question_id,
            question_order: row.question_order,
            student_label: row.student_label,
            transcript_snippet: truncateText(row.transcript_snippet, 240),
          })),
        };

        try {
          const ai = await generateAssessmentReportInsights({
            assessment: {
              title: assessment.title,
              subject: assessment.subject ?? null,
              target_language: assessment.target_language ?? null,
              instructions: assessment.instructions ?? null,
            },
            rubrics: rubrics ?? [],
            metrics: {
              data_quality: dataQuality,
              rubric_distributions: metrics.rubricDistributions,
              question_effectiveness: metrics.questionEffectiveness,
            },
            excerpts: promptExcerpts,
            context: {
              assessmentId,
              teacherId: teacher?.id ?? null,
              classId: assessment.class_id,
            },
          });
          insights = ai.insights;
          aiRaw = ai.raw;
          aiModel = ai.model;
        } catch (err) {
          warningList.push("LLM synthesis failed.");
          dataQuality.llm_mode = "metrics_only";
        }
      }
    }

    dataQuality.warnings = warningList;

    const { data: latestReport, error: latestError } = await supabase
      .from("assessment_analysis_reports")
      .select("id, report_version")
      .eq("assessment_id", assessmentId)
      .order("report_version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) return NextResponse.json({ error: latestError.message }, { status: 500 });

    const reportVersion = (latestReport?.report_version ?? 0) + 1;
    const processingSeconds = Math.max(0, (Date.now() - start) / 1000);

    const { data: report, error: reportError } = await supabase
      .from("assessment_analysis_reports")
      .insert({
        assessment_id: assessmentId,
        class_id: assessment.class_id,
        teacher_id: teacher?.id ?? null,
        status: "complete",
        report_version: reportVersion,
        supersedes_report_id: latestReport?.id ?? null,
        student_count: metrics.studentCount,
        completion_rate: metrics.completionRate,
        avg_reasoning_score: metrics.avgReasoningScore,
        avg_evidence_score: metrics.avgEvidenceScore,
        avg_response_length_words: metrics.avgResponseLengthWords,
        data_quality: dataQuality,
        rubric_distributions: metrics.rubricDistributions,
        question_effectiveness: {
          ...metrics.questionEffectiveness,
          narrative: insights?.question_effectiveness ?? null,
        },
        misconceptions: insights?.misconceptions ?? [],
        reasoning_patterns: insights?.reasoning_patterns ?? null,
        evidence_patterns: insights?.evidence_patterns ?? null,
        engagement_indicators: insights?.engagement_indicators ?? null,
        suggested_actions: insights?.suggested_actions ?? [],
        evidence_index: evidenceIndex,
        processing_time_seconds: processingSeconds,
        ai_model_version: aiModel,
        raw_ai_analysis: aiRaw,
      })
      .select("id, status, generated_at")
      .single();

    if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 });

    await supabase
      .from("assessments")
      .update({
        has_class_report: true,
        latest_report_id: report.id,
        scores_last_modified_at: metrics.maxScoredAt ?? new Date().toISOString(),
      })
      .eq("id", assessmentId);

    if (insights?.misconceptions?.length) {
      const excerptById = new Map(excerptRows.map((row) => [row.id, row]));
      const evidenceRows: Array<{
        report_id: string;
        claim_id: string;
        excerpt_id: string;
        submission_id: string | null;
        question_id: string | null;
      }> = [];
      for (const claim of insights.misconceptions) {
        for (const ref of claim.evidence_refs) {
          const excerpt = excerptById.get(ref);
          if (!excerpt) continue;
          evidenceRows.push({
            report_id: report.id,
            claim_id: claim.claim_id,
            excerpt_id: ref,
            submission_id: excerpt.submission_id ?? null,
            question_id: excerpt.question_id ?? null,
          });
        }
      }
      if (evidenceRows.length) {
        await supabase.from("report_evidence_refs").insert(evidenceRows);
      }
    }

    const res = NextResponse.json({ report_id: report.id, status: report.status, generated_at: report.generated_at }, { status: 202 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report generation failed.";
    const res = NextResponse.json({ error: message }, { status: 500 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }
}
