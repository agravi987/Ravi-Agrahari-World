/**
 * TechMarquee.tsx (server) — P9 colorful interactivity + P25 polish.
 * An infinite-scrolling ticker of the technologies/skills behind the
 * portfolio — pulled from the CONTENT LAYER (skills + galaxy planet
 * names), never hardcoded. CSS-only animation (transform, compositor-
 * friendly); pauses on hover; reduced-motion users get a static row
 * (the global reduced-motion rule kills the animation anyway).
 * Zero-data policy: hides entirely if there's nothing to show.
 *
 * P25: a pinned "stack" label sits at the left edge (chips scroll
 * under it), each chip carries a topic-hued leading dot, and the
 * DUPLICATE (2nd) copy is aria-hidden — screen readers announce
 * each technology once, not twice.
 */
import type { GalaxyData } from "@/types/galaxy";
import type { Skill } from "@/types";

/* P27: chip text uses the DEEP-* tokens — the soft topic-* hues fail
   AA contrast for 12px text (same bug the Lighthouse audit caught on
   the galaxy chips); borders/fills stay soft. */
const CHIP_HUES = [
  "border-topic-cloud/30 bg-topic-cloud/10 text-topic-cloud-deep",
  "border-topic-devops/30 bg-topic-devops/10 text-topic-devops-deep",
  "border-topic-ai/30 bg-topic-ai/10 text-topic-ai-deep",
  "border-topic-linux/30 bg-topic-linux/10 text-topic-linux-deep",
  "border-topic-mars/30 bg-topic-mars/10 text-topic-mars-deep",
  "border-topic-ice/30 bg-topic-ice/10 text-topic-ice-deep",
];

export default function TechMarquee({
  skills,
  galaxy,
}: {
  skills: Skill[];
  galaxy: GalaxyData;
}) {
  const planetNames = galaxy.planets.map((p) => p.name);
  const items = [...skills.map((s) => s.name), ...planetNames];
  if (items.length < 4) return null; // not enough to tick — zero-data hide

  // Duplicate the list so the loop is seamless (2× = one full cycle).
  const doubled = [...items, ...items];

  return (
    <section
      aria-label="Technologies I work with"
      className="relative overflow-hidden border-y border-card-border bg-card/50 py-4"
    >
      {/* Fade masks at both edges — soft, no hard cut */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent sm:w-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent sm:w-28"
      />

      {/* P25: pinned "stack" label — chips scroll UNDER it (z-20 sits
          above the fade mask; the label is glass so it reads as a
          control, not content) */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-full border border-l-0 border-accent/25 bg-card/90 py-1.5 pl-4 pr-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent shadow-card backdrop-blur-sm"
      >
        stack
      </span>

      <div className="marquee-track flex w-max items-center gap-3 pr-3 pl-16 sm:pl-24">
        {doubled.map((name, i) => (
          <a
            key={`${name}-${i}`}
            href="/detailed-galaxy"
            // P25 a11y: the second (duplicate) copy is skipped by AT —
            // it exists only to make the loop seamless.
            aria-hidden={i >= items.length ? "true" : undefined}
            tabIndex={i >= items.length ? -1 : undefined}
            title="Explore this topic in the learning galaxy"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${CHIP_HUES[i % CHIP_HUES.length]}`}
          >
            {/* Colored dot for all chips — consistent visual language */}
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
            />
            {name}
          </a>
        ))}
      </div>
    </section>
  );
}
