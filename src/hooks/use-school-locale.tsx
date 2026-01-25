"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
    Jurisdiction,
    WorkspaceLocaleConfig,
    getDefaultsForLocale,
    countryToLocale,
    UK_WORKSPACE_DEFAULTS,
    US_WORKSPACE_DEFAULTS,
    translateTermForLocale,
    shouldHideScores,
    shouldHideGrades,
    shouldEnableOracyStrands,
} from "@/lib/config/uk-config";

/**
 * School Locale Context
 * 
 * Provides school-level locale configuration throughout the app.
 * Per uk_centric_build.md: Locale is set at school creation and is immutable for UK schools.
 */

interface SchoolLocaleContextValue {
    // Core locale info
    locale: Jurisdiction;
    isUK: boolean;
    isLoading: boolean;
    error: string | null;

    // Workspace config
    config: WorkspaceLocaleConfig;

    // Convenience helpers
    hideScores: boolean;
    hideGrades: boolean;
    enableOracyStrands: boolean;

    // Translation helper
    t: (term: string) => string;

    // Refresh locale (for after school creation)
    refreshLocale: () => Promise<void>;
}

const SchoolLocaleContext = createContext<SchoolLocaleContextValue | null>(null);

interface SchoolLocaleProviderProps {
    children: ReactNode;
    /** Optional: Pre-fetched locale from server (SSR optimization) */
    initialLocale?: Jurisdiction;
    /** Optional: School ID to fetch locale for */
    schoolId?: string;
}

export function SchoolLocaleProvider({
    children,
    initialLocale,
    schoolId,
}: SchoolLocaleProviderProps) {
    const [locale, setLocale] = useState<Jurisdiction>(initialLocale ?? "US");
    const [isLoading, setIsLoading] = useState(!initialLocale);
    const [error, setError] = useState<string | null>(null);

    const fetchLocale = useCallback(async () => {
        if (!schoolId && initialLocale) {
            // Use initial locale if no school ID and we have initial value
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const supabase = createSupabaseBrowserClient();

            // Get current user's school locale
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLocale("US");
                return;
            }

            // Try to get teacher's school locale
            const { data: teacher } = await supabase
                .from("teachers")
                .select("school_id, schools(locale)")
                .eq("user_id", user.id)
                .maybeSingle();

            if (teacher?.schools) {
                const schoolLocale = (teacher.schools as { locale?: string })?.locale;
                setLocale(schoolLocale === "UK" ? "UK" : "US");
            } else {
                // Fallback: check school_admins
                const { data: admin } = await supabase
                    .from("school_admins")
                    .select("school_id, schools(locale)")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (admin?.schools) {
                    const schoolLocale = (admin.schools as { locale?: string })?.locale;
                    setLocale(schoolLocale === "UK" ? "UK" : "US");
                } else {
                    // Fallback: check students
                    const { data: student } = await supabase
                        .from("students")
                        .select("school_id, schools(locale)")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    if (student?.schools) {
                        const schoolLocale = (student.schools as { locale?: string })?.locale;
                        setLocale(schoolLocale === "UK" ? "UK" : "US");
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch school locale:", err);
            setError("Failed to load locale settings");
            setLocale("US"); // Default to US on error
        } finally {
            setIsLoading(false);
        }
    }, [schoolId, initialLocale]);

    useEffect(() => {
        if (!initialLocale) {
            fetchLocale();
        }
    }, [fetchLocale, initialLocale]);

    const isUK = locale === "UK";
    const config = getDefaultsForLocale(locale);

    const t = useCallback((term: string) => {
        return translateTermForLocale(term, locale);
    }, [locale]);

    const value: SchoolLocaleContextValue = {
        locale,
        isUK,
        isLoading,
        error,
        config,
        hideScores: shouldHideScores(locale),
        hideGrades: shouldHideGrades(locale),
        enableOracyStrands: shouldEnableOracyStrands(locale),
        t,
        refreshLocale: fetchLocale,
    };

    return (
        <SchoolLocaleContext.Provider value={value}>
            {children}
        </SchoolLocaleContext.Provider>
    );
}

/**
 * Hook to access school locale context
 */
export function useSchoolLocale(): SchoolLocaleContextValue {
    const context = useContext(SchoolLocaleContext);

    if (!context) {
        // Return safe defaults if not wrapped in provider
        return {
            locale: "US",
            isUK: false,
            isLoading: false,
            error: null,
            config: US_WORKSPACE_DEFAULTS,
            hideScores: false,
            hideGrades: false,
            enableOracyStrands: false,
            t: (term) => term,
            refreshLocale: async () => { },
        };
    }

    return context;
}

/**
 * Hook specifically for UK workspace checks
 */
export function useIsUKWorkspace(): { isUK: boolean; isLoading: boolean } {
    const { isUK, isLoading } = useSchoolLocale();
    return { isUK, isLoading };
}

/**
 * Server-side helper to get school locale
 * Use this in server components
 */
export async function getSchoolLocaleServer(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    userId: string
): Promise<Jurisdiction> {
    try {
        // Try teacher first
        const { data: teacher } = await supabase
            .from("teachers")
            .select("schools(locale)")
            .eq("user_id", userId)
            .maybeSingle();

        if (teacher?.schools) {
            const schoolLocale = (teacher.schools as { locale?: string })?.locale;
            return schoolLocale === "UK" ? "UK" : "US";
        }

        // Try school admin
        const { data: admin } = await supabase
            .from("school_admins")
            .select("schools(locale)")
            .eq("user_id", userId)
            .maybeSingle();

        if (admin?.schools) {
            const schoolLocale = (admin.schools as { locale?: string })?.locale;
            return schoolLocale === "UK" ? "UK" : "US";
        }

        return "US";
    } catch {
        return "US";
    }
}
