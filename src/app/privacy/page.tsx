import Link from "next/link";
import fs from "fs";
import path from "path";

export default function PrivacyPage() {
  const privacyHtml = fs.readFileSync(path.join(process.cwd(), "src/app/privacy/privacy-policy.html"), "utf8");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <Link href="/login" className="hover:text-[var(--text)]">
              Sign in
            </Link>
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-14">
        <div dangerouslySetInnerHTML={{ __html: privacyHtml }} />
      </main>

      <footer className="border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[var(--text)]">SayVeritas</p>
            <p className="mt-1">@chamberlininnovations</p>
          </div>
          <div className="flex gap-6">
            <Link className="hover:text-[var(--text)]" href="/">
              Home
            </Link>
            <Link className="hover:text-[var(--text)]" href="/about">
              About
            </Link>
            <a className="hover:text-[var(--text)]" href="mailto:hello@sayveritas.com">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
