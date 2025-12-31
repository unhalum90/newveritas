import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { DisabledAccount } from "@/components/auth/disabled-account";
import { TeacherTour } from "@/components/onboarding/teacher-tour";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  let { data: teacher } = await supabase
    .from("teachers")
    .select("onboarding_stage, workspace_id, disabled, school_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (teacher?.onboarding_stage === "COMPLETE" && !teacher.workspace_id && teacher.school_id) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: existingWorkspace } = await admin
        .from("workspaces")
        .select("id")
        .eq("school_id", teacher.school_id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      let workspaceId = existingWorkspace?.id ?? null;
      if (!workspaceId) {
        const { data: workspace, error: workspaceError } = await admin
          .from("workspaces")
          .insert({ school_id: teacher.school_id, name: "Main Workspace" })
          .select("id")
          .single();
        if (workspaceError) throw workspaceError;
        workspaceId = workspace.id;
      }

      const { data: updatedTeacher } = await admin
        .from("teachers")
        .update({ workspace_id: workspaceId })
        .eq("user_id", data.user.id)
        .select("onboarding_stage, workspace_id, disabled, school_id")
        .single();
      if (updatedTeacher) teacher = updatedTeacher;
    } catch {
      // Fall back to onboarding if we cannot provision workspace data.
    }
  }

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
