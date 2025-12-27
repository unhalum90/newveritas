import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: teacher } = await supabase
    .from("teachers")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!teacher?.workspace_id) redirect("/onboarding");

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, access_mode")
    .eq("workspace_id", teacher.workspace_id)
    .order("created_at", { ascending: false })
    .limit(3);

  const hasClasses = Boolean(classes && classes.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Dashboard</h1>
        </div>
        <Link href="/classes/new">
          <Button type="button">+ Create Class</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          {!hasClasses ? (
            <CardDescription>Set up your first class to begin preparing assessments.</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {classesError ? (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
              We couldn&apos;t load your classes right now. Try refreshing, or check{" "}
              <Link href="/classes" className="text-[var(--text)] hover:underline">
                Classes
              </Link>
              .
            </div>
          ) : !hasClasses ? (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
              Create your first class to begin preparing assessments.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-[var(--muted)]">
                Recent classes (manage all in{" "}
                <Link href="/classes" className="text-[var(--text)] hover:underline">
                  Classes
                </Link>
                ).
              </div>
              <div className="space-y-2">
                {classes?.map((c) => (
                  <Link
                    key={c.id}
                    href={`/classes/${c.id}`}
                    className="block rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)]"
                  >
                    <div className="text-sm font-semibold text-[var(--text)]">{c.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {c.access_mode === "code" ? "Code access" : c.access_mode.toUpperCase()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
