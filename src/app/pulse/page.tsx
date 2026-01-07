import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HeroImage } from "@/components/home/hero-image";

export default function PulseLandingPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-lg font-semibold tracking-tight">
                        SayVeritas <span className="text-[var(--pulse-accent)]">Pulse</span>
                    </Link>
                    <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
                        <Link href="/" className="hover:text-[var(--text)]">Home</Link>
                        <Link href="/studylab" className="hover:text-[var(--text)]">StudyLab</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link href="/login" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[color-mix(in_oklab,var(--surface),white_6%)]">
                            Sign in
                        </Link>
                        <Link href="/waitlist" className="rounded-md bg-[var(--pulse-accent)] px-3 py-2 text-sm text-white hover:bg-[color-mix(in_oklab,var(--pulse-accent),black_12%)]">
                            Start Pilot
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="border-b border-[var(--border)] bg-[var(--surface)]">
                    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                        <div className="grid gap-12 md:grid-cols-2 md:items-center">
                            <div>
                                <span className="mb-4 inline-block rounded-full bg-[color-mix(in_oklab,var(--pulse-accent),white_90%)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--pulse-accent)]">
                                    For Daily Check-ins
                                </span>
                                <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                                    Take the Pulse <br />
                                    <span className="text-[var(--pulse-accent)]">in 60 Seconds</span>
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
                                    Replace written exit tickets with quick voice check-ins.
                                    See who understands, who's guessing, and who's lost—instantly.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href="/waitlist"
                                        className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--pulse-accent)] px-6 text-base font-medium text-white hover:bg-[color-mix(in_oklab,var(--pulse-accent),black_12%)]"
                                    >
                                        Start Pulse Pilot
                                    </Link>
                                </div>
                            </div>
                            <div className="relative aspect-square md:aspect-auto">
                                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--pulse-accent),white_95%)] border-2 border-[var(--pulse-accent)]/20 border-dashed">
                                    <div className="text-center p-8">
                                        <div className="text-6xl mb-4">🎤✓</div>
                                        <p className="font-semibold text-[var(--pulse-accent)]">Quick Voice Check-in</p>
                                        <p className="text-sm text-[var(--muted)] mt-2">"Summarize the main idea in 1 minute..."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-6xl px-6">
                        <h2 className="text-center text-3xl font-bold text-[#0F172A]">Why Teachers Love Pulse</h2>

                        <div className="grid gap-8 mt-12 md:grid-cols-3">
                            <div className="p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                <div className="text-4xl mb-4">⚡</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0F172A]">Faster than Grading</h3>
                                <p className="text-gray-600">Review an entire class in 5 minutes. Listen to standard-speed or 2x speed audio snippets.</p>
                            </div>
                            <div className="p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                <div className="text-4xl mb-4">📈</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0F172A]">Higher Completion</h3>
                                <p className="text-gray-600">Students prefer speaking to writing. Completion rates jump from 40% to 85%.</p>
                            </div>
                            <div className="p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                <div className="text-4xl mb-4">🎯</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0F172A]">Targeted Reteaching</h3>
                                <p className="text-gray-600">Know exactly which concept to review tomorrow based on actual student explanations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section className="border-y border-[var(--border)] bg-[var(--surface)] py-16">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">How it Works</h2>
                                <ul className="space-y-6">
                                    <li className="flex gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--pulse-accent)] text-white flex items-center justify-center font-bold">1</span>
                                        <div>
                                            <h4 className="font-semibold text-lg">Post a Quick Question</h4>
                                            <p className="text-[var(--muted)]">"What was the most confusing part of today's lesson?" or "Explain the main conflict in Chapter 4."</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--pulse-accent)] text-white flex items-center justify-center font-bold">2</span>
                                        <div>
                                            <h4 className="font-semibold text-lg">Students Record Instantly</h4>
                                            <p className="text-[var(--muted)]">They tap 'Record' on their phone or laptop. No app to install. 60 seconds max.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--pulse-accent)] text-white flex items-center justify-center font-bold">3</span>
                                        <div>
                                            <h4 className="font-semibold text-lg">AI Transcribes & Highlights</h4>
                                            <p className="text-[var(--muted)]">You get a dashboard of transcripts with key themes and misconceptions highlighted.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white p-8 rounded-2xl border border-[var(--border)] shadow-lg">
                                {/* Mockup of dashboard list */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <div>
                                            <div className="font-semibold text-sm">Alex J.</div>
                                            <div className="text-xs text-gray-500">Audio • 0:42</div>
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Understood</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <div>
                                            <div className="font-semibold text-sm">Sam M.</div>
                                            <div className="text-xs text-gray-500">Audio • 0:55</div>
                                        </div>
                                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Misconception</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <div>
                                            <div className="font-semibold text-sm">Jordan T.</div>
                                            <div className="text-xs text-gray-500">Audio • 0:38</div>
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Understood</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 text-center">
                                    <p className="text-sm text-[var(--muted)]">Teacher Dashboard View</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-[var(--pulse-accent)] py-20">
                    <div className="mx-auto max-w-4xl px-6 text-center text-white">
                        <h2 className="text-3xl font-bold md:text-4xl">Stop Guessing. Start Listening.</h2>
                        <p className="mt-4 text-lg opacity-90">
                            Get instant insight into your classroom's understanding.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link
                                href="/waitlist"
                                className="rounded-full bg-white px-8 py-3 font-semibold text-[var(--pulse-accent)] hover:bg-gray-100 transition shadow-lg"
                            >
                                Try Pulse Free
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
