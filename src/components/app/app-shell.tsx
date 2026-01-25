"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/app/app-header";
import { PrivacyNoticeModal } from "@/components/compliance/privacy-notice-modal";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "veritas-dashboard-theme";

type PrivacyNoticeProps = {
  userId: string;
  userType: "teacher" | "student";
  lastShown: string | null;
};

type AppShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  privacyNotice?: PrivacyNoticeProps;
};

export function AppShell({ children, mainClassName = "mx-auto max-w-6xl px-6 py-10", privacyNotice }: AppShellProps) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const wrapperClass = theme === "light" ? "veritas-light" : "veritas-wizard";

  return (
    <div className={`${wrapperClass} min-h-screen bg-[var(--background)] text-[var(--text)]`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)]"
      >
        Skip to main content
      </a>
      <AppHeader theme={theme} onThemeChange={setTheme} />
      <main id="main-content" className={mainClassName}>
        {children}
      </main>
      {privacyNotice && (
        <PrivacyNoticeModal
          userId={privacyNotice.userId}
          userType={privacyNotice.userType}
          lastShown={privacyNotice.lastShown}
        />
      )}
      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] py-4 text-center text-xs text-[var(--muted)]">
        © 2026 SayVeritas / Chamberlin Innovations SASU. All rights reserved.
      </footer>
    </div>
  );
}

