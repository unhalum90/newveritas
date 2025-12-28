import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: assessment, error: getError } = await supabase
    .from("assessments")
    .select("id, class_id, title, subject, target_language, instructions, authoring_mode")
    .eq("id", id)
    .maybeSingle();

  if (getError) return NextResponse.json({ error: getSupabaseErrorMessage(getError) }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const copyTitle = `${assessment.title} (Copy)`;
  const { data: created, error: insertError } = await supabase
    .from("assessments")
    .insert({
      class_id: assessment.class_id,
      title: copyTitle,
      subject: assessment.subject ?? null,
      target_language: assessment.target_language ?? null,
      instructions: assessment.instructions ?? null,
      status: "draft",
      authoring_mode: assessment.authoring_mode ?? "manual",
      selected_asset_id: null,
    })
    .select("id")
    .single();

  if (insertError || !created) return NextResponse.json({ error: getSupabaseErrorMessage(insertError) }, { status: 500 });

  const [questionsRes, rubricsRes, integrityRes] = await Promise.all([
    supabase
      .from("assessment_questions")
      .select("question_text, question_type, order_index")
      .eq("assessment_id", id),
    supabase
      .from("rubrics")
      .select("id, rubric_type, instructions, scale_min, scale_max")
      .eq("assessment_id", id),
    supabase
      .from("assessment_integrity")
      .select(
        "pause_threshold_seconds, tab_switch_monitor, shuffle_questions, pledge_enabled, pledge_version, pledge_text, recording_limit_seconds, viewing_timer_seconds",
      )
      .eq("assessment_id", id)
      .maybeSingle(),
  ]);

  if (questionsRes.error) {
    return NextResponse.json({ error: getSupabaseErrorMessage(questionsRes.error) }, { status: 500 });
  }
  if (rubricsRes.error) {
    return NextResponse.json({ error: getSupabaseErrorMessage(rubricsRes.error) }, { status: 500 });
  }
  if (integrityRes.error) {
    return NextResponse.json({ error: getSupabaseErrorMessage(integrityRes.error) }, { status: 500 });
  }

  if (questionsRes.data?.length) {
    const { error: qInsertError } = await supabase.from("assessment_questions").insert(
      questionsRes.data.map((q) => ({
        assessment_id: created.id,
        question_text: q.question_text,
        question_type: q.question_type ?? "open_response",
        order_index: q.order_index,
      })),
    );
    if (qInsertError) return NextResponse.json({ error: getSupabaseErrorMessage(qInsertError) }, { status: 500 });
  }

  const rubricIdMap = new Map<string, string>();
  if (rubricsRes.data?.length) {
    const { data: insertedRubrics, error: rInsertError } = await supabase
      .from("rubrics")
      .insert(
        rubricsRes.data.map((r) => ({
          assessment_id: created.id,
          rubric_type: r.rubric_type,
          instructions: r.instructions,
          scale_min: r.scale_min,
          scale_max: r.scale_max,
        })),
      )
      .select("id, rubric_type");
    if (rInsertError) return NextResponse.json({ error: getSupabaseErrorMessage(rInsertError) }, { status: 500 });
    for (const r of insertedRubrics ?? []) {
      const match = rubricsRes.data.find((orig) => orig.rubric_type === r.rubric_type);
      if (match) rubricIdMap.set(match.id, r.id);
    }
  }

  if (rubricIdMap.size) {
    const { data: standards, error: standardsError } = await supabase
      .from("rubric_standards")
      .select("rubric_id, framework, standard_code, description")
      .in("rubric_id", Array.from(rubricIdMap.keys()));
    if (standardsError) return NextResponse.json({ error: getSupabaseErrorMessage(standardsError) }, { status: 500 });
    if (standards?.length) {
      const { error: standardInsertError } = await supabase.from("rubric_standards").insert(
        standards
          .map((standard) => {
            const newRubricId = rubricIdMap.get(standard.rubric_id);
            if (!newRubricId) return null;
            return {
              rubric_id: newRubricId,
              framework: standard.framework,
              standard_code: standard.standard_code ?? null,
              description: standard.description ?? null,
            };
          })
          .filter(Boolean),
      );
      if (standardInsertError) {
        return NextResponse.json({ error: getSupabaseErrorMessage(standardInsertError) }, { status: 500 });
      }
    }
  }

  if (integrityRes.data) {
    const { error: integrityInsertError } = await supabase.from("assessment_integrity").insert({
      assessment_id: created.id,
      pause_threshold_seconds: integrityRes.data.pause_threshold_seconds,
      tab_switch_monitor: integrityRes.data.tab_switch_monitor,
      shuffle_questions: integrityRes.data.shuffle_questions,
      pledge_enabled: integrityRes.data.pledge_enabled,
      pledge_version: integrityRes.data.pledge_version,
      pledge_text: integrityRes.data.pledge_text ?? null,
      recording_limit_seconds: integrityRes.data.recording_limit_seconds,
      viewing_timer_seconds: integrityRes.data.viewing_timer_seconds,
    });
    if (integrityInsertError) {
      return NextResponse.json({ error: getSupabaseErrorMessage(integrityInsertError) }, { status: 500 });
    }
  }

  const res = NextResponse.json({ ok: true, id: created.id });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
