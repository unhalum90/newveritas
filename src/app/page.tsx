import Link from "next/link";

export default function Home() {
  const featureItems: Array<{ title: string; body: string }> = [
    { title: "Socratic follow-ups", body: "Adaptive probing based on what students actually say (per assessment)." },
    { title: "Question rotation", body: "Create multiple prompts that assess the same target skill to reduce sharing." },
    { title: "Integrity settings", body: "Time limits and integrity options that don’t interrupt the student experience." },
    { title: "Teacher-validated scoring", body: "AI assists, teachers maintain professional judgment." },
    { title: "Works on any device", body: "Students record on phones, tablets, or laptops." },
    { title: "Admin-ready", body: "School admin onboarding and bulk account workflows (where enabled)." },
  ];

  const featureAccents = ["#14b8a6", "#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#fb7185"] as const;

  return (
    <div className="veritas-wizard min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            SayVeritas
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <a href="#how" className="hover:text-[var(--text)]">
              How it works
            </a>
            <a href="#features" className="hover:text-[var(--text)]">
              Features
            </a>
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
            <Link
              href="/signup"
              className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm text-white hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                  Oral assessment • AI-assisted scoring • Teacher-verified
                </p>
                <div className="mb-5 flex flex-wrap gap-2">
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
                <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  Stop grading. Start teaching.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-[var(--muted)] md:text-lg">
                  AI-powered oral assessment that scores student understanding in minutes—so you can focus on the students who
                  need you most.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#how"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--primary)] px-5 text-base text-white hover:opacity-90"
                  >
                    See how it works
                  </a>
                  <a
                    href="mailto:hello@edusynapse.org?subject=SayVeritas%20Early%20Access"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 text-base hover:opacity-90"
                  >
                    Request early access
                  </a>
                </div>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  Students: use{" "}
                  <Link className="underline hover:opacity-90" href="/student/login">
                    student login
                  </Link>
                  .
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_10%)] p-4">
                    <p className="text-xs font-medium text-[var(--muted)]">Before</p>
                    <p className="mt-2 text-sm text-[var(--text)]">Stack of grading. Late nights. Slow interventions.</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">“I’ll grade this weekend…”</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_4%)] p-4">
                    <p className="text-xs font-medium text-[var(--muted)]">After</p>
                    <p className="mt-2 text-sm text-[var(--text)]">Scores + flags in minutes. Focused follow-up.</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">“Here’s who needs help today.”</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
                  <p className="text-sm font-medium">What you get</p>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                    <li>• Teacher-authored questions, AI-assisted scoring.</li>
                    <li>• Integrity-aware, sequential student flow (no preview / no redo).</li>
                    <li>• Results that highlight who needs intervention.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  The grading treadmill is killing good teaching
                </h2>
                <span className="text-sm text-[var(--muted)] group-open:hidden">Expand</span>
                <span className="hidden text-sm text-[var(--muted)] group-open:inline">Collapse</span>
              </summary>
              <div className="border-t border-[var(--border)] px-6 py-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                    <p className="text-sm font-semibold">The time trap</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Teachers spend hours grading. By the time scores are back, the moment for intervention has passed.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                    <p className="text-sm font-semibold">The scale problem</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Oral assessments reveal deep understanding—but 5 minutes per student doesn’t scale.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                    <p className="text-sm font-semibold">The integrity crisis</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Answers spread quickly. Traditional assessment formats struggle to keep up.
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-[var(--muted)]">
                  What if you could assess authentic understanding—at scale—without losing control?
                </p>
              </div>
            </details>
          </div>
        </section>

        {/* Solution */}
        <section id="how" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Assessment that thinks like a professor, scales like technology
                </h2>
                <span className="text-sm text-[var(--muted)] group-open:hidden">Expand</span>
                <span className="hidden text-sm text-[var(--muted)] group-open:inline">Collapse</span>
              </summary>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                  <p className="text-sm font-semibold">1) Create an assessment</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Start from scratch, upload material (PDF), or generate a draft with AI—then refine it in the builder.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                  <p className="text-sm font-semibold">2) Students record responses</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Students answer by voice (any device). Questions are revealed sequentially to reduce answer-sharing.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                  <p className="text-sm font-semibold">3) AI scores & flags</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Transcription + rubric-based scoring (Reasoning & Evidence) produce fast, reviewable results.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                  <p className="text-sm font-semibold">4) Intervene where it matters</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Spend your time on the 10–15% who need targeted support—not on routine grading.
                  </p>
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Built for real classrooms</h2>
                <span className="text-sm text-[var(--muted)] group-open:hidden">Expand</span>
                <span className="hidden text-sm text-[var(--muted)] group-open:inline">Collapse</span>
              </summary>
              <div className="border-t border-[var(--border)] px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {featureItems.map((item, idx) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5"
                      style={{ borderLeftColor: featureAccents[idx % featureAccents.length], borderLeftWidth: 6 }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: featureAccents[idx % featureAccents.length] }}
                        />
                        <p className="text-sm font-semibold">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* Use cases */}
        <section id="use-cases" className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Perfect for…</h2>
                <span className="text-sm text-[var(--muted)] group-open:hidden">Expand</span>
                <span className="hidden text-sm text-[var(--muted)] group-open:inline">Collapse</span>
              </summary>
              <div className="border-t border-[var(--border)] px-6 py-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                    <p className="text-sm font-semibold">Performance academies</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Traveling students can demonstrate understanding on their schedule—with rigor intact.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                    <p className="text-sm font-semibold">Higher education</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Bring oral assessment to large classes without adding grading overhead.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5">
                    <p className="text-sm font-semibold">IB / AP programs</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      High-stakes courses that demand authentic evidence of understanding.
                    </p>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* Trust */}
        <section id="security" className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_6%)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Your data. Your students. Your control.</h2>
                <span className="text-sm text-[var(--muted)] group-open:hidden">Expand</span>
                <span className="hidden text-sm text-[var(--muted)] group-open:inline">Collapse</span>
              </summary>
              <div className="border-t border-[var(--border)] px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["FERPA-aware by design", "Protect student work with access controls and teacher visibility."],
                    ["Teacher review required", "AI provides recommendations; teachers make final decisions."],
                    ["Transparent integrity", "Flags inform review—students aren’t “punished by algorithm.”"],
                    ["School-level control", "Admin tools and bulk onboarding (where enabled)."],
                  ].map(([title, body]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface),black_6%)] p-5"
                    >
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
              <h3 className="text-xl font-semibold tracking-tight">Join the beta program</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Early access partners get priority onboarding and direct input on features.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--primary)] px-5 text-white hover:opacity-90"
                >
                  Create teacher account
                </Link>
                <a
                  href="mailto:hello@edusynapse.org?subject=SayVeritas%20Demo%20Request"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 hover:opacity-90"
                >
                  Request a demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <p>© SayVeritas</p>
          <div className="flex gap-4">
            <Link className="hover:text-[var(--text)]" href="/login">
              Teacher sign in
            </Link>
            <Link className="hover:text-[var(--text)]" href="/student/login">
              Student login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
