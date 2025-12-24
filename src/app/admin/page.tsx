import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PlatformAdminPage() {
  const admin = createSupabaseAdminClient();

  const { data: schools } = await admin.from("schools").select("id,name,created_at").order("created_at", { ascending: false });
  const { count: teacherTotal } = await admin.from("teachers").select("id", { count: "exact", head: true });
  const { count: studentTotal } = await admin.from("students").select("id", { count: "exact", head: true });
  const { count: assessmentTotal } = await admin.from("assessments").select("id", { count: "exact", head: true });

  const schoolRows =
    (schools ?? []).length > 0
      ? await Promise.all(
          (schools ?? []).map(async (s) => {
            const { count: teachers } = await admin
              .from("teachers")
              .select("id", { count: "exact", head: true })
              .eq("school_id", s.id);
            return { ...s, teacherCount: teachers ?? 0 };
          }),
        )
      : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Platform Admin</h1>
        <p className="text-sm text-[var(--muted)]">High-level visibility across schools.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--muted)]">Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{(schools ?? []).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--muted)]">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{teacherTotal ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--muted)]">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{studentTotal ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schools</CardTitle>
        </CardHeader>
        <CardContent>
          {(schoolRows ?? []).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No schools yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[var(--muted)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Teachers</th>
                    <th className="py-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolRows.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="py-3">{s.name}</td>
                      <td className="py-3">{s.teacherCount}</td>
                      <td className="py-3">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-xs text-[var(--muted)]">Assessments total: {assessmentTotal ?? 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}

