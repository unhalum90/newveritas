import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getUserRole } from "@/lib/auth/roles";
import { countryToLocale } from "@/lib/config/uk-config";

const schema = z.object({
  school_name: z.string().min(2),
  country: z.string().optional().nullable(),
  school_type: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "school_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const admin = createSupabaseAdminClient();

    // Idempotent bootstrap: if they already have a school, return it.
    const { data: existing, error: existingError } = await admin
      .from("school_admins")
      .select("school_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.school_id) {
      const res = NextResponse.json({ school_id: existing.school_id });
      pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }

    const { data: school, error: schoolError } = await admin
      .from("schools")
      .insert({
        name: parsed.data.school_name,
        country: parsed.data.country ?? null,
        school_type: parsed.data.school_type ?? null,
        locale: countryToLocale(parsed.data.country),
        locale_locked: countryToLocale(parsed.data.country) === 'UK',
      })
      .select("id, locale")
      .single();
    if (schoolError) throw schoolError;

    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .insert({ school_id: school.id, name: "Main Workspace", locale: school.locale })
      .select("id")
      .single();
    if (workspaceError) throw workspaceError;

    const { error: linkError } = await admin
      .from("school_admins")
      .insert({ user_id: user.id, school_id: school.id });
    if (linkError) throw linkError;

    // Store a hint in user metadata for convenience (not used for security).
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...(user.user_metadata as Record<string, unknown>), school_id: school.id },
    });

    const res = NextResponse.json({ school_id: school.id, workspace_id: workspace.id });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
  }
}

