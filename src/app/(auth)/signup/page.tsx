"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SignupRole = "teacher" | "school_admin";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const redirectPath = role === "school_admin" ? "/schools/register?resume=1" : "/onboarding";
  const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}` : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role }, emailRedirectTo: redirectUrl ?? undefined },
      });
      if (signUpError) return setError(signUpError.message || "Unable to create account.");

      if (!data.session) {
        setInfo("Account created. Check your email to confirm, then finish setup.");
        return;
      }

      if (role === "teacher") {
        // Ensure teacher row exists for onboarding.
        await fetch("/api/teacher", { cache: "no-store" });
      }

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError("Enter your email to receive a magic link.");
      return;
    }
    setMagicLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { role },
          emailRedirectTo: redirectUrl ?? undefined,
        },
      });
      if (otpError) return setError(otpError.message || "Unable to send magic link.");
      setInfo("Magic link sent. Check your email to finish setup.");
    } catch {
      setError("Unable to send magic link. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)] px-6 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Create Account</div>
          <h1 className="mt-3 text-3xl font-semibold">Who are you creating this account for?</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This helps us set up the right workspace. Students are added by teachers.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`rounded-2xl border p-5 text-left transition ${
              role === "teacher"
                ? "border-[rgba(20,184,166,0.6)] bg-[rgba(20,184,166,0.08)] shadow-[0_0_0_1px_rgba(20,184,166,0.35)]"
                : "border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.45)] hover:border-[rgba(148,163,184,0.4)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(15,23,42,0.6)] text-[var(--text)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 20h14" />
                  <path d="M7 20v-3a4 4 0 014-4h2a4 4 0 014 4v3" />
                  <circle cx="12" cy="7" r="3" />
                </svg>
              </div>
              <div>
                <div className="text-base font-semibold">Classroom Teacher</div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  I&apos;m setting up assessments for my own classes.
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole("school_admin")}
            className={`rounded-2xl border p-5 text-left transition ${
              role === "school_admin"
                ? "border-[rgba(20,184,166,0.6)] bg-[rgba(20,184,166,0.08)] shadow-[0_0_0_1px_rgba(20,184,166,0.35)]"
                : "border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.45)] hover:border-[rgba(148,163,184,0.4)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(15,23,42,0.6)] text-[var(--text)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 19h16" />
                  <path d="M6 19V9l6-4 6 4v10" />
                  <path d="M9 19v-5h6v5" />
                </svg>
              </div>
              <div>
                <div className="text-base font-semibold">School Admin</div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  I&apos;m setting up accounts and onboarding for a school.
                </div>
              </div>
            </div>
          </button>
        </div>

        <Card className="border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.4)]">
          <CardHeader>
            <CardTitle>{role === "school_admin" ? "School admin details" : "Teacher account details"}</CardTitle>
            <CardDescription>
              {role === "school_admin"
                ? "Create your admin login. You’ll finish school setup after sign-in."
                : "Create your classroom account to start onboarding."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-zinc-500">Minimum 8 characters.</p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-600">{info}</p> : null}
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : role === "school_admin" ? "Create admin account" : "Create teacher account"}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={handleMagicLink} disabled={magicLoading}>
                {magicLoading ? "Sending magic link..." : "Send magic link"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--text)] hover:underline">
              Sign in
            </Link>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
