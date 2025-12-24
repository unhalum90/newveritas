import type { NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getUserRole } from "@/lib/auth/roles";

export async function requireSchoolAdminContext(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { error: "Unauthorized" as const, status: 401, pendingCookies } as const;
  if (getUserRole(user) !== "school_admin") {
    return { error: "Forbidden" as const, status: 403, pendingCookies } as const;
  }

  const admin = createSupabaseAdminClient();
  const { data: link, error: linkError } = await admin
    .from("school_admins")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (linkError || !link?.school_id) {
    return { error: "School admin setup incomplete" as const, status: 409, pendingCookies } as const;
  }

  const { data: workspaces } = await admin.from("workspaces").select("id").eq("school_id", link.school_id);
  const workspaceId = workspaces?.[0]?.id ?? null;

  return {
    admin,
    user,
    schoolId: link.school_id,
    workspaceId,
    pendingCookies,
  } as const;
}

