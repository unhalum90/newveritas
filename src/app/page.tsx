"use client";

import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { UK_HOMEPAGE } from "@/lib/config/uk-homepage-content";
import { US_HOMEPAGE } from "@/lib/config/us-homepage-content";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HeroImage } from "@/components/home/hero-image";
import Link from "next/link";

export default function HomePage() {
  const { isUK, isLoading } = useMarketingLocale();

  // Select content based on locale
  const content = isUK ? UK_HOMEPAGE : US_HOMEPAGE;

  // Show minimal loading state to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="animate-pulse">
            <div className="h-12 w-64 rounded bg-[var(--surface)]" />
            <div className="mt-6 h-8 w-full max-w-xl rounded bg-[var(--surface)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)]"
      >
        Skip to main content
      </a>

      {/* ===================================================================== */}
      {/* HEADER */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>

          <nav
            className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex"
            aria-label="Primary"
          >
            <a href="#how-it-works" className="hover:text-[var(--text)]">
              How it works
            </a>
            <a href="#who-its-for" className="hover:text-[var(--text)]">
              Who it&apos;s for
            </a>
            <Link
              href="/studylab"
              className="font-medium text-[var(--studylab-accent)] hover:text-[var(--text)]"
            >
              StudyLab
            </Link>
            <Link
              href="/pulse"
              className="font-medium text-[var(--pulse-accent)] hover:text-[var(--text)]"
            >
              Pulse
            </Link>
            <a href="#pricing" className="hover:text-[var(--text)]">
              Pricing
            </a>
            <a href="#trust" className="hover:text-[var(--text)]">
              Trust
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/login"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[color-mix(in_oklab,var(--surface),white_6%)]"
            >
              Sign in
            </Link>
            <Link
              href={content.hero.cta_primary.href}
              className="rounded-md bg-[var(--primary-strong)] px-3 py-2 text-sm text-white hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)]"
            >
              {content.hero.cta_primary.text}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ================================================================= */}
        {/* HERO SECTION */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              {/* Left Column - Content */}
              <div>
                {/* Badge */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {content.hero.badge}
                </div>

                {/* Headline */}
                <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
                  {content.hero.headline}
                </h1>

                {/* Subheadline */}
                <p className="mt-6 text-lg leading-relaxed text-[var(--muted)] md:text-xl">
                  {content.hero.subheadline}
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={content.hero.cta_primary.href}
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--primary-strong)] px-6 text-base font-medium text-white hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)] whitespace-nowrap"
                  >
                    {content.hero.cta_primary.text}
                  </Link>

                  <a
                    href={content.hero.cta_secondary.href}
                    className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-6 text-base hover:bg-[var(--surface)] whitespace-nowrap"
                  >
                    {content.hero.cta_secondary.text}
                  </a>
                </div>

                {/* Social Proof */}
                <p className="mt-6 text-sm text-[var(--muted)]">
                  {content.hero.proof}
                </p>
              </div>

              {/* Right Column - Hero Image */}
              <div className="relative">
                <HeroImage
                  src="/hero_image.png"
                  alt="Teacher dashboard showing AI-assisted oral assessment results"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TRUST BAR */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-white py-8">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-6 text-center text-sm font-medium text-[#64748B]">
              {content.trustBar.heading}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {content.trustBar.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-[#475569]"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* THE 3-PRODUCT JOURNEY */}
        {/* ================================================================= */}
        <section
          id="how-it-works"
          className="border-b border-[var(--border)] bg-[#F8FAFC] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.threeProducts.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.threeProducts.subheading}
              </p>
            </div>

            {/* 3 Product Cards */}
            {/* Order: Pulse (weekly) → Study Lab (daily) → Oral (unit) */}
            <div className="grid gap-8 md:grid-cols-3">
              <ProductCard product={content.threeProducts.weekly} isUK={isUK} />
              <ProductCard product={content.threeProducts.daily} isUK={isUK} />
              <ProductCard product={content.threeProducts.unit} isUK={isUK} />
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PAIN-BASED SEGMENTS */}
        {/* ================================================================= */}
        <section
          id="who-its-for"
          className="border-b border-[var(--border)] bg-white py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.segments.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.segments.subheading}
              </p>
            </div>

            {/* Segment Cards */}
            <div className="grid gap-8 md:grid-cols-3">
              {content.segments.cards.map((segment, idx) => (
                <SegmentCard key={idx} segment={segment} isUK={isUK} />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TIME & ROI */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-[#F8FAFC] py-20">
          <div className="mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.timeROI.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">
                {content.timeROI.subheading}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-8 md:grid-cols-3">
              {content.timeROI.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm"
                >
                  <div className="mb-3 text-5xl">{stat.icon}</div>
                  <div className="mb-2 text-3xl font-bold text-[var(--primary-strong)]">
                    {stat.metric}
                  </div>
                  <div className="mb-3 text-sm font-semibold text-[#0F172A]">
                    {stat.label}
                  </div>
                  <p className="text-sm text-[#64748B]">{stat.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* HOW IT WORKS (Step-by-Step) */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#0F172A]">
                {content.howItWorks.heading}
              </h2>
            </div>

            {/* Horizontal Timeline */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-[#E2E8F0] md:block" />

              <div className="grid gap-8 md:grid-cols-4">
                {content.howItWorks.steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Step Number Circle */}
                    <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--primary-strong)] font-bold text-white shadow-lg">
                        <span className="text-2xl">{step.number}</span>
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="mt-4 text-center">
                      <p className="text-base font-semibold text-[#0F172A]">
                        {step.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow (except last step) */}
                    {idx < 3 && (
                      <div className="absolute right-0 top-12 hidden -translate-y-1/2 translate-x-1/2 text-2xl text-[#64748B] md:block">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TRUST & COMPLIANCE */}
        {/* ================================================================= */}
        <section
          id="trust"
          className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                {content.trust.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
                {content.trust.subheading}
              </p>
            </div>

            {/* Trust Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {content.trust.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
                >
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>
                  <Link
                    href={item.linkHref}
                    className="text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    {item.linkText} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ================================================================= */}
        {/* PRICING */}
        {/* ================================================================= */}
        <section
          id="pricing"
          className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight">
                {content.pricing.heading}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
                {content.pricing.subheading}
              </p>
            </div>

            {/* Pricing Tiers */}
            <div className="mb-16 grid gap-6 md:grid-cols-3">
              {content.pricing.tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`relative flex h-full flex-col rounded-3xl border p-8 shadow-[0_30px_80px_-60px_rgba(20,184,166,0.35)] ${tier.popular
                    ? "border-[color-mix(in_oklab,#34d399,white_30%)] bg-[linear-gradient(160deg,rgba(16,55,48,0.96),rgba(10,22,24,0.96))]"
                    : "border-[var(--border)] bg-[linear-gradient(160deg,rgba(18,24,34,0.96),rgba(11,15,20,0.96))]"
                    }`}
                >
                  {tier.badge && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color-mix(in_oklab,#34d399,white_25%)] bg-[color-mix(in_oklab,#34d399,black_10%)] px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                      {tier.badge}
                    </span>
                  )}

                  <div>
                    <p
                      className={`text-lg font-semibold ${tier.popular ? "text-[#34d399]" : "text-[#f59e0b]"
                        }`}
                    >
                      {tier.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {tier.audience}
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-4xl font-semibold text-white">
                        {tier.priceDisplay}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {tier.priceDetail}
                    </p>
                  </div>

                  <p className="mt-4 text-sm text-[var(--muted)]">
                    {tier.description}
                  </p>

                  <ul className="mt-6 flex flex-col gap-3 text-sm text-[color-mix(in_oklab,white,black_10%)]">
                    {tier.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-2">
                        <span className="text-base text-[color-mix(in_oklab,white,black_8%)]">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.cta.href}
                    className={`mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition ${tier.popular
                      ? "bg-[color-mix(in_oklab,#34d399,black_25%)] text-[#0b0f14] hover:bg-[color-mix(in_oklab,#34d399,black_35%)]"
                      : "border border-[color-mix(in_oklab,#f59e0b,white_20%)] text-[#f59e0b] hover:bg-[color-mix(in_oklab,#f59e0b,black_85%)]"
                      }`}
                  >
                    {tier.cta.text}
                  </Link>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="mx-auto max-w-3xl">
              <h3 className="mb-8 text-center text-2xl font-bold">
                Frequently asked questions
              </h3>
              <div className="space-y-4">
                {content.pricing.faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
                  >
                    <h4 className="mb-2 font-semibold">{item.question}</h4>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FINAL CTA */}
        {/* ================================================================= */}
        <section className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--primary-strong)] to-[#0891b2] py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              {content.finalCTA.heading}
            </h2>

            <p className="mb-8 text-lg text-white/90">
              {content.finalCTA.subheading}
            </p>

            <div className="mb-10 grid gap-3 text-left md:grid-cols-2">
              {content.finalCTA.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-white">
                  <span className="mt-1">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={content.finalCTA.cta_primary.href}
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-base font-medium text-[var(--primary-strong)] shadow-lg hover:bg-white/90"
              >
                {content.finalCTA.cta_primary.text}
              </Link>

              <a
                href={content.finalCTA.cta_secondary.href}
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-white bg-transparent px-8 text-base font-medium text-white hover:bg-white/10"
              >
                {content.finalCTA.cta_secondary.text}
              </a>
            </div>

            <p className="text-sm text-white/80">{content.finalCTA.note}</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

// ============================================================================
// COMPONENT: ProductCard
// ============================================================================
interface ProductCardProps {
  product: {
    icon: string;
    frequency: string;
    name: string;
    tagline: string;
    studentPrompt: string;
    whatHappens: string[];
    teacherBenefit: string;
    ukAlignment: string;
    useCases: string[];
  };
  isUK: boolean;
}

function ProductCard({ product, isUK }: ProductCardProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-2 text-4xl">{product.icon}</div>
        <div className="mb-1 text-sm font-semibold text-[var(--primary-strong)]">
          {product.frequency}
        </div>
        <h3 className="mb-1 text-xl font-bold text-[#0F172A]">{product.name}</h3>
        <p className="text-sm text-[#64748B]">{product.tagline}</p>
      </div>

      {/* Student Prompt */}
      <div className="mb-4 rounded-lg bg-[#F8FAFC] p-3">
        <p className="text-sm italic text-[#475569]">{product.studentPrompt}</p>
      </div>

      {/* What Happens */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase text-[#64748B]">
          What happens
        </div>
        <ul className="space-y-1">
          {product.whatHappens.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-[#475569]"
            >
              <span className="text-[var(--primary-strong)]">→</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Teacher Benefit */}
      <div className="mb-4 rounded-lg border-l-4 border-[var(--primary-strong)] bg-[#F0FDFA] p-3">
        <p className="text-sm font-medium text-[#0F172A]">
          {product.teacherBenefit}
        </p>
      </div>

      {/* UK Alignment (only show if there's content) */}
      {isUK && product.ukAlignment && (
        <div className="mb-4">
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold">UK alignment:</span>{" "}
            {product.ukAlignment}
          </p>
        </div>
      )}

      {/* Use Cases */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-[#64748B]">
          Use cases
        </div>
        <div className="flex flex-wrap gap-2">
          {product.useCases.map((useCase, idx) => (
            <span
              key={idx}
              className="rounded-full bg-[#E0F2FE] px-2 py-1 text-xs text-[#0369A1]"
            >
              {useCase}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: SegmentCard
// ============================================================================
interface SegmentCardProps {
  segment: {
    icon: string;
    audience: string;
    pains: string[];
    solutions: string[];
    ukSpecific: string;
    cta: {
      text: string;
      href: string;
    };
  };
  isUK: boolean;
}

function SegmentCard({ segment, isUK }: SegmentCardProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-8">
      {/* Icon & Audience */}
      <div className="mb-6">
        <div className="mb-3 text-4xl">{segment.icon}</div>
        <h3 className="text-xl font-bold text-[#0F172A]">{segment.audience}</h3>
      </div>

      {/* Pains */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-semibold uppercase text-[#DC2626]">
          Challenges you face
        </div>
        <ul className="space-y-2">
          {segment.pains.map((pain, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-[#475569]"
            >
              <span className="text-[#DC2626]">✗</span>
              <span>{pain}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Solutions */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-semibold uppercase text-[#059669]">
          How SayVeritas helps
        </div>
        <ul className="space-y-2">
          {segment.solutions.map((solution, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-[#475569]"
            >
              <span className="text-[#059669]">✓</span>
              <span>{solution}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* UK-Specific (only show if there's content) */}
      {isUK && segment.ukSpecific && (
        <div className="rounded-lg bg-[#F0F9FF] p-3">
          <p className="text-sm font-medium text-[#0369A1]">
            {segment.ukSpecific}
          </p>
        </div>
      )}
    </div>
  );
}
