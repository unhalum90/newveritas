import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isEvidenceFollowup } from "@/lib/assessments/question-types";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: questions, error: listError } = await supabase
    .from("assessment_questions")
    .select("id, assessment_id, question_text, question_type, blooms_level, evidence_upload, order_index, created_at")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  if (listError) return NextResponse.json({ error: "Questions lookup failed." }, { status: 500 });

  const res = NextResponse.json({ questions: questions ?? [] });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const createSchema = z.object({
  question_text: z.string().min(1).max(500),
  question_type: z.string().optional().nullable(),
  blooms_level: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional().nullable(),
  evidence_upload: z.enum(["disabled", "optional", "required"]).optional(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { data: last } = await supabase
    .from("assessment_questions")
    .select("order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderIndex = (last?.order_index ?? 0) + 1;

  const questionType = parsed.data.question_type ?? null;
  const evidenceUpload = isEvidenceFollowup(questionType) ? "required" : parsed.data.evidence_upload ?? "optional";
  const bloomsLevel = parsed.data.blooms_level ?? "understand";

  const { data: created, error: createError } = await supabase
    .from("assessment_questions")
    .insert({
      assessment_id: assessmentId,
      question_text: parsed.data.question_text,
      question_type: questionType,
      blooms_level: bloomsLevel,
      evidence_upload: evidenceUpload,
      order_index: orderIndex,
    })
    .select("id")
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, id: created.id });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
