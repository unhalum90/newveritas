"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentInput = { first_name: string; last_name: string; email?: string | null };

function parseCsv(text: string): StudentInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("first") && header.includes("last");
  const start = hasHeader ? 1 : 0;

  const out: StudentInput[] = [];
  for (let i = start; i < lines.length; i++) {
    const [first_name, last_name, email] = lines[i].split(",").map((s) => s?.trim() ?? "");
    if (!first_name || !last_name) continue;
    out.push({ first_name, last_name, email: email || null });
  }
  return out;
}

export function AddStudents({ classId }: { classId: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedCsv = useMemo(() => parseCsv(csv), [csv]);

  async function submit(students: StudentInput[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ students }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Add students failed.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setCsv("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add students failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Manual Add</CardTitle>
          <CardDescription>Add one student at a time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button
            type="button"
            disabled={loading || !firstName.trim() || !lastName.trim()}
            onClick={() =>
              submit([{ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() || null }])
            }
          >
            {loading ? "Adding…" : "Add Student"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Upload</CardTitle>
          <CardDescription>Format: `first_name,last_name,email` (email optional).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="csv">Paste CSV</Label>
            <textarea
              id="csv"
              className="min-h-28 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"first_name,last_name,email\nAva,Ng,\nJon,Smith,jon@example.com"}
            />
          </div>
          <div className="text-xs text-[var(--muted)]">{parsedCsv.length} students parsed.</div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="button" disabled={loading || parsedCsv.length === 0} onClick={() => submit(parsedCsv)}>
            {loading ? "Adding…" : "Add Students"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
