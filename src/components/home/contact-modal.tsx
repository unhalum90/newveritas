"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ContactModalProps = {
  className?: string;
  label?: string;
};

export function ContactModal({ className, label = "Contact" }: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, note }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(payload?.error ?? "Unable to send message.");
      setSuccess("Thanks! We received your message and will reply from hello@sayveritas.com.");
      setName("");
      setEmail("");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`bg-transparent p-0 ${className ?? ""}`}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <Card className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
            <CardHeader>
              <CardTitle>Contact SayVeritas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@school.org"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-note">Note</Label>
                <textarea
                  id="contact-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Tell us what you need help with."
                  className="min-h-[120px] w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                  disabled={loading}
                />
              </div>
              {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
              {success ? <div className="text-sm text-[var(--primary)]">{success}</div> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" onClick={submit} disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
