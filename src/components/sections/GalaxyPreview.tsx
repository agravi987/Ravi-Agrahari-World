/**
 * GalaxyPreview.tsx (SERVER) — home surface of Galaxy v4 (§6.1) + P25
 * Minimal by design: sun + first N planets, a short description and one
 * CTA. The visual stage is GalaxyPreviewStage (client): it swaps in the
 * REAL 3D system (shared lazy WebGL chunk) when the viewer can support
 * it, and otherwise falls back to GalaxyStage2D — the zero-JS, pure-CSS
 * orbit stage, so the home page stays LCP-cheap either way. No moons,
 * no cards on the preview. Clicking a planet (or the CTA) goes to
 * /detailed-galaxy.
 *
 * P25: the CTA arrow slides on hover, a "click to explore" hint fades in
 * over the stage on hover (pure CSS), the top-3 planet names appear as
 * topic-hued chips ("AWS · Docker · Kubernetes — and N more"), and a soft
 * radial glow sits behind the stage.
 *
 * Rendered only when the galaxy has visible planets (zero-data
 * policy — empty galaxy hides the section).
 */
import type { GalaxyData } from "@/types/galaxy";
import Eyebrow from "@/components/ui/Eyebrow";
import GalaxyPreviewStage from "@/components/sections/GalaxyPreviewStage";

/** P25: planet-chip hues (cycled by position). TEXT uses the deep-*
 *  tokens — the soft topic-* hues fail AA contrast for 12px text
 *  (caught by the Lighthouse a11y audit); borders/fills stay soft. */
const PLANET_HUES = [
  "border-topic-cloud/30 bg-topic-cloud/10 text-topic-cloud-deep",
  "border-topic-devops/30 bg-topic-devops/10 text-topic-devops-deep",
  "border-topic-ai/30 bg-topic-ai/10 text-topic-ai-deep",
  "border-topic-linux/30 bg-topic-linux/10 text-topic-linux-deep",
];

export default function GalaxyPreview({ galaxy }: { galaxy: GalaxyData }) {
  const { profile, planets } = galaxy;
  if (!planets.length) return null; // zero-data: hide the section

  const shown = planets.slice(0, Math.max(1, galaxy.settings.homePreviewPlanets || 6));
  const previewGalaxy: GalaxyData = { ...galaxy, planets: shown };
  const moonCount = planets.reduce((n, p) => n + p.moons.length, 0);
  const topChips = planets.slice(0, 3);
  const moreCount = planets.length - topChips.length;

  return (
    <section
      id="galaxy"
      aria-labelledby="galaxy-title"
      className="py-10 sm:py-12"
    >
      <div className="mx-auto max-w-5xl px-6">
        <Eyebrow label="learning-galaxy" />
        <h2
          id="galaxy-title"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          Learning Galaxy
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          My learning universe — every planet is a skill I&apos;m exploring, and every moon
          is a project, lab or note I&apos;ve actually shipped. A small taste here; the full
          system lives on the galaxy page.
        </p>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* The system */}
          <GalaxyPreviewStage galaxy={previewGalaxy} />

          {/* Description + CTA */}
          <div className="text-center lg:text-left">
            <h3 className="font-display text-xl font-semibold text-ink">
              {profile.name}&apos;s solar system
            </h3>
            <p className="mt-3 text-ink-soft">
              {shown.length} planet{shown.length === 1 ? "" : "s"} on screen, {moonCount} moon
              {moonCount === 1 ? "" : "s"} in total — skills and the artifacts that prove
              them, arranged as a living map of what I&apos;m learning.
            </p>

            {/* P25 chips + P26 deep-links — each chip jumps straight to
                its planet on the explorer page (#planet-<slug>) */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 lg:justify-start">
              {topChips.map((p, i) => (
                <a
                  key={p.slug}
                  href={`/detailed-galaxy#planet-${p.slug}`}
                  title={`Open ${p.name} in the galaxy`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${PLANET_HUES[i % PLANET_HUES.length]}`}
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {p.name}
                </a>
              ))}
              {moreCount > 0 && (
                /* P25: ink-soft, not ink-faint — the audit flagged 12px
                   ink-faint on the card bg (fails AA in both themes) */
                <span className="inline-flex items-center rounded-full border border-card-border bg-card px-3 py-1 font-mono text-xs text-ink-soft">
                  +{moreCount} more
                </span>
              )}
            </div>

            <a
              href="/detailed-galaxy"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-accent-btn px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-btn-hover active:translate-y-px"
            >
              Explore my galaxy
              {/* P25: arrow slides on hover */}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
