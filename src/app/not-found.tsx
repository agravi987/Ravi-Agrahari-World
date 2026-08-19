/**
 * not-found.tsx — ui-ux-design.md P1 (plan §4.2 optional) + P17
 * Custom 404: "Lost in space". On-theme with a tiny CSS-only orbit
 * (sun + one drifting planet, no JS), and quick links so the
 * visitor is one click from everywhere important — not just home.
 */
import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { getContent } from "@/lib/content";

const QUICK_LINKS = [
  { href: "/", label: "Mission Control", hue: "text-topic-cloud hover:border-topic-cloud/40" },
  { href: "/detailed-galaxy", label: "Learning Galaxy", hue: "text-topic-ai hover:border-topic-ai/40" },
  { href: "/blog", label: "Notes archive", hue: "text-topic-linux hover:border-topic-linux/40" },
  // P23 fix: #contact doesn't exist on the 404 — resolve to the home
  // section (Next scrolls to it after navigating to "/").
  { href: "/#contact", label: "Contact", hue: "text-topic-mars hover:border-topic-mars/40" },
];

export default async function NotFound() {
  // P26: data-driven escape hatch — the real email, never hardcoded
  const { config } = await getContent();

  return (
    <div className="relative flex min-h-[75dvh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      {/* P17: tiny lost-satellite orbit — pure CSS, aria-hidden, zero JS */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[22%] -z-10 -translate-x-1/2">
        <div className="relative h-56 w-56">
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-accent/15">
            <span className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-accent-cyan shadow-[0_0_14px] shadow-accent-cyan" />
          </div>
          <div className="absolute inset-10 animate-spin-slower rounded-full border border-topic-mars/15">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-topic-mars/70 shadow-[0_0_10px] shadow-topic-mars/50" />
          </div>
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_18px] shadow-accent" />
        </div>
      </div>

      <p className="font-mono text-xs text-accent">~/404</p>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
        Lost in space
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        That signal doesn&apos;t reach Mission Control — the route you tried isn&apos;t on
        the map. No worries, the coordinates are easy to re-enter.
      </p>

      <div className="mt-8">
        <Button href="/">Reroute to Mission Control</Button>
      </div>

      {/* P25: power users don't need the reroute button */}
      <p className="mt-6 hidden font-mono text-xs text-ink-faint md:block">
        or press <kbd className="rounded border border-card-border bg-card px-1.5 py-0.5">⌘K</kbd> to jump
        anywhere
      </p>

      {/* P26: a human on the other end — the email comes from the CMS */}
      <p className="mt-3 text-sm text-ink-soft">
        …or reach me directly at{" "}
        <a
          href={`mailto:${config.email}`}
          className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:text-accent-strong"
        >
          {config.email}
        </a>
      </p>

      {/* Quick links — one click to everywhere that matters (P17) */}
      <nav aria-label="Quick links" className="mt-10 flex flex-wrap justify-center gap-3">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={`inline-flex items-center gap-1 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink-soft shadow-card transition-colors hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${link.hue}`}
          >
            {link.label}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ))}
      </nav>
    </div>
  );
}
