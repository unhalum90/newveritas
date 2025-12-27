import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const role = getUserRole(data.user);
  if (role === "student") redirect("/student");
  if (role === "teacher") redirect("/dashboard");
  if (role === "school_admin") redirect("/schools/admin");
  if (role !== "platform_admin") redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: allowlisted } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!allowlisted?.user_id) redirect("/login");

  return { admin, user: data.user };
}
