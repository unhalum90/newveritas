"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Props = {
    buttonText?: string;
    className?: string;
};

export function SecurityContactModal({ buttonText = "Request Documentation", className }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        setSending(true);
        setError(null);

        try {
            const res = await fetch("/api/contact/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    message: `[Security/Compliance Inquiry]\n\n${message.trim()}`,
                    to: "security@sayveritas.com",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Failed to send message");
            }

            setSent(true);
            setName("");
            setEmail("");
            setMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send. Please try again.");
        } finally {
            setSending(false);
        }
    }

    function handleClose() {
        setOpen(false);
        setSent(false);
        setError(null);
    }

    return (
        <>
            <Button type="button" className={className} onClick={() => setOpen(true)}>
                {buttonText}
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--text)]"
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-semibold text-[var(--text)]">Request Security Documentation</h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            DPAs, security questionnaires, data flow documentation, and more.
                        </p>

                        {sent ? (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                    <span className="text-xl">✓</span>
                                    <div>
                                        <div className="font-medium">Message sent!</div>
                                        <div className="text-sm">We&apos;ll respond to {email} within 1-2 business days.</div>
                                    </div>
                                </div>
                                <Button type="button" variant="secondary" className="w-full" onClick={handleClose}>
                                    Close
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="sec-name" className="text-sm font-medium text-[var(--text)]">
                                        Name
                                    </label>
                                    <input
                                        id="sec-name"
                                        type="text"
                                        required
                                        maxLength={100}
                                        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={sending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="sec-email" className="text-sm font-medium text-[var(--text)]">
                                        Email
                                    </label>
                                    <input
                                        id="sec-email"
                                        type="email"
                                        required
                                        maxLength={200}
                                        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="you@school.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={sending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="sec-message" className="text-sm font-medium text-[var(--text)]">
                                        Message
                                    </label>
                                    <textarea
                                        id="sec-message"
                                        required
                                        maxLength={2000}
                                        rows={4}
                                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="What documentation do you need? (DPA, security questionnaire, SOC 2 status, etc.)"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={sending}
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={sending}>
                                    {sending ? "Sending..." : "Send Request"}
                                </Button>

                                <p className="text-center text-xs text-[var(--muted)]">
                                    Your message will be sent to security@sayveritas.com
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
