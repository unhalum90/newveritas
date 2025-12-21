import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if ((data.user.user_metadata as { role?: string } | undefined)?.role === "student") {
    redirect("/student");
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("onboarding_stage, workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!teacher || teacher.onboarding_stage !== "COMPLETE" || !teacher.workspace_id) redirect("/onboarding");

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
