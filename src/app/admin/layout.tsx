import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/app/admin-header";
import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const role = getUserRole(data.user);
  if (role === "student") redirect("/student");
  if (role === "teacher") redirect("/dashboard");
  if (role !== "platform_admin") redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: allowlisted } = await admin.from("platform_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!allowlisted?.user_id) redirect("/login");

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <AdminHeader homeHref="/admin" links={[{ href: "/admin", label: "Platform" }]} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
