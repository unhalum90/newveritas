import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SchoolAdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || getUserRole(user) !== "school_admin") return null;

  const admin = createSupabaseAdminClient();
  const { data: link } = await admin
    .from("school_admins")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const schoolId = link?.school_id;
  if (!schoolId) return null;

  const { data: workspaces } = await admin.from("workspaces").select("id").eq("school_id", schoolId);
  const workspaceIds = (workspaces ?? []).map((w) => w.id);
  const { data: classes } = workspaceIds.length
    ? await admin.from("classes").select("id").in("workspace_id", workspaceIds)
    : { data: [] as Array<{ id: string }> };
  const classIds = (classes ?? []).map((c) => c.id);

  const { data: school } = await admin.from("schools").select("id,name").eq("id", schoolId).single();
  const { count: teacherCount } = await admin
    .from("teachers")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  const { count: studentCount } = classIds.length
    ? await admin.from("students").select("id", { count: "exact", head: true }).in("class_id", classIds)
    : { count: 0 };
  const { count: assessmentCount } = classIds.length
    ? await admin.from("assessments").select("id", { count: "exact", head: true }).in("class_id", classIds)
    : { count: 0 };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{school?.name ?? "School Admin"}</h1>
          <p className="text-sm text-[var(--muted)]">Manage teachers and track adoption.</p>
        </div>
        <Link href="/schools/admin/teachers">
          <Button>Manage Teachers</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--muted)]">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{teacherCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--muted)]">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{studentCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--muted)]">Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{assessmentCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
