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
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (getError) return NextResponse.json({ error: getSupabaseErrorMessage(getError) }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.status === "closed") {
    const res = NextResponse.json({ ok: true, status: "closed" });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const { data: updated, error: updateError } = await supabase
    .from("assessments")
    .update({ status: "closed" })
    .eq("id", id)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: getSupabaseErrorMessage(updateError) }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, status: updated.status });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
