import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClassesPage() {
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
    .select("id, name, description, access_mode, created_at")
    .eq("workspace_id", teacher?.workspace_id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div className="relative min-h-screen pb-20">
      {/* Sparkle background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-background dark:to-background" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-[var(--text)]">
              Your <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-indigo-500">Classes</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Manage your classes and students.</p>
          </div>
          <Link href="/classes/new">
            <Button type="button">+ Create Class</Button>
          </Link>
        </div>

        {!classes?.length ? (
          <Card className="border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>No classes yet</CardTitle>
              <CardDescription>Create your first class to begin preparing assessments.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/classes/new">
                <Button type="button">Create Class</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <Card key={c.id} className="border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-[var(--primary)]/50">
                <CardHeader>
                  <CardTitle>
                    <Link href={`/classes/${c.id}`} className="hover:underline flex items-center justify-between">
                      {c.name}
                      <span className="text-xs font-normal text-[var(--muted)] border border-[var(--border)] rounded-full px-2 py-0.5">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {c.access_mode === "code" ? "Code access" : c.access_mode.toUpperCase()}
                    {c.description ? ` • ${c.description}` : ""}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
