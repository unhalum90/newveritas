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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Classes</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Create a class, then add students.</p>
        </div>
        <Link href="/classes/new">
          <Button type="button">+ Create Class</Button>
        </Link>
      </div>

      {!classes?.length ? (
        <Card>
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
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/classes/${c.id}`} className="hover:underline">
                    {c.name}
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
  );
}
