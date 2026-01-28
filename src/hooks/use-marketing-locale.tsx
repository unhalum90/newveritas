"use client";

import { useEffect, useState } from "react";

export type MarketingLocale = "US" | "UK";

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
}

/**
 * Set cookie with expiry in days
 */
function setCookie(name: string, value: string, days: number): void {
    if (typeof document === "undefined") return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Marketing Locale Hook
 * 
 * Detects locale for marketing pages based on:
 * 1. Cookie preference (highest priority - user's explicit choice)
 * 2. Domain detection (sayveritas.co.uk = UK, sayveritas.com = US)
 * 
 * Works without authentication - suitable for public marketing pages.
 */
export function useMarketingLocale() {
    const [locale, setLocale] = useState<MarketingLocale>("US");
    const [isUK, setIsUK] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Check cookie first (user preference overrides everything)
        const cookieLocale = getCookie("marketing_locale");
        if (cookieLocale === "UK" || cookieLocale === "US") {
            setLocale(cookieLocale);
            setIsUK(cookieLocale === "UK");
            setIsLoading(false);
            return;
        }

        // 2. Check domain
        const host = window.location.host;
        if (host.includes("sayveritas.co.uk") || host.includes("localhost")) {
            // For localhost, check if there's a query param for testing
            const params = new URLSearchParams(window.location.search);
            const testLocale = params.get("locale");

            if (testLocale === "UK" || host.includes("sayveritas.co.uk")) {
                setLocale("UK");
                setIsUK(true);
            } else if (testLocale === "US") {
                setLocale("US");
                setIsUK(false);
            } else if (host.includes("sayveritas.co.uk")) {
                setLocale("UK");
                setIsUK(true);
            }
        }

        setIsLoading(false);
    }, []);

    /**
     * Switch locale and redirect to appropriate domain
     */
    const switchLocale = (newLocale: MarketingLocale) => {
        // Set cookie for persistence (1 year)
        setCookie("marketing_locale", newLocale, 365);

        // In production, redirect to appropriate domain
        const host = window.location.host;
        const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

        if (isLocalhost) {
            // On localhost, just update the URL param and reload
            const url = new URL(window.location.href);
            url.searchParams.set("locale", newLocale);
            window.location.href = url.toString();
        } else {
            // Redirect to appropriate domain
            const targetDomain = newLocale === "UK"
                ? "sayveritas.co.uk"
                : "sayveritas.com";
            const targetUrl = `https://${targetDomain}${window.location.pathname}${window.location.search}`;
            window.location.href = targetUrl;
        }
    };

    return {
        locale,
        isUK,
        isLoading,
        switchLocale
    };
}

/**
 * Get locale from server-side (for SSR)
 * Uses headers to detect domain
 */
export function getServerLocale(host: string | null): MarketingLocale {
    if (!host) return "US";
    if (host.includes("sayveritas.co.uk")) return "UK";
    return "US";
}
