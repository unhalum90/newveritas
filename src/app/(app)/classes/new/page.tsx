"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GoogleCourse = {
  id: string;
  name: string;
  section: string | null;
};

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState<"code" | "email" | "sso">("code");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Classroom state
  const [courses, setCourses] = useState<GoogleCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch Google Classroom courses on mount
  useEffect(() => {
    (async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const res = await fetch("/api/classroom/courses", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          // Not an error if they just don't have Google token
          if (res.status === 401) {
            setCoursesError("Sign in with Google to import from Classroom");
          } else {
            setCoursesError(data.error || "Failed to load courses");
          }
          return;
        }
        setCourses(data.courses || []);
      } catch {
        setCoursesError("Failed to load Google Classroom courses");
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, []);

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

  async function handleImportCourse(courseId: string, courseName: string) {
    setImporting(courseId);
    setImportResult(null);
    try {
      const res = await fetch("/api/classroom/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, className: courseName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult({ success: false, message: data.error || "Import failed" });
        return;
      }
      setImportResult({
        success: true,
        message: `Imported ${data.imported} students to "${data.className}"`,
      });
      // Navigate to the new class
      setTimeout(() => {
        router.push(`/classes/${data.classId}`);
        router.refresh();
      }, 1500);
    } catch {
      setImportResult({ success: false, message: "Import failed" });
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Google Classroom Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
            Import from Google Classroom
          </CardTitle>
          <CardDescription>Import a class and all students from Google Classroom</CardDescription>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <p className="text-sm text-[var(--muted)]">Loading your courses...</p>
          ) : coursesError ? (
            <p className="text-sm text-[var(--muted)]">{coursesError}</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No active courses found in Google Classroom</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-md border border-[var(--border)] p-3"
                >
                  <div>
                    <div className="font-medium text-[var(--text)]">{course.name}</div>
                    {course.section && (
                      <div className="text-xs text-[var(--muted)]">{course.section}</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={importing === course.id}
                    onClick={() => handleImportCourse(course.id, course.name)}
                  >
                    {importing === course.id ? "Importing..." : "Import"}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {importResult && (
            <p
              className={`mt-3 text-sm ${importResult.success ? "text-emerald-400" : "text-red-400"
                }`}
            >
              {importResult.success ? "✓" : "✗"} {importResult.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--background)] px-2 text-[var(--muted)]">Or create manually</span>
        </div>
      </div>

      {/* Manual Create */}
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
