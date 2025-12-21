import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rubrics, error: listError } = await supabase
    .from("rubrics")
    .select("id, assessment_id, rubric_type, instructions, scale_min, scale_max, created_at")
    .eq("assessment_id", assessmentId);

  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const res = NextResponse.json({ rubrics: rubrics ?? [] });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const upsertSchema = z.object({
  rubric_type: z.enum(["reasoning", "evidence"]),
  instructions: z.string().min(1).max(500),
  scale_min: z.number().int().min(1).max(5).default(1),
  scale_max: z.number().int().min(1).max(5).default(5),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  if (parsed.data.scale_min >= parsed.data.scale_max) {
    return NextResponse.json({ error: "Invalid scale." }, { status: 400 });
  }

  // Avoid relying on a DB unique constraint for ON CONFLICT.
  // Update if exists; otherwise insert.
  const { data: existing, error: findError } = await supabase
    .from("rubrics")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("rubric_type", parsed.data.rubric_type)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });

  const payload = {
    assessment_id: assessmentId,
    rubric_type: parsed.data.rubric_type,
    instructions: parsed.data.instructions,
    scale_min: parsed.data.scale_min,
    scale_max: parsed.data.scale_max,
  };

  const { data: rubric, error: writeError } = existing?.id
    ? await supabase.from("rubrics").update(payload).eq("id", existing.id).select("id").single()
    : await supabase.from("rubrics").insert(payload).select("id").single();

  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, id: rubric.id });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
