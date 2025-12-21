import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
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

  // Only redirect if onboarding is complete AND the Sprint 2 scaffold exists.
  if (teacher?.onboarding_stage === "COMPLETE" && teacher.workspace_id) redirect("/dashboard");

  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
