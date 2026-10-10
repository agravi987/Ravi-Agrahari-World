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
    <div className="relative min-h-screen bg-[#07080f] text-slate-100 overflow-x-hidden">
      {/* Ambient Cosmic Observatory Starlight Background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.15),transparent_40%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Observatory HUD Strip */}
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Breadcrumbs
              items={[
                { label: "Portfolio", href: "/" },
                { label: "Cosmic Observatory" },
              ]}
            />
            <div className="mt-2">
              <Eyebrow label="deep-space-telemetry" cursor />
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Learning Galaxy Observatory
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Interactive Solar System: planets represent core skill domains, moons represent live
              repos, labs, and projects. Click or hover any celestial body to inspect telemetry.
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 font-mono text-xs font-medium text-indigo-300">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              {galaxy.planets.length} Planetary Systems
            </span>
            {(() => {
              const moons = galaxy.planets.reduce((n, p) => n + p.moons.length, 0);
              return moons > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 font-mono text-xs font-medium text-cyan-300">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-400" />
                  {moons} Orbiting Moons
                </span>
              ) : null;
            })()}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs font-medium text-emerald-300">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
              Locked Zero-Overlap
            </span>
          </div>
        </header>

        {/* The Solar System Canvas Component */}
        {galaxy.planets.length > 0 ? (
          <div className="relative rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-xl sm:p-8">
            <GalaxySystem galaxy={galaxy} />
          </div>
        ) : (
          <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            The galaxy is currently forming — please check back soon.
          </p>
        )}

        {/* Mission Log (Recently Shipped Learning Moons) */}
        {log.length > 0 && (
          <section
            aria-labelledby="mission-log-heading"
            className="mt-12 rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
              <h2 id="mission-log-heading" className="font-display text-lg font-semibold text-white">
                Mission Log · Recent Artifacts
              </h2>
              <span className="font-mono text-xs text-slate-500">continuous telemetry</span>
            </div>
            <ol className="mt-4 divide-y divide-white/5">
              {log.map(({ moon, planetName }) => (
                <li
                  key={moon.slug}
                  className="flex items-center gap-3 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: moonTypeColor(moon.type) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                    {moon.icon && (
                      <span aria-hidden="true" className="mr-1.5">
                        {moon.icon}
                      </span>
                    )}
                    {moon.name}
                  </span>
                  <span className="hidden shrink-0 font-mono text-xs text-slate-400 sm:inline">
                    {planetName} · {moon.type}
                  </span>
                  <time
                    dateTime={moon.lastUpdated}
                    className="shrink-0 font-mono text-xs text-slate-500"
                  >
                    {timeAgo(moon.lastUpdated)}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
