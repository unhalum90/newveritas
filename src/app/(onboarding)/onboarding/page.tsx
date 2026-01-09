"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Teacher = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  country: string | null;
  school_type: string | null;
  teaching_level: string | null;
  onboarding_stage: "0" | "1" | "2" | "COMPLETE";
  school_id?: string | null;
  workspace_id?: string | null;
};

type TeacherPatch = Partial<Teacher> & {
  school_name?: string;
};

const schoolTypes = ["K-12", "Higher Ed", "Language School", "Private", "Other"] as const;
const teachingLevels = ["Elementary", "Middle", "Secondary", "Adult"] as const;

function getOnboardingStep(teacher: Teacher) {
  // Sprint 2 introduced school/workspace. If an older account is marked COMPLETE
  // but lacks workspace_id, route them back through Step 2 to finalize setup.
  if (teacher.onboarding_stage === "COMPLETE" && !teacher.workspace_id) return 2;
  if (teacher.onboarding_stage === "0") return 1;
  if (teacher.onboarding_stage === "1") return 2;
  if (teacher.onboarding_stage === "2") return 3;
  return 3;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");

  const step = useMemo(() => (teacher ? getOnboardingStep(teacher) : 1), [teacher]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/teacher", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load teacher profile.");
        const data = (await res.json()) as { teacher: Teacher };
        if (active) {
          setTeacher(data.teacher);
          setSchoolName("");
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function patchTeacher(payload: TeacherPatch) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { teacher?: Teacher; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Update failed.");
      if (data?.teacher) setTeacher(data.teacher);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="text-sm text-zinc-600">Loading onboarding…</div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="text-sm text-red-700">{error ?? "Unable to load onboarding."}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Onboarding</h1>
        <p className="mt-1 text-sm text-zinc-600">Step {step} of 3</p>
      </div>

      {error ? <div className="text-sm text-red-700">{error}</div> : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Identity Confirmation</CardTitle>
            <CardDescription>Confirm the basics. You can edit later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={teacher.first_name ?? ""}
                  onChange={(e) => setTeacher({ ...teacher, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={teacher.last_name ?? ""}
                  onChange={(e) => setTeacher({ ...teacher, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={teacher.email}
                onChange={(e) => setTeacher({ ...teacher, email: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={saving}
                onClick={async () => {
                  await patchTeacher({
                    first_name: teacher.first_name?.trim() || null,
                    last_name: teacher.last_name?.trim() || null,
                    email: teacher.email.trim(),
                    onboarding_stage: "1",
                  });
                }}
              >
                {saving ? "Saving…" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Teaching Context</CardTitle>
            <CardDescription>Required for sensible defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School name</Label>
              <Input
                id="schoolName"
                placeholder="e.g. Lincoln Middle School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
              <p className="text-xs text-zinc-500">Used to create your school and workspace.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g. United States"
                value={teacher.country ?? ""}
                onChange={(e) => setTeacher({ ...teacher, country: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schoolType">School type</Label>
                <select
                  id="schoolType"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  value={teacher.school_type ?? ""}
                  onChange={(e) =>
                    setTeacher({ ...teacher, school_type: e.target.value || null })
                  }
                >
                  <option value="">Select…</option>
                  {schoolTypes.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teachingLevel">Teaching level</Label>
                <select
                  id="teachingLevel"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  value={teacher.teaching_level ?? ""}
                  onChange={(e) =>
                    setTeacher({ ...teacher, teaching_level: e.target.value || null })
                  }
                >
                  <option value="">Select…</option>
                  {teachingLevels.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!schoolName.trim()) {
                    setError("School name is required.");
                    return;
                  }
                  await patchTeacher({
                    country: teacher.country?.trim() || null,
                    school_type: teacher.school_type ?? null,
                    teaching_level: teacher.teaching_level ?? null,
                    school_name: schoolName.trim(),
                    onboarding_stage: teacher.onboarding_stage === "COMPLETE" ? "COMPLETE" : "2",
                  });
                }}
              >
                {saving ? "Saving…" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>Orientation</CardTitle>
            <CardDescription>Quick framing before you enter the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <div className="font-semibold text-white">What Veritas is</div>
                <ul className="mt-1 list-disc pl-5">
                  <li>Oral assessment tool</li>
                  <li>AI first-pass scoring</li>
                  <li>You remain final authority</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-white">What Veritas is not</div>
                <ul className="mt-1 list-disc pl-5">
                  <li>Essay auto-grading</li>
                  <li>Surveillance</li>
                  <li>Replacing teachers</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-white">Integrity</div>
                <ul className="mt-1 list-disc pl-5">
                  <li>Student consent</li>
                  <li>Transparent scoring</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const ok = await patchTeacher({ onboarding_stage: "COMPLETE" });
                  if (ok) router.push("/dashboard");
                }}
              >
                {saving ? "Finishing…" : "Enter Dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
