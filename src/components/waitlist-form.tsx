"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok || response.status === 409) {
        setStatus("success");
        setMessage("You are on the waitlist. We will be in touch soon.");
        setEmail("");
        return;
      }

      const data = await response.json().catch(() => ({}));
      const errorMessage =
        typeof data?.error === "string" ? data.error : "Unable to join the waitlist right now.";
      setStatus("error");
      setMessage(errorMessage);
    } catch (error) {
      setStatus("error");
      setMessage("Unable to join the waitlist right now.");
    }
  };

  const messageTone =
    status === "success" ? "text-[var(--primary)]" : status === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]";

  return (
    <div className="mt-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
      >
        <label className="sr-only" htmlFor="waitlist-email">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@school.edu"
          className="h-12 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:max-w-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--primary-strong)] px-6 text-base font-medium text-white shadow-lg hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Joining..." : "Join waitlist"}
        </button>
      </form>
      {message ? (
        <p className={`mt-3 text-sm ${messageTone}`} aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
