import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export default async function AdminSupportPage() {
  const { admin } = await requirePlatformAdmin();

  const [{ data: tickets, error: ticketError }, { data: integrityEvents }, { data: scoringErrors }] =
    await Promise.all([
      admin
        .from("support_tickets")
        .select("id, title, status, priority, category, created_at")
        .order("created_at", { ascending: false })
        .limit(12),
      admin
        .from("integrity_events")
        .select("id, event_type, submission_id, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("submissions")
        .select("id, scoring_error, created_at")
        .eq("scoring_status", "error")
        .order("created_at", { ascending: false })
        .limit(6),
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
        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Support Queue</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Resolve high-priority incidents</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Triage integrity reviews, scoring failures, and billing escalations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
          <CardHeader>
            <CardTitle>Open Tickets</CardTitle>
            <CardDescription>Active requests from schools and internal alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketError ? (
              <p className="text-sm text-[var(--muted)]">Support tickets unavailable. Add `support_tickets` table.</p>
            ) : (tickets ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No open tickets right now.</p>
            ) : (
              <div className="space-y-3">
                {(tickets ?? []).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.18)] p-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{ticket.title}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        {ticket.category ?? "General"} • {ticket.priority ?? "normal"} • {formatDateTime(ticket.created_at)}
                      </div>
                    </div>
                    <span className="rounded-full border border-[rgba(148,163,184,0.35)] px-3 py-1 text-xs text-[var(--muted)]">
                      {ticket.status ?? "open"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
            <CardHeader>
              <CardTitle>Integrity Events</CardTitle>
              <CardDescription>Latest suspicious submission activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(integrityEvents ?? []).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No integrity events logged yet.</p>
              ) : (
                (integrityEvents ?? []).map((event) => (
                  <div key={event.id} className="rounded-lg border border-[rgba(148,163,184,0.18)] p-3">
                    <div className="text-sm font-semibold text-[var(--text)]">
                      {event.event_type.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{event.submission_id}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(event.created_at)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
            <CardHeader>
              <CardTitle>Scoring Exceptions</CardTitle>
              <CardDescription>Submissions stuck in error state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(scoringErrors ?? []).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No scoring errors right now.</p>
              ) : (
                (scoringErrors ?? []).map((submission) => (
                  <div key={submission.id} className="rounded-lg border border-[rgba(148,163,184,0.18)] p-3">
                    <div className="text-sm font-semibold text-[var(--text)]">Submission {submission.id}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{submission.scoring_error ?? "Unknown error"}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(submission.created_at)}</div>
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
