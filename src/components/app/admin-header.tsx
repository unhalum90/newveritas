"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "font-semibold text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </Link>
  );
}

export function AdminHeader({
  homeHref,
  links,
}: {
  homeHref: string;
  links: Array<{ href: string; label: string }>;
}) {
  const router = useRouter();
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={homeHref} className="text-sm font-semibold text-[var(--text)]">
          Veritas
        </Link>
        <nav className="flex items-center gap-5">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
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

