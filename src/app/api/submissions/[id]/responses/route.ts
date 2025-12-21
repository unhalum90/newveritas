import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

function getBucket() {
  return process.env.SUPABASE_RECORDINGS_BUCKET || "student-recordings";
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ensure teacher can see this submission via RLS (scoped to their assessment/workspace).
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("id, assessment_id, student_id, status, started_at, submitted_at, scoring_status, scoring_started_at, scored_at, scoring_error")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: student, error: stError } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .eq("id", submission.student_id)
    .maybeSingle();

  if (stError) return NextResponse.json({ error: stError.message }, { status: 500 });

  const { data: questions, error: qError } = await supabase
    .from("assessment_questions")
    .select("id, order_index, question_text, question_type")
    .eq("assessment_id", submission.assessment_id)
    .order("order_index", { ascending: true });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  const { data: responses, error: rError } = await supabase
    .from("submission_responses")
    .select("id, submission_id, question_id, storage_path, mime_type, duration_seconds, created_at, transcript")
    .eq("submission_id", submissionId);

  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  const { data: scores, error: scError } = await supabase
    .from("question_scores")
    .select("question_id, scorer_type, score, justification")
    .eq("submission_id", submissionId);

  if (scError) return NextResponse.json({ error: scError.message }, { status: 500 });

  const admin = createSupabaseAdminClient();
  const bucket = getBucket();

  const responseByQuestion = new Map<
    string,
    {
      signed_url: string;
      duration_seconds: number | null;
      created_at: string;
      transcript: string | null;
    }
  >();
  for (const r of responses ?? []) {
    const { data: signedUrl, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUrl(r.storage_path, 60 * 60);
    if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });
    responseByQuestion.set(r.question_id, {
      signed_url: signedUrl.signedUrl,
      duration_seconds: r.duration_seconds ?? null,
      created_at: r.created_at,
      transcript: typeof r.transcript === "string" && r.transcript.trim() ? r.transcript : null,
    });
  }

  const scoresByQuestion = new Map<
    string,
    {
      reasoning: { score: number | null; justification: string | null };
      evidence: { score: number | null; justification: string | null };
    }
  >();
  for (const row of scores ?? []) {
    const key = row.question_id;
    const curr = scoresByQuestion.get(key) ?? {
      reasoning: { score: null, justification: null },
      evidence: { score: null, justification: null },
    };

    if (row.scorer_type === "reasoning") {
      curr.reasoning = { score: row.score ?? null, justification: row.justification ?? null };
    } else if (row.scorer_type === "evidence") {
      curr.evidence = { score: row.score ?? null, justification: row.justification ?? null };
    }
    scoresByQuestion.set(key, curr);
  }

  const res = NextResponse.json({
    submission: {
      ...submission,
      student_name: `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim() || "Student",
    },
    questions: (questions ?? []).map((q) => ({
      ...q,
      response: responseByQuestion.get(q.id) ?? null,
      scores: scoresByQuestion.get(q.id) ?? null,
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
