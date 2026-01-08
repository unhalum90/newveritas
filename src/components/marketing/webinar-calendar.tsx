type WebinarSession = {
  id: string;
  label: string;
  time: string;
};

type WebinarOccurrence = {
  date: Date;
  session: WebinarSession;
};

const sessions: WebinarSession[] = [
  { id: "thursday", label: "Thursday", time: "9:00 AM ET" },
  { id: "tuesday", label: "Tuesday", time: "3:00 PM ET" },
];

const baseDate = new Date(Date.UTC(2026, 0, 13, 12));
const dayMs = 24 * 60 * 60 * 1000;
const intervals = [5, 9];

function buildUpcomingSessions(limit: number): WebinarOccurrence[] {
  const upcoming: WebinarOccurrence[] = [];
  const now = new Date();
  let date = baseDate;
  let sessionIndex = 0;

  while (date < now) {
    const daysToAdd = intervals[sessionIndex];
    date = new Date(date.getTime() + daysToAdd * dayMs);
    sessionIndex = (sessionIndex + 1) % sessions.length;
  }

  for (let i = 0; i < limit; i += 1) {
    upcoming.push({ date, session: sessions[sessionIndex] });
    const daysToAdd = intervals[sessionIndex];
    date = new Date(date.getTime() + daysToAdd * dayMs);
    sessionIndex = (sessionIndex + 1) % sessions.length;
  }

  return upcoming;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

export function WebinarCalendar() {
  const upcoming = buildUpcomingSessions(6);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Calendar</p>
          <p className="text-sm font-semibold text-[var(--text)]">Upcoming dates</p>
        </div>
        <span className="text-xs text-[var(--muted)]">ET</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {upcoming.map((item) => (
          <div key={`${item.session.id}-${item.date.toISOString()}`} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{item.session.label}</div>
            <div className="mt-2 text-base font-semibold text-[var(--text)]">{dateFormatter.format(item.date)}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{item.session.time}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Sessions alternate weekly between Thursday morning and Tuesday evening.
      </p>
    </div>
  );
}
