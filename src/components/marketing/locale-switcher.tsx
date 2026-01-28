"use client";

import { useMarketingLocale } from "@/hooks/use-marketing-locale";

/**
 * Locale Switcher Component
 * 
 * Subtle button in header top-right that allows users to manually switch
 * between UK and US versions of the site.
 * 
 * Shows:
 * - 🇬🇧 "Switch to UK site" when on US
 * - 🇺🇸 "Switch to US site" when on UK
 */
export function LocaleSwitcher() {
    const { locale, switchLocale, isLoading } = useMarketingLocale();

    if (isLoading) {
        return null; // Don't show switcher until we know the locale
    }

    const targetLocale = locale === "UK" ? "US" : "UK";
    const label = locale === "UK" ? "Switch to US site" : "Switch to UK site";
    const flag = locale === "UK" ? "🇺🇸" : "🇬🇧";

    return (
        <button
            onClick={() => switchLocale(targetLocale)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
            aria-label={label}
            title={label}
        >
            <span className="text-sm">{flag}</span>
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

/**
 * Locale Badge Component
 * 
 * Shows the current locale as a small badge (useful for debugging or confirming locale)
 */
export function LocaleBadge() {
    const { locale, isLoading } = useMarketingLocale();

    if (isLoading) return null;

    return (
        <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {locale === "UK" ? "🇬🇧 UK" : "🇺🇸 US"}
        </span>
    );
}
