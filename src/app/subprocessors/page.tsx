"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SecurityContactModal } from "@/components/compliance/security-contact-modal";

export default function SubprocessorsPage() {
    const subprocessors = [
        {
            name: "OpenAI",
            purpose: "Speech-to-text transcription, rubric-aligned scoring support, image generation for assessments",
            dataCategories: "Audio recordings (for transcription), transcript text (for scoring)",
            region: "United States",
            safeguards: "DPA available",
            website: "https://openai.com",
        },
        {
            name: "Google (Gemini Flash)",
            purpose: "Rubric-aligned scoring support (consensus scoring)",
            dataCategories: "Transcript text",
            region: "United States",
            safeguards: "DPA available",
            website: "https://cloud.google.com",
        },
        {
            name: "Supabase",
            purpose: "Database hosting, file storage, authentication",
            dataCategories: "All platform data (encrypted at rest)",
            region: "United States",
            safeguards: "SOC 2 Type II, DPA available",
            website: "https://supabase.com",
        },
        {
            name: "Vercel",
            purpose: "Application hosting and edge delivery",
            dataCategories: "Application logs, request metadata",
            region: "Global (edge network)",
            safeguards: "SOC 2 Type II, DPA available",
            website: "https://vercel.com",
        },
        {
            name: "LemonSqueezy",
            purpose: "Payment processing (merchant of record for individual teacher credits)",
            dataCategories: "Billing information, purchase history",
            region: "United States",
            safeguards: "PCI DSS compliant",
            website: "https://lemonsqueezy.com",
        },
        {
            name: "MailerLite",
            purpose: "Email communications (sales and marketing emails only)",
            dataCategories: "Teacher email addresses (not student data)",
            region: "European Union",
            safeguards: "GDPR compliant, DPA available",
            website: "https://mailerlite.com",
        },
    ];

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

            <main id="main-content" className="mx-auto max-w-5xl px-6 py-14">
                <div className="mb-8">
                    <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        Transparency
                    </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Subprocessors
                </h1>
                <p className="mt-4 text-lg text-[var(--muted)]">
                    Third-party services that process data on behalf of SayVeritas. This list is provided for procurement transparency.
                </p>

                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-900">
                        <strong>Last updated:</strong> January 2026. We notify customers of material changes to this list.
                    </p>
                </div>

                {/* Desktop Table */}
                <div className="mt-10 hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                                <th className="px-4 py-3 text-left text-sm font-semibold">Vendor</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Purpose</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Data Categories</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Region</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Safeguards</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subprocessors.map((sp, idx) => (
                                <tr
                                    key={sp.name}
                                    className={`border-b border-[var(--border)] ${idx % 2 === 0 ? "bg-[var(--background)]" : "bg-[var(--surface)]"}`}
                                >
                                    <td className="px-4 py-4 align-top">
                                        <a
                                            href={sp.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-teal-600 hover:underline"
                                        >
                                            {sp.name}
                                        </a>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-[var(--muted)] align-top">{sp.purpose}</td>
                                    <td className="px-4 py-4 text-sm text-[var(--muted)] align-top">{sp.dataCategories}</td>
                                    <td className="px-4 py-4 text-sm text-[var(--muted)] align-top">{sp.region}</td>
                                    <td className="px-4 py-4 text-sm align-top">
                                        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                            {sp.safeguards}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="mt-10 space-y-4 md:hidden">
                    {subprocessors.map((sp) => (
                        <div key={sp.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                            <a
                                href={sp.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-medium text-teal-600 hover:underline"
                            >
                                {sp.name}
                            </a>
                            <p className="mt-2 text-sm text-[var(--muted)]">{sp.purpose}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <div>
                                    <span className="font-medium text-[var(--text)]">Data:</span>{" "}
                                    <span className="text-[var(--muted)]">{sp.dataCategories}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-[var(--text)]">Region:</span>{" "}
                                    <span className="text-[var(--muted)]">{sp.region}</span>
                                </div>
                                <div>
                                    <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                        {sp.safeguards}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Data Flow Section */}
                <section className="mt-16">
                    <h2 className="text-2xl font-semibold">Data Flow Summary</h2>
                    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <p className="font-semibold text-teal-600">Student Audio</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Recorded → Stored in Supabase → Sent to OpenAI for transcription →
                                    Transcript stored → Audio available for 30 days (teacher download) → Auto-deleted
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-teal-600">Transcripts</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Stored in Supabase → Sent to OpenAI/Google for scoring →
                                    Scores saved → Transcript retained per school policy
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-teal-600">Teacher Data</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Email stored in Supabase + MailerLite (for communications) →
                                    Payment info handled by LemonSqueezy (never touches our servers)
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-teal-600">No Student PII to Marketing</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    MailerLite receives teacher emails only. Student names, recordings,
                                    and transcripts are never sent to marketing systems.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What We Don't Do */}
                <section className="mt-12">
                    <h2 className="text-2xl font-semibold">What We Don&apos;t Do</h2>
                    <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-6">
                        <ul className="space-y-2 text-red-900">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold">✗</span>
                                <span>We do not sell student data to any third party</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold">✗</span>
                                <span>We do not use student recordings to train AI models</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold">✗</span>
                                <span>We do not share student data with advertising platforms</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold">✗</span>
                                <span>We do not retain audio beyond the configured retention period</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Request More Info */}
                <section className="mt-12">
                    <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-6">
                        <p className="font-semibold">Need more details for procurement?</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                            We can provide DPAs, security questionnaire responses, and detailed data flow documentation upon request.
                        </p>
                        <div className="mt-4">
                            <SecurityContactModal buttonText="Request Documentation" />
                        </div>
                    </div>
                </section>

                {/* Related Links */}
                <div className="mt-16 border-t border-[var(--border)] pt-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Related Pages</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href="/privacy" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            Privacy Policy →
                        </Link>
                        <Link href="/ai-safety" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface)]">
                            AI Safety & Governance →
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
