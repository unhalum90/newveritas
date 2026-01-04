import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

async function ensureTeacher(
  supabase: ReturnType<typeof createRouteSupabaseClient>["supabase"],
  userId: string,
) {
  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, user_id, email, standards_tagging_enabled")
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
    .select("id, user_id, email, standards_tagging_enabled")
    .single();
  if (insertError) throw insertError;
  return inserted;
}

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const teacher = await ensureTeacher(supabase, data.user.id);
    const { data: sets, error: setsError } = await supabase
      .from("standards_sets")
      .select("id, key, title, subject, jurisdiction, organization, version, description, active")
      .order("title", { ascending: true });
    if (setsError) throw setsError;

    const { data: enabledRows, error: enabledError } = await supabase
      .from("teacher_enabled_standards")
      .select("standards_set_id")
      .eq("teacher_id", teacher.id);
    if (enabledError) throw enabledError;

    const enabledSetIds = new Set((enabledRows ?? []).map((row) => row.standards_set_id));
    const responseSets = (sets ?? []).map((set) => ({
      ...set,
      enabled: enabledSetIds.has(set.id),
    }));

    const res = NextResponse.json({
      enabled: Boolean(teacher.standards_tagging_enabled),
      sets: responseSets,
    });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: getSupabaseErrorMessage(e) },
      { status: 500 },
    );
  }
}

const updateSchema = z.object({
  standards_enabled: z.boolean(),
  enabled_set_ids: z.array(z.string().uuid()),
});

export async function PUT(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  try {
    const teacher = await ensureTeacher(supabase, data.user.id);

    const { error: updateError } = await supabase
      .from("teachers")
      .update({ standards_tagging_enabled: parsed.data.standards_enabled })
      .eq("id", teacher.id);
    if (updateError) throw updateError;

    const { data: existingRows, error: listError } = await supabase
      .from("teacher_enabled_standards")
      .select("standards_set_id")
      .eq("teacher_id", teacher.id);
    if (listError) throw listError;

    const existingIds = new Set((existingRows ?? []).map((row) => row.standards_set_id));
    const nextIds = new Set(parsed.data.enabled_set_ids);

    const toInsert = Array.from(nextIds).filter((id) => !existingIds.has(id));
    const toDelete = Array.from(existingIds).filter((id) => !nextIds.has(id));

    if (toDelete.length) {
      const { error: deleteError } = await supabase
        .from("teacher_enabled_standards")
        .delete()
        .eq("teacher_id", teacher.id)
        .in("standards_set_id", toDelete);
      if (deleteError) throw deleteError;
    }

    if (toInsert.length) {
      const rows = toInsert.map((id) => ({
        teacher_id: teacher.id,
        standards_set_id: id,
      }));
      const { error: insertError } = await supabase.from("teacher_enabled_standards").insert(rows);
      if (insertError) throw insertError;
    }

    const res = NextResponse.json({ ok: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: getSupabaseErrorMessage(e) },
      { status: 500 },
    );
  }
}
