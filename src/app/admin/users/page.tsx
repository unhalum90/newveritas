import { revalidatePath } from "next/cache";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

type SearchParams = {
  q?: string;
  role?: string;
};

async function toggleTeacherDisabled(formData: FormData) {
  "use server";
  const { admin, user } = await requirePlatformAdmin();
  const teacherId = String(formData.get("teacher_id") ?? "").trim();
  const nextDisabled = String(formData.get("next_disabled") ?? "false") === "true";
  if (!teacherId) return;

  await admin.from("teachers").update({ disabled: nextDisabled }).eq("id", teacherId);
  await admin.from("admin_audit_trail").insert({
    admin_user_id: user.id,
    action: nextDisabled ? "teacher_disabled" : "teacher_enabled",
    entity_type: "teacher",
    entity_id: teacherId,
    metadata: { disabled: nextDisabled },
  });

  revalidatePath("/admin/users");
}

async function adjustCredits(formData: FormData) {
  "use server";
  const { admin, user } = await requirePlatformAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  const delta = Number(formData.get("delta") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  if (!userId || !Number.isFinite(delta) || delta === 0) return;

  await admin.from("credit_adjustments").insert({
    user_id: userId,
    delta,
    reason: reason || null,
    created_by: user.id,
  });

  await admin.from("admin_audit_trail").insert({
    admin_user_id: user.id,
    action: "credit_adjustment",
    entity_type: "user",
    entity_id: userId,
    metadata: { delta, reason: reason || null },
  });

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const { admin } = await requirePlatformAdmin();
  const query = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const roleFilter = typeof searchParams?.role === "string" ? searchParams.role : "all";
  const searchFilter = query ? `%${query}%` : null;

  const [{ count: teacherCount }, { count: studentCount }] = await Promise.all([
    admin.from("teachers").select("id", { count: "exact", head: true }),
    admin.from("students").select("id", { count: "exact", head: true }),
  ]);

  const teachersQuery = admin
    .from("teachers")
    .select("id, user_id, email, first_name, last_name, disabled, onboarding_stage, created_at, school:schools(name), workspace:workspaces(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (searchFilter) {
    teachersQuery.or(`email.ilike.${searchFilter},first_name.ilike.${searchFilter},last_name.ilike.${searchFilter}`);
  }

  const studentsQuery = admin
    .from("students")
    .select(
      "id, first_name, last_name, email, student_code, auth_user_id, created_at, class:classes(name, workspace:workspaces(name, school:schools(name)))",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (searchFilter) {
    studentsQuery.or(`email.ilike.${searchFilter},first_name.ilike.${searchFilter},last_name.ilike.${searchFilter}`);
  }

  const [{ data: teachers, error: teacherError }, { data: students, error: studentError }, { data: auditLogs }] =
    await Promise.all([
      roleFilter === "students" ? Promise.resolve({ data: [], error: null }) : teachersQuery,
      roleFilter === "teachers" ? Promise.resolve({ data: [], error: null }) : studentsQuery,
      admin
        .from("admin_audit_trail")
        .select("id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const teacherUserIds = (teachers ?? []).map((t) => t.user_id).filter(Boolean) as string[];
  const { data: creditBalances, error: creditError } = teacherUserIds.length
    ? await admin.from("credit_balances").select("user_id, balance").in("user_id", teacherUserIds)
    : { data: [], error: null };

  const creditMap = new Map(
    (creditError ? [] : creditBalances ?? []).map((entry) => [entry.user_id, entry.balance]),
  );

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-";

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">User Management</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Manage people and credits</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Search teachers and students, adjust credits, and audit account actions.
        </p>
      </div>

      <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)]">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Search</div>
              <Input name="q" form="admin-user-search" defaultValue={query} placeholder="Email or name" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Role</div>
              <select
                name="role"
                form="admin-user-search"
                defaultValue={roleFilter}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              >
                <option value="all">All users</option>
                <option value="teachers">Teachers</option>
                <option value="students">Students</option>
              </select>
            </div>
          </div>
          <form id="admin-user-search" method="get" className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-[var(--primary-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)]"
            >
              Search
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {roleFilter !== "students" ? (
            <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
              <CardHeader>
                <CardTitle>Teachers</CardTitle>
                <CardDescription>
                  {teacherCount ?? 0} total teachers • Showing {(teachers ?? []).length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teacherError ? (
                  <p className="text-sm text-[var(--muted)]">Unable to load teachers right now.</p>
                ) : (teachers ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No teacher results found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        <tr className="border-b border-[rgba(148,163,184,0.2)] text-left">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">School</th>
                          <th className="pb-3">Workspace</th>
                          <th className="pb-3">Credits</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(teachers ?? []).map((teacher) => {
                          const name = [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") || teacher.email;
                          const credits = creditMap.get(teacher.user_id);
                          return (
                            <tr key={teacher.id} className="border-b border-[rgba(148,163,184,0.15)] last:border-b-0">
                              <td className="py-3">
                                <div className="font-medium text-[var(--text)]">{name}</div>
                                <div className="text-xs text-[var(--muted)]">{teacher.email}</div>
                              </td>
                              <td className="py-3 text-[var(--muted)]">{teacher.school?.[0]?.name ?? "-"}</td>
                              <td className="py-3 text-[var(--muted)]">{teacher.workspace?.[0]?.name ?? "-"}</td>
                              <td className="py-3 text-[var(--muted)]">{typeof credits === "number" ? credits : "-"}</td>
                              <td className="py-3">
                                <span
                                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                                    teacher.disabled
                                      ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.16)] text-[#fecaca]"
                                      : "border-[rgba(20,184,166,0.4)] bg-[rgba(20,184,166,0.16)] text-[#5eead4]"
                                  }`}
                                >
                                  {teacher.disabled ? "Disabled" : "Active"}
                                </span>
                              </td>
                              <td className="py-3">
                                <form action={toggleTeacherDisabled}>
                                  <input type="hidden" name="teacher_id" value={teacher.id} />
                                  <input type="hidden" name="next_disabled" value={String(!teacher.disabled)} />
                                  <button
                                    type="submit"
                                    className="rounded-full border border-[rgba(148,163,184,0.3)] px-3 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--text)]"
                                  >
                                    {teacher.disabled ? "Enable" : "Disable"}
                                  </button>
                                </form>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {roleFilter !== "teachers" ? (
            <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  {studentCount ?? 0} total students • Showing {(students ?? []).length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentError ? (
                  <p className="text-sm text-[var(--muted)]">Unable to load students right now.</p>
                ) : (students ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No student results found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        <tr className="border-b border-[rgba(148,163,184,0.2)] text-left">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Class</th>
                          <th className="pb-3">School</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(students ?? []).map((student) => {
                          const name = `${student.first_name} ${student.last_name}`.trim();
                          return (
                            <tr key={student.id} className="border-b border-[rgba(148,163,184,0.15)] last:border-b-0">
                              <td className="py-3">
                                <div className="font-medium text-[var(--text)]">{name}</div>
                                <div className="text-xs text-[var(--muted)]">{student.email ?? student.student_code}</div>
                              </td>
                              <td className="py-3 text-[var(--muted)]">{student.class?.[0]?.name ?? "-"}</td>
                              <td className="py-3 text-[var(--muted)]">
                                {student.class?.[0]?.workspace?.[0]?.school?.[0]?.name ?? "-"}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                                    student.auth_user_id
                                      ? "border-[rgba(20,184,166,0.4)] bg-[rgba(20,184,166,0.16)] text-[#5eead4]"
                                      : "border-[rgba(148,163,184,0.4)] bg-[rgba(148,163,184,0.16)] text-[var(--text)]"
                                  }`}
                                >
                                  {student.auth_user_id ? "Linked" : "Pending"}
                                </span>
                              </td>
                              <td className="py-3 text-[var(--muted)]">{formatDate(student.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
            <CardHeader>
              <CardTitle>Manual Credit Adjustment</CardTitle>
              <CardDescription>Apply a one-time credit delta to a user UUID.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={adjustCredits} className="space-y-3">
                <Input name="user_id" placeholder="User UUID" required />
                <Input name="delta" type="number" placeholder="Delta (e.g. 25 or -10)" required />
                <textarea
                  name="reason"
                  rows={3}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                  placeholder="Reason (optional)"
                />
                <button
                  type="submit"
                  className="w-full rounded-md bg-[var(--primary-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)]"
                >
                  Apply Adjustment
                </button>
                <p className="text-xs text-[var(--muted)]">
                  Requires the `credit_adjustments` + `credit_balances` tables in Supabase.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
            <CardHeader>
              <CardTitle>Recent Admin Actions</CardTitle>
              <CardDescription>Latest changes made in the admin console.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(auditLogs ?? []).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No audit events yet.</p>
              ) : (
                (auditLogs ?? []).map((log) => (
                  <div key={log.id} className="rounded-lg border border-[rgba(148,163,184,0.18)] p-3 text-sm">
                    <div className="font-semibold text-[var(--text)]">{log.action.replace(/_/g, " ")}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {log.entity_type} • {formatDate(log.created_at)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
