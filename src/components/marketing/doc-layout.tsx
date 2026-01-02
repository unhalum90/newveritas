import fs from "fs";
import path from "path";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

type DocLayoutProps = {
  title: string;
  fileName: string;
};

export function DocLayout({ title, fileName }: DocLayoutProps) {
  const content = fs.readFileSync(path.join(process.cwd(), fileName), "utf8").trim();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <Link href="/pricing" className="hover:text-[var(--text)]">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
            <Link href="/login" className="hover:text-[var(--text)]">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Resource</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)] md:text-base">
          {content}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
