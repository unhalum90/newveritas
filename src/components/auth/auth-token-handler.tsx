"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * This component detects Supabase auth tokens in URL hash fragments
 * and processes them automatically. This handles magic links and invites
 * that redirect to any page (including homepage).
 * 
 * It should be included in the root layout.
 */
export function AuthTokenHandler() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleHashTokens = async () => {
            const hash = window.location.hash;

            // Only process if we have access_token in hash
            if (!hash || !hash.includes("access_token")) {
                return;
            }

            try {
                // Parse hash fragment
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");
                const type = params.get("type"); // 'invite', 'recovery', 'signup', etc.

                if (!accessToken || !refreshToken) {
                    return;
                }

                const supabase = createSupabaseBrowserClient();

                // Set the session
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    console.error("Auth token handler - session error:", sessionError);
                    // Clear the hash and stay on current page
                    window.history.replaceState(null, "", pathname);
                    return;
                }

                // Clear the hash from URL for cleanliness
                window.history.replaceState(null, "", pathname);

                // Get user to determine redirect
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const role = (user.user_metadata as { role?: string })?.role;
                    const isStudent = role === "student";

                    // For invites, redirect to onboarding
                    if (type === "invite" || type === "signup") {
                        router.push(isStudent ? "/student" : "/onboarding");
                    } else {
                        router.push(isStudent ? "/student" : "/dashboard");
                    }
                    router.refresh();
                }
            } catch (err) {
                console.error("Auth token handler error:", err);
                // Clear hash and stay on page
                window.history.replaceState(null, "", pathname);
            }
        };

        handleHashTokens();
    }, [router, pathname]);

    // This component doesn't render anything
    return null;
}
