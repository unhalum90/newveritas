"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState<"code" | "email" | "sso">("code");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          access_mode: accessMode,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Create failed.");
      router.push(`/classes/${data?.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Class</CardTitle>
          <CardDescription>Students in a class share access rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Period 2 • Spanish II"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access">Access mode</Label>
              <select
                id="access"
                className="h-10 w-full rounded-md border bg-[var(--surface)] px-3 text-sm text-[var(--text)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                value={accessMode}
                onChange={(e) => setAccessMode(e.target.value as "code" | "email" | "sso")}
              >
                <option value="code">Code (recommended for K–12)</option>
                <option value="email">Email (future)</option>
                <option value="sso">SSO (future)</option>
              </select>
            </div>
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
