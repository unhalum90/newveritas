import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: asset, error: assetError } = await supabase
    .from("assessment_assets")
    .select("id, assessment_id, asset_type, asset_url, generation_prompt, created_at")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });

  const res = NextResponse.json({ asset: asset ?? null });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const upsertSchema = z.object({
  asset_url: z.string().url().max(1000).nullable().optional(),
  generation_prompt: z.string().max(1000).nullable().optional(),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const assetUrl = parsed.data.asset_url ?? null;
  const generationPrompt = parsed.data.generation_prompt ?? null;

  // Enforce "one visual asset" by deleting any previous rows before inserting the new one.
  const { error: deleteError } = await supabase.from("assessment_assets").delete().eq("assessment_id", assessmentId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (!assetUrl) {
    await supabase.from("assessments").update({ selected_asset_id: null }).eq("id", assessmentId);
    const res = NextResponse.json({ ok: true, asset: null });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const { data: created, error: insertError } = await supabase
    .from("assessment_assets")
    .insert({
      assessment_id: assessmentId,
      asset_type: "image",
      asset_url: assetUrl,
      generation_prompt: generationPrompt,
    })
    .select("id, assessment_id, asset_type, asset_url, generation_prompt, created_at")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase.from("assessments").update({ selected_asset_id: created.id }).eq("id", assessmentId);

  const res = NextResponse.json({ ok: true, asset: created });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
