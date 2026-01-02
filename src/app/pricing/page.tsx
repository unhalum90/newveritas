import Link from "next/link";
import { ContactModal } from "@/components/home/contact-modal";

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

export default function PricingPage() {
  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <Link href="/" className="hover:text-[var(--text)]">
              Home
            </Link>
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
            <Link href="/pricing" className="hover:text-[var(--text)]">
              Pricing
            </Link>
            <a href="#faq" className="hover:text-[var(--text)]">
              FAQ
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
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Pricing</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Simple pricing for oral assessment at scale
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
                Bundle assessment credits for pilots and classroom runs, or unlock a school license when you are ready to
                standardize oral assessment across teams.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-6 md:grid-cols-3">
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
            <p className="mt-6 text-center text-xs text-[var(--muted)]">
              *Unlimited credits are subject to fair use policies designed to protect instructional quality.
            </p>
          </div>
        </section>

        <section id="faq" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "What counts as a credit?",
                  body:
                    "A credit represents one scored student response, including transcription, scoring, and evidence snippets.",
                },
                {
                  title: "Do teachers approve every score?",
                  body:
                    "Yes. SayVeritas delivers AI recommendations, but teachers remain the final decision makers.",
                },
                {
                  title: "Can students use any device?",
                  body: "Yes. Students can record from phones, tablets, or laptops without installing extra software.",
                },
                {
                  title: "Need a district rollout?",
                  body:
                    "School licenses include onboarding support, admin analytics, and optional rostering integrations.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="waitlist" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div className="rounded-2xl border-2 border-[var(--primary)] bg-[var(--surface)] p-10 text-center">
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to pilot SayVeritas?</h3>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
                Join the waitlist for early access, founder pricing, and direct input on new assessment features.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="mailto:hello@sayveritas.com?subject=SayVeritas%20Demo%20Request"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--primary)] px-8 text-base font-medium text-white hover:opacity-90"
                >
                  Request Demo
                </a>
                <a
                  href="mailto:hello@sayveritas.com?subject=SayVeritas%20Pricing%20Question"
                  className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[var(--border)] bg-transparent px-8 text-base hover:bg-[var(--surface)]"
                >
                  Talk to Sales
                </a>
              </div>
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
