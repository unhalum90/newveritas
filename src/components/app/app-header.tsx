"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function NavLink({ href, label, dataTour }: { href: string; label: string; dataTour?: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      data-tour={dataTour}
      aria-current={active ? "page" : undefined}
      className={`text-sm transition-colors ${
        active
          ? "font-semibold text-[var(--primary)]"
          : "text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </Link>
  );
}

type ThemeMode = "dark" | "light";

type AppHeaderProps = {
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
};

export function AppHeader({ theme = "dark", onThemeChange }: AppHeaderProps) {
  const router = useRouter();
  const [teacherLabel, setTeacherLabel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/teacher", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | { teacher?: { first_name?: string | null; last_name?: string | null; email?: string | null } }
          | null;
        if (!active) return;
        const first = typeof data?.teacher?.first_name === "string" ? data.teacher.first_name.trim() : "";
        const last = typeof data?.teacher?.last_name === "string" ? data.teacher.last_name.trim() : "";
        const name = [first, last].filter(Boolean).join(" ");
        const fallbackEmail = typeof data?.teacher?.email === "string" ? data.teacher.email.trim() : "";
        setTeacherLabel(name || fallbackEmail || null);
      } catch {
        if (active) setTeacherLabel(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-[var(--text)]">
          Veritas
        </Link>
        <nav className="flex items-center gap-5" aria-label="Primary">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/classes" label="Classes" dataTour="nav-classes" />
          <NavLink href="/assessments" label="Assessments" dataTour="nav-assessments" />
          <NavLink href="/help" label="Help" dataTour="nav-help" />
          <NavLink href="/settings" label="Settings" />
          {onThemeChange ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Theme</span>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")}
                aria-label="Toggle dark mode"
              />
              <span className="text-xs text-[var(--muted)]">{theme === "dark" ? "Dark" : "Light"}</span>
            </div>
          ) : null}
          {teacherLabel ? <span className="text-sm text-[var(--muted)]">{teacherLabel}</span> : null}
          <Button
            variant="ghost"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
          >
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
