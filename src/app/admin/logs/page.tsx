import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export default async function AdminSystemLogsPage() {
  const { admin } = await requirePlatformAdmin();

  const [{ data: systemLogs, error: systemError }, { data: auditLogs, error: auditError }] = await Promise.all([
    admin
      .from("system_logs")
      .select("id, event_type, provider, severity, message, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("admin_audit_trail")
      .select("id, action, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const formatDateTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "-";

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">System Logs</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Incident and audit timeline</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Review provider incidents, runtime errors, and admin actions in one stream.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
          <CardHeader>
            <CardTitle>System Events</CardTitle>
            <CardDescription>Operational errors and vendor alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            {systemError ? (
              <p className="text-sm text-[var(--muted)]">System logs unavailable. Add the `system_logs` table.</p>
            ) : (systemLogs ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No system events logged yet.</p>
            ) : (
              <div className="space-y-3">
                {(systemLogs ?? []).map((log) => (
                  <div key={log.id} className="rounded-xl border border-[rgba(148,163,184,0.18)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--text)]">{log.event_type}</div>
                      <div className="text-xs text-[var(--muted)]">{formatDateTime(log.created_at)}</div>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {log.provider ?? "Core"} • {log.severity ?? "info"}
                    </div>
                    <div className="mt-2 text-sm text-[var(--text)]">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
          <CardHeader>
            <CardTitle>Admin Audit Trail</CardTitle>
            <CardDescription>Every privileged action logged for compliance.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditError ? (
              <p className="text-sm text-[var(--muted)]">Audit trail unavailable. Add the `admin_audit_trail` table.</p>
            ) : (auditLogs ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No admin actions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {(auditLogs ?? []).map((log) => (
                  <div key={log.id} className="rounded-xl border border-[rgba(148,163,184,0.18)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--text)]">{log.action.replace(/_/g, " ")}</div>
                      <div className="text-xs text-[var(--muted)]">{formatDateTime(log.created_at)}</div>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {log.entity_type} • {log.entity_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
