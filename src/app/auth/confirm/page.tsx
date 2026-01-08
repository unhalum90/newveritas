"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * This page handles authentication tokens from Supabase magic links/invites
 * that arrive as hash fragments (#access_token=...).
 * 
 * Hash fragments are not sent to the server, so we need client-side
 * JavaScript to extract and process them.
 * 
 * The /auth/callback route.ts handles PKCE code exchange (?code=...).
 * This page handles hash-based tokens from invites/magic links.
 */
export default function AuthConfirmPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Authenticating...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const supabase = createSupabaseBrowserClient();

                // Check for hash fragment tokens (from Supabase invite emails)
                const hash = window.location.hash;
                if (hash && hash.includes("access_token")) {
                    // Parse hash fragment
                    const params = new URLSearchParams(hash.substring(1));
                    const accessToken = params.get("access_token");
                    const refreshToken = params.get("refresh_token");
                    const type = params.get("type"); // 'invite', 'recovery', 'signup', etc.

                    if (accessToken && refreshToken) {
                        setStatus("Setting up your session...");

                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) {
                            console.error("Session error:", sessionError);
                            setError(sessionError.message);
                            return;
                        }

                        // Get user to check if onboarding needed
                        const { data: { user } } = await supabase.auth.getUser();

                        if (user) {
                            const role = (user.user_metadata as { role?: string })?.role;
                            const isStudent = role === "student";

                            // For invites, redirect to appropriate onboarding
                            if (type === "invite" || type === "signup") {
                                setStatus("Redirecting to setup...");
                                router.push(isStudent ? "/student" : "/onboarding");
                            } else {
                                setStatus("Redirecting...");
                                router.push(isStudent ? "/student" : "/dashboard");
                            }
                            router.refresh();
                            return;
                        }
                    }
                }

                // No hash tokens - check if already authenticated
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const role = (user.user_metadata as { role?: string })?.role;
                    const isStudent = role === "student";
                    router.push(isStudent ? "/student" : "/dashboard");
                    router.refresh();
                } else {
                    // No session found
                    setError("Authentication failed. Please try again.");
                    setTimeout(() => router.push("/login"), 2000);
                }
            } catch (err) {
                console.error("Auth confirm error:", err);
                setError("An error occurred during authentication.");
                setTimeout(() => router.push("/login"), 2000);
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
            <div className="text-center space-y-4">
                {error ? (
                    <>
                        <div className="text-red-600 text-lg font-medium">{error}</div>
                        <p className="text-[var(--muted)] text-sm">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent mx-auto" />
                        <p className="text-[var(--text)] font-medium">{status}</p>
                    </>
                )}
            </div>
        </div>
    );
}
