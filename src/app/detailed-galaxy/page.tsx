/**
 * detailed-galaxy/page.tsx — Galaxy v4 explorer page (v4 §6.2)
 * The full show: sun + planets + moons + index + sticky cards.
 * SSG + ISR (60s) — admin edits go live via revalidatePath.
 * WebGL (T2) enhancement arrives in Phase 3 on top of this layer.
 */
import type { Metadata } from "next";
import GalaxySystem from "@/components/galaxy/GalaxySystem";
import { moonTypeColor } from "@/components/galaxy/MoonCard";
import Eyebrow from "@/components/ui/Eyebrow";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getGalaxy } from "@/lib/content";
import { dateMs, parseDate } from "@/lib/date";
import type { GalaxyData, GalaxyMoon } from "@/types/galaxy";

/** Phase 15 (#10): "mission log" — the newest moons (by last edit),
 *  compact timeline under the system. Server-computed from updatedAt.
 *  Renders nothing when no moon carries a timestamp (zero-data rule). */
function timeAgo(iso: string | null | undefined): string {
  const t = parseDate(iso);
  if (!t) return ""; // garbage timestamps: never throw, never render junk
  const s = Math.max(0, Math.floor((Date.now() - t.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function recentMoons(galaxy: GalaxyData): { moon: GalaxyMoon; planetName: string }[] {
  const out: { moon: GalaxyMoon; planetName: string }[] = [];
  for (const p of galaxy.planets) {
    for (const m of p.moons) {
      // BUGFIX: truthy-but-garbage lastUpdated used to pass this filter
      // and crash timeAgo → the whole galaxy page 500'd.
      if (parseDate(m.lastUpdated)) out.push({ moon: m, planetName: p.name });
    }
  }
  return out
    .sort((a, b) => dateMs(b.moon.lastUpdated) - dateMs(a.moon.lastUpdated))
    .slice(0, 6);
}

// Phase 9 perf: 1h ISR safety net — admin mutations revalidatePath
// the galaxy instantly, so the TTL only guards against missed
// invalidations (a fresh render every visit used to cost seconds).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Learning Galaxy — Explore the journey",
  description:
    "My learning universe — planets are skills, moons are the projects, labs and notes I've shipped. Explore the full system.",
};

export default async function DetailedGalaxyPage() {
  const galaxy = await getGalaxy();
  const log = recentMoons(galaxy);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Breadcrumbs — hierarchy navigation for deep pages */}
      <Breadcrumbs
        items={[
          { label: "Portfolio", href: "/" },
          { label: "Learning Galaxy" },
        ]}
      />
      <Eyebrow label="learning-galaxy" cursor />
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Learning Galaxy
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Every planet is a skill I&apos;m exploring. Every moon is a project, lab or note that
        proves it. Hover a planet to explore — the cards stay open so you can actually click
        through to the repos. Or use the index to jump straight to a skill.
      </p>

      {/* P25: at-a-glance scale — data-driven counts */}
      <p className="mt-4 font-mono text-xs text-ink-faint">
        {galaxy.planets.length} planet{galaxy.planets.length === 1 ? "" : "s"} ·{" "}
        {galaxy.planets.reduce((n, p) => n + p.moons.length, 0)} moon
        {galaxy.planets.reduce((n, p) => n + p.moons.length, 0) === 1 ? "" : "s"} — deep-link to a
        planet with #planet-&lt;slug&gt; in the URL
      </p>

      {/* Colorful mini-stats readout — topic-hued chips. Zero-data: the
          moons chip hides when there are none (plan §5). */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-topic-mars/40 bg-topic-mars/10 px-3.5 py-1.5 font-mono text-xs font-medium text-topic-mars-deep">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-topic-mars" />
          {galaxy.planets.length} planet{galaxy.planets.length === 1 ? "" : "s"}
        </span>
        {(() => {
          const moons = galaxy.planets.reduce((n, p) => n + p.moons.length, 0);
          return moons > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-topic-ice/40 bg-topic-ice/10 px-3.5 py-1.5 font-mono text-xs font-medium text-topic-ice-deep">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-topic-ice" />
              {moons} moon{moons === 1 ? "" : "s"}
            </span>
          ) : null;
        })()}
        <span className="inline-flex items-center gap-2 rounded-full border border-topic-ai/40 bg-topic-ai/10 px-3.5 py-1.5 font-mono text-xs font-medium text-topic-ai-deep">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-topic-ai" />
          {galaxy.settings.moonTypes.length} moon type
          {galaxy.settings.moonTypes.length === 1 ? "" : "s"}
        </span>
      </div>

      {galaxy.planets.length > 0 ? (
        <div className="mt-10">
          <GalaxySystem galaxy={galaxy} />
        </div>
      ) : (
        <p className="mt-10 rounded-card border border-card-border bg-card p-6 text-sm text-ink-soft">
          The galaxy is still forming — check back soon.
        </p>
      )}

      {/* Phase 15 (#10): mission log — the newest artifacts across all
          planets, newest first. Only when timestamps exist (§5). */}
      {log.length > 0 && (
        <section
          aria-labelledby="mission-log-heading"
          className="mt-12 rounded-card border border-card-border bg-card p-6 shadow-card"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="mission-log-heading" className="font-display text-lg font-semibold text-ink">
              Mission log
            </h2>
            <span className="font-mono text-[10px] text-ink-faint">recently shipped</span>
          </div>
          <ol className="mt-4 space-y-0">
            {log.map(({ moon, planetName }, i) => (
              <li
                key={moon.slug}
                className={`flex items-center gap-3 py-2.5 ${
                  i > 0 ? "border-t border-card-border" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: moonTypeColor(moon.type) }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {moon.icon && (
                    <span aria-hidden="true" className="mr-1">
                      {moon.icon}{" "}
                    </span>
                  )}
                  {moon.name}
                </span>
                <span className="hidden shrink-0 font-mono text-[10px] text-ink-faint sm:inline">
                  {planetName} · {moon.type}
                </span>
                <time
                  dateTime={moon.lastUpdated}
                  className="shrink-0 font-mono text-[10px] text-ink-faint"
                >
                  {timeAgo(moon.lastUpdated)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
