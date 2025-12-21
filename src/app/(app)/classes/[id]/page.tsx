import Link from "next/link";
import { redirect } from "next/navigation";

import { AddStudents } from "@/components/classes/add-students";
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
            . First login = create password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!students?.length ? (
            <div className="text-sm text-[var(--muted)]">No students yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-[var(--text)]">
                <thead>
                  <tr className="text-left text-[var(--muted)]">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Student link</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-4">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="py-2 pr-4">{s.email ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono">{s.student_code ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {s.student_code ? (
                          <Link
                            className="text-[var(--text)] hover:underline"
                            href={`/student/login?code=${encodeURIComponent(s.student_code)}`}
                          >
                            Login
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {s.auth_user_id ? (
                          <span className="text-[var(--primary)]">Activated</span>
                        ) : (
                          <span className="text-[var(--muted)]">Not activated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddStudents classId={id} />
    </div>
  );
}
