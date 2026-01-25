import Link from "next/link";
import { ContactModal } from "@/components/home/contact-modal";

const learningLinks = [
  { label: "Attend Webinar", href: "/webinars" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Assessment Types", href: "/assessment-types" },
  { label: "Class Analysis Report", href: "/class-analysis-report" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Roadmap", href: "/roadmap" },
] as const;

const complianceLinks = [
  { label: "AI Safety & Governance", href: "/ai-safety" },
  { label: "How AI is Used", href: "/ai-use" },
  { label: "Evidence & Outcomes", href: "/evidence-outcomes" },
  { label: "Subprocessors", href: "/subprocessors" },
  { label: "Security & Privacy / DPA", href: "/security-privacy" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

const accessLinks = [
  { label: "Teacher Sign In", href: "/login" },
  { label: "Student Login", href: "/student/login" },
] as const;

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[var(--muted)]">
        <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
          <div>
            <p className="text-base font-semibold text-[var(--text)]">SayVeritas</p>
            <p className="mt-1 text-sm">@chamberlininnovations</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Learn</p>
              <div className="mt-3 flex flex-col gap-2">
                {learningLinks.map((link) => (
                  <Link key={link.href} className="hover:text-[var(--text)]" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Trust & Compliance</p>
              <div className="mt-3 flex flex-col gap-2">
                {complianceLinks.map((link) => (
                  <Link key={link.href} className="hover:text-[var(--text)]" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Access</p>
              <div className="mt-3 flex flex-col gap-2">
                {accessLinks.map((link) => (
                  <Link key={link.href} className="hover:text-[var(--text)]" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Company</p>
              <div className="mt-3 flex flex-col gap-2">
                {companyLinks.map((link) => (
                  <Link key={link.href} className="hover:text-[var(--text)]" href={link.href}>
                    {link.label}
                  </Link>
                ))}
                <ContactModal className="hover:text-[var(--text)]" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--muted)]">
          © 2026 SayVeritas / Chamberlin Innovations SASU. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

