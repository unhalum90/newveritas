"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TeacherRow = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  disabled: boolean;
  created_at: string;
};

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ sent: boolean; message: string } | null>(null);

  const filtered = useMemo(() => teachers, [teachers]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schools/admin/teachers", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as { teachers?: TeacherRow[]; error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Failed to load teachers.");
        return;
      }
      setTeachers(json?.teachers ?? []);
    } catch {
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTeacher(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setInviteStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/schools/admin/teachers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
      });
      const json = (await res.json().catch(() => null)) as
        | { teacher?: TeacherRow; invite_sent?: boolean; message?: string; error?: string }
        | null;
      if (!res.ok) {
        setError(json?.error || "Failed to create teacher.");
        return;
      }
      setInviteStatus({
        sent: json?.invite_sent ?? false,
        message: json?.message || (json?.invite_sent ? "Invite sent!" : "Teacher created."),
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      await load();
    } catch {
      setError("Failed to create teacher.");
    } finally {
      setCreating(false);
      // Clear success message after 8 seconds
      setTimeout(() => setInviteStatus(null), 8000);
    }
  }

  async function setDisabled(userId: string, disabled: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/schools/admin/teachers/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error || "Update failed.");
        return;
      }
      await load();
    } catch {
      setError("Update failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Teachers</h1>
          <p className="text-sm text-[var(--muted)]">Create and manage teacher accounts for your school.</p>
        </div>
        <Link href="/schools/admin/teachers/bulk-upload">
          <Button variant="secondary">Bulk Upload CSV</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Teacher</CardTitle>
          <CardDescription>Send a magic link invite to add a teacher to your school.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createTeacher} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="sm:col-span-3 flex items-center justify-between gap-3">
              <Button type="submit" disabled={creating}>
                {creating ? "Sending Invite..." : "Invite Teacher"}
              </Button>
              {inviteStatus ? (
                <p className={`text-sm ${inviteStatus.sent ? "text-emerald-400" : "text-amber-400"}`}>
                  {inviteStatus.sent ? "✓" : "⚠"} {inviteStatus.message}
                </p>
              ) : null}
            </div>
          </form>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-[var(--muted)]">Loading…</p> : null}
          {!loading && filtered.length === 0 ? <p className="text-sm text-[var(--muted)]">No teachers yet.</p> : null}
          {!loading && filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[var(--muted)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Email</th>
                    <th className="py-2 text-left font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.user_id} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="py-3">
                        {(t.first_name || "") + " " + (t.last_name || "")}
                      </td>
                      <td className="py-3">{t.email}</td>
                      <td className="py-3">{t.disabled ? "Disabled" : "Active"}</td>
                      <td className="py-3 text-right">
                        {t.disabled ? (
                          <Button variant="secondary" onClick={() => void setDisabled(t.user_id, false)}>
                            Enable
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            className="border-red-500/40 text-red-200 hover:bg-red-500/10"
                            onClick={() => void setDisabled(t.user_id, true)}
                          >
                            Disable
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
