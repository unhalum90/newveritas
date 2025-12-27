"use client";

import { useState } from "react";

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
  const [defaultTabSwitchMonitor, setDefaultTabSwitchMonitor] = useState(true);
  const [defaultShuffleQuestions, setDefaultShuffleQuestions] = useState(true);
  const [defaultPledgeEnabled, setDefaultPledgeEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your profile details and login email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button type="button">Update Email</Button>
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
            <Switch checked={newSubmissionEmail} onCheckedChange={setNewSubmissionEmail} aria-label="New submissions" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Scoring complete</div>
              <div className="text-xs text-[var(--muted)]">Notify me when auto-scoring finishes.</div>
            </div>
            <Switch checked={scoringCompleteEmail} onCheckedChange={setScoringCompleteEmail} aria-label="Scoring complete" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Integrity alerts</div>
              <div className="text-xs text-[var(--muted)]">Surface fast-start and tab-switch flags.</div>
            </div>
            <Switch checked={integrityAlerts} onCheckedChange={setIntegrityAlerts} aria-label="Integrity alerts" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Weekly summary</div>
              <div className="text-xs text-[var(--muted)]">Digest of class performance and scoring.</div>
            </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Defaults</CardTitle>
          <CardDescription>Applied when you create new assessments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Tab switch monitor</div>
              <div className="text-xs text-[var(--muted)]">Track students leaving the assessment tab.</div>
            </div>
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
          <CardDescription>Download your assessments, scores, and student rosters.</CardDescription>
        </CardHeader>
        <CardContent>
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
            Students won’t be able to start new assessments until reactivated.
          </div>
          <Button type="button" variant="secondary">
            Deactivate Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
