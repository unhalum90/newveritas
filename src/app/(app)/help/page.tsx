import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Help & Support</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Quick answers and direct support when you need it.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Common tasks</CardTitle>
            <CardDescription>Shortcuts to the places you use most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link href="/classes" className="block text-[var(--text)] hover:underline">
              Manage classes and students
            </Link>
            <Link href="/assessments" className="block text-[var(--text)] hover:underline">
              Review and edit assessments
            </Link>
            <Link href="/settings" className="block text-[var(--text)] hover:underline">
              Update account and notification settings
            </Link>
            <Link href="/dashboard" className="block text-[var(--text)] hover:underline">
              View dashboard activity
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact support</CardTitle>
            <CardDescription>We reply within one business day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-[var(--muted)]">Email us for help with setup, grading, or integrity flags.</div>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] hover:opacity-90"
              href="mailto:support@veritas.ai?subject=Teacher%20Support%20Request"
            >
              Contact Support
            </a>
            <div className="text-xs text-[var(--muted)]">Include your class name and assessment title if applicable.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
