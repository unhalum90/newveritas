import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: assessment, error: getError } = await supabase
    .from("assessments")
    .select(
      `
      id, class_id, title, subject, target_language, instructions, status, authoring_mode, is_practice_mode, selected_asset_id, published_at, created_at, updated_at,
      assessment_profile, profile_modified, profile_version, profile_override_keys,
      classes(name),
      assessment_integrity(*),
      assessment_questions(id, assessment_id, question_text, question_type, blooms_level, order_index, created_at),
      rubrics(id, assessment_id, rubric_type, instructions, scale_min, scale_max, created_at, rubric_standards(id, rubric_id, framework, standard_code, description))
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (getError) {
    const message = getSupabaseErrorMessage(getError);
    const schemaHint =
      message.includes("does not exist") || message.includes("column")
        ? "Database schema is out of date. Re-run `veritas/supabase/schema.sql` in Supabase SQL Editor (and if you previously ran a segment-based schema, run the drop table commands at the top of that file first)."
        : null;
    return NextResponse.json({ error: schemaHint ? `${message} • ${schemaHint}` : message }, { status: 500 });
  }
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Ensure ordering
  type AssessmentQuestion = { order_index: number };
  type Rubric = { rubric_type: string };

  if (Array.isArray(assessment.assessment_questions)) {
    (assessment.assessment_questions as AssessmentQuestion[]).sort((a, b) => a.order_index - b.order_index);
  }
  if (Array.isArray(assessment.rubrics)) {
    (assessment.rubrics as Rubric[]).sort((a, b) => a.rubric_type.localeCompare(b.rubric_type));
  }

  const res = NextResponse.json({ assessment });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  class_id: z.string().uuid().optional(),
  subject: z.string().optional().nullable(),
  target_language: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  authoring_mode: z.enum(["manual", "upload", "ai", "template"]).optional(),
  is_practice_mode: z.boolean().optional(),
  // Profile fields
  assessment_profile: z.enum(["k6_formative", "712_formative", "712_summative", "higher_ed_viva", "language_proficiency"]).optional().nullable(),
  profile_modified: z.boolean().optional(),
  profile_version: z.number().int().positive().optional(),
  profile_override_keys: z.array(z.string()).optional(),
  // UK Config
  uk_locale_config: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { data: updated, error: updateError } = await supabase
    .from("assessments")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, id: updated.id });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: assessment, error: getError } = await supabase
    .from("assessments")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (getError) return NextResponse.json({ error: getSupabaseErrorMessage(getError) }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.status !== "draft") {
    return NextResponse.json({ error: "Only draft assessments can be deleted." }, { status: 409 });
  }

  const { error: deleteError } = await supabase.from("assessments").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: getSupabaseErrorMessage(deleteError) }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
