import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

const payloadSchema = z.object({
  standard_ids: z.array(z.string().uuid()),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows, error: listError } = await supabase
    .from("assessment_question_standards")
    .select("standard_id, standards_nodes(id, code, description)")
    .eq("question_id", id);
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const standards = (rows ?? [])
    .map((row) => row.standards_nodes)
    .filter(Boolean);

  const res = NextResponse.json({ standards });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { error: deleteError } = await supabase
    .from("assessment_question_standards")
    .delete()
    .eq("question_id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (parsed.data.standard_ids.length) {
    const rows = parsed.data.standard_ids.map((standardId) => ({
      question_id: id,
      standard_id: standardId,
    }));
    const { error: insertError } = await supabase.from("assessment_question_standards").insert(rows);
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
