import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function WaitlistPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-lg font-semibold tracking-tight">
                        SayVeritas
                    </Link>
                    <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
                        <Link href="/" className="hover:text-[var(--text)]">Home</Link>
                        <Link href="/studylab" className="hover:text-[var(--text)]">StudyLab</Link>
                        <Link href="/pulse" className="hover:text-[var(--text)]">Pulse</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link href="/login" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[color-mix(in_oklab,var(--surface),white_6%)]">
                            Sign in
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center">
                <section className="w-full max-w-4xl px-6 py-20 text-center">
                    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-12 shadow-xl">
                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-3xl">
                            🚀
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                            Coming Soon
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
                            We are currently rolling out access to select schools. Join the waitlist to be notified when SayVeritas is available in your area.
                        </p>

                        <div className="mx-auto max-w-md">
                            <WaitlistForm />
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}
