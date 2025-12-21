import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AssessmentsClient } from "./assessments-client";

export default async function AssessmentsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: teacher } = await supabase
    .from("teachers")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("workspace_id", teacher?.workspace_id ?? "");

  const classIds = classes?.map((c) => c.id) ?? [];
  const classNameById = new Map(classes?.map((c) => [c.id, c.name]));

  const assessments =
    classIds.length === 0
      ? []
      : (
          await supabase
            .from("assessments")
            .select("id, title, status, authoring_mode, created_at, class_id")
            .in("class_id", classIds)
            .order("created_at", { ascending: false })
        ).data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Assessments</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Build assessments and publish them to a class.</p>
        </div>
        <Link href="/assessments/new">
          <Button type="button">+ New Assessment</Button>
        </Link>
      </div>

      {!classes?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a class first</CardTitle>
            <CardDescription>Assessments attach to classes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/classes/new">
              <Button type="button">Create Class</Button>
            </Link>
          </CardContent>
        </Card>
      ) : !assessments?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No assessments yet</CardTitle>
            <CardDescription>Create your first assessment to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/assessments/new">
              <Button type="button">Create Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <AssessmentsClient
          initialAssessments={assessments}
          classNameById={Object.fromEntries(classNameById.entries())}
        />
      )}
    </div>
  );
}
