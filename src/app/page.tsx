import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { FeatureGallery } from "@/components/home/feature-gallery";
import { ContactModal } from "@/components/home/contact-modal";
import { HeroImage } from "@/components/home/hero-image";

export default function Home() {
  const featureItems: Array<{ title: string; body: string }> = [
    { title: "Socratic follow-ups", body: "Adaptive probing based on what students actually say (per assessment)." },
    { title: "Question rotation", body: "Create multiple prompts that assess the same target skill to reduce sharing." },
    { title: "Integrity settings", body: "Time limits and integrity options that don't interrupt the student experience." },
    { title: "Teacher-validated scoring", body: "AI assists, teachers maintain professional judgment." },
    { title: "Works on any device", body: "Students record on phones, tablets, or laptops." },
    { title: "Admin-ready", body: "School admin onboarding and bulk account workflows (where enabled)." },
  ];

  const featureAccents = ["#14b8a6", "#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#fb7185"] as const;
  const pricingTiers = [
    {
      name: "Starter Pack",
      price: "$15",
      cadence: "one-time",
      credits: "250 assessment credits",
      minutes: "~60 mins of AI review",
      features: [
        "AI transcription + scoring",
        "Socratic follow-up questions",
        "Teacher review workflow",
        "Credits never expire",
      ],
      isPopular: false,
      ctaLabel: "Get Starter",
      ctaHref: "#waitlist",
      accent: "text-[#f59e0b]",
      buttonClass:
        "border border-[color-mix(in_oklab,#f59e0b,white_20%)] text-[#f59e0b] hover:bg-[color-mix(in_oklab,#f59e0b,black_85%)]",
    },
    {
      name: "Classroom Pack",
      price: "$29",
      cadence: "one-time",
      credits: "600 assessment credits",
      minutes: "~150 mins of AI review",
      features: [
        "Question rotation + integrity controls",
        "Class report with misconceptions",
        "Evidence snippets for review",
        "Enough for a full-class assessment",
      ],
      ctaLabel: "Get Classroom",
      ctaHref: "#waitlist",
      accent: "text-[#34d399]",
      buttonClass: "bg-[color-mix(in_oklab,#34d399,black_25%)] text-[#0b0f14] hover:opacity-90",
      isPopular: true,
    },
    {
      name: "School License",
      price: "Custom",
      cadence: "/ year",
      credits: "Unlimited* credits",
      minutes: "Subject to fair use policy",
      features: [
        "Unlimited teacher accounts",
        "Admin dashboard + analytics",
        "SSO / rostering support",
        "Purchase order + invoice support",
      ],
      isPopular: false,
      ctaLabel: "Contact Sales",
      ctaHref: "mailto:hello@sayveritas.com?subject=SayVeritas%20Pricing%20Request",
      accent: "text-white",
      buttonClass:
        "border border-[color-mix(in_oklab,var(--border),white_35%)] text-white hover:bg-[color-mix(in_oklab,var(--surface),black_35%)]",
    },
  ] as const;

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
            <a href="#how" className="hover:text-[var(--text)]">
              How it works
            </a>
            <a href="#features" className="hover:text-[var(--text)]">
              Features
            </a>
            <Link href="/pricing" className="hover:text-[var(--text)]">
              Pricing
            </Link>
            <a href="#use-cases" className="hover:text-[var(--text)]">
              Use cases
            </a>
            <a href="#security" className="hover:text-[var(--text)]">
              Trust
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:opacity-90"
            >
              Sign in
            </Link>
            <a
              href="#waitlist"
              className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm text-white hover:opacity-90"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero - DARK BACKGROUND */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              {/* Left Column - Content */}
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                  Oral assessment • AI-assisted scoring • Teacher-verified
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[color-mix(in_oklab,var(--primary),white_35%)] bg-[color-mix(in_oklab,var(--primary),black_75%)] px-3 py-1 text-xs text-[color-mix(in_oklab,white,black_8%)]">
                    AI scoring
                  </span>
                  <span className="rounded-full border border-[color-mix(in_oklab,#60a5fa,white_35%)] bg-[color-mix(in_oklab,#60a5fa,black_80%)] px-3 py-1 text-xs text-[color-mix(in_oklab,white,black_8%)]">
                    Socratic follow-ups
                  </span>
                  <span className="rounded-full border border-[color-mix(in_oklab,#a78bfa,white_35%)] bg-[color-mix(in_oklab,#a78bfa,black_82%)] px-3 py-1 text-xs text-[color-mix(in_oklab,white,black_8%)]">
                    Integrity options
                  </span>
                  <span className="rounded-full border border-[color-mix(in_oklab,#34d399,white_35%)] bg-[color-mix(in_oklab,#34d399,black_82%)] px-3 py-1 text-xs text-[color-mix(in_oklab,white,black_8%)]">
                    Mobile-ready
                  </span>
                </div>
                
                {/* ENLARGED HERO HEADLINE - was 4xl/5xl, now 5xl/7xl */}
                <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                  Stop grading. <br />
                  <span className="text-[var(--primary)]">Start teaching.</span>
                </h1>
                
                <p className="mt-6 text-lg leading-relaxed text-[var(--muted)] md:text-xl">
                  AI-powered oral assessment that scores student understanding in minutes—so you can focus on the students who
                  need you most.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#how"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--primary)] px-6 text-base font-medium text-white hover:opacity-90"
                  >
                    See how it works
                  </a>
                  <a
                    href="#waitlist"
                    className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-6 text-base hover:bg-[var(--surface)]"
                  >
                    Join waitlist
                  </a>
                </div>
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

        {/* Stats Section - WHITE BACKGROUND (NEW) */}
        <section className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="text-5xl font-bold text-[var(--primary)] md:text-6xl">6 hours</div>
                <p className="mt-3 text-base text-[#64748B]">saved per week</p>
                <p className="mt-2 text-sm text-[#94A3B8]">vs. traditional grading</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[var(--primary)] md:text-6xl">30 min</div>
                <p className="mt-3 text-base text-[#64748B]">to review 90 students</p>
                <p className="mt-2 text-sm text-[#94A3B8]">with AI-assisted scoring</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[var(--primary)] md:text-6xl">10-15%</div>
                <p className="mt-3 text-base text-[#64748B]">need targeted support</p>
                <p className="mt-2 text-sm text-[#94A3B8]">focus on who matters most</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section - DARK BACKGROUND */}
        <section className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                The grading treadmill is killing good teaching
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--primary)] text-2xl">⏱️</div>
                  <p className="text-base font-semibold">The time trap</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    Teachers spend hours grading. By the time scores are back, the moment for intervention has passed.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#60a5fa] text-2xl">📊</div>
                  <p className="text-base font-semibold">The scale problem</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    Oral assessments reveal deep understanding—but 5 minutes per student doesn't scale.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#f59e0b] text-2xl">🔒</div>
                  <p className="text-base font-semibold">The integrity crisis</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    Answers spread quickly. Traditional assessment formats struggle to keep up.
                  </p>
                </div>
              </div>
              <p className="mt-8 text-center text-base text-[var(--muted)]">
                What if you could assess authentic understanding—at scale—without losing control?
              </p>
            </div>
          </div>
        </section>

        {/* See It In Action - LIGHT BACKGROUND (NEW) */}
        <section className="border-b border-[var(--border)] bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
              See It In Action
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[#64748B]">
              From assessment creation to student responses to teacher review—here's how SayVeritas works in real classrooms.
            </p>
            
            <FeatureGallery />
          </div>
        </section>

        {/* How It Works - WHITE BACKGROUND */}
        <section id="how" className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
              Assessment that thinks like a professor, scales like technology
            </h2>
            
            {/* Horizontal Timeline Layout */}
            <div className="relative mt-12">
              {/* Timeline Line */}
              <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-[#E2E8F0] md:block" />
              
              <div className="grid gap-8 md:grid-cols-4">
                {[
                  {
                    number: "1",
                    title: "Create an assessment",
                    description: "Start from scratch, upload material (PDF), or generate a draft with AI—then refine it in the builder.",
                    color: "#14b8a6"
                  },
                  {
                    number: "2",
                    title: "Students record responses",
                    description: "Students answer by voice (any device). Questions are revealed sequentially to reduce answer-sharing.",
                    color: "#60a5fa"
                  },
                  {
                    number: "3",
                    title: "AI scores & flags",
                    description: "Transcription + rubric-based scoring (Reasoning & Evidence) produce fast, reviewable results.",
                    color: "#a78bfa"
                  },
                  {
                    number: "4",
                    title: "Intervene where it matters",
                    description: "Spend your time on the 10–15% who need targeted support—not on routine grading.",
                    color: "#34d399"
                  }
                ].map((step, idx) => (
                  <div key={step.number} className="relative">
                    {/* Step Number Circle */}
                    <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center">
                      <div 
                        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white font-bold text-white shadow-lg"
                        style={{ backgroundColor: step.color }}
                      >
                        <span className="text-2xl">{step.number}</span>
                      </div>
                    </div>
                    
                    {/* Step Content */}
                    <div className="mt-4 text-center">
                      <p className="text-base font-semibold text-[#0F172A]">{step.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Arrow (except last step) */}
                    {idx < 3 && (
                      <div className="absolute right-0 top-12 hidden -translate-y-1/2 translate-x-1/2 text-2xl text-[#CBD5E1] md:block">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Mid-Page CTA - TEAL ACCENT (NEW) */}
        <section className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--primary)] to-[#0891b2]">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h3 className="text-3xl font-bold text-white md:text-4xl">Ready to reclaim your time?</h3>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
              Join our beta program and get priority onboarding, direct input on features, and founder pricing locked for 3 years.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="mailto:hello@sayveritas.com?subject=SayVeritas%20Demo%20Request"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-base font-medium text-[var(--primary)] shadow-lg hover:bg-white/90"
              >
                Request Demo
              </a>
              <a
                href="#waitlist"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-white bg-transparent px-8 text-base font-medium text-white hover:bg-white/10"
              >
                Join waitlist
              </a>
            </div>
          </div>
        </section>

        {/* Features - LIGHT BACKGROUND */}
        <section id="features" className="border-b border-[var(--border)] bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
              Built for real classrooms
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {featureItems.map((item, idx) => (
                <div
                  key={item.title}
                  className="group rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  style={{ 
                    borderLeftColor: featureAccents[idx % featureAccents.length], 
                    borderLeftWidth: 4 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: featureAccents[idx % featureAccents.length] }}
                    />
                    <p className="text-base font-semibold text-[#0F172A]">{item.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases - DARK BACKGROUND */}
        <section id="use-cases" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">Perfect for…</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Performance academies",
                  description: "Traveling students can demonstrate understanding on their schedule—with rigor intact.",
                  emoji: "🏆",
                  color: "#14b8a6"
                },
                {
                  title: "Higher education",
                  description: "Bring oral assessment to large classes without adding grading overhead.",
                  emoji: "🎓",
                  color: "#60a5fa"
                },
                {
                  title: "IB / AP programs",
                  description: "High-stakes courses that demand authentic evidence of understanding.",
                  emoji: "📚",
                  color: "#a78bfa"
                }
              ].map((useCase) => (
                <div
                  key={useCase.title}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-all hover:border-[var(--primary)] hover:shadow-lg"
                >
                  {/* IMAGE PLACEHOLDER: Use case photo */}
                  <div className="mb-6 flex aspect-video items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--surface),black_10%)]">
                    <div className="text-center">
                      <div className="text-6xl">{useCase.emoji}</div>
                      <p className="mt-3 text-xs text-[var(--muted)]">Photo: {useCase.title}</p>
                    </div>
                  </div>
                  {/* Replace with actual photo:
                  <Image 
                    src={`/use-cases/${useCase.title.toLowerCase().replace(/\s+/g, '-')}.jpg`}
                    alt={useCase.title}
                    width={400}
                    height={300}
                    className="w-full rounded-lg"
                  /> */}
                  
                  <p className="text-lg font-semibold" style={{ color: useCase.color }}>
                    {useCase.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial - LIGHT BACKGROUND (NEW) */}
        <section className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white p-8 shadow-lg md:p-12">
              <div className="flex flex-col items-center gap-8 md:flex-row">
                {/* IMAGE PLACEHOLDER: Teacher headshot */}
                <div className="flex-shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--primary)] bg-[#F1F5F9]">
                    <span className="text-3xl">👤</span>
                  </div>
                  {/* Replace with actual photo:
                  <Image 
                    src="/testimonials/sarah-m.jpg"
                    alt="Sarah M., Biology Teacher"
                    width={96}
                    height={96}
                    className="rounded-full"
                  /> */}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <p className="text-2xl leading-relaxed text-[#0F172A]">
                    "Finally, I have time to actually <span className="font-semibold text-[var(--primary)]">teach</span> instead of grade papers. SayVeritas gave me my weekends back."
                  </p>
                  <div className="mt-6">
                    <p className="font-semibold text-[#0F172A]">Sarah M.</p>
                    <p className="text-sm text-[#64748B]">Biology Teacher</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section - DARK BACKGROUND */}
        <section id="security" className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
              Your data. Your students. Your control.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "FERPA-aware by design",
                  description: "Protect student work with access controls and teacher visibility.",
                  icon: "🔒"
                },
                {
                  title: "Teacher review required",
                  description: "AI provides recommendations; teachers make final decisions.",
                  icon: "✓"
                },
                {
                  title: "Transparent integrity",
                  description: "Flags inform review—students aren't \"punished by algorithm.\"",
                  icon: "👁️"
                },
                {
                  title: "School-level control",
                  description: "Admin tools and bulk onboarding (where enabled).",
                  icon: "⚙️"
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--primary)] text-3xl">
                    {item.icon}
                  </div>
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing - DARK BACKGROUND */}
        <section id="pricing" className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Pricing</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Choose the plan that fits your assessment cycle
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--muted)]">
                Credit bundles for pilots and classroom runs, plus school licenses for teams that want full coverage.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative flex h-full flex-col rounded-3xl border p-8 shadow-[0_30px_80px_-60px_rgba(20,184,166,0.35)] ${
                    tier.isPopular
                      ? "border-[color-mix(in_oklab,#34d399,white_30%)] bg-[linear-gradient(160deg,rgba(16,55,48,0.96),rgba(10,22,24,0.96))]"
                      : "border-[var(--border)] bg-[linear-gradient(160deg,rgba(18,24,34,0.96),rgba(11,15,20,0.96))]"
                  }`}
                >
                  {tier.isPopular ? (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color-mix(in_oklab,#34d399,white_25%)] bg-[color-mix(in_oklab,#34d399,black_10%)] px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                      Popular
                    </span>
                  ) : null}

                  <div>
                    <p className={`text-lg font-semibold ${tier.accent}`}>{tier.name}</p>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-4xl font-semibold text-white">{tier.price}</span>
                      <span className="pb-1 text-sm text-[var(--muted)]">{tier.cadence}</span>
                    </div>
                    <p className="mt-4 text-sm text-[var(--muted)]">{tier.credits}</p>
                    <p className="text-xs text-[var(--muted)]">{tier.minutes}</p>
                  </div>

                  <ul className="mt-6 flex flex-col gap-3 text-sm text-[color-mix(in_oklab,white,black_10%)]">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-base text-[color-mix(in_oklab,white,black_8%)]">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={tier.ctaHref}
                    className={`mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition ${tier.buttonClass}`}
                  >
                    {tier.ctaLabel}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-[var(--muted)]">
              Want the full breakdown?{" "}
              <Link className="font-semibold text-[var(--primary)] hover:opacity-90" href="/pricing">
                See detailed pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA - DARK BACKGROUND */}
        <section id="waitlist" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div className="rounded-2xl border-2 border-[var(--primary)] bg-[var(--surface)] p-10 text-center">
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">Join the waitlist</h3>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
                Early access partners get priority onboarding, direct input on features, and founder pricing locked for 3 years.
              </p>
              <WaitlistForm />
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="mailto:hello@sayveritas.com?subject=SayVeritas%20Demo%20Request"
                  className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-8 text-base hover:bg-[var(--surface)]"
                >
                  Request a Demo
                </a>
              </div>
              <p className="mt-6 text-sm text-[var(--muted)]">
                Questions? <a href="mailto:hello@sayveritas.com" className="underline hover:text-[var(--text)]">Schedule a call</a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[var(--text)]">SayVeritas</p>
            <p className="mt-1">@chamberlininnovations</p>
          </div>
          <div className="flex gap-6">
            <Link className="hover:text-[var(--text)]" href="/login">
              Teacher sign in
            </Link>
            <Link className="hover:text-[var(--text)]" href="/student/login">
              Student login
            </Link>
            <Link className="hover:text-[var(--text)]" href="/privacy">
              Privacy
            </Link>
            <ContactModal className="hover:text-[var(--text)]" />
          </div>
        </div>
      </footer>
    </div>
  );
}
