import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAssessmentDraftFromPrompt } from "@/lib/ai/assessment-draft";
import { generateImageBytes } from "@/lib/ai/images";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const requestSchema = z.object({
  prompt: z.string().min(20).max(4000),
  question_count: z.number().int().min(1).max(5).default(3),
});

// NOTE: Dual-model review belongs in scoring student submissions, not the builder.

async function ensurePublicBucket(admin: ReturnType<typeof createSupabaseAdminClient>, bucket: string) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.name === bucket)) return;
  const { error: createError } = await admin.storage.createBucket(bucket, { public: true });
  if (createError) throw createError;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsedReq = requestSchema.safeParse(body);
  if (!parsedReq.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  try {
    // Ensure the teacher can see/update this assessment (RLS scoped).
    const { data: assessment, error: aError } = await supabase
      .from("assessments")
      .select("id, status")
      .eq("id", assessmentId)
      .maybeSingle();

    if (aError) throw aError;
    if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (assessment.status !== "draft") {
      return NextResponse.json({ error: "Only draft assessments can be generated." }, { status: 409 });
    }

    // Builder generation should be a single-pass draft creation.
    // Dual AI review belongs in the student submission scoring pipeline, not the authoring flow.
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");
    const ai = await generateAssessmentDraftFromPrompt(parsedReq.data.prompt, parsedReq.data.question_count, {
      assessmentId,
    });

    // Persist prompt metadata (optional but useful).
    const { error: srcError } = await supabase.from("assessment_sources").insert({
      assessment_id: assessmentId,
      source_type: "ai",
      source_reference: parsedReq.data.prompt,
    });
    if (srcError) throw srcError;

    // Update assessment foundation
    const { error: updateAssessmentError } = await supabase
      .from("assessments")
      .update({
        title: ai.title,
        subject: ai.subject ?? null,
        target_language: ai.target_language ?? null,
        instructions: ai.instructions ?? null,
      })
      .eq("id", assessmentId);
    if (updateAssessmentError) throw updateAssessmentError;

    // Replace questions (v1: overwrite)
    const { error: deleteQuestionsError } = await supabase
      .from("assessment_questions")
      .delete()
      .eq("assessment_id", assessmentId);
    if (deleteQuestionsError) throw deleteQuestionsError;
    if (ai.questions.length) {
      const { error: insertQuestionsError } = await supabase.from("assessment_questions").insert(
        ai.questions.map((q, idx) => ({
          assessment_id: assessmentId,
          question_text: q.question_text,
          question_type: q.question_type ?? "open_response",
          order_index: idx + 1,
        })),
      );
      if (insertQuestionsError) throw insertQuestionsError;
    }

    // Replace rubrics (overwrite). Avoid ON CONFLICT dependency on a DB unique constraint.
    const { error: deleteRubricsError } = await supabase.from("rubrics").delete().eq("assessment_id", assessmentId);
    if (deleteRubricsError) throw deleteRubricsError;
    const { error: insertRubricsError } = await supabase.from("rubrics").insert([
      {
        assessment_id: assessmentId,
        rubric_type: "reasoning",
        instructions: ai.rubrics.reasoning,
        scale_min: 1,
        scale_max: 5,
      },
      {
        assessment_id: assessmentId,
        rubric_type: "evidence",
        instructions: ai.rubrics.evidence,
        scale_min: 1,
        scale_max: 5,
      },
    ]);
    if (insertRubricsError) throw insertRubricsError;

    // Generate and persist a single image (if prompt present).
    if (ai.image_prompt) {
      try {
        const admin = createSupabaseAdminClient();
        const bucket = process.env.SUPABASE_ASSET_BUCKET || "assessment-assets";
        await ensurePublicBucket(admin, bucket);
        const buffers = await generateImageBytes(ai.image_prompt, 1, { assessmentId });
        const bytes = buffers[0];

        const filename = `${assessmentId}/${Date.now()}-ai.png`;
        const { error: uploadError } = await admin.storage.from(bucket).upload(filename, bytes, {
          contentType: "image/png",
          upsert: true,
        });
        if (uploadError) throw uploadError;

        const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(filename);
        const assetUrl = publicUrl.publicUrl;

        // Replace any previous asset and link to assessments.selected_asset_id.
        const { error: deleteAssetsError } = await supabase
          .from("assessment_assets")
          .delete()
          .eq("assessment_id", assessmentId);
        if (deleteAssetsError) throw deleteAssetsError;
        const { data: assetRow, error: assetError } = await supabase
          .from("assessment_assets")
          .insert({
            assessment_id: assessmentId,
            asset_type: "image",
            asset_url: assetUrl,
            generation_prompt: ai.image_prompt,
        })
          .select("id")
          .single();
        if (assetError) throw assetError;
        const { error: linkAssetError } = await supabase
          .from("assessments")
          .update({ selected_asset_id: assetRow.id })
          .eq("id", assessmentId);
        if (linkAssetError) throw linkAssetError;
      } catch (e) {
        // Image generation should not block draft creation; teacher can pick an image manually later.
        console.error("AI image generation failed", e);
      }
    }

    const res = NextResponse.json({ ok: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    const message = getSupabaseErrorMessage(e);
    const envHint = message.includes("Missing OPENAI_API_KEY")
      ? "Set OPENAI_API_KEY in `veritas/.env.local` to enable AI draft generation."
      : null;
    const res = NextResponse.json({ error: envHint ? `${message} • ${envHint}` : message }, { status: 500 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }
}
