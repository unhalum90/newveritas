import Link from "next/link";
import { ContactModal } from "@/components/home/contact-modal";

const resourceLinks = [
  { label: "Attend Webinar", href: "/webinars" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Assessment Types", href: "/assessment-types" },
  { label: "Class Analysis Report (evidence-linked)", href: "/class-analysis-report" },
  { label: "Use Cases (cross-subject)", href: "/use-cases" },
  { label: "Security & Privacy / DPA", href: "/security-privacy" },
  { label: "Roadmap", href: "/roadmap" },
] as const;

const accessLinks = [
  { label: "Teacher sign in", href: "/login" },
  { label: "Student login", href: "/student/login" },
  { label: "Privacy", href: "/privacy" },
] as const;

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--background),black_10%)]">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[var(--muted)]">
        <div className="grid gap-8 md:grid-cols-[1.1fr_2fr]">
          <div>
            <p className="text-base font-semibold text-[var(--text)]">SayVeritas</p>
            <p className="mt-1 text-sm">@chamberlininnovations</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Resources</p>
              <div className="mt-3 flex flex-col gap-2">
                {resourceLinks.map((link) => (
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
      </div>
    </footer>
  );
}
