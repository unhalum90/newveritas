import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { DisabledAccount } from "@/components/auth/disabled-account";
import { TeacherTour } from "@/components/onboarding/teacher-tour";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") {
    redirect("/student");
  }
  if (role === "school_admin") {
    redirect("/schools/admin");
  }
  if (role === "platform_admin") {
    redirect("/admin");
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("onboarding_stage, workspace_id, disabled")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!teacher || teacher.onboarding_stage !== "COMPLETE" || !teacher.workspace_id) redirect("/onboarding");

  if (teacher.disabled) {
    return (
      <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <DisabledAccount />
        </main>
      </div>
    );
  }

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <AppHeader />
      <TeacherTour />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
