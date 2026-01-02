import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: report, error: reportError } = await supabase
    .from("assessment_analysis_reports")
    .select(
      "id, assessment_id, status, generated_at, student_count, completion_rate, avg_reasoning_score, avg_evidence_score, avg_response_length_words, data_quality, rubric_distributions, misconceptions, reasoning_patterns, evidence_patterns, engagement_indicators, question_effectiveness, suggested_actions, evidence_index, processing_time_seconds, report_version, ai_model_version",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 });
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const res = NextResponse.json({ report });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
