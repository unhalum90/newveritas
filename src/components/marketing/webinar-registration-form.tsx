"use client";

import { useMemo, useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

const sessions = [
  {
    id: "thursday",
    label: "Thursday morning",
    time: "9:00 AM ET",
    duration: "45 minutes · alternating weekly",
    link: "https://us06web.zoom.us/meeting/register/P2eRPVlpQxaTRjqF29lFjw",
  },
  {
    id: "tuesday",
    label: "Tuesday evening",
    time: "3:00 PM ET",
    duration: "45 minutes · alternating weekly",
    link: "https://us06web.zoom.us/meeting/register/bW4JmEtMRJ2NMbFW2ic8UQ",
  },
] as const;

export function WebinarRegistrationForm() {
  const [sessionId, setSessionId] = useState<string>(sessions[0].id);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const selectedSession = useMemo(() => sessions.find((s) => s.id === sessionId), [sessionId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !school.trim() || !position.trim() || !email.trim()) {
      setStatus("error");
      setMessage("Please complete all fields.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/webinars/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          school,
          position,
          email,
          session: selectedSession ? `${selectedSession.label} (${selectedSession.time})` : sessionId,
        }),
      });

      if (response.ok || response.status === 409) {
        setStatus("success");
        setMessage("Thanks! Redirecting you to Zoom registration...");
        setName("");
        setSchool("");
        setPosition("");
        setEmail("");
        if (selectedSession?.link) {
          setTimeout(() => {
            window.location.href = selectedSession.link;
          }, 800);
        }
        return;
      }

      const data = await response.json().catch(() => ({}));
      const errorMessage = typeof data?.error === "string" ? data.error : "Unable to register right now.";
      setStatus("error");
      setMessage(errorMessage);
    } catch (error) {
      setStatus("error");
      setMessage("Unable to register right now.");
    }
  };

  const messageTone =
    status === "success" ? "text-[var(--primary)]" : status === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl md:p-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Alternating sessions (ET)</p>
        <h2 className="text-2xl font-semibold text-[var(--text)]">Register for a live walkthrough</h2>
        <p className="text-sm text-[var(--muted)]">
          Choose the next session that works for you. We alternate weekly between Thursday morning and Tuesday evening.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sessions.map((session) => {
          const active = session.id === sessionId;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => setSessionId(session.id)}
              className={`rounded-xl border px-4 py-4 text-left transition ${active ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-highlight)]"
                }`}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{session.label}</div>
              <div className="mt-2 text-lg font-semibold text-[var(--text)]">{session.time}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{session.duration}</div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text)]">
            Name
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)]"
              placeholder="Alex Morgan"
            />
          </label>
          <label className="text-sm font-medium text-[var(--text)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)]"
              placeholder="you@school.edu"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text)]">
            School / District
            <input
              type="text"
              required
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)]"
              placeholder="Lincoln Middle School"
            />
          </label>
          <label className="text-sm font-medium text-[var(--text)]">
            Position
            <input
              type="text"
              required
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)]"
              placeholder="Instructional Coach"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-[var(--primary-strong)] px-5 text-sm font-semibold text-white hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Registering..." : "Reserve my seat"}
        </button>
        {message ? (
          <p className={`text-sm ${messageTone}`} aria-live="polite">
            {message}
          </p>
        ) : null}
        <p className="text-xs text-[var(--muted)]">
          You will be redirected to Zoom to confirm your registration details.
        </p>
      </form>
    </div>
  );
}
