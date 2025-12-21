"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeStudentCode, studentCodeToEmail } from "@/lib/students/code";

export function StudentLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [activationNeeded, setActivationNeeded] = useState<boolean | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (fromUrl && !code) setCode(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const normalized = normalizeStudentCode(code);
    if (!normalized) {
      setActivationNeeded(null);
      setStudentName(null);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/activate?code=${encodeURIComponent(normalized)}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; student?: { first_name?: string; last_name?: string }; error?: string }
          | null;

        if (!active) return;

        if (res.ok && data?.ok) {
          setActivationNeeded(true);
          setStudentName(
            data.student ? `${data.student.first_name ?? ""} ${data.student.last_name ?? ""}`.trim() : null,
          );
          return;
        }

        if (res.status === 409) {
          setActivationNeeded(false);
          setStudentName(null);
          return;
        }

        setActivationNeeded(null);
        setStudentName(null);
      } catch {
        if (!active) return;
        setActivationNeeded(null);
        setStudentName(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const normalized = normalizeStudentCode(code);
      if (!normalized) {
        setError("Enter your student code.");
        return;
      }

      if (activationNeeded) {
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }

        const res = await fetch("/api/activate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ student_code: normalized, password }),
        });
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          setError(data?.error ?? "Activation failed.");
          return;
        }
      }

      const email = studentCodeToEmail(normalized);

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return setError(signInError.message || "Unable to sign in.");
      router.push("/student");
      router.refresh();
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Login</CardTitle>
          <CardDescription>
            Enter your student code. On your first login, you’ll create a password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Student code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. K7M2Q8HF"
                autoCorrect="off"
              />
              {studentName ? <p className="text-xs text-zinc-600">Activating for {studentName}.</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {activationNeeded ? (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Working…" : activationNeeded ? "Create Password & Sign In" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

