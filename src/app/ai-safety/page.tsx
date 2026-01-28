"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SecurityContactModal } from "@/components/compliance/security-contact-modal";

export default function AISafetyPage() {
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
                    <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                        Trust & Safety
                    </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    AI Safety & Governance
                </h1>
                <p className="mt-4 text-lg text-[var(--muted)]">
                    How SayVeritas ensures safe, responsible, and transparent use of AI in educational assessment.
                </p>

                <div className="mt-12 space-y-12">
                    {/* Section 1: Educational Purpose */}
                    <section>
                        <h2 className="text-2xl font-semibold">1. Educational Purpose & Approved Use Cases</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <p className="text-[var(--muted)]">
                                SayVeritas is designed exclusively for educational purposes. Our platform supports:
                            </p>
                            <ul className="mt-4 space-y-2 text-[var(--muted)]">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>Voice-based formative and summative assessments</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>AI-assisted transcription and rubric-aligned scoring support</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>Socratic tutoring to build verbal fluency and critical thinking</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span>Class-level insights to identify misconceptions and guide instruction</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2: Human Responsibility */}
                    <section>
                        <h2 className="text-2xl font-semibold">2. Human Responsibility: Teacher Final Judgement</h2>
                        <div className="mt-4 rounded-xl border-2 border-teal-500 bg-teal-50 p-6">
                            <p className="font-semibold text-teal-900">
                                AI is not the evaluator. The teacher is.
                            </p>
                            <p className="mt-3 text-teal-800">
                                All AI-generated scores and feedback are recommendations only. Teachers retain full authority to:
                            </p>
                            <ul className="mt-3 space-y-2 text-teal-800">
                                <li>• Review and listen to original student recordings</li>
                                <li>• Override any AI-suggested score with documented reasoning</li>
                                <li>• Approve or modify feedback before students see it</li>
                                <li>• Make final grading decisions based on their professional judgement</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Safeguards */}
                    <section>
                        <h2 className="text-2xl font-semibold">3. Technical & Organisational Safeguards</h2>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <p className="font-semibold">Data Minimisation</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    We collect only the data necessary for the educational purpose. Audio is processed and can be deleted according to school-configured retention policies.
                                </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <p className="font-semibold">Access Controls</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Role-based permissions ensure teachers see only their classes. Students access only their own work. Admins have audit visibility.
                                </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <p className="font-semibold">Encryption</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Audio files are stored in isolated, access-controlled buckets.
                                </p>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <p className="font-semibold">No Emotion Inference</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    We deliberately exclude AI-driven inference of tone, emotion, or sentiment to mitigate accent discrimination and bias.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Incident Reporting */}
                    <section>
                        <h2 className="text-2xl font-semibold">4. Incident Reporting & Response</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <p className="text-[var(--muted)]">
                                If you encounter any issue with AI behaviour, data handling, or platform safety:
                            </p>
                            <ol className="mt-4 space-y-3 text-[var(--muted)]">
                                <li className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">1</span>
                                    <span><strong>Report:</strong> Email <a href="mailto:safety@sayveritas.com" className="text-teal-600 underline">safety@sayveritas.com</a> with details</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">2</span>
                                    <span><strong>Acknowledge:</strong> We respond within 24 hours to confirm receipt</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">3</span>
                                    <span><strong>Investigate:</strong> Our team investigates with full audit trail access</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">4</span>
                                    <span><strong>Resolve:</strong> We communicate findings and remediation steps</span>
                                </li>
                            </ol>
                        </div>
                    </section>

                    {/* Section 5: Escalation */}
                    <section>
                        <h2 className="text-2xl font-semibold">5. Escalation Route</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">🏫</div>
                                <div className="text-2xl text-[var(--muted)]">→</div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-xl">🛡️</div>
                            </div>
                            <p className="mt-4 text-[var(--muted)]">
                                <strong>School-level concerns</strong> should first be addressed by your institution&apos;s administrator.
                                If unresolved, escalate to SayVeritas support at <a href="mailto:hello@sayveritas.com" className="text-teal-600 underline">hello@sayveritas.com</a>.
                            </p>
                        </div>
                    </section>

                    {/* Section 6: Age-Appropriate Defaults */}
                    <section>
                        <h2 className="text-2xl font-semibold">6. Age-Appropriate Defaults</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <ul className="space-y-2 text-[var(--muted)]">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span><strong>No open-ended AI chat for students</strong> — Interactions are structured and teacher-supervised</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span><strong>No advertising</strong> — Student data is never used for marketing or ad targeting</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span><strong>Teacher-created accounts</strong> — Students cannot self-register; access is mediated by educators</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-500">✓</span>
                                    <span><strong>Pseudonymous by default</strong> — Real names are not required for student participation</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 7: Data Retention */}
                    <section>
                        <h2 className="text-2xl font-semibold">7. Data Retention Options</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <p className="text-[var(--muted)]">
                                Schools and districts control their data retention policies. Default retention is 30 days for audio recordings, after which data is permanently deleted. Administrators can configure longer retention periods if required by local policies.
                            </p>
                            <p className="mt-4">
                                <Link href="/privacy" className="text-teal-600 underline hover:text-teal-700">
                                    Read our full Privacy Policy →
                                </Link>
                            </p>
                        </div>
                    </section>

                    {/* Section 8: Request Documentation */}
                    <section>
                        <h2 className="text-2xl font-semibold">8. Request Our Assurance Pack</h2>
                        <div className="mt-4 rounded-xl border-2 border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-6">
                            <p className="text-[var(--muted)]">
                                Need documentation for procurement or compliance review? We provide:
                            </p>
                            <ul className="mt-3 space-y-1 text-[var(--muted)]">
                                <li>• Data Processing Agreement (DPA)</li>
                                <li>• <Link href="/dpia" className="underline hover:text-teal-600">Data Protection Impact Assessment (DPIA)</Link></li>
                                <li>• SOC 2 roadmap and security questionnaire responses</li>
                                <li>• Subprocessor list with transfer safeguards</li>
                            </ul>
                            <div className="mt-6">
                                <SecurityContactModal buttonText="Request Assurance Pack" />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Related Links */}
                <div className="mt-16 border-t border-[var(--border)] pt-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Related Pages</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href="/ai-use" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            How AI is Used →
                        </Link>
                        <Link href="/evidence-outcomes" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Evidence & Outcomes →
                        </Link>
                        <Link href="/subprocessors" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Subprocessors →
                        </Link>
                        <Link href="/privacy" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Privacy Policy →
                        </Link>
                        <Link href="/dpia" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            DPIA →
                        </Link>
                        <Link href="/security-privacy" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Security & DPA →
                        </Link>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
