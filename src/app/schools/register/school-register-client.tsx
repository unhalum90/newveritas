"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SchoolRegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResume = useMemo(() => searchParams.get("resume") === "1", [searchParams]);

  const [schoolName, setSchoolName] = useState("");
  const [country, setCountry] = useState("");
  const [schoolType, setSchoolType] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function ensureSession() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      let session = await ensureSession();
      if (!isResume) {
        const supabase = createSupabaseBrowserClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role: "school_admin", first_name: firstName, last_name: lastName } },
        });

        if (signUpError) {
          setError(signUpError.message || "Unable to create account.");
          return;
        }

        if (!data.session) {
          setInfo("Account created. Confirm your email, then sign in to finish setup.");
          return;
        }
        session = data.session;
      } else if (!session) {
        setError("Please sign in first, then complete setup here.");
        return;
      }

      const res = await fetch("/api/schools/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ school_name: schoolName, country, school_type: schoolType }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Unable to create school.");
        return;
      }

      router.push("/schools/admin");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>School Admin Setup</CardTitle>
          <CardDescription>
            {isResume
              ? "Sign in first, then complete your school setup here."
              : "Create your institution and your admin account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="schoolName">School / Institution name</Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., Endicott College"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country (optional)</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., US" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolType">School type (optional)</Label>
                <Input
                  id="schoolType"
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  placeholder="e.g., Higher Ed"
                />
              </div>
            </div>

            {isResume ? null : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Admin first name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Admin last name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Admin email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
              </div>
            )}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-700">{info}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : isResume ? "Create School" : "Create School Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

