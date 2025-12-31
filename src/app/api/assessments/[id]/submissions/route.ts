import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

function avg(nums: number[]) {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return s / nums.length;
}

const TAB_SWITCH_COUNT_THRESHOLD = 3;
const TAB_SWITCH_DURATION_THRESHOLD_MS = 20000;

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ensure teacher can access this assessment (RLS scoped).
  const { data: assessment, error: aError } = await supabase
    .from("assessments")
    .select("id, title, status, is_practice_mode")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: submissions, error: sError } = await supabase
    .from("submissions")
    .select(
      "id, student_id, status, started_at, submitted_at, scoring_status, scoring_started_at, scored_at, scoring_error, review_status, published_at, final_score_override, teacher_comment",
    )
    .eq("assessment_id", assessmentId)
    .order("started_at", { ascending: false });

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });

  const studentIds = Array.from(new Set((submissions ?? []).map((s) => s.student_id)));
  const { data: students, error: stError } =
    studentIds.length > 0
      ? await supabase
          .from("students")
          .select("id, first_name, last_name")
          .in("id", studentIds)
      : { data: [], error: null };

  if (stError) return NextResponse.json({ error: stError.message }, { status: 500 });

  const nameById = new Map<string, string>();
  for (const s of students ?? []) {
    nameById.set(s.id, `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim());
  }

  const { data: restartEvents, error: restartError } =
    studentIds.length > 0
      ? await supabase
          .from("assessment_restart_events")
          .select("student_id, restart_reason, created_at")
          .eq("assessment_id", assessmentId)
          .in("student_id", studentIds)
      : { data: [], error: null };
  if (restartError) return NextResponse.json({ error: restartError.message }, { status: 500 });

  const restartByStudent = new Map<string, { reason: string; created_at: string }>();
  for (const row of restartEvents ?? []) {
    if (!restartByStudent.has(row.student_id)) {
      restartByStudent.set(row.student_id, {
        reason: row.restart_reason,
        created_at: row.created_at,
      });
    }
  }

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: responses, error: rError } =
    submissionIds.length > 0
      ? await supabase
          .from("submission_responses")
          .select("submission_id, question_id")
          .in("submission_id", submissionIds)
      : { data: [], error: null };

  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  const counts = new Map<string, number>();
  for (const r of responses ?? []) {
    counts.set(r.submission_id, (counts.get(r.submission_id) ?? 0) + 1);
  }

  const { data: scores, error: scError } =
    submissionIds.length > 0
      ? await supabase
          .from("question_scores")
          .select("submission_id, scorer_type, score")
          .in("submission_id", submissionIds)
      : { data: [], error: null };

  if (scError) return NextResponse.json({ error: scError.message }, { status: 500 });

  const { data: integrityEvents, error: ieError } =
    submissionIds.length > 0
      ? await supabase
          .from("integrity_events")
          .select("submission_id, event_type, duration_ms")
          .in("submission_id", submissionIds)
      : { data: [], error: null };

  if (ieError) return NextResponse.json({ error: ieError.message }, { status: 500 });

  const integrityBySubmission = new Map<
    string,
    {
      fast_start: number;
      slow_start: number;
      screenshot_attempt: number;
      tab_switch_count: number;
      tab_switch_total_ms: number;
    }
  >();

  for (const row of integrityEvents ?? []) {
    const curr =
      integrityBySubmission.get(row.submission_id) ?? {
        fast_start: 0,
        slow_start: 0,
        screenshot_attempt: 0,
        tab_switch_count: 0,
        tab_switch_total_ms: 0,
      };
    if (row.event_type === "tab_switch") {
      curr.tab_switch_count += 1;
      curr.tab_switch_total_ms += typeof row.duration_ms === "number" ? row.duration_ms : 0;
    } else if (row.event_type === "fast_start") {
      curr.fast_start += 1;
    } else if (row.event_type === "slow_start") {
      curr.slow_start += 1;
    } else if (row.event_type === "screenshot_attempt") {
      curr.screenshot_attempt += 1;
    }
    integrityBySubmission.set(row.submission_id, curr);
  }

  const scoreBuckets = new Map<
    string,
    { all: number[]; reasoning: number[]; evidence: number[]; hasAny: boolean }
  >();
  for (const row of scores ?? []) {
    if (typeof row.score !== "number") continue;
    const curr =
      scoreBuckets.get(row.submission_id) ?? { all: [], reasoning: [], evidence: [], hasAny: false };
    curr.hasAny = true;
    curr.all.push(row.score);
    if (row.scorer_type === "reasoning") curr.reasoning.push(row.score);
    if (row.scorer_type === "evidence") curr.evidence.push(row.score);
    scoreBuckets.set(row.submission_id, curr);
  }

  const submitted = (submissions ?? []).filter((s) => s.status === "submitted");
  const isPracticeMode = Boolean(assessment.is_practice_mode);
  const scoringComplete = isPracticeMode ? [] : submitted.filter((s) => s.scoring_status === "complete");
  const scoringError = isPracticeMode ? [] : submitted.filter((s) => s.scoring_status === "error");

  const avgScoresAcross = isPracticeMode
    ? []
    : scoringComplete.map((s) => avg(scoreBuckets.get(s.id)?.all ?? [])).filter((n): n is number => typeof n === "number");

  const timeToScoreSeconds = scoringComplete
    .map((s) => {
      const submittedAt = s.submitted_at ? new Date(s.submitted_at).getTime() : NaN;
      const scoredAt = s.scored_at ? new Date(s.scored_at).getTime() : NaN;
      if (!Number.isFinite(submittedAt) || !Number.isFinite(scoredAt)) return null;
      const diff = (scoredAt - submittedAt) / 1000;
      return diff >= 0 ? diff : null;
    })
    .filter((n): n is number => typeof n === "number");

  const res = NextResponse.json({
    assessment,
    summary: {
      total_submissions: (submissions ?? []).length,
      submitted_count: submitted.length,
      scoring_complete_count: isPracticeMode ? 0 : scoringComplete.length,
      scoring_error_count: isPracticeMode ? 0 : scoringError.length,
      completion_rate: (submissions ?? []).length ? submitted.length / (submissions ?? []).length : 0,
      avg_score: isPracticeMode ? null : avg(avgScoresAcross),
      avg_time_to_score_seconds: avg(timeToScoreSeconds),
      restart_count: restartByStudent.size,
    },
    submissions: (submissions ?? []).map((s) => ({
      ...s,
      student_name: nameById.get(s.student_id) ?? "Student",
      response_count: counts.get(s.id) ?? 0,
      avg_score: isPracticeMode ? null : avg(scoreBuckets.get(s.id)?.all ?? []),
      reasoning_avg: isPracticeMode ? null : avg(scoreBuckets.get(s.id)?.reasoning ?? []),
      evidence_avg: isPracticeMode ? null : avg(scoreBuckets.get(s.id)?.evidence ?? []),
      restart_reason: restartByStudent.get(s.student_id)?.reason ?? null,
      restart_at: restartByStudent.get(s.student_id)?.created_at ?? null,
      integrity_flag_count: (() => {
        const summary = integrityBySubmission.get(s.id);
        if (!summary) return 0;
        const tabSwitchFlag =
          summary.tab_switch_count > TAB_SWITCH_COUNT_THRESHOLD ||
          summary.tab_switch_total_ms > TAB_SWITCH_DURATION_THRESHOLD_MS
            ? 1
            : 0;
        return summary.fast_start + summary.slow_start + summary.screenshot_attempt + tabSwitchFlag;
      })(),
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
