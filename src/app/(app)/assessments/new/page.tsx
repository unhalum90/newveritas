"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/classes", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as { classes?: ClassRow[]; error?: string } | null;
        if (!res.ok || !data?.classes) throw new Error(data?.error ?? "Unable to load classes.");
        setClasses(data.classes);
        if (!data.classes.length) return;

        const createRes = await fetch("/api/assessments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            class_id: data.classes[0].id,
            title: "Untitled assessment",
            authoring_mode: "manual",
          }),
        });
        const createData = (await createRes.json().catch(() => null)) as { error?: string; id?: string } | null;
        if (!createRes.ok) throw new Error(createData?.error ?? "Create failed.");
        if (!createData?.id) throw new Error("Create failed.");

        router.replace(`/assessments/${createData.id}?step=1`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Preparing Builder</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Creating a draft assessment…</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next</CardTitle>
          <CardDescription>Once the draft is created, you&apos;ll be redirected into the builder.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          {!loading && !classes.length ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">No classes yet. Create one first.</p>
              <Button type="button" onClick={() => router.push("/classes")}>
                Go to Classes
              </Button>
            </div>
          ) : null}

          {loading ? <p className="text-sm text-[var(--muted)]">Working…</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

type ClassRow = { id: string; name: string };
