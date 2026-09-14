/**
 * ExploreLink.tsx (UI primitive) — the "one screen per section" affordance.
 * An attractive pill that routes the visitor to a section's DETAIL page
 * when the home surface holds more content than fits on one screen –
 * PlanetZ-style: an accent pill with a count chip and an arrow that
 * nudges forward on hover. Everything after "…" lives on the target page.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ExploreLinkProps {
  /** Detail-page route (internal "/…"). */
  href: string;
  /** Short CTA copy, e.g. "Explore all projects". */
  label: string;
  /** Items held back on the surface — rendered as a "+N" mono chip. */
  count?: number;
  /** Keeps the label on one line without spilling on small screens. */
  className?: string;
}

export default function ExploreLink({
  href,
  label,
  count,
  className,
}: ExploreLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-full border border-accent/35 bg-card py-2.5 pl-5 pr-2.5 text-sm font-medium text-accent shadow-card transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className ?? ""}`}
    >
      <span>{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="font-mono text-xs text-ink-faint" aria-hidden="true">
          +{count}
        </span>
      )}
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white explore-arrow-pulse transition-transform duration-200 group-hover:translate-x-1">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}