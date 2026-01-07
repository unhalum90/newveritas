import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HeroImage } from "@/components/home/hero-image";

export default function StudyLabLandingPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
            {/* Header (Simplified - could refactor main header to be reusable) */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-lg font-semibold tracking-tight">
                        SayVeritas <span className="text-[var(--studylab-accent)]">StudyLab</span>
                    </Link>
                    <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
                        <Link href="/" className="hover:text-[var(--text)]">Home</Link>
                        <Link href="/pulse" className="hover:text-[var(--text)]">Pulse</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link href="/login" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[color-mix(in_oklab,var(--surface),white_6%)]">
                            Sign in
                        </Link>
                        <Link href="/waitlist" className="rounded-md bg-[var(--studylab-accent)] px-3 py-2 text-sm text-white hover:bg-[color-mix(in_oklab,var(--studylab-accent),black_12%)]">
                            Try Free
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
                                <span className="mb-4 inline-block rounded-full bg-[color-mix(in_oklab,var(--studylab-accent),white_90%)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--studylab-accent)]">
                                    For Weekly Practice
                                </span>
                                <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                                    The Socratic Tutor <br />
                                    <span className="text-[var(--studylab-accent)]">for Every Student</span>
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
                                    StudyLab turns passive studying into active verbal reasoning.
                                    AI asks probing questions, identifies gaps, and builds confidence before the test—all through voice.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href="/waitlist"
                                        className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--studylab-accent)] px-6 text-base font-medium text-white hover:bg-[color-mix(in_oklab,var(--studylab-accent),black_12%)]"
                                    >
                                        Start 30-Day Free Trial
                                    </Link>
                                </div>
                            </div>
                            <div className="relative aspect-square md:aspect-auto">
                                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--studylab-accent),white_95%)] border-2 border-[var(--studylab-accent)]/20 border-dashed">
                                    <div className="text-center p-8">
                                        <div className="text-6xl mb-4">🧠💭</div>
                                        <p className="font-semibold text-[var(--studylab-accent)]">Interactive Study Session</p>
                                        <p className="text-sm text-[var(--muted)] mt-2">"Explain mitosis in your own words..."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-6xl px-6">
                        <h2 className="text-center text-3xl font-bold text-[#0F172A]">How StudyLab Works</h2>

                        <div className="grid gap-8 mt-12 md:grid-cols-3">
                            <div className="p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold mb-4">1</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0F172A]">Teacher Sets Topic</h3>
                                <p className="text-gray-600">Assign a learning target (e.g. "Causes of WWII") or let students choose their own study focus.</p>
                            </div>
                            <div className="p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold mb-4">2</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0F172A]">AI Guides Discussion</h3>
                                <p className="text-gray-600">Students speak their explanations. The AI acts as a Socratic tutor, asking follow-ups to deepen understanding.</p>
                            </div>
                            <div className="p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold mb-4">3</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0F172A]">Insight Dashboard</h3>
                                <p className="text-gray-600">You see a heatmap of who's ready and who's struggling before class even starts.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Example Dialogue */}
                <section className="border-y border-[var(--border)] bg-[var(--surface)] py-16">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="text-center text-3xl font-bold mb-8">Not a Quiz. A Conversation.</h2>
                        <div className="mt-8 overflow-hidden rounded-xl border border-[var(--border)] shadow-xl">
                            <img
                                src="/studylab-conversation.jpg"
                                alt="StudyLab AI Conversation Example"
                                className="w-full h-auto"
                            />
                        </div>
                        <p className="text-center text-[var(--muted)] mt-8 italic">
                            Students are forced to articulate their thinking, revealing gaps memorization hides.
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-[var(--studylab-accent)] py-20">
                    <div className="mx-auto max-w-4xl px-6 text-center text-white">
                        <h2 className="text-3xl font-bold md:text-4xl">Build Thinking Habits Weekly</h2>
                        <p className="mt-4 text-lg opacity-90">
                            Give your students an on-demand tutor. Give yourself peace of mind.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link
                                href="/waitlist"
                                className="rounded-full bg-white px-8 py-3 font-semibold text-[var(--studylab-accent)] hover:bg-gray-100 transition shadow-lg"
                            >
                                Try StudyLab for Free
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}
