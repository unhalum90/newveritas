import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isEvidenceFollowup } from "@/lib/assessments/question-types";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const requestSchema = z.object({
  template_id: z.string().uuid(),
});

const bloomsSchema = z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]);
const questionSchema = z.object({
  question_text: z.string().min(1),
  question_type: z.string().optional().nullable(),
  evidence_upload: z.enum(["disabled", "optional", "required"]).optional().nullable(),
  blooms_level: bloomsSchema.optional().nullable(),
});
const rubricsSchema = z.object({
  reasoning: z.object({
    instructions: z.string().min(1),
    scale_min: z.number().int().min(1).max(5).default(1),
    scale_max: z.number().int().min(2).max(5).default(5),
  }),
  evidence: z.object({
    instructions: z.string().min(1),
    scale_min: z.number().int().min(1).max(5).default(1),
    scale_max: z.number().int().min(2).max(5).default(5),
  }),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  try {
    const { data: assessment, error: aError } = await supabase
      .from("assessments")
      .select("id, status")
      .eq("id", assessmentId)
      .maybeSingle();
    if (aError) throw aError;
    if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (assessment.status !== "draft") {
      return NextResponse.json({ error: "Only draft assessments can apply templates." }, { status: 409 });
    }

    const { data: template, error: tError } = await supabase
      .from("assessment_templates")
      .select("id, title, subject, grade_band, instructions, target_language, asset_url, questions, rubrics")
      .eq("id", parsed.data.template_id)
      .maybeSingle();
    if (tError) throw tError;
    if (!template) return NextResponse.json({ error: "Template not found." }, { status: 404 });

    const questionsParsed = z.array(questionSchema).safeParse(template.questions);
    if (!questionsParsed.success) {
      return NextResponse.json({ error: "Template questions are invalid." }, { status: 400 });
    }
    const rubricsParsed = rubricsSchema.safeParse(template.rubrics);
    if (!rubricsParsed.success) {
      return NextResponse.json({ error: "Template rubrics are invalid." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("assessments")
      .update({
        title: template.title,
        subject: template.subject ?? null,
        target_language: template.target_language ?? null,
        instructions: template.instructions ?? null,
        authoring_mode: "template",
      })
      .eq("id", assessmentId);
    if (updateError) throw updateError;

    const { error: deleteQuestionsError } = await supabase
      .from("assessment_questions")
      .delete()
      .eq("assessment_id", assessmentId);
    if (deleteQuestionsError) throw deleteQuestionsError;

    const normalizedQuestions = questionsParsed.data.map((q, idx) => {
      const questionType = q.question_type ?? "open_response";
      const evidenceUpload = isEvidenceFollowup(questionType) ? "required" : q.evidence_upload ?? "optional";
      return {
        assessment_id: assessmentId,
        question_text: q.question_text,
        question_type: questionType,
        evidence_upload: evidenceUpload,
        blooms_level: q.blooms_level ?? "understand",
        order_index: idx + 1,
      };
    });
    if (normalizedQuestions.length) {
      const { error: insertQuestionsError } = await supabase.from("assessment_questions").insert(normalizedQuestions);
      if (insertQuestionsError) throw insertQuestionsError;
    }

    const { error: deleteRubricsError } = await supabase.from("rubrics").delete().eq("assessment_id", assessmentId);
    if (deleteRubricsError) throw deleteRubricsError;
    const rubricPayload = rubricsParsed.data;
    const { error: insertRubricsError } = await supabase.from("rubrics").insert([
      {
        assessment_id: assessmentId,
        rubric_type: "reasoning",
        instructions: rubricPayload.reasoning.instructions,
        scale_min: rubricPayload.reasoning.scale_min,
        scale_max: rubricPayload.reasoning.scale_max,
      },
      {
        assessment_id: assessmentId,
        rubric_type: "evidence",
        instructions: rubricPayload.evidence.instructions,
        scale_min: rubricPayload.evidence.scale_min,
        scale_max: rubricPayload.evidence.scale_max,
      },
    ]);
    if (insertRubricsError) throw insertRubricsError;

    if (template.asset_url) {
      const { error: deleteAssetsError } = await supabase
        .from("assessment_assets")
        .delete()
        .eq("assessment_id", assessmentId)
        .eq("asset_type", "image");
      if (deleteAssetsError) throw deleteAssetsError;
      const { data: assetRow, error: assetError } = await supabase
        .from("assessment_assets")
        .insert({
          assessment_id: assessmentId,
          asset_type: "image",
          asset_url: template.asset_url,
          generation_prompt: null,
        })
        .select("id")
        .single();
      if (assetError) throw assetError;
      const { error: linkAssetError } = await supabase
        .from("assessments")
        .update({ selected_asset_id: assetRow.id })
        .eq("id", assessmentId);
      if (linkAssetError) throw linkAssetError;
    } else {
      const { error: clearAssetsError } = await supabase
        .from("assessment_assets")
        .delete()
        .eq("assessment_id", assessmentId)
        .eq("asset_type", "image");
      if (clearAssetsError) throw clearAssetsError;
      const { error: unlinkAssetError } = await supabase
        .from("assessments")
        .update({ selected_asset_id: null })
        .eq("id", assessmentId);
      if (unlinkAssetError) throw unlinkAssetError;
    }

    await supabase.from("assessment_sources").insert({
      assessment_id: assessmentId,
      source_type: "template",
      source_reference: template.id,
    });

    const res = NextResponse.json({ ok: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    const message = getSupabaseErrorMessage(e);
    const res = NextResponse.json({ error: message }, { status: 500 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }
}
