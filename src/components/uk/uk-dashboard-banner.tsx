"use client";

import Link from "next/link";
import { useSchoolLocale } from "@/hooks/use-school-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UKDashboardBanner() {
    const { isUK } = useSchoolLocale();

    if (!isUK) return null;

    return (
        <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background dark:border-indigo-900 mb-8">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🇬🇧</span>
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                            UK Oracy Workspace
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            Voice 21 Aligned
                        </span>
                    </div>
                    <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80">
                        Your workspace is configured for UK assessment standards. Scores are replaced with strand indicators.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Quick action for evidence packs (placeholder link for now) */}
                    {/* Quick action for evidence packs */}
                    <Link
                        href="/reports/evidence-packs"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] h-10 px-4 py-2 border bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                    >
                        Evidence Packs
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
