import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

async function ensureTeacher(
  supabase: ReturnType<typeof createRouteSupabaseClient>["supabase"],
  userId: string,
) {
  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("*")
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
    .select("*")
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
    const res = NextResponse.json({ teacher });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: getSupabaseErrorMessage(e) },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  first_name: z.string().min(1).optional().nullable(),
  last_name: z.string().min(1).optional().nullable(),
  email: z.string().email().optional(),
  country: z.string().min(1).optional().nullable(),
  school_type: z.string().min(1).optional().nullable(),
  teaching_level: z.string().min(1).optional().nullable(),
  school_name: z.string().min(1).optional(),
  onboarding_stage: z.enum(["0", "1", "2", "COMPLETE"]).optional(),
});

export async function PATCH(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const existingTeacher = await ensureTeacher(supabase, data.user.id);
    const { school_name, ...teacherUpdates } = parsed.data;

    const { data: updatedTeacher, error: updateError } = await supabase
      .from("teachers")
      .update(teacherUpdates)
      .eq("user_id", data.user.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Sprint 2: create School + Workspace during onboarding (v1: 1 school per teacher).
    let teacher = updatedTeacher;
    if (school_name && !existingTeacher.school_id) {
      // Use service role for provisioning to avoid RLS friction (still scoped to the signed-in user).
      const admin = createSupabaseAdminClient();
      const { data: school, error: schoolError } = await admin
        .from("schools")
        .insert({
          name: school_name,
          country: teacher.country,
          school_type: teacher.school_type,
        })
        .select("id")
        .single();

      if (schoolError) throw schoolError;

      const { data: workspace, error: workspaceError } = await admin
        .from("workspaces")
        .insert({ school_id: school.id, name: "Main Workspace" })
        .select("id")
        .single();

      if (workspaceError) throw workspaceError;

      const { data: finalTeacher, error: finalTeacherError } = await admin
        .from("teachers")
        .update({ school_id: school.id, workspace_id: workspace.id })
        .eq("user_id", data.user.id)
        .select("*")
        .single();

      if (finalTeacherError) throw finalTeacherError;
      teacher = finalTeacher;
    }

    const res = NextResponse.json({ teacher });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    const message = getSupabaseErrorMessage(e);
    const schemaHint =
      message.includes("relation") && message.includes("does not exist")
        ? "Database schema not installed. Run veritas/supabase/schema.sql in Supabase SQL Editor."
        : null;
    return NextResponse.json({ error: schemaHint ? `${message} • ${schemaHint}` : message }, { status: 500 });
  }
}
