"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type CreatedRow = { row: { first_name: string; last_name: string; email: string }; user_id: string; temp_password: string };
type ErrorRow = { row: { first_name: string; last_name: string; email: string }; error: string };

export default function BulkUploadTeachersPage() {
  const [csv, setCsv] = useState("first_name,last_name,email\nJane,Smith,jsmith@school.edu\nJohn,Doe,jdoe@school.edu");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedRow[]>([]);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createdCount = created.length;
  const errorCount = errors.length;
  const showResults = useMemo(() => createdCount + errorCount > 0, [createdCount, errorCount]);

  async function run() {
    setLoading(true);
    setError(null);
    setCreated([]);
    setErrors([]);
    try {
      const res = await fetch("/api/schools/admin/teachers/bulk-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv, proceed_valid_only: true }),
      });
      const json = (await res.json().catch(() => null)) as
        | { created?: CreatedRow[]; errors?: ErrorRow[]; error?: string }
        | null;
      if (!res.ok) {
        setError(json?.error || "Upload failed.");
        return;
      }
      setCreated(json?.created ?? []);
      setErrors(json?.errors ?? []);
    } catch {
      setError("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Bulk Teacher Upload</h1>
          <p className="text-sm text-[var(--muted)]">Paste CSV with columns: first_name,last_name,email</p>
        </div>
        <Link href="/schools/admin/teachers">
          <Button variant="secondary">Back to Teachers</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Input</CardTitle>
          <CardDescription>Each row creates a teacher login with a temporary password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="csv">Paste CSV</Label>
          <textarea
            id="csv"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="min-h-48 w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-3 font-mono text-sm text-[var(--text)]"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button onClick={() => void run()} disabled={loading}>
            {loading ? "Uploading..." : "Process Upload"}
          </Button>
        </CardContent>
      </Card>

      {showResults ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Created ({createdCount})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {createdCount === 0 ? <p className="text-sm text-[var(--muted)]">None created.</p> : null}
              {created.map((c) => (
                <div key={c.user_id} className="rounded-md border border-[var(--border)] p-3">
                  <div className="text-sm font-medium">
                    {c.row.first_name} {c.row.last_name} — {c.row.email}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Temp password: <span className="font-mono">{c.temp_password}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Errors ({errorCount})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {errorCount === 0 ? <p className="text-sm text-[var(--muted)]">No errors.</p> : null}
              {errors.map((e, idx) => (
                <div key={`${e.row.email}-${idx}`} className="rounded-md border border-[var(--border)] p-3">
                  <div className="text-sm font-medium">
                    {e.row.first_name} {e.row.last_name} — {e.row.email}
                  </div>
                  <div className="text-xs text-red-600">{e.error}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

