import Image from "next/image";
import Link from "next/link";

const timeline = [
  {
    period: "1999-2006",
    title: "The Foundation",
    body:
      "Started teaching at the turn of the century when educational technology meant computer labs and overhead projectors. Quickly moved to EdTech leadership, becoming one of eight Regional Technology Integration Mentors for Maine Learning Technologies Initiative—working alongside Dr. Ruben Puentedura as he developed the SAMR framework. This taught me the critical lesson: technology only transforms learning when it redesigns pedagogy, not just digitizes existing practices.",
  },
  {
    period: "2006-2019",
    title: "Scaling Impact",
    body:
      "Director of Academics at Carrabassett Valley Academy (7 years)—built assessment systems for student-athletes competing internationally while maintaining academic rigor. Director of Digital Learning, Salem Public Schools—managed strategy and budget for district-wide device deployment. Worked alongside Apple Professional Development Experts, learned change management at scale. The first quarter of the 21st century was about putting devices in students' hands. I helped lead that transformation.",
  },
  {
    period: "2021-2025",
    title: "The Disruption",
    body:
      "Moved to international schools, then remote EdTech leadership roles. Watched generative AI emerge and immediately recognized the inflection point: students could generate sophisticated essays in seconds, but teachers had no reliable way to assess actual understanding. The assessment tools we'd built for the first quarter—essays, multiple choice, LMS platforms—were designed for a world without AI. They were breaking in real time.",
  },
  {
    period: "2025",
    title: "Building for a New Era",
    body:
      "Started prototyping oral assessment systems. Realized the technology existed, but nobody was building it with pedagogical scaffolding. Most tools were \"record your answer, AI grades it\"—which fails spectacularly because it skips the teaching part. The second quarter of the 21st century needs more than new tools; it needs new infrastructure built around how learning actually works when AI is everywhere.",
  },
  {
    period: "Now",
    title: "Why SayVeritas",
    body:
      "SayVeritas combines 25 years of EdTech implementation experience with modern AI—but with a critical difference: it's built around progressive skill development, teacher control, and students demonstrating thinking that can't be faked. Not another EdTech tool. Infrastructure for how assessment should work in the AI era. The first quarter was about access to information. The second quarter is about demonstrating understanding when information is free. That's the problem I'm solving.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <main className="relative">
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--primary),var(--surface)_92%)]">
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(20,184,166,0.18),transparent)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_25px_70px_-45px_rgba(15,118,110,0.45)]">
              <div className="rounded-[22px] bg-[color-mix(in_oklab,var(--primary),var(--surface)_88%)] p-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-[color-mix(in_oklab,var(--primary),var(--surface)_65%)]">
                  <Image
                    src="https://www.chamberlininnovations.fr/images/IMG_2542.jpeg"
                    alt="Portrait of Eric Chamberlin"
                    fill
                    sizes="(min-width: 768px) 420px, 100vw"
                    className="object-cover object-[50%_25%]"
                    priority
                  />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[var(--text)]">Eric Chamberlin</p>
                <p className="text-sm text-[var(--muted)]">Founder, Chamberlin Innovations</p>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">My Journey</h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
                I started teaching in 1999, right as &quot;21st century skills&quot; became education's rallying cry. A quarter
                century later, entering the second quarter of the 21st century, it's clear: the tools we built for that
                era don't work anymore. AI has fundamentally changed what students can fake and what teachers can
                verify. SayVeritas is my attempt to build assessment infrastructure for the reality we face today—grounded
                in pedagogy, not just AI hype.
              </p>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,184,166,0.06),transparent_55%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-16">
            <div className="relative">
              <div className="absolute left-6 top-0 h-full w-1 rounded-full bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary),white_35%),color-mix(in_oklab,var(--primary),white_75%))] md:left-1/2 md:-ml-0.5" />
              <div className="space-y-14">
                {timeline.map((item, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <div
                      key={`${item.period}-${item.title}`}
                      className={`relative flex ${isLeft ? "md:justify-start" : "md:justify-end"} pl-16 md:pl-0`}
                    >
                      <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--primary)] bg-[var(--surface)] text-center text-[11px] font-semibold uppercase leading-tight text-[var(--primary)] shadow-[0_12px_30px_-18px_rgba(15,118,110,0.6)]">
                          {item.period}
                        </div>
                      </div>
                      <div className={`w-full md:w-[46%] ${isLeft ? "md:pr-16" : "md:pl-16"}`}>
                        <div
                          className={`rounded-[32px] border border-[var(--border)] bg-[var(--surface)] px-8 py-6 shadow-[0_30px_80px_-55px_rgba(15,118,110,0.45)] ${
                            isLeft ? "text-left" : "text-left md:text-right"
                          }`}
                        >
                          <h3 className="text-xl font-semibold">{item.title}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <div className="rounded-[28px] border border-[var(--border)] bg-[color-mix(in_oklab,var(--primary),var(--surface)_92%)] p-8 shadow-[0_20px_60px_-45px_rgba(15,118,110,0.35)]">
              <h2 className="text-2xl font-semibold">Also Building: PhonemeLab</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                PhonemeLab applies the same pedagogical principles to pronunciation practice for ESL and world language
                learners. Teachers assign structured oral practice, students build confidence through repetition, AI
                provides feedback signals—but teachers remain in control.
              </p>
              <a
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:opacity-80"
                href="mailto:hello@edusynapse.org?subject=PhonemeLab%20Info"
              >
                Learn more about PhonemeLab →
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[var(--text)]">SayVeritas</p>
            <p className="mt-1">© 2025 EduSynapse Group. All rights reserved.</p>
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
            <a className="hover:text-[var(--text)]" href="mailto:hello@edusynapse.org">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
