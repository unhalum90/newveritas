import Link from "next/link";
import fs from "fs";
import path from "path";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function PrivacyPage() {
  const privacyHtml = fs.readFileSync(path.join(process.cwd(), "src/app/privacy/privacy-policy.html"), "utf8");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)]"
      >
        Skip to main content
      </a>
      <header className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <nav className="flex items-center gap-3 text-sm text-[var(--muted)]" aria-label="Primary">
            <Link href="/login" className="hover:text-[var(--text)]">
              Sign in
            </Link>
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-4xl px-6 py-14">
        <div dangerouslySetInnerHTML={{ __html: privacyHtml }} />
      </main>

      <MarketingFooter />
    </div>
  );
}
