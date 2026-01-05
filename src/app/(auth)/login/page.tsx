"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return setError(signInError.message || "Invalid email or password");
      router.push("/dashboard");
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
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      });
      if (otpError) return setError(otpError.message || "Unable to send magic link.");
      setInfo("Magic link sent. Check your email to finish signing in.");
    } catch {
      setError("Unable to send magic link. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
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
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-600">{info}</p> : null}
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={handleMagicLink} disabled={magicLoading}>
                {magicLoading ? "Sending magic link..." : "Send magic link"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm text-[var(--muted)]">
            Need access?{" "}
            <Link href="/#waitlist" className="text-[var(--text)] hover:underline">
              Join the waitlist
            </Link>
            .
          </div>
          <div className="mt-2 text-center text-sm text-[var(--muted)]">
            Student?{" "}
            <Link href="/student/login" className="text-[var(--text)] hover:underline">
              Use student login
            </Link>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
