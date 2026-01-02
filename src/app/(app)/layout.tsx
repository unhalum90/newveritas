import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { DisabledAccount } from "@/components/auth/disabled-account";
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

  if (!teacher) {
    const { data: createdTeacher } = await supabase
      .from("teachers")
      .insert({
        user_id: data.user.id,
        email: data.user.email ?? "",
      })
      .select("onboarding_stage, workspace_id, disabled, school_id")
      .single();
    teacher = createdTeacher ?? null;
  }

  const shouldProvisionWorkspace =
    teacher &&
    (!teacher.workspace_id || !teacher.school_id || teacher.onboarding_stage !== "COMPLETE");

  if (shouldProvisionWorkspace) {
    try {
      const admin = createSupabaseAdminClient();
      let schoolId = teacher.school_id ?? null;

      if (!schoolId) {
        const { data: school, error: schoolError } = await admin
          .from("schools")
          .insert({ name: "Default School" })
          .select("id")
          .single();
        if (schoolError) throw schoolError;
        schoolId = school.id;
      }

      let workspaceId = teacher.workspace_id ?? null;
      if (!workspaceId && schoolId) {
        const { data: existingWorkspace } = await admin
          .from("workspaces")
          .select("id")
          .eq("school_id", schoolId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        workspaceId = existingWorkspace?.id ?? null;
        if (!workspaceId) {
          const { data: workspace, error: workspaceError } = await admin
            .from("workspaces")
            .insert({ school_id: schoolId, name: "Main Workspace" })
            .select("id")
            .single();
          if (workspaceError) throw workspaceError;
          workspaceId = workspace.id;
        }
      }

      const { data: updatedTeacher } = await admin
        .from("teachers")
        .update({
          school_id: schoolId ?? teacher.school_id,
          workspace_id: workspaceId ?? teacher.workspace_id,
          onboarding_stage: "COMPLETE",
        })
        .eq("user_id", data.user.id)
        .select("onboarding_stage, workspace_id, disabled, school_id")
        .single();
      if (updatedTeacher) teacher = updatedTeacher;
    } catch {
      // If provisioning fails, fall through to the in-app notice below.
    }
  }

  if (teacher?.disabled) {
    return (
      <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <DisabledAccount />
        </main>
      </div>
    );
  }

  if (!teacher || !teacher.workspace_id) {
    return (
      <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.5)] p-6 text-sm text-[var(--muted)]">
            We couldn&apos;t finalize your workspace. Refresh this page or contact support and we&apos;ll
            fix it quickly.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
