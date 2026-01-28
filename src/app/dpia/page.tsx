"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function DPIAPage() {
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
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                        Regulatory Compliance
                    </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Data Protection Impact Assessment (DPIA)
                </h1>
                <p className="mt-4 text-lg text-[var(--muted)]">
                    Veritas Oracy Assessment Platform — Compliance with UK GDPR and Child Safety Standards.
                </p>

                <div className="mt-12 space-y-12">
                    <section>
                        <h2 className="text-2xl font-semibold">1. Necessity & Purpose</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)] leading-relaxed">
                            <p>
                                SayVeritas is an AI-powered oracy assessment platform that records students&apos; verbal responses to assess reasoning and evidence.
                            </p>
                            <p className="mt-4 font-semibold text-[var(--text)]">Aims:</p>
                            <ul className="mt-2 list-disc pl-5 space-y-1">
                                <li>Automate teacher marking for oral assessments.</li>
                                <li>Provide real-time safeguarding through mental health &quot;crisis detection.&quot;</li>
                                <li>Improve student outcomes through Socratic AI feedback.</li>
                            </ul>
                            <p className="mt-4">
                                <strong>DPIA Need:</strong> Mandatory under UK GDPR due to processing children&apos;s data at scale and using novel AI technologies for automated decision-making and safeguarding. Processing is designed in line with the ICO Children&apos;s Code principles, prioritising data minimisation, transparency, and the best interests of the child.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold">2. Nature of Processing</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)] leading-relaxed">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="font-semibold text-[var(--text)]">Data Collection</h3>
                                    <p className="text-sm mt-2">Students record audio via the web browser. Audio is temporarily buffered as base64 and then uploaded to secure Supabase Storage.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--text)]">AI Pipeline</h3>
                                    <p className="text-sm mt-2">Audio is sent to OpenAI Whisper or Gemini for transcription. Transcripts are processed by Gemini-1.5-Flash for scoring and crisis detection.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--text)]">No Biometric ID</h3>
                                    <p className="text-sm mt-2">Audio recordings are not used for biometric identification or authentication. No voiceprints or speaker profiles are generated.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--text)]">Retention</h3>
                                    <p className="text-sm mt-2">Audio is retained for a maximum of 30–90 days, and may be deleted sooner following teacher review or safeguarding triage.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold">3. Lawful Basis</h2>
                        <div className="mt-4 space-y-4">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <h3 className="font-semibold">Maintenance/State Schools</h3>
                                <p className="mt-2 text-[var(--muted)]">Public Task (Article 6(1)(e)) where deployed by maintained schools, academies, or local authorities.</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <h3 className="font-semibold">Independent Schools</h3>
                                <p className="mt-2 text-[var(--muted)]">Legitimate Interests (Article 6(1)(f)) where deployed by independent schools, with a Legitimate Interests Assessment (LIA) completed.</p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                                <h3 className="font-semibold">Safeguarding (Special Category)</h3>
                                <ul className="mt-2 list-disc pl-5 text-[var(--muted)]">
                                    <li>Article 9(2)(g): Substantial Public Interest.</li>
                                    <li>DPA 2018 Schedule 1, Part 2, paragraph 18: Safeguarding of children.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border-2 border-teal-500/30 bg-teal-500/5 p-8">
                        <h2 className="text-2xl font-semibold text-teal-400">Human-In-The-Loop Guarantee</h2>
                        <p className="mt-4 text-[var(--muted)]">
                            The system does not make <strong>solely automated decisions</strong> with legal or similarly significant effects (Article 22).
                            All assessment outcomes and safeguarding alerts are subject to human review by teachers or designated safeguarding staff.
                        </p>
                        <p className="mt-4 text-[var(--muted)]">
                            Crisis detection operates as a support signal only and does not replace school safeguarding procedures, professional judgment, or statutory reporting obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold">4. Risk Assessment & Mitigation</h2>
                        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[color-mix(in_oklab,var(--surface),black_5%)] text-xs font-semibold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Risk</th>
                                        <th className="px-6 py-4">Mitigation</th>
                                        <th className="px-6 py-4">Residual Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    <tr>
                                        <td className="px-6 py-4 font-medium">AI Bias / Accuracy</td>
                                        <td className="px-6 py-4 text-[var(--muted)]">Teacher overrides for every AI score; confidence markers.</td>
                                        <td className="px-6 py-4 text-teal-500">Low</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium">Safeguarding failure</td>
                                        <td className="px-6 py-4 text-[var(--muted)]">Multi-keyword matching + immediate teacher email alerts.</td>
                                        <td className="px-6 py-4 text-teal-500">Low</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-medium">Unauthorized Access</td>
                                        <td className="px-6 py-4 text-[var(--muted)]">Supabase RLS + logical tenant isolation.</td>
                                        <td className="px-6 py-4 text-teal-500">Low</td>
                                    </tr>
                                </tbody>
                            </table>
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
                        <Link href="/privacy" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Privacy Policy →
                        </Link>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
