"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SecurityContactModal } from "@/components/compliance/security-contact-modal";

export default function EvidenceOutcomesPage() {
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
                <div className="mb-8">
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
                        Efficacy
                    </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Evidence & Outcomes
                </h1>
                <p className="mt-4 text-lg text-[var(--muted)]">
                    A measurable approach to evaluating SayVeritas impact. No vague promises—just specific metrics you can track.
                </p>

                <div className="mt-12 space-y-12">
                    {/* 30-Day Evaluation Protocol */}
                    <section>
                        <h2 className="text-2xl font-semibold">30-Day Evaluation Protocol</h2>
                        <p className="mt-2 text-[var(--muted)]">
                            Use these metrics to assess whether SayVeritas is delivering value for your classroom:
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl">🎙️</span>
                                    <div>
                                        <p className="font-semibold">Speaking Minutes / Student / Week</p>
                                        <p className="text-sm text-[var(--muted)]">Track with: Dashboard analytics</p>
                                    </div>
                                </div>
                                <div className="border-t border-[var(--border)] pt-4">
                                    <p className="text-sm text-[var(--muted)]">
                                        <strong>Baseline:</strong> How many minutes did each student speak in class before SayVeritas?
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        <strong>Target:</strong> 2-5 minutes of recorded speaking practice per student per week.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">📊</span>
                                    <div>
                                        <p className="font-semibold">Attempts / Student / Week</p>
                                        <p className="text-sm text-[var(--muted)]">Track with: Submission counts</p>
                                    </div>
                                </div>
                                <div className="border-t border-[var(--border)] pt-4">
                                    <p className="text-sm text-[var(--muted)]">
                                        <strong>Baseline:</strong> How many formal speaking opportunities per student before?
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        <strong>Target:</strong> 3-5 voice responses per student per week.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl">⏱️</span>
                                    <div>
                                        <p className="font-semibold">Teacher Time Saved</p>
                                        <p className="text-sm text-[var(--muted)]">Track with: Teacher survey</p>
                                    </div>
                                </div>
                                <div className="border-t border-[var(--border)] pt-4">
                                    <p className="text-sm text-[var(--muted)]">
                                        <strong>Measure:</strong> Minutes spent per student per assessment on grading/feedback.
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        <strong>Compare:</strong> Traditional essay/oral exam grading vs. AI-assisted review.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-2xl">📈</span>
                                    <div>
                                        <p className="font-semibold">Growth Trend</p>
                                        <p className="text-sm text-[var(--muted)]">Track with: Rubric score history</p>
                                    </div>
                                </div>
                                <div className="border-t border-[var(--border)] pt-4">
                                    <p className="text-sm text-[var(--muted)]">
                                        <strong>Measure:</strong> Rubric score deltas over 4+ assessments.
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        <strong>Context:</strong> Include teacher moderation notes for qualitative insight.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Participation Rate */}
                    <section>
                        <h2 className="text-2xl font-semibold">100% Participation Tracking</h2>
                        <div className="mt-4 rounded-xl border-2 border-green-500 bg-green-50 p-6">
                            <p className="font-semibold text-green-900">The "no hiding" metric</p>
                            <p className="mt-2 text-green-800">
                                Traditional class discussion typically engages 20-30% of students. Voice-based assessments
                                require every student to respond, eliminating the "back row" problem.
                            </p>
                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-700">20-30%</p>
                                    <p className="text-sm text-green-600">Traditional discussion participation</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-600">→</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-700">100%</p>
                                    <p className="text-sm text-green-600">Voice response participation</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* What We Will NOT Claim */}
                    <section>
                        <h2 className="text-2xl font-semibold">What We Will Not Claim</h2>
                        <p className="mt-2 text-[var(--muted)]">
                            Honest evaluation requires acknowledging what we cannot promise:
                        </p>
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
                            <ul className="space-y-3 text-amber-900">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 font-bold">⚠</span>
                                    <span><strong>No guaranteed test score improvement</strong> — Outcomes depend on curriculum, instruction, and student engagement</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 font-bold">⚠</span>
                                    <span><strong>No certification equivalence</strong> — SayVeritas is a classroom tool, not a standardised testing platform</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 font-bold">⚠</span>
                                    <span><strong>Context-dependent results</strong> — Efficacy varies by subject, grade level, and implementation quality</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 font-bold">⚠</span>
                                    <span><strong>No replacement for teacher expertise</strong> — The tool amplifies good teaching; it cannot substitute for it</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Downloadable Evaluation Worksheet */}
                    <section>
                        <h2 className="text-2xl font-semibold">Evaluation Worksheet</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-6">
                            <p className="text-[var(--muted)]">
                                Download our 1-page evaluation worksheet to track your 30-day pilot:
                            </p>
                            <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                                <p className="font-mono text-sm text-[var(--muted)]">
                                    <strong>SayVeritas 30-Day Evaluation Worksheet</strong><br /><br />
                                    Week 1: Baseline data collection<br />
                                    - Current speaking minutes per student: ___<br />
                                    - Current assessment grading time: ___<br />
                                    - Current participation rate: ___%<br /><br />
                                    Week 2-3: Implementation phase<br />
                                    - Assessments administered: ___<br />
                                    - Total student responses: ___<br />
                                    - Teacher override rate: ___%<br /><br />
                                    Week 4: Comparison<br />
                                    - New speaking minutes per student: ___<br />
                                    - New assessment grading time: ___<br />
                                    - New participation rate: ___%<br />
                                    - Qualitative notes: ___
                                </p>
                            </div>
                            <div className="mt-6">
                                <SecurityContactModal
                                    buttonText="Request PDF Worksheet"
                                    className="bg-green-600 hover:bg-green-700"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Evidence-Linked Insights */}
                    <section>
                        <h2 className="text-2xl font-semibold">Evidence-Linked Reporting</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <p className="text-[var(--muted)]">
                                Every claim in our class analysis reports is auditable:
                            </p>
                            <ul className="mt-4 space-y-2 text-[var(--muted)]">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>Insights link to specific transcript excerpts and timestamps</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>Teachers can click through from summary to source evidence</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>Minimum 8 responses required before generating class-level insights</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>No &quot;black box&quot; claims—AI reasoning is transparent and reviewable</span>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Related Links */}
                <div className="mt-16 border-t border-[var(--border)] pt-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Related Pages</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href="/ai-safety" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            AI Safety & Governance →
                        </Link>
                        <Link href="/ai-use" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            How AI is Used →
                        </Link>
                        <Link href="/how-it-works" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            How It Works →
                        </Link>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
