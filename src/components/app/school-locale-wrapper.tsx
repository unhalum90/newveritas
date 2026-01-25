"use client";

import { ReactNode } from "react";
import { SchoolLocaleProvider } from "@/hooks/use-school-locale";
import { Jurisdiction } from "@/lib/config/uk-config";

/**
 * Client component wrapper for SchoolLocaleProvider
 * Needed because server components can't use context providers directly
 */
export function SchoolLocaleWrapper({
    children,
    locale,
}: {
    children: ReactNode;
    locale: Jurisdiction;
}) {
    return (
        <SchoolLocaleProvider initialLocale={locale}>
            {children}
        </SchoolLocaleProvider>
    );
}
