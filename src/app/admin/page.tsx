import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export default async function PlatformAdminPage() {
  const { admin } = await requirePlatformAdmin();

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: teacherTotal },
    { count: studentTotal },
    { count: assessmentTotal },
    { count: assessment24h },
    { data: integrityEvents },
    { data: scoringErrors },
    { data: apiLogs },
  ] = await Promise.all([
    admin.from("teachers").select("id", { count: "exact", head: true }),
    admin.from("students").select("id", { count: "exact", head: true }),
    admin.from("assessments").select("id", { count: "exact", head: true }),
    admin.from("assessments").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
    admin.from("integrity_events").select("id, event_type, created_at").order("created_at", { ascending: false }).limit(2),
    admin
      .from("submissions")
      .select("id, scoring_error, created_at")
      .eq("scoring_status", "error")
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("api_logs")
      .select("provider, latency_ms, cost_cents, status_code, created_at")
      .gte("created_at", sinceIso),
  ]);

  const totalUsers = (teacherTotal ?? 0) + (studentTotal ?? 0);
  const formatNumber = (value: number) => value.toLocaleString("en-US");
  const formatTime = (value?: string | null) => (value ? new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "-");

  const statCards = [
    {
      label: "Total Users",
      value: formatNumber(totalUsers),
      delta: "+12%",
      tone: "positive",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3.5 18c0-2.8 3-4.5 6.5-4.5S16.5 15.2 16.5 18" />
          <circle cx="10" cy="8.5" r="3.5" />
          <path d="M15.5 11.5h5" />
          <path d="M18 9v5" />
        </svg>
      ),
    },
    {
      label: "Assessments (24h)",
      value: formatNumber(assessment24h ?? 0),
      delta: "+18%",
      tone: "positive",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 16l4-5 4 3 6-8" />
          <path d="M20 7v6h-6" />
        </svg>
      ),
    },
    {
      label: "Avg. Gross Margin",
      value: "79.2%",
      delta: "-0.5%",
      tone: "negative",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 14l4-4 4 3 6-6" />
          <path d="M20 7v6h-6" />
        </svg>
      ),
    },
    {
      label: "API Health",
      value: "99.9%",
      delta: "Stable",
      tone: "neutral",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
        </svg>
      ),
    },
  ] as const;

  const providerStats = new Map<
    string,
    { volume: number; latencySum: number; latencyCount: number; errorCount: number; costCents: number }
  >();
  for (const log of apiLogs ?? []) {
    const provider = (log.provider || "OpenAI").toLowerCase();
    const stats = providerStats.get(provider) ?? {
      volume: 0,
      latencySum: 0,
      latencyCount: 0,
      errorCount: 0,
      costCents: 0,
    };
    stats.volume += 1;
    if (typeof log.latency_ms === "number") {
      stats.latencySum += log.latency_ms;
      stats.latencyCount += 1;
    }
    if (typeof log.status_code === "number" && log.status_code >= 400) stats.errorCount += 1;
    if (log.cost_cents !== null && log.cost_cents !== undefined) {
      const costValue = typeof log.cost_cents === "string" ? Number(log.cost_cents) : log.cost_cents;
      if (!Number.isNaN(costValue)) stats.costCents += costValue;
    }
    providerStats.set(provider, stats);
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatProviderName = (provider: string) => (provider === "openai" ? "OpenAI" : provider);

  const providerRows = providerStats.size
    ? Array.from(providerStats.entries())
        .sort(([, left], [, right]) => right.volume - left.volume)
        .map(([provider, stats]) => ({
          name: formatProviderName(provider),
          volume: formatNumber(stats.volume),
          cost: formatCurrency(stats.costCents),
          latency: stats.latencyCount ? `${Math.round(stats.latencySum / stats.latencyCount)}ms` : "-",
          status: stats.errorCount > 0 ? "Degraded" : "Healthy",
          tone: stats.errorCount > 0 ? "warning" : "positive",
        }))
    : [];

  type SecurityFlag = { title: string; meta: string; tone: "warning" | "negative" | "neutral" };

  const securityFlags: SecurityFlag[] = [
    ...(integrityEvents?.map(
      (event): SecurityFlag => ({
        title: `Integrity ${event.event_type.replace("_", " ")}`,
        meta: `Submission event - ${formatTime(event.created_at)}`,
        tone: "warning",
      }),
    ) ?? []),
    ...(scoringErrors?.length
      ? [
          {
            title: "Scoring pipeline error",
            meta: `${formatTime(scoringErrors[0]?.created_at)} - check scoring queue`,
            tone: "negative",
          } as SecurityFlag,
        ]
      : []),
  ];

  const resolvedFlags = securityFlags.length
    ? securityFlags
    : [{ title: "No active flags", meta: "All clear", tone: "neutral" as const }];

  const quickLinks = [
    { title: "User Management", body: "Search, credit overrides, and impersonation.", href: "/admin/users" },
    { title: "API Usage", body: "Provider health, costs, and consensus auditing.", href: "/admin/api" },
    { title: "System Logs", body: "Incident tracking and alert history.", href: "/admin/logs" },
    { title: "Support Queue", body: "Priority tickets and integrity review.", href: "/admin/support" },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Platform Health</div>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Real-time ops for Veritas</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Monitoring user demand, API throughput, and integrity risk across the platform.
            </p>
          </div>
          <form action="/admin/users" method="get" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-72">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <Input name="q" className="pl-9" placeholder="Search users or schools..." />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[rgba(148,163,184,0.08)] text-[var(--text)] transition hover:border-[rgba(148,163,184,0.4)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 12a8 8 0 0 1 13.66-5.66" />
                <path d="M20 12a8 8 0 0 1-13.66 5.66" />
                <path d="M18 6v4h-4" />
                <path d="M6 18v-4h4" />
              </svg>
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const toneStyles =
              card.tone === "positive"
                ? "border-[rgba(20,184,166,0.4)] bg-[rgba(20,184,166,0.14)] text-[var(--text)]"
                : card.tone === "negative"
                  ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.14)] text-[#fecaca]"
                  : "border-[rgba(148,163,184,0.4)] bg-[rgba(148,163,184,0.16)] text-[var(--text)]";

            return (
              <Card
                key={card.label}
                className="border-[rgba(148,163,184,0.18)] bg-[linear-gradient(135deg,#0f172a_0%,#0b0f14_65%)] shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(148,163,184,0.12)] text-[var(--primary)]">
                    {card.icon}
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${toneStyles}`}>
                    {card.delta}
                  </span>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{card.label}</div>
                  <div className="mt-2 text-3xl font-semibold text-[var(--text)]">{card.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-[rgba(148,163,184,0.18)] bg-[linear-gradient(135deg,#0f172a_0%,#0b0f14_65%)] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <CardHeader>
              <CardTitle>API Provider Infrastructure</CardTitle>
              <CardDescription>Traffic volume, cost exposure, and latency by vendor.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    <tr className="border-b border-[rgba(148,163,184,0.15)] text-left">
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Volume (24h)</th>
                      <th className="pb-3">Cost Estimate</th>
                      <th className="pb-3">Latency</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerRows.length === 0 ? (
                      <tr className="border-b border-[rgba(148,163,184,0.12)] last:border-b-0">
                        <td colSpan={5} className="py-5 text-sm text-[var(--muted)]">
                          No API usage logged in the last 24 hours.
                        </td>
                      </tr>
                    ) : (
                      providerRows.map((row) => (
                        <tr key={row.name} className="border-b border-[rgba(148,163,184,0.12)] last:border-b-0">
                          <td className="py-4 font-medium text-[var(--text)]">{row.name}</td>
                          <td className="py-4 text-[var(--muted)]">{row.volume}</td>
                          <td className="py-4 text-[var(--muted)]">{row.cost}</td>
                          <td className="py-4 text-[var(--muted)]">{row.latency}</td>
                          <td className="py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                row.tone === "positive"
                                  ? "border-[rgba(20,184,166,0.4)] bg-[rgba(20,184,166,0.14)] text-[#5eead4]"
                                  : row.tone === "warning"
                                    ? "border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.16)] text-[#fde68a]"
                                    : "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.14)] text-[#fecaca]"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-[var(--muted)]">Assessments total: {formatNumber(assessmentTotal ?? 0)}</div>
            </CardContent>
          </Card>

          <Card className="border-[rgba(148,163,184,0.18)] bg-[linear-gradient(135deg,#0f172a_0%,#0b0f14_65%)] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <CardHeader>
              <CardTitle>Security Flags</CardTitle>
              <CardDescription>Active integrity and billing alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolvedFlags.map((flag, index) => {
                const iconTone =
                  flag.tone === "negative"
                    ? "text-[#f87171] bg-[rgba(248,113,113,0.15)]"
                    : flag.tone === "warning"
                      ? "text-[#fbbf24] bg-[rgba(251,191,36,0.15)]"
                      : "text-[#94a3b8] bg-[rgba(148,163,184,0.2)]";
                return (
                  <div
                    key={`${flag.title}-${flag.meta ?? "flag"}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.55)] p-3"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconTone}`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 3l7 4v5c0 4.25-2.9 7.9-7 9-4.1-1.1-7-4.75-7-9V7l7-4z" />
                        <path d="M12 8v5" />
                        <path d="M12 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{flag.title}</div>
                      <div className="text-xs text-[var(--muted)]">{flag.meta}</div>
                    </div>
                  </div>
                );
              })}
              <Link
                href="/admin/support"
                className="mt-2 block w-full rounded-md border border-[rgba(148,163,184,0.2)] px-3 py-2 text-center text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--text)]"
              >
                Review Security Queue
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Operations Shortcuts</h2>
          <p className="text-sm text-[var(--muted)]">Jump into core modules to take action fast.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[linear-gradient(135deg,#0f172a_0%,#0b0f14_65%)] p-5 transition hover:border-[rgba(20,184,166,0.4)]"
            >
              <div className="text-sm font-semibold text-[var(--text)]">{link.title}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{link.body}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
