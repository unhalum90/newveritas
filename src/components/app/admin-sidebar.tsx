"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  href: string;
  label: string;
};

export function AdminSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const normalizedPath = useMemo(() => pathname.replace(/\/$/, ""), [pathname]);

  return (
    <div className="lg:w-64">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,#0d141c_0%,#0b0f14_100%)] lg:hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(20,184,166,0.15)] text-[var(--primary)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l7 4v5c0 4.25-2.9 7.9-7 9-4.1-1.1-7-4.75-7-9V7l7-4z" />
                <path d="M9.5 12l2 2 3.5-3.5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">Veritas Ops</div>
              <div className="text-xs text-[var(--muted)]">Admin Console</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--muted)] hover:text-[var(--text)]"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
          >
            Logout
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {items.map((item) => {
            const isActive =
              normalizedPath === item.href || (item.href !== "/admin" && normalizedPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition ${
                  isActive
                    ? "border-[rgba(20,184,166,0.35)] bg-[rgba(20,184,166,0.15)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <aside className="hidden h-screen flex-col border-r border-[var(--border)] bg-[linear-gradient(180deg,#0d141c_0%,#0b0f14_100%)] lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(20,184,166,0.15)] text-[var(--primary)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 3l7 4v5c0 4.25-2.9 7.9-7 9-4.1-1.1-7-4.75-7-9V7l7-4z" />
              <path d="M9.5 12l2 2 3.5-3.5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Veritas Ops</div>
            <div className="text-xs text-[var(--muted)]">Admin Console</div>
          </div>
        </div>

        <nav className="space-y-1 px-4">
          {items.map((item) => {
            const isActive =
              normalizedPath === item.href || (item.href !== "/admin" && normalizedPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-[rgba(20,184,166,0.15)] text-[var(--text)]"
                    : "text-[var(--muted)] hover:bg-[rgba(148,163,184,0.12)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 px-4 pb-6">
          <div className="rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[linear-gradient(135deg,#0f172a_0%,#0b0f14_70%)] p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">API Credits Used</div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[var(--text)]">This month</span>
              <span className="font-semibold text-[var(--text)]">82%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[rgba(148,163,184,0.2)]">
              <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: "82%" }} />
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-[var(--muted)] hover:text-[var(--text)]"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
          >
            Logout
          </Button>
        </div>
      </aside>
    </div>
  );
}
