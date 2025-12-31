import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { validateAssessmentPhase1 } from "@/lib/validation/assessment-validator";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: assessment, error: getError } = await supabase
    .from("assessments")
    .select("id, status, title, selected_asset_id")
    .eq("id", id)
    .maybeSingle();

  if (getError) return NextResponse.json({ error: "Assessment lookup failed." }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.status !== "draft") {
    return NextResponse.json({ error: "Only draft assessments can be published." }, { status: 409 });
  }
  if (!assessment.title?.trim()) {
    return NextResponse.json({ error: "Assessment title is required." }, { status: 400 });
  }

  const { data: questions, error: qError } = await supabase
    .from("assessment_questions")
    .select("id, question_text")
    .eq("assessment_id", id);

  if (qError) return NextResponse.json({ error: "Question lookup failed." }, { status: 500 });
  if (!questions || questions.length < 1) return NextResponse.json({ error: "Add at least one question." }, { status: 400 });

  const { data: rubrics, error: rError } = await supabase
    .from("rubrics")
    .select("id, rubric_type, instructions, scale_min, scale_max")
    .eq("assessment_id", id);

  if (rError) return NextResponse.json({ error: "Rubric validation failed." }, { status: 500 });
  const validation = validateAssessmentPhase1({ questions, rubrics: rubrics ?? [] });
  if (!validation.can_publish) {
    return NextResponse.json(validation, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: publishError } = await supabase
    .from("assessments")
    .update({ status: "live", published_at: now })
    .eq("id", id);

  if (publishError) return NextResponse.json({ error: publishError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
