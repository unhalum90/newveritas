import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { WebinarCalendar } from "@/components/marketing/webinar-calendar";
import { WebinarRegistrationForm } from "@/components/marketing/webinar-registration-form";

export default function WebinarsPage() {
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

      <main className="veritas-light bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Live Webinars</p>
            <h1 className="text-4xl font-semibold tracking-tight">See SayVeritas in action</h1>
            <p className="text-base text-[var(--muted)] md:text-lg">
              Join a 45-minute walkthrough to see how oral assessments work, how evidence is captured, and how
              teachers keep full control. Bring your questions—we will stay for live Q&A.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Thursday</div>
                <div className="mt-2 text-lg font-semibold text-[var(--text)]">9:00 AM ET</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Alternating weekly</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Tuesday</div>
                <div className="mt-2 text-lg font-semibold text-[var(--text)]">3:00 PM ET</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Alternating weekly</div>
              </div>
            </div>
            <WebinarCalendar />
          </div>

          <WebinarRegistrationForm />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
