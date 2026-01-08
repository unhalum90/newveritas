import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata = {
    title: "How AI is Used | SayVeritas",
    description:
        "Understand exactly when AI runs in SayVeritas, what it does, what it doesn't do, and its known limitations.",
};

export default function AIUsePage() {
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
                        Transparency
                    </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    How AI is Used (and Not Used)
                </h1>
                <p className="mt-4 text-lg text-[var(--muted)]">
                    Complete transparency about AI in SayVeritas: when it runs, what it outputs, and its limitations.
                </p>

                <div className="mt-12 space-y-12">
                    {/* When AI Runs */}
                    <section>
                        <h2 className="text-2xl font-semibold">When AI Runs</h2>
                        <p className="mt-2 text-[var(--muted)]">
                            AI is used in the following specific contexts within SayVeritas:
                        </p>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg">🎙️</span>
                                    <div>
                                        <p className="font-semibold">Speech-to-Text Transcription</p>
                                        <p className="text-sm text-[var(--muted)]">
                                            Student voice recordings are transcribed to text using OpenAI speech recognition. This creates a reviewable record of what students said.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-lg">📊</span>
                                    <div>
                                        <p className="font-semibold">Rubric-Aligned Scoring (Dual-Model Consensus)</p>
                                        <p className="text-sm text-[var(--muted)]">
                                            Transcripts are analysed by two AI models (OpenAI and Google Gemini) for consensus scoring against teacher-defined rubric criteria. This dual-model approach reduces single-model bias. Scores are recommendations only.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-lg">🖼️</span>
                                    <div>
                                        <p className="font-semibold">Assessment Image Generation</p>
                                        <p className="text-sm text-[var(--muted)]">
                                            AI can generate images for assessment prompts (e.g., diagrams, scenes for analysis). Teachers preview and approve all generated images before student use.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-lg">🔍</span>
                                    <div>
                                        <p className="font-semibold">Socratic Follow-Up Questions</p>
                                        <p className="text-sm text-[var(--muted)]">
                                            In StudyLab mode, AI generates follow-up questions to push student thinking deeper. Designed to guide, not evaluate.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg">📈</span>
                                    <div>
                                        <p className="font-semibold">Class-Level Insights</p>
                                        <p className="text-sm text-[var(--muted)]">
                                            AI aggregates responses to surface common misconceptions and patterns. All insights are evidence-linked to source transcripts.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* What AI Does NOT Do */}
                    <section>
                        <h2 className="text-2xl font-semibold">What AI Does NOT Do</h2>
                        <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-6">
                            <ul className="space-y-3 text-red-900">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span><strong>No autonomous final grades</strong> — AI never assigns grades that go directly to students without teacher review</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span><strong>No certification or credentialing</strong> — SayVeritas does not issue certificates, diplomas, or formal credentials</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span><strong>No high-stakes proctoring</strong> — We do not claim exam-level security or identity verification</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span><strong>No emotion or sentiment analysis</strong> — We deliberately exclude tone, mood, or emotional inference</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span><strong>No training on your data</strong> — Student recordings are never used to train public AI models</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span><strong>No advertising</strong> — Student data is never used for marketing or ad targeting</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Known Limitations */}
                    <section>
                        <h2 className="text-2xl font-semibold">Known Limitations</h2>
                        <p className="mt-2 text-[var(--muted)]">
                            We believe in honest disclosure. AI in SayVeritas has the following limitations:
                        </p>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                                <p className="font-semibold text-amber-900">Speech Recognition Errors</p>
                                <p className="mt-2 text-sm text-amber-800">
                                    Transcription accuracy varies. Uncommon names, technical vocabulary, and fast speech may be misrecognised. Teachers can view original audio.
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                                <p className="font-semibold text-amber-900">Accent & Dialect Variation</p>
                                <p className="mt-2 text-sm text-amber-800">
                                    Speech models perform differently across accents. We provide teacher override to correct for any systematic bias.
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                                <p className="font-semibold text-amber-900">Audio Quality Dependency</p>
                                <p className="mt-2 text-sm text-amber-800">
                                    Background noise, poor microphones, or connectivity issues affect transcription quality. We flag low-confidence transcripts for review.
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                                <p className="font-semibold text-amber-900">Rubric Interpretation</p>
                                <p className="mt-2 text-sm text-amber-800">
                                    AI scoring is probabilistic. Edge cases and nuanced responses may not align with teacher expectations. Human review is essential.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Teacher Override */}
                    <section>
                        <h2 className="text-2xl font-semibold">Teacher Review & Override</h2>
                        <div className="mt-4 rounded-xl border-2 border-teal-500 bg-teal-50 p-6">
                            <p className="font-semibold text-teal-900">
                                Every AI output is reviewable and overrideable.
                            </p>
                            <ul className="mt-4 space-y-2 text-teal-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600">✓</span>
                                    <span>Teachers can listen to original audio alongside transcripts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600">✓</span>
                                    <span>Any AI-suggested score can be overridden with a documented reason</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600">✓</span>
                                    <span>Feedback can be edited or replaced entirely before release</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600">✓</span>
                                    <span>Override reasons are logged for accountability and audit</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Data Promise */}
                    <section>
                        <h2 className="text-2xl font-semibold">Our Data Promise</h2>
                        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <p className="font-semibold">No Training on Student Data</p>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        Student voice recordings and transcripts are never used to train AI models. Your data serves only your educational purposes.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold">No Third-Party Sharing</p>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        Student data is not sold, shared, or commercialised. Our subprocessors access data only to deliver the service.
                                    </p>
                                </div>
                            </div>
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
                        <Link href="/evidence-outcomes" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Evidence & Outcomes →
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
