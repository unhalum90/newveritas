import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/app/admin-header";
import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const role = getUserRole(data.user);
  if (role === "student") redirect("/student");
  if (role === "teacher") redirect("/dashboard");
  if (role !== "school_admin") redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: link, error } = await admin
    .from("school_admins")
    .select("school_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (error) redirect("/schools/register?resume=1");
  if (!link?.school_id) redirect("/schools/register?resume=1");

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <AdminHeader
        homeHref="/schools/admin"
        links={[
          { href: "/schools/admin", label: "Dashboard" },
          { href: "/schools/admin/teachers", label: "Teachers" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
