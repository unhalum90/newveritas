import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

async function ensureTeacher(
  supabase: ReturnType<typeof createRouteSupabaseClient>["supabase"],
  userId: string,
) {
  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, user_id, standards_tagging_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (teacher) return teacher;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Unauthorized");

  const { data: inserted, error: insertError } = await supabase
    .from("teachers")
    .insert({ user_id: userId, email: user.email ?? "" })
    .select("id, user_id, standards_tagging_enabled")
    .single();
  if (insertError) throw insertError;
  return inserted;
}

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const subject = (url.searchParams.get("subject") ?? "").trim();
  const limitParam = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

  if (!query || query.length < 2) {
    const res = NextResponse.json({ nodes: [] });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  try {
    const teacher = await ensureTeacher(supabase, data.user.id);
    if (!teacher.standards_tagging_enabled) {
      const res = NextResponse.json({ nodes: [] });
      pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }

    const { data: enabledRows, error: enabledError } = await supabase
      .from("teacher_enabled_standards")
      .select("standards_set_id")
      .eq("teacher_id", teacher.id);
    if (enabledError) throw enabledError;

    let enabledSetIds = (enabledRows ?? []).map((row) => row.standards_set_id);
    if (!enabledSetIds.length) {
      const res = NextResponse.json({ nodes: [] });
      pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }

    if (subject) {
      const { data: filteredSets, error: filterError } = await supabase
        .from("standards_sets")
        .select("id")
        .in("id", enabledSetIds)
        .ilike("subject", subject);
      if (filterError) throw filterError;
      enabledSetIds = (filteredSets ?? []).map((row) => row.id);
      if (!enabledSetIds.length) {
        const res = NextResponse.json({ nodes: [] });
        pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
      }
    }

    const search = query.replace(/%/g, "\\%");
    const { data: nodes, error: nodesError } = await supabase
      .from("standards_nodes")
      .select("id, code, description, set_id, standards_sets(key, title, subject)")
      .in("set_id", enabledSetIds)
      .or(`code.ilike.%${search}%,description.ilike.%${search}%`)
      .order("code", { ascending: true })
      .limit(limit);
    if (nodesError) throw nodesError;

    const res = NextResponse.json({ nodes: nodes ?? [] });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: getSupabaseErrorMessage(e) },
      { status: 500 },
    );
  }
}
