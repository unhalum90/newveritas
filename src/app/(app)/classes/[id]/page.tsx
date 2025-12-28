import Link from "next/link";
import { redirect } from "next/navigation";

import { AddStudents } from "@/components/classes/add-students";
import { StudentTable } from "@/components/classes/student-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, description, access_mode, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!cls) redirect("/classes");

  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, email, student_code, auth_user_id, code_claimed_at, created_at")
    .eq("class_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{cls.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {cls.access_mode === "code" ? "Code access" : cls.access_mode.toUpperCase()}
            {cls.description ? ` • ${cls.description}` : ""}
          </p>
        </div>
        <Link href="/classes">
          <Button type="button" variant="secondary">
            Back to Classes
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Students log in at{" "}
            <Link href="/student/login" className="text-[var(--text)] hover:underline">
              /student/login
            </Link>
            . Copy links below to share student access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!students?.length ? (
            <div className="text-sm text-[var(--muted)]">No students yet.</div>
          ) : (
            <StudentTable classId={id} students={students} />
          )}
        </CardContent>
      </Card>

      <AddStudents classId={id} />
    </div>
  );
}
