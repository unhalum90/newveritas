import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

function avg(nums: number[]) {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return s / nums.length;
}

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
    .select("id, title, status")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: submissions, error: sError } = await supabase
    .from("submissions")
    .select(
      "id, student_id, status, started_at, submitted_at, scoring_status, scoring_started_at, scored_at, scoring_error",
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
  const scoringComplete = submitted.filter((s) => s.scoring_status === "complete");
  const scoringError = submitted.filter((s) => s.scoring_status === "error");

  const avgScoresAcross = scoringComplete
    .map((s) => avg(scoreBuckets.get(s.id)?.all ?? []))
    .filter((n): n is number => typeof n === "number");

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
      scoring_complete_count: scoringComplete.length,
      scoring_error_count: scoringError.length,
      completion_rate: (submissions ?? []).length ? submitted.length / (submissions ?? []).length : 0,
      avg_score: avg(avgScoresAcross),
      avg_time_to_score_seconds: avg(timeToScoreSeconds),
    },
    submissions: (submissions ?? []).map((s) => ({
      ...s,
      student_name: nameById.get(s.student_id) ?? "Student",
      response_count: counts.get(s.id) ?? 0,
      avg_score: avg(scoreBuckets.get(s.id)?.all ?? []),
      reasoning_avg: avg(scoreBuckets.get(s.id)?.reasoning ?? []),
      evidence_avg: avg(scoreBuckets.get(s.id)?.evidence ?? []),
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
