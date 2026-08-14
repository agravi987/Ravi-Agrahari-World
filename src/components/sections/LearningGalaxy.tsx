/**
 * LearningGalaxy.tsx (client) — plan S5 + ui-ux-design.md orbit rework
 * Solar-system viz with the planets actually ORBITING the sun:
 * each planet rides its own rotating ring (CSS spin on a transform-
 * only overlay, no layout thrash) and counter-rotates so its icon +
 * label stay upright. Orbits PAUSE while the cursor is over the
 * system or any planet has keyboard focus (moving targets are hard
 * to click), and reduced-motion users get the static table fallback.
 *
 * Also: sun breathing glow, spotlight dim (hover/focus a planet to
 * dim the rest), repo-count bubbles, a moon-type legend, and the
 * mission log beside the system on desktop.
 * Zero-data: planets with 0 items are hidden (plan §5).
 */
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import type { LearningItemType, LearningTrack } from "@/types";

/* --- Planet color tokens → CSS variables (plan §4.1 per-topic hues) --- */
const COLOR_VARS: Record<string, string> = {
  "topic-cloud": "var(--color-topic-cloud)",
  "topic-devops": "var(--color-topic-devops)",
  "topic-ai": "var(--color-topic-ai)",
  "topic-linux": "var(--color-topic-linux)",
  "topic-mars": "var(--color-topic-mars)",
  "topic-ice": "var(--color-topic-ice)",
};

/* --- Moon type tints (plan §3.1) --- */
const MOON_COLORS: Record<LearningItemType, string> = {
  notes: "var(--color-moon-notes)", // 🗒️ blue
  "hands-on": "var(--color-moon-hands)", // 🛠️ green
  project: "var(--color-moon-project)", // 🚀 purple
};

const MOON_LABELS: Record<LearningItemType, string> = {
  notes: "Notes",
  "hands-on": "Hands-on",
  project: "Project",
};

const FILTERS: ("all" | LearningItemType)[] = ["all", "notes", "hands-on", "project"];

/* --- Orbit tuning (named constants, plan §7.2: no magic numbers) --- */
const PLANET_MIN_SIZE = 52;
const PLANET_MAX_SIZE = 88;
/** Innermost orbit inset (%), each further planet steps outward. */
const ORBIT_BASE_INSET = 6;
const ORBIT_STEP = 6;
/** Inner planets orbit faster (loose Kepler feel) — seconds per rev. */
const ORBIT_BASE_DURATION = 26;
const ORBIT_DURATION_STEP = 9;

/** Clamp planet size by repo count: more repos → bigger planet (plan §3.1). */
function planetSize(itemCount: number): number {
  return Math.min(PLANET_MAX_SIZE, Math.max(PLANET_MIN_SIZE, 40 + itemCount * 10));
}

/** Orbit inset % for the i-th planet — every planet gets its own path. */
function orbitInset(i: number): number {
  return ORBIT_BASE_INSET + i * ORBIT_STEP;
}

/** Seconds for one full revolution of the i-th planet. */
function orbitDuration(i: number): number {
  return ORBIT_BASE_DURATION + i * ORBIT_DURATION_STEP;
}

/** Level → ring style: growing gets a Saturn ring (plan §4.2). */
const LEVEL_RING: Record<LearningTrack["level"], string> = {
  beginner: "none",
  learning: "dashed",
  growing: "saturn",
};

interface LearningGalaxyProps {
  tracks: LearningTrack[];
  weeklyNotes: string[];
}

export default function LearningGalaxy({ tracks, weeklyNotes }: LearningGalaxyProps) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<LearningTrack | null>(null);
  const [activePlanet, setActivePlanet] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | LearningItemType>("all");
  /** True while the cursor is over the system or a planet is focused
   *  → orbits pause so planets are easy to click (ui-ux-design.md). */
  const [paused, setPaused] = useState(false);

  // Dialog hygiene (ui-ux-design.md P0): move focus into the mission
  // brief when it opens, return it to the planet on close, Escape closes.
  const panelRef = useRef<HTMLDivElement>(null);
  const planetRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const lastPlanetRef = useRef<HTMLButtonElement | null>(null);

  function openMission(track: LearningTrack) {
    lastPlanetRef.current = planetRefs.current.get(track.name) ?? null;
    setSelected(track);
  }

  function closeMission() {
    setSelected(null);
    // Restore focus after the panel unmounts (a11y: keyboard users
    // never lose their place in the galaxy).
    requestAnimationFrame(() => lastPlanetRef.current?.focus());
  }

  useEffect(() => {
    if (!selected) return;
    // Focus the brief itself (tabIndex={-1}) so SR users hear it.
    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMission();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  // Hide planets with zero items (plan §5.1).
  const visibleTracks = useMemo(
    () => tracks.filter((t) => t.items.length > 0).sort((a, b) => a.order - b.order),
    [tracks]
  );

  /** Filter which moons are drawn (chips only affect viz, panel shows all). */
  const visibleItems = (track: LearningTrack) =>
    filter === "all" ? track.items : track.items.filter((i) => i.type === filter);

  /** Mission log ("what I learned this week", plan §4.2 core). */
  const MissionLog = weeklyNotes.length > 0 ? (
    <div>
      <h3 className="font-mono text-xs font-medium uppercase tracking-widest text-ink-faint">
        mission log · this week
      </h3>
      <ul className="mt-3 space-y-2">
        {weeklyNotes.map((note, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" />
            {note}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  /** The table fallback — used for reduced-motion (plan §3.1). */
  const TableFallback = (
    <div className="mt-10 space-y-6">
      {visibleTracks.map((track) => (
        <div key={track.name} className="rounded-card border border-card-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{track.icon}</span>
            <h3 className="font-display text-lg font-semibold text-ink">{track.name}</h3>
            <Badge variant="accent">{track.level}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{track.description}</p>
          <ul className="mt-3 space-y-2">
            {track.items.map((item) => (
              <li key={item.githubUrl} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="neutral">{MOON_LABELS[item.type]}</Badge>
                <a
                  href={item.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {MissionLog}
    </div>
  );

  return (
    <Section
      id="galaxy"
      eyebrow="learning-galaxy"
      title="Learning Galaxy"
      description="Every planet is a topic I'm learning. Every moon is a real repo — notes, hands-on practice, or a small project."
    >
      {reduceMotion || visibleTracks.length === 0 ? (
        TableFallback
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-10">
          <div>
            {/* Filter chips (plan §3.1) */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter moons by type">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-accent text-white"
                      : "bg-card text-ink-soft hover:text-accent"
                  }`}
                >
                  {f === "all" ? "All" : MOON_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Moon-type legend — one glance, no guesswork */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
              {(["notes", "hands-on", "project"] as const).map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    aria-hidden="true"
                    style={{ backgroundColor: MOON_COLORS[t] }}
                  />
                  {MOON_LABELS[t]}
                </span>
              ))}
            </div>

            {/* Solar system */}
            <div
              className="relative mx-auto mt-10 aspect-square w-full max-w-[560px]"
              role="group"
              aria-label="Learning topics solar system"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={() => setPaused(false)}
            >
              {/* Orbit guide rings — one per planet, matching its path */}
              {visibleTracks.map((track, i) => (
                <div
                  key={`ring-${track.name}`}
                  aria-hidden="true"
                  className="absolute rounded-full border border-accent/10"
                  style={{ inset: `${orbitInset(i)}%` }}
                />
              ))}

              {/* The sun — you / the learning journey (plan §3.1) */}
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-cyan font-display text-2xl font-bold text-white shadow-orbital">
                  ✦
                  {/* Breathing glow — the one sanctioned gradient, used here */}
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 -z-10 rounded-full bg-accent-cyan/20 blur-xl animate-sun-pulse"
                  />
                </div>
                <p className="mt-2 text-center text-xs font-medium text-ink-faint">you</p>
              </div>

              {/* Planets — each rides its own rotating orbit */}
              {visibleTracks.map((track, i) => {
                const size = planetSize(track.items.length);
                const duration = orbitDuration(i);
                // Negative animation-delay staggers the starting angle so
                // planets aren't lined up at the top on first paint — they
                // load already spread around their orbits (orbit rework).
                const phase =
                  visibleTracks.length > 1
                    ? -((i * duration) / visibleTracks.length)
                    : 0;
                // Orbits pause while hovering/focusing the system so
                // planets aren't moving targets (ui-ux-design.md).
                const playState = paused ? "paused" : "running";
                const color = COLOR_VARS[track.color] ?? "var(--color-accent)";
                const isActive = activePlanet === track.name;
                const ring = LEVEL_RING[track.level];
                const items = visibleItems(track);
                const glow = track.items[0]?.updatedAt
                  ? // Fresher updatedAt → stronger glow (plan D3)
                    `0 0 ${isActive ? 28 : 16}px ${isActive ? 10 : 6}px ${color}`
                  : "none";

                return (
                  <div
                    key={track.name}
                    className="absolute"
                    style={{
                      inset: `${orbitInset(i)}%`,
                      // Transform-only animation (GPU-composited, no layout).
                      animation: reduceMotion ? undefined : `spin ${duration}s linear infinite`,
                      animationDelay: `${phase}s`,
                      animationPlayState: playState,
                    }}
                  >
                    {/* Position shell: parks the planet on its ring's edge */}
                    <div
                      className="absolute left-1/2 top-0 -translate-x-1/2"
                      style={{ width: size, height: size }}
                    >
                      {/* Spotlight: hovering/focusing one planet dims the rest */}
                      <div
                        className={`flex flex-col items-center transition-opacity duration-300 ${
                          activePlanet && !isActive ? "opacity-40" : ""
                        }`}
                      >
                        {/* Counter-rotation keeps the planet upright as the
                            orbit spins (classic orbit trick: same duration,
                            reverse direction, origin = planet center). */}
                        <div
                          className="relative"
                          style={{
                            width: size,
                            height: size,
                            animation: reduceMotion
                              ? undefined
                              : `spin ${duration}s linear infinite reverse`,
                            animationDelay: `${phase}s`,
                            animationPlayState: playState,
                          }}
                        >
                          {/* Moons: repos orbit the planet, lit on hover/focus */}
                          {items.map((item, mi) => {
                            const ma = (mi / Math.max(items.length, 1)) * Math.PI * 2;
                            return (
                              <span
                                key={item.githubUrl}
                                aria-hidden="true"
                                title={`${MOON_LABELS[item.type]}: ${item.title}`}
                                className={`absolute h-2 w-2 rounded-full transition-opacity duration-200 ${
                                  isActive ? "opacity-100" : "opacity-30"
                                }`}
                                style={{
                                  left: `${50 + 42 * Math.cos(ma)}%`,
                                  top: `${50 + 42 * Math.sin(ma)}%`,
                                  backgroundColor: MOON_COLORS[item.type],
                                }}
                              />
                            );
                          })}

                          {/* Planet button (keyboard accessible, plan S5) */}
                          <button
                            type="button"
                            ref={(el) => {
                              planetRefs.current.set(track.name, el);
                            }}
                            onClick={() => openMission(track)}
                            onMouseEnter={() => setActivePlanet(track.name)}
                            onMouseLeave={() => setActivePlanet(null)}
                            onFocus={() => setActivePlanet(track.name)}
                            onBlur={() => setActivePlanet(null)}
                            aria-label={`${track.name}: ${track.items.length} repos, level ${track.level}. Click for details.`}
                            aria-expanded={selected?.name === track.name}
                            aria-controls="mission-brief"
                            className={`group relative flex items-center justify-center rounded-full text-white transition-transform duration-200 ${
                              isActive ? "scale-110" : "hover:scale-110"
                            }`}
                            style={{
                              width: size,
                              height: size,
                              backgroundColor: color,
                              boxShadow: glow,
                              // Saturn-style ring for "growing" level (plan §4.2)
                              ...(ring === "saturn" && {
                                outline: `3px solid ${color}44`,
                                outlineOffset: 7,
                              }),
                            }}
                          >
                            {/* Dashed orbit marker for "learning" level */}
                            {ring === "dashed" && (
                              <span
                                aria-hidden="true"
                                className="absolute -inset-2 rounded-full border border-dashed border-current opacity-50"
                              />
                            )}
                            <span className="text-xl leading-none" aria-hidden="true">
                              {track.icon}
                            </span>
                          </button>
                        </div>

                        {/* Repo-count bubble (ui-ux-design.md) */}
                        <span
                          aria-hidden="true"
                          className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border border-card-border bg-card px-1 text-[10px] font-semibold text-ink-soft shadow-card"
                        >
                          {track.items.length}
                        </span>

                        {/* Label — counter-rotates around its own center */}
                        <p
                          className="mt-2 text-center text-xs font-medium text-ink-soft"
                          style={{
                            animation: reduceMotion
                              ? undefined
                              : `spin ${duration}s linear infinite reverse`,
                            animationDelay: `${phase}s`,
                            animationPlayState: playState,
                          }}
                        >
                          {track.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mission brief panel (plan §4.2 core) */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  key={selected.name}
                  ref={panelRef}
                  id="mission-brief"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.25 }}
                  className="mx-auto mt-8 max-w-2xl rounded-card border border-accent/30 bg-card p-6 shadow-orbital focus:outline-none"
                  role="dialog"
                  aria-modal={false}
                  aria-label={`Mission brief: ${selected.name}`}
                  tabIndex={-1}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-2xl" aria-hidden="true">{selected.icon}</span>
                        <h3 className="font-display text-xl font-semibold text-ink">
                          {selected.name}
                        </h3>
                        <Badge variant="accent">{selected.level}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-ink-soft">{selected.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeMission}
                      aria-label="Close mission brief"
                      className="rounded-full p-1.5 text-ink-faint transition-colors hover:text-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {selected.items.map((item) => (
                      <li
                        key={item.githubUrl}
                        className="rounded-lg border border-card-border bg-paper p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="colored" className="!bg-paper-deep">
                            {MOON_LABELS[item.type]}
                          </Badge>
                          <a
                            href={item.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                          >
                            {item.title}
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </div>
                        <p className="mt-1 text-sm text-ink-soft">{item.description}</p>
                        {item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="neutral">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mission log — beside the system on desktop (ui-ux-design.md) */}
          {MissionLog && <aside className="mt-12 lg:mt-2">{MissionLog}</aside>}
        </div>
      )}
    </Section>
  );
}
