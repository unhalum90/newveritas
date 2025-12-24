import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

const patchSchema = z.object({
  question_text: z.string().min(1).max(500).optional(),
  question_type: z.string().optional().nullable(),
  order_index: z.number().int().positive().optional(),
  evidence_upload: z.enum(["disabled", "optional", "required"]).optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { error: updateError } = await supabase.from("assessment_questions").update(parsed.data).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error: deleteError } = await supabase.from("assessment_questions").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
