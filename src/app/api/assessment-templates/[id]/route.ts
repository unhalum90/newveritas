import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: template, error: getError } = await supabase
    .from("assessment_templates")
    .select(
      "id, title, subject, grade_band, blooms_level_avg, description, asset_url, instructions, target_language, questions, rubrics, is_public, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (getError) return NextResponse.json({ error: getError.message }, { status: 500 });
  if (!template) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const res = NextResponse.json({ template });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
