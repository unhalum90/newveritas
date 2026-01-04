"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [newSubmissionEmail, setNewSubmissionEmail] = useState(true);
  const [scoringCompleteEmail, setScoringCompleteEmail] = useState(true);
  const [integrityAlerts, setIntegrityAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [notificationScope, setNotificationScope] = useState("all");
  const [defaultRecordingLimit, setDefaultRecordingLimit] = useState("60");
  const [defaultViewingTimer, setDefaultViewingTimer] = useState("20");
  const [defaultPreset, setDefaultPreset] = useState("standard");
  const [defaultTabSwitchMonitor, setDefaultTabSwitchMonitor] = useState(true);
  const [defaultShuffleQuestions, setDefaultShuffleQuestions] = useState(true);
  const [defaultPledgeEnabled, setDefaultPledgeEnabled] = useState(true);
  const [standardsEnabled, setStandardsEnabled] = useState(false);
  const [standardsSets, setStandardsSets] = useState<
    Array<{
      id: string;
      key: string;
      title: string;
      subject?: string | null;
      active?: boolean | null;
      enabled: boolean;
    }>
  >([]);
  const [standardsLoading, setStandardsLoading] = useState(false);
  const [standardsSaving, setStandardsSaving] = useState(false);
  const [standardsError, setStandardsError] = useState<string | null>(null);

  const initials = (displayName || email || "Teacher")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    let active = true;
    setStandardsLoading(true);
    setStandardsError(null);
    fetch("/api/standards/teacher", { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | {
              enabled?: boolean;
              sets?: Array<{ id: string; key: string; title: string; subject?: string | null; active?: boolean | null; enabled?: boolean }>;
              error?: string;
            }
          | null;
        if (!active) return;
        if (!res.ok) {
          const message = data && typeof data.error === "string" ? data.error : "Unable to load standards.";
          throw new Error(message);
        }
        setStandardsEnabled(Boolean(data?.enabled));
        const sets = (data?.sets ?? []).map((set) => ({
          ...set,
          enabled: Boolean(set.enabled),
        }));
        setStandardsSets(sets);
      })
      .catch((err) => {
        if (!active) return;
        setStandardsError(err instanceof Error ? err.message : "Unable to load standards.");
      })
      .finally(() => {
        if (active) setStandardsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveStandardsSettings() {
    setStandardsSaving(true);
    setStandardsError(null);
    try {
      const enabledSetIds = standardsSets.filter((set) => set.enabled).map((set) => set.id);
      const res = await fetch("/api/standards/teacher", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          standards_enabled: standardsEnabled,
          enabled_set_ids: enabledSetIds,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Unable to save standards settings.");
    } catch (err) {
      setStandardsError(err instanceof Error ? err.message : "Unable to save standards settings.");
    } finally {
      setStandardsSaving(false);
    }
  }

  function handlePresetChange(value: string) {
    setDefaultPreset(value);
    if (value === "quick") {
      setDefaultRecordingLimit("30");
      setDefaultViewingTimer("15");
    } else if (value === "standard") {
      setDefaultRecordingLimit("60");
      setDefaultViewingTimer("20");
    } else if (value === "extended") {
      setDefaultRecordingLimit("120");
      setDefaultViewingTimer("30");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your profile details and login email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg font-semibold text-[var(--text)]">
              {initials || "T"}
            </div>
            <div className="text-sm text-[var(--muted)]">Profile photo upload coming soon.</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              placeholder="Ms. Rivera"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
              <option value="America/Denver">Mountain (America/Denver)</option>
              <option value="America/Chicago">Central (America/Chicago)</option>
              <option value="America/New_York">Eastern (America/New_York)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">Save Changes</Button>
            <Button type="button" variant="secondary">
              Send Password Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control when you receive email updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">New submissions</div>
              <div className="text-xs text-[var(--muted)]">Email when a student submits an assessment.</div>
            </div>
            <span title="Get an email each time a student submits." className="text-xs text-[var(--muted)]">
              (?)
            </span>
            <Switch checked={newSubmissionEmail} onCheckedChange={setNewSubmissionEmail} aria-label="New submissions" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Scoring complete</div>
              <div className="text-xs text-[var(--muted)]">Notify me when auto-scoring finishes.</div>
            </div>
            <span title="Get notified when AI scoring completes." className="text-xs text-[var(--muted)]">
              (?)
            </span>
            <Switch checked={scoringCompleteEmail} onCheckedChange={setScoringCompleteEmail} aria-label="Scoring complete" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Integrity alerts</div>
              <div className="text-xs text-[var(--muted)]">Notify me about fast-start, tab-switch, and long-pause flags.</div>
            </div>
            <span
              title="Get notified when student submissions trigger integrity flags like fast-start, tab switching, or long pauses."
              className="text-xs text-[var(--muted)]"
            >
              (?)
            </span>
            <Switch checked={integrityAlerts} onCheckedChange={setIntegrityAlerts} aria-label="Integrity alerts" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Weekly summary</div>
              <div className="text-xs text-[var(--muted)]">Digest of class performance and scoring.</div>
            </div>
            <span title="Weekly summary email of submissions and scores." className="text-xs text-[var(--muted)]">
              (?)
            </span>
            <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} aria-label="Weekly summary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-scope">Notification scope</Label>
            <select
              id="notification-scope"
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              value={notificationScope}
              onChange={(e) => setNotificationScope(e.target.value)}
            >
              <option value="all">All classes</option>
              <option value="active">Active classes only</option>
              <option value="manual">I will select classes</option>
            </select>
          </div>
          <Button type="button" variant="secondary">
            Send Test Email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Defaults</CardTitle>
          <CardDescription>Applied when you create new assessments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset">Preset</Label>
            <select
              id="preset"
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              value={defaultPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="quick">Quick response (30s / 15s)</option>
              <option value="standard">Standard (60s / 20s)</option>
              <option value="extended">Extended (120s / 30s)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recording-limit">Recording limit (seconds)</Label>
              <Input
                id="recording-limit"
                type="number"
                min={10}
                max={180}
                value={defaultRecordingLimit}
                onChange={(e) => setDefaultRecordingLimit(e.target.value)}
              />
              <div className="text-xs text-[var(--muted)]">Typical range: 30-90 seconds for paragraph responses.</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="viewing-timer">Viewing timer (seconds)</Label>
              <Input
                id="viewing-timer"
                type="number"
                min={5}
                max={120}
                value={defaultViewingTimer}
                onChange={(e) => setDefaultViewingTimer(e.target.value)}
              />
              <div className="text-xs text-[var(--muted)]">Typical range: 15-30 seconds to read a short prompt.</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Tab switch monitor</div>
              <div className="text-xs text-[var(--muted)]">Track when students leave the assessment tab.</div>
            </div>
            <span
              title="Flags if students leave the assessment tab during a response."
              className="text-xs text-[var(--muted)]"
            >
              (?)
            </span>
            <Switch
              checked={defaultTabSwitchMonitor}
              onCheckedChange={setDefaultTabSwitchMonitor}
              aria-label="Tab switch monitor"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Shuffle questions</div>
              <div className="text-xs text-[var(--muted)]">Randomize question order for each student.</div>
            </div>
            <span
              title="Randomizes question order per student to reduce sharing."
              className="text-xs text-[var(--muted)]"
            >
              (?)
            </span>
            <Switch
              checked={defaultShuffleQuestions}
              onCheckedChange={setDefaultShuffleQuestions}
              aria-label="Shuffle questions"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Academic integrity pledge</div>
              <div className="text-xs text-[var(--muted)]">Require students to accept before starting.</div>
            </div>
            <span
              title="Prompts students to accept a pledge before starting the assessment."
              className="text-xs text-[var(--muted)]"
            >
              (?)
            </span>
            <Switch
              checked={defaultPledgeEnabled}
              onCheckedChange={setDefaultPledgeEnabled}
              aria-label="Academic integrity pledge"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standards</CardTitle>
          <CardDescription>Enable standards tagging and choose which frameworks to use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Standards tagging</div>
              <div className="text-xs text-[var(--muted)]">Allow question-level standards tagging in the builder.</div>
            </div>
            <Switch
              checked={standardsEnabled}
              onCheckedChange={setStandardsEnabled}
              aria-label="Standards tagging"
            />
          </div>

          {standardsEnabled ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Available standards
              </div>
              {standardsSets.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {standardsSets.map((set) => (
                    <label
                      key={set.id}
                      className={`flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 ${
                        set.active === false ? "opacity-60" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        disabled={standardsLoading || set.active === false}
                        checked={set.enabled}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setStandardsSets((prev) =>
                            prev.map((item) => (item.id === set.id ? { ...item, enabled: checked } : item)),
                          );
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-[var(--text)]">{set.title}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {set.subject ? `Subject: ${set.subject}` : "Subject: General"}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[var(--muted)]">No standards sets found.</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[var(--muted)]">
              Turn this on to select standards frameworks.
            </div>
          )}

          {standardsError ? (
            <div className="text-sm text-[var(--danger)]" role="alert">
              {standardsError}
            </div>
          ) : null}

          <div className="flex items-center justify-end">
            <Button type="button" disabled={standardsSaving || standardsLoading} onClick={saveStandardsSettings}>
              {standardsSaving ? "Saving…" : "Save Standards"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage password and multi-factor authentication.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary">
            Send Password Reset
          </Button>
          <Button type="button" variant="secondary">
            Set Up MFA
          </Button>
          <Button type="button" variant="secondary">
            Reset MFA
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download assessments, scores, rosters, and transcripts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 text-sm text-[var(--muted)]">
            Export format: ZIP with CSV and JSON files. Typical processing time: about 5 minutes.
          </div>
          <Button type="button" variant="secondary">
            Request Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Deactivation</CardTitle>
          <CardDescription>Disable access for your account and pause all classes.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm text-[var(--muted)]">
            Classes pause immediately. Students cannot start new assessments. Data remains available for reactivation.
          </div>
          <Button type="button" variant="secondary">
            Deactivate Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
