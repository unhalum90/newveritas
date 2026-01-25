import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { DisabledAccount } from "@/components/auth/disabled-account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SchoolLocaleWrapper } from "@/components/app/school-locale-wrapper";
import { Jurisdiction } from "@/lib/config/uk-config";

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
    .select("onboarding_stage, workspace_id, disabled, school_id, last_privacy_notice_shown, schools(locale)")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!teacher) {
    const { data: createdTeacher } = await supabase
      .from("teachers")
      .insert({
        user_id: data.user.id,
        email: data.user.email ?? "",
        onboarding_stage: "0", // New user starts at stage 0
      })
      .select("onboarding_stage, workspace_id, disabled, school_id, last_privacy_notice_shown, schools(locale)")
      .single();
    teacher = createdTeacher ?? null;
  }

  // Redirect NEW users (stage "0", "1", "2") to onboarding flow
  if (teacher && teacher.onboarding_stage !== "COMPLETE") {
    redirect("/onboarding");
  }

  // Only auto-provision for LEGACY accounts that completed onboarding
  // but are missing workspace/school (from before Sprint 2)
  if (
    teacher &&
    teacher.onboarding_stage === "COMPLETE" &&
    (!teacher.workspace_id || !teacher.school_id)
  ) {
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
        })
        .eq("user_id", data.user.id)
        .select("onboarding_stage, workspace_id, disabled, school_id, last_privacy_notice_shown, schools(locale)")
        .single();
      if (updatedTeacher) teacher = updatedTeacher;
    } catch {
      // If provisioning fails, fall through to the in-app notice below.
    }
  }

  if (teacher?.disabled) {
    return (
      <AppShell>
        <DisabledAccount />
      </AppShell>
    );
  }

  if (!teacher || !teacher.workspace_id) {
    return (
      <AppShell mainClassName="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
          We couldn&apos;t finalize your workspace. Refresh this page or contact support and we&apos;ll
          fix it quickly.
        </div>
      </AppShell>
    );
  }

  // Fetch privacy notice timestamp
  const lastPrivacyNoticeShown = teacher?.last_privacy_notice_shown ?? null;

  // Get school locale for UK workspace mode
  const schoolLocale = ((teacher as { schools?: { locale?: string } })?.schools?.locale ?? "US") as Jurisdiction;

  return (
    <AppShell
      privacyNotice={{
        userId: data.user.id,
        userType: "teacher",
        lastShown: lastPrivacyNoticeShown,
      }}
    >
      <SchoolLocaleWrapper locale={schoolLocale}>
        {children}
      </SchoolLocaleWrapper>
    </AppShell>
  );
}
