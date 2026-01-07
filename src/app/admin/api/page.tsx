import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

type ApiLogRow = {
  id: string;
  provider: string | null;
  model: string | null;
  status_code: number | null;
  latency_ms: number | null;
  cost_cents: number | string | null;
  created_at: string | null;
};

export default async function AdminApiUsagePage() {
  const { admin } = await requirePlatformAdmin();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // eslint-disable-line react-hooks/purity

  const { data: apiLogs, error: apiLogsError } = await admin
    .from("api_logs")
    .select("id, provider, model, status_code, latency_ms, cost_cents, created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(200);

  const logs = (apiLogs ?? []) as ApiLogRow[];

  const providerStats = new Map<
    string,
    { volume: number; latencySum: number; latencyCount: number; errorCount: number; costCents: number }
  >();

  const normalizeProvider = (provider?: string | null) => (provider ?? "openai").toLowerCase();
  const formatProviderName = (provider: string) => (provider === "openai" ? "OpenAI" : provider);

  logs.forEach((log) => {
    const provider = normalizeProvider(log.provider);
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
    if (typeof log.status_code === "number" && log.status_code >= 400) {
      stats.errorCount += 1;
    }
    if (log.cost_cents !== null && log.cost_cents !== undefined) {
      const costValue = typeof log.cost_cents === "string" ? Number(log.cost_cents) : log.cost_cents;
      if (!Number.isNaN(costValue)) stats.costCents += costValue;
    }
    providerStats.set(provider, stats);
  });

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString("en-US");

  const totalCalls = logs.length;
  const totalCost = Array.from(providerStats.values()).reduce((sum, row) => sum + row.costCents, 0);
  const totalLatency = Array.from(providerStats.values()).reduce((sum, row) => sum + row.latencySum, 0);
  const totalLatencyCount = Array.from(providerStats.values()).reduce((sum, row) => sum + row.latencyCount, 0);
  const totalErrors = Array.from(providerStats.values()).reduce((sum, row) => sum + row.errorCount, 0);

  const avgLatency = totalLatencyCount ? Math.round(totalLatency / totalLatencyCount) : 0;
  const errorRate = totalCalls ? ((totalErrors / totalCalls) * 100).toFixed(1) : "0.0";

  const providerRows = providerStats.size
    ? Array.from(providerStats.entries())
      .sort(([, left], [, right]) => right.volume - left.volume)
      .map(([provider, stats]) => ({
        provider: formatProviderName(provider),
        volume: stats.volume,
        cost: formatCurrency(stats.costCents),
        latency: stats.latencyCount ? `${Math.round(stats.latencySum / stats.latencyCount)}ms` : "-",
        status: stats.errorCount > 0 ? "Degraded" : "Healthy",
        tone: stats.errorCount > 0 ? "warning" : "positive",
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">API Usage</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Provider health and cost tracking</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live visibility into model throughput, latency, and spend exposure.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Calls (24h)", value: formatNumber(totalCalls) },
          { label: "Total Cost", value: formatCurrency(totalCost) },
          { label: "Avg. Latency", value: avgLatency ? `${avgLatency}ms` : "-" },
          { label: "Error Rate", value: `${errorRate}%` },
        ].map((card) => (
          <Card
            key={card.label}
            className="border-[rgba(148,163,184,0.18)] bg-[linear-gradient(135deg,#0f172a_0%,#0b0f14_65%)]"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-[var(--text)]">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
          <CardHeader>
            <CardTitle>Provider Breakdown</CardTitle>
            <CardDescription>Calls, costs, and latency by upstream vendor.</CardDescription>
          </CardHeader>
          <CardContent>
            {apiLogsError ? (
              <p className="text-sm text-[var(--muted)]">API logs unavailable. Add the `api_logs` table to enable.</p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  <tr className="border-b border-[rgba(148,163,184,0.15)] text-left">
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Volume</th>
                    <th className="pb-3">Cost</th>
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
                      <tr key={row.provider} className="border-b border-[rgba(148,163,184,0.12)] last:border-b-0">
                        <td className="py-4 font-medium text-[var(--text)]">{row.provider}</td>
                        <td className="py-4 text-[var(--muted)]">{formatNumber(row.volume)}</td>
                        <td className="py-4 text-[var(--muted)]">{row.cost}</td>
                        <td className="py-4 text-[var(--muted)]">{row.latency}</td>
                        <td className="py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.tone === "positive"
                              ? "border-[rgba(20,184,166,0.4)] bg-[rgba(20,184,166,0.14)] text-[#5eead4]"
                              : row.tone === "warning"
                                ? "border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.16)] text-[#fde68a]"
                                : "border-[rgba(148,163,184,0.4)] bg-[rgba(148,163,184,0.16)] text-[var(--text)]"
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
          </CardContent>
        </Card>

        <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
          <CardHeader>
            <CardTitle>Consensus Auditor</CardTitle>
            <CardDescription>Review dual-scorer output and drift alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-[rgba(148,163,184,0.25)] p-4 text-sm text-[var(--muted)]">
              Hook this panel into the `api_logs` + scoring tables to compare LLM outputs side-by-side.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.6)]">
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Latest model requests across all providers.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No API calls logged in the last 24 hours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  <tr className="border-b border-[rgba(148,163,184,0.15)] text-left">
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Model</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Latency</th>
                    <th className="pb-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 12).map((log) => (
                    <tr key={log.id} className="border-b border-[rgba(148,163,184,0.12)] last:border-b-0">
                      <td className="py-3 text-[var(--text)]">
                        {formatProviderName(normalizeProvider(log.provider))}
                      </td>
                      <td className="py-3 text-[var(--muted)]">{log.model ?? "-"}</td>
                      <td className="py-3 text-[var(--muted)]">{log.status_code ?? "-"}</td>
                      <td className="py-3 text-[var(--muted)]">
                        {typeof log.latency_ms === "number" ? `${log.latency_ms}ms` : "-"}
                      </td>
                      <td className="py-3 text-[var(--muted)]">
                        {log.cost_cents ? formatCurrency(Number(log.cost_cents)) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
