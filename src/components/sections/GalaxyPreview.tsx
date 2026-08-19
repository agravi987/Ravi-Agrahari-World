/**
 * GalaxyPreview.tsx (SERVER) — home surface of Galaxy v4 (§6.1) + P25
 * Minimal by design: sun + first N planets on a slow, locked CSS
 * orbit, faint orbit lines, a short description and one CTA. No
 * moons, no cards, no tooltips — and ZERO client JS (pure CSS
 * animation + hover states), so the home page stays LCP-cheap.
 * Clicking a planet (or the CTA) goes to /detailed-galaxy.
 *
 * P25: the CTA arrow slides on hover, a "click to explore" hint
 * fades in over the stage on hover (pure CSS), the stage carries an
 * aria-label, the top-3 planet names appear as topic-hued chips
 * ("AWS · Docker · Kubernetes — and N more"), and a soft radial
 * glow sits behind the stage.
 *
 * Rendered only when the galaxy has visible planets (zero-data
 * policy — empty galaxy hides the section).
 */
import type { GalaxyData } from "@/types/galaxy";
import { planetStyle, worldSize, worldStyle } from "@/lib/galaxyGeometry";
import GalaxyBackground from "@/components/galaxy/GalaxyBackground";
import GalaxyComets from "@/components/galaxy/GalaxyComets";
import OrbitLine from "@/components/galaxy/OrbitLine";
import Sun from "@/components/galaxy/Sun";
import Eyebrow from "@/components/ui/Eyebrow";

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
  const { profile, settings, planets } = galaxy;
  if (!planets.length) return null; // zero-data: hide the section

  const shown = planets.slice(0, Math.max(1, settings.homePreviewPlanets || 6));
  const staticLayout = !settings.animationEnabled;
  const world = worldSize(shown);
  const moonCount = planets.reduce((n, p) => n + p.moons.length, 0);
  const topChips = planets.slice(0, 3);
  const moreCount = planets.length - topChips.length;

  return (
    <section
      id="galaxy"
      aria-labelledby="galaxy-title"
      className="py-14"
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
          <div className="relative mx-auto w-full max-w-[420px]">
            {/* P25: soft radial glow behind the stage */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -z-10 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent)_10%,transparent),transparent_65%)] blur-2xl"
            />
            <div
              className="galaxy-stage group mx-auto w-full transition-shadow duration-300 hover:shadow-orbital"
              data-static={staticLayout || undefined}
              aria-label="Learning galaxy preview"
            >
              <GalaxyBackground
                showStars={settings.showStars}
                density={settings.starDensity}
                nebula={settings.nebulaVisible}
              />
              <div className="galaxy-world" style={worldStyle(world)}>
                <Sun profile={profile} size={72} />
                {/* Comets revolve the sun on fixed elliptical orbits —
                    decorative ambience (like the stars), scales with zoom. */}
                <GalaxyComets />

                <div className="galaxy-rotator" aria-hidden="true">
                  {shown.map((p) => (
                    <div key={p.slug} className="galaxy-orbit-ring" style={planetStyle(p, settings)}>
                      {settings.showOrbitLines && <OrbitLine />}
                      <div className="galaxy-planet-holder">
                        <div className="galaxy-planet-inner">
                          <div className="galaxy-planet-face">
                            {/* Decorative duplicate of the CTA below —
                                inert to keyboard/AT, mouse-clickable. */}
                            <a
                              href="/detailed-galaxy"
                              tabIndex={-1}
                              aria-hidden="true"
                              className="galaxy-planet"
                            >
                              <span aria-hidden="true">{p.icon}</span>
                            </a>
                            {p.moons.length > 0 && (
                              <span
                                aria-hidden="true"
                                className="galaxy-moon-count absolute -top-2 right-2 flex items-center gap-0.5 rounded-full border border-card-border bg-card/90 px-1.5 py-0.5 text-[9px] font-mono text-ink-faint shadow-card backdrop-blur-sm"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                {p.moons.length}
                              </span>
                            )}
                          </div>
                          <span className="galaxy-planet-chip" aria-hidden="true">
                            {p.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* P25: hover hint — pure CSS (server component, zero JS) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-card-border bg-card/90 px-3 py-1 text-[11px] text-ink-soft opacity-0 shadow-card backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                click to explore →
              </span>
            </div>
          </div>

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
