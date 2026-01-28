import Link from "next/link";
import { FeatureGallery } from "@/components/home/feature-gallery";
import { HeroImage } from "@/components/home/hero-image";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { WebinarCalendar } from "@/components/marketing/webinar-calendar";
import { WebinarRegistrationForm } from "@/components/marketing/webinar-registration-form";
import { ShieldAlert } from "lucide-react";

export default function Home() {
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
      ctaHref: "/waitlist",
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
      ctaHref: "/waitlist",
      accent: "text-[#34d399]",
      buttonClass: "bg-[color-mix(in_oklab,#34d399,black_25%)] text-[#0b0f14] hover:bg-[color-mix(in_oklab,#34d399,black_35%)]",
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--text)]"
      >
        Skip to main content
      </a>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex" aria-label="Primary">
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
            <Link href="#how" className="hover:text-[var(--text)]">
              How it works
            </Link>
            <Link href="/studylab" className="text-[var(--studylab-accent)] font-medium hover:text-[var(--text)]">
              StudyLab
            </Link>
            <Link href="/pulse" className="text-[var(--pulse-accent)] font-medium hover:text-[var(--text)]">
              Pulse
            </Link>
            <Link href="#features" className="hover:text-[var(--text)]">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-[var(--text)]">
              Pricing
            </Link>
            <Link href="#use-cases" className="hover:text-[var(--text)]">
              Use cases
            </Link>
            <Link href="#security" className="hover:text-[var(--text)]">
              Trust
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[color-mix(in_oklab,var(--surface),white_6%)]"
            >
              Sign in
            </Link>
            <Link
              href="#waitlist"
              className="rounded-md bg-[var(--primary-strong)] px-3 py-2 text-sm text-white hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)]"
            >
              Join waitlist
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero - DARK BACKGROUND */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              {/* Left Column - Content */}
              <div>
                <div className="mb-6 flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  <ShieldAlert className="h-3 w-3" />
                  UK DfE Safety Standards Compliant
                </div>
                <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                  Voice-based learning <br />
                  <span className="text-[var(--primary)]">platform.</span>
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-[var(--muted)] md:text-xl">
                  Daily formative check-ins. Weekly Socratic study sessions. Unit oral assessments.
                  One platform where thinking happens through speaking, not typing. Built for UK schools with integrated safeguarding and academic integrity.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#how"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--primary-strong)] px-6 text-base font-medium text-white hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)] whitespace-nowrap"
                  >
                    See How It Works
                  </Link>

                  <Link
                    href="#webinars"
                    className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-6 text-base hover:bg-[var(--surface)] whitespace-nowrap"
                  >
                    Attend Webinar
                  </Link>
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

        {/* How Students Use SayVeritas Section */}
        <section id="how" className="bg-[var(--surface)] py-20 border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl text-[var(--text)] mb-16">
              How Students Use SayVeritas
            </h2>
            <div className="grid gap-8 md:grid-cols-3 relative">
              {/* Visual Timeline Line - Hidden on mobile */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-[var(--border)] z-0 transform -translate-y-1/2"></div>

              {/* Card 1: Pulse (Daily) */}
              <div className="relative z-10 bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[var(--pulse-accent)] text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto md:mx-0 relative border-4 border-[var(--surface)]">
                  D
                </div>
                <h3 className="text-xl font-bold mb-2 text-center md:text-left">Daily</h3>
                <div className="text-[var(--pulse-accent)] font-semibold text-sm uppercase tracking-wide mb-3 text-center md:text-left">Pulse</div>
                <p className="text-[var(--muted)] text-sm mb-4">
                  A 60-second voice checkout. &quot;Explain the main conflict in Chapter 4.&quot; Teachers get an audio highlights reel instantly.
                </p>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li>• Replaces exit tickets</li>
                  <li>• 100% participation</li>
                  <li>• Instant misconceptions</li>
                </ul>
              </div>

              {/* Card 2: StudyLab (Weekly) */}
              <div className="relative z-10 bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[var(--studylab-accent)] text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto md:mx-0 relative border-4 border-[var(--surface)]">
                  W
                </div>
                <h3 className="text-xl font-bold mb-2 text-center md:text-left">Weekly</h3>
                <div className="text-[var(--studylab-accent)] font-semibold text-sm uppercase tracking-wide mb-3 text-center md:text-left">StudyLab</div>
                <p className="text-[var(--muted)] text-sm mb-4">
                  Students chat with an AI tutor that acts like a Socratic guide. It helps them articulate concepts *before* they are tested.
                </p>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li>• Low stakes</li>
                  <li>• Builds confidence</li>
                  <li>• Identifies gaps</li>
                </ul>
              </div>

              {/* Card 3: Core */}
              <div className="relative z-10 bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[var(--core-accent)] text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto md:mx-0 relative border-4 border-[var(--surface)]">
                  U
                </div>
                <h3 className="text-xl font-bold mb-2 text-center md:text-left">Unit</h3>
                <div className="text-[var(--core-accent)] font-semibold text-sm uppercase tracking-wide mb-3 text-center md:text-left">Core</div>
                <p className="text-[var(--muted)] text-sm mb-4">
                  Secure, graded oral assessments. Replaces or supplements the unit test. Automated grading with integrity checks.
                </p>
                <ul className="text-sm space-y-2 text-[var(--text)]">
                  <li>• Summative grades</li>
                  <li>• Anti-cheat secured</li>
                  <li>• Standardized rubric</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Education Level Segmentation */}
        <section className="bg-[var(--background)] py-20 border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏫</div>
                <h3 className="text-lg font-bold">Grades 6–12</h3>
                <p className="text-[var(--muted)] text-sm mt-2">
                  Build verbal fluency and critical thinking across ELA, History, Science, and World Languages.
                </p>
              </div>
              <div className="text-center p-6 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-lg font-bold">Higher Ed</h3>
                <p className="text-[var(--muted)] text-sm mt-2">
                  Scale oral exams for large lecture sections. Verify student identity and original thinking in the AI era.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">💻</div>
                <h3 className="text-lg font-bold">Virtual Learning</h3>
                <p className="text-[var(--muted)] text-sm mt-2">
                  Bring human connection back to online classes. Ensure the student behind the screen is doing the thinking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - WHITE BACKGROUND (NEW) */}
        <section className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="text-5xl font-bold text-[var(--primary-strong)] md:text-6xl">30 Days</div>
                <p className="mt-3 text-base text-[#64748B]">free trial</p>
                <p className="mt-2 text-sm text-[#475569]">for individual teachers</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[var(--primary-strong)] md:text-6xl">60 Sec</div>
                <p className="mt-3 text-base text-[#64748B]">to check understanding</p>
                <p className="mt-2 text-sm text-[#475569]">voice-based exit tickets</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-[var(--primary-strong)] md:text-6xl">100%</div>
                <p className="mt-3 text-base text-[#64748B]">student participation</p>
                <p className="mt-2 text-sm text-[#475569]">no more flying under the radar</p>
              </div>
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
              From assessment creation to student responses to teacher review—here&apos;s how SayVeritas works in real classrooms.
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
                        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white font-bold text-[#0b0f14] shadow-lg"
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

        {/* Mid-Page CTA - TEAL ACCENT (NEW) */}
        <section className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--primary-strong)] to-[#0e7490]">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h3 className="text-3xl font-bold text-white md:text-4xl">Ready to reclaim your time?</h3>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white">
              Join our beta program and get priority onboarding, direct input on features, and founder pricing locked for 3 years.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="mailto:hello@sayveritas.com?subject=SayVeritas%20Demo%20Request"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-base font-medium text-[var(--primary-strong)] shadow-lg hover:bg-white/90"
              >
                Request Demo
              </a>
              <a
                href="#waitlist"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-white bg-transparent px-8 text-base font-medium text-white hover:bg-white/10"
              >
                Join waitlist
              </a>
              <Link
                href="/webinars"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-white bg-transparent px-8 text-base font-medium text-white hover:bg-white/10"
              >
                Attend webinar
              </Link>
            </div>
          </div>
        </section>

        {/* Features - LIGHT BACKGROUND */}
        <section id="features" className="border-b border-[var(--border)] bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
              Complete Assessment Infrastructure
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Feature 1: StudyLab */}
              <div className="group rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md border-l-4 border-l-[var(--studylab-accent)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[var(--studylab-accent)]" />
                  <p className="text-base font-semibold text-[#0F172A]">AI Socratic Tutor</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  Give every student a personal tutor that pushes their thinking further. Low-stakes practice that builds high-stakes confidence.
                </p>
              </div>

              {/* Feature 2: Pulse */}
              <div className="group rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md border-l-4 border-l-[var(--pulse-accent)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[var(--pulse-accent)]" />
                  <p className="text-base font-semibold text-[#0F172A]">Formative Voice Check-in</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  Replace exit tickets with 60-second voice summaries. Get a heatmap of class understanding before you leave simple misconceptions behind.
                </p>
              </div>

              {/* Feature 3: Core */}
              <div className="group rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md border-l-4 border-l-[var(--core-accent)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[var(--core-accent)]" />
                  <p className="text-base font-semibold text-[#0F172A]">Secure Oral Assessment</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
                  Administer oral exams at scale. Randomized questions, integrity checks, and standardized rubrics ensure fair and rigorous grading.
                </p>
              </div>
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

        {/* Testimonials - LIGHT BACKGROUND (NEW) */}
        <section className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0F172A] mb-12">
              Loved by teachers who want to teach, not grade
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Testimonial 1 */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white p-6 shadow-sm">
                <p className="text-lg leading-relaxed text-[#0F172A] italic">
                  &quot;Finally, I have time to actually <span className="font-semibold text-[var(--primary-strong)]">teach</span> instead of grade papers. SayVeritas gave me my weekends back.&quot;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold">SM</div>
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">Sarah M.</p>
                    <p className="text-xs text-[#64748B]">AP Biology Teacher</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white p-6 shadow-sm">
                <p className="text-lg leading-relaxed text-[#0F172A] italic">
                  &quot;Grading essays used to take all weekend. Now I listen to 30 minutes of Pulse highlights and know exactly what to reteach on Monday.&quot;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">JL</div>
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">James L.</p>
                    <p className="text-xs text-[#64748B]">History Dept Chair</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-white p-6 shadow-sm">
                <p className="text-lg leading-relaxed text-[#0F172A] italic">
                  &quot;My students are actually speaking the language now. They can&apos;t hide behind Google Translate when they have to respond with their voice.&quot;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold">MG</div>
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">Maria G.</p>
                    <p className="text-xs text-[#64748B]">Spanish Teacher</p>
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
                  description: "Admin dashboards with UK compliance reporting (Integrity & Engagement).",
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

            {/* AI Transparency Block */}
            <div className="mt-16 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-900/20 to-transparent p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-xl">🤖</span>
                <h3 className="text-xl font-semibold">AI that supports judgement, not replaces it</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">Human-in-the-loop: teachers retain final authority</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">Reviewable evidence: every AI claim links to source</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">No advertising: student data is never commercialised</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">Limitation transparency: we disclose what AI cannot do</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">Teacher override: adjust any AI score with documented reason</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">No emotion inference: we focus on content, not tone</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">UK Data Residency: GDPR-compliant processing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  <span className="text-sm text-[var(--muted)]">Anti-Anthropomorphization: AI as a utility, not a person</span>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/ai-safety"
                  className="rounded-full border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-teal-500/20"
                >
                  AI Safety & Governance →
                </Link>
                <Link
                  href="/ai-use"
                  className="rounded-full border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-teal-500/20"
                >
                  How AI is Used →
                </Link>
                <Link
                  href="/evidence-outcomes"
                  className="rounded-full border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-teal-500/20"
                >
                  Evidence & Outcomes →
                </Link>
                <Link
                  href="/privacy"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
                >
                  Privacy Policy →
                </Link>
                <Link
                  href="/dpia"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)]"
                >
                  DPIA →
                </Link>
              </div>
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
                  className={`relative flex h-full flex-col rounded-3xl border p-8 shadow-[0_30px_80px_-60px_rgba(20,184,166,0.35)] ${tier.isPopular
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
                    data-analytics-event={`pricing_${tier.ctaLabel.toLowerCase().replace(/\s+/g, '_')}_click`}
                    className={`mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition ${tier.buttonClass}`}
                  >
                    {tier.ctaLabel}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-[var(--muted)]">
              Want the full breakdown?{" "}
              <Link className="font-semibold text-[var(--primary)] hover:underline" href="/pricing">
                See detailed pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA - DARK BACKGROUND */}
        <section id="waitlist" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h3 className="text-3xl font-bold tracking-tight md:text-5xl">Transform your classroom with voice.</h3>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
              Join 1,000+ teachers who have stopped grading papers and started listening to their students.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/waitlist"
                className="rounded-full bg-[var(--primary-strong)] px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-[color-mix(in_oklab,var(--primary-strong),black_12%)] transition"
              >
                Start 30-Day Free Trial
              </Link>
              <Link
                href="/waitlist"
                className="rounded-full border-2 border-[var(--border)] bg-[var(--surface)] px-8 py-4 text-lg font-medium text-[var(--text)] hover:bg-[color-mix(in_oklab,var(--surface),white_4%)] transition"
              >
                Book a Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-[var(--muted)]">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </section>

        {/* Webinars Section */}
        <section id="webinars" className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 md:max-w-2xl">
              <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Weekly Live Sessions
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
                See SayVeritas in action.
              </h2>
              <p className="mt-4 text-lg text-[var(--muted)]">
                Join our product team for a live walkthrough. We&apos;ll show you how to set up your first class,
                run a Pulse check-in, and use StudyLab for deeper practice.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <WebinarRegistrationForm />
              <div className="space-y-8">
                <WebinarCalendar />

                <div className="rounded-xl border border-[var(--border)] bg-indigo-50/50 p-6">
                  <h3 className="font-semibold text-indigo-900">What we cover:</h3>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                      <span className="text-sm text-indigo-900/80">How to replace exit tickets with 60-second voice check-ins</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">2</span>
                      <span className="text-sm text-indigo-900/80">Using StudyLab to give every student a personal Socratic tutor</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">3</span>
                      <span className="text-sm text-indigo-900/80">Live Q&A with our founder</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div >
  );
}
