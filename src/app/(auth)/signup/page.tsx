"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)] px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        <Card className="border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.4)]">
          <CardHeader>
            <CardTitle>New accounts are waitlist-only</CardTitle>
            <CardDescription>
              Veritas is in a closed beta. Join the waitlist and we&apos;ll invite you as soon as we open more seats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/#waitlist"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              Join the waitlist
            </Link>
            <div className="text-center text-sm text-[var(--muted)]">
              Already invited?{" "}
              <Link href="/login" className="text-[var(--text)] hover:underline">
                Sign in
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
