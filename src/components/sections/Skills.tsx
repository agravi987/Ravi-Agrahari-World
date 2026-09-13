/**
 * Skills.tsx (client) — plan S4 + P13 progressive disclosure
 * One FOCUS card at a time instead of a flat wall of cards: a chip
 * row (one per domain) switches which domain is expanded — blurb +
 * honest 1–5 level bar. Click/hover to flip between them; the grid
 * stays quiet and the hierarchy reads: section → domain → detail.
 * Renders nothing if the skills array is empty (plan §5.2).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Cloud, Pause, Play, Workflow } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import CosmicDecor from "@/components/ui/CosmicDecor";
import LevelBar from "@/components/ui/LevelBar";
import LevelRing from "@/components/ui/LevelRing";
import Section from "@/components/ui/Section";
import TiltCard from "@/components/ui/TiltCard";
import Tooltip from "@/components/ui/Tooltip";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSwipe } from "@/lib/useSwipe";
import type { Skill } from "@/types";

/** Maps seed icon keys → lucide icons (plan §4.1: lucide = UI icons). */
const ICON_MAP = {
  cloud: Cloud,
  workflow: Workflow,
  bot: Bot,
} as const;

/** Per-topic tile color (ui-ux-design.md P1): each domain gets its own
 *  muted hue from the design tokens instead of accent-soft everywhere —
 *  colorful but restrained (plan §4.1). */
const TILE_STYLES: Record<string, string> = {
  cloud: "bg-topic-cloud/10 text-topic-cloud",
  workflow: "bg-topic-devops/10 text-topic-devops",
  bot: "bg-topic-ai/10 text-topic-ai",
};

/** Bar fill + label colors match the tile hue (color pass P7). */
const BAR_STYLES: Record<string, string> = {
  cloud: "bg-topic-cloud text-topic-cloud",
  workflow: "bg-topic-devops text-topic-devops",
  bot: "bg-topic-ai text-topic-ai",
};

/** Active-chip underline hue per domain. */
const CHIP_ACTIVE: Record<string, string> = {
  cloud: "after:bg-topic-cloud",
  workflow: "after:bg-topic-devops",
  bot: "after:bg-topic-ai",
};

/** P27: focus-card left accent per domain (subtle color echo). */
const PANEL_ACCENT: Record<string, string> = {
  cloud: "border-l-topic-cloud/60",
  workflow: "border-l-topic-devops/60",
  bot: "border-l-topic-ai/60",
};

/** Phase 14 (#2): focus-card ring tint per domain (focus-within). */
const RING_ACTIVE: Record<string, string> = {
  cloud: "focus-within:ring-topic-cloud/20",
  workflow: "focus-within:ring-topic-devops/20",
  bot: "focus-within:ring-topic-ai/20",
};

/** Splits the combined class into the bar fill (bg) + label (text). */
const barFor = (icon: string) => {
  const combined = BAR_STYLES[icon] ?? "bg-accent text-accent";
  const [fill, text] = combined.split(" ");
  return { fill, text };
};

interface SkillsProps {
  skills: Skill[];
  /** Phase 14 (#11): skill name → galaxy planet slug (name-matched in
   *  page.tsx). Lets the "explore in galaxy" link land ON the planet. */
  galaxyPlanetSlugs?: Record<string, string>;
}

/** P25: honest level words beside the bar (plan §3 — never oversold). */
const LEVEL_WORDS = [
  "getting started",
  "beginner",
  "building",
  "comfortable",
  "confident",
];
const levelWord = (level: number) =>
  LEVEL_WORDS[Math.min(5, Math.max(1, level)) - 1] ?? "";

export default function Skills({ skills, galaxyPlanetSlugs }: SkillsProps) {
  const [active, setActive] = useState(0);

  /** P25: proper-tabs keyboard — ←/→ move the selection and refocus. */
  const moveTab = useCallback((i: number, dir: 1 | -1) => {
    const next = (i + dir + skills.length) % skills.length;
    setActive(next);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-skill-tab="${next}"]`)
        ?.focus();
    });
  }, [skills.length]);

  /** Phase 9 gestures: explicit prev/next (click + touch swipe) so the
      "one domain at a time" switcher is browsable by any input. */
  const prev = useCallback(
    () => setActive((i) => (i - 1 + skills.length) % skills.length),
    [skills.length]
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % skills.length),
    [skills.length]
  );
  const swipe = useSwipe(next, prev);

  /** Auto-advance through domains: one after another, ~5s each.
      Paused on hover/focus, manual select, or reduced-motion.
      FIX: auto-advance only changes state (no .focus()) — calling
      focus() on the tab button scrolls the page UP to the Skills
      section every 5 seconds, which is the "auto-scroll" bug. */
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduceMotion || skills.length <= 1 || paused) return;
    timerRef.current = setTimeout(() => {
      setActive((i) => (i + 1) % skills.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, paused, reduceMotion, skills.length]);

  if (skills.length === 0) return null; // auto-hide when empty (§5.2)

  // Phase 14 (#11): deep-link straight to the matching planet when the
  // skill name lines up with a galaxy planet (else the galaxy home).
  // NOTE: this reads skills[active] — it MUST sit after the empty guard
  // above, or skills[-1] is undefined and skill.name crashes the page.
  const skill = skills[Math.min(active, skills.length - 1)];

  return (
    <Section
      id="skills"
      index="01"
      eyebrow="skills"
      title="What I'm building toward"
      description="Honest levels — early but consistent. These bars move as I learn (plan §3)."
      band
      mesh
    >
      <CosmicDecor
        hue="ai"
        stars="sparse"
        planet="bottom-left"
        planetSrc="/images/planets/ai-agents.png"
      />

      {/* Chip switcher — click a domain to focus it (one at a time).
          P25: proper tabs — roving tabindex + ←/→ keys + aria-controls.
          P28: auto-advance pauses on hover/focus so users can read. */}
      <div
        role="tablist"
        aria-label="Skill domains"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="flex flex-wrap justify-center gap-2"
      >
        {skills.map((s, i) => {
          const selected = i === Math.min(active, skills.length - 1);
          const ChipIcon = ICON_MAP[s.icon as keyof typeof ICON_MAP] ?? Cloud;
          return (
            <button
              key={s.name}
              type="button"
              role="tab"
              id={`skill-tab-${i}`}
              aria-selected={selected}
              aria-controls="skill-panel"
              tabIndex={selected ? 0 : -1}
              data-skill-tab={i}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  moveTab(i, -1);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  moveTab(i, 1);
                } else if (e.key === "Home") {
                  // P26: Home/End jump to the first/last domain
                  e.preventDefault();
                  setActive(0);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>('[data-skill-tab="0"]')
                      ?.focus(),
                  );
                } else if (e.key === "End") {
                  e.preventDefault();
                  setActive(skills.length - 1);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>(
                        `[data-skill-tab="${skills.length - 1}"]`,
                      )
                      ?.focus(),
                  );
                } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  // Phase 14 (#5): vertical arrows are aliases — the
                  // tablist is horizontal, so ↑/↓ move just like ←/→.
                  e.preventDefault();
                  moveTab(i, e.key === "ArrowUp" ? -1 : 1);
                }
              }}
              className={`relative inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:rounded-full after:transition-opacity after:duration-300 ${
                selected
                  ? `border-transparent bg-card text-ink shadow-card after:opacity-100 ${CHIP_ACTIVE[s.icon] ?? "after:bg-accent"}`
                  : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
              }`}
            >
              <ChipIcon
                className={`h-3.5 w-3.5 ${selected ? ((TILE_STYLES[s.icon] ?? "text-accent").split(" ")[1] ?? "text-accent") : "text-ink-faint"}`}
                aria-hidden="true"
              />
              {s.name}
            </button>
          );
        })}
      </div>

      {/* P26: honest scale — how many domains are tracked */}
      <p className="mt-3 text-center font-mono text-xs text-ink-faint">
        {skills.length} skill {skills.length === 1 ? "domain" : "domains"}
      </p>

      {/* Focus card — all panels rendered simultaneously (absolute overlay)
          so switching skills never changes container height (no scroll jump).
          The active panel is relative (sets container height); others are
          absolute inset-0 and crossfade via opacity. */}
      <div
        className="skill-swap mx-auto mt-6 max-w-2xl"
        role="tabpanel"
        id="skill-panel"
        aria-labelledby={`skill-tab-${Math.min(active, skills.length - 1)}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        // Phase 9 gestures: swipe left/right cycles domains on touch
        {...swipe}
      >
        {skills.map((s, i) => {
          const isActive = i === Math.min(active, skills.length - 1);
          const SkillIcon = ICON_MAP[s.icon as keyof typeof ICON_MAP] ?? Cloud;
          const skillTile = TILE_STYLES[s.icon] ?? "bg-accent-soft text-accent";
          const planetSlug = galaxyPlanetSlugs?.[s.name.toLowerCase()];
          const skillGalaxyHref = planetSlug ? `/detailed-galaxy#planet-${planetSlug}` : "/detailed-galaxy";
          return (
            <div
              key={s.name}
              className={isActive
                ? "relative"
                : "absolute inset-0 opacity-0 pointer-events-none"
              }
            >
              <TiltCard max={5} className="rounded-card">
                <Card
                  hover
                  className={`group border-l-4 p-6 outline-none transition-shadow sm:p-8 focus-within:ring-4 ${
                    RING_ACTIVE[s.icon] ?? "focus-within:ring-accent/15"
                  } ${PANEL_ACCENT[s.icon] ?? "border-l-accent/40"}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 ${skillTile}`}
                    >
                      <SkillIcon
                        className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-xl font-semibold text-ink">
                          {s.name}
                        </h3>
                        <Tooltip label="1 = getting started · 5 = confident" side="left">
                          <LevelRing
                            level={s.level}
                            className={`shrink-0 ${barFor(s.icon).text}`}
                          />
                        </Tooltip>
                      </div>
                      {s.blurb && (
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                          {s.blurb}
                        </p>
                      )}
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-ink-faint">
                          <span aria-hidden="true">level</span>
                          <span className={`flex items-center gap-2 font-medium ${barFor(s.icon).text}`}>
                            {s.level < 3 && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                still learning
                              </span>
                            )}
                            {levelWord(s.level)} · {s.level}/5
                          </span>
                        </div>
                        <LevelBar
                          level={s.level}
                          fillClass={barFor(s.icon).fill}
                        />
                      </div>
                      <Link
                        href={skillGalaxyHref}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:underline"
                      >
                        explore in galaxy
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </Card>
              </TiltCard>
            </div>
          );
        })}

        {/* Phase 9: prev/next controls + position — click, swipe or
            arrow-keys all browse the same switcher. */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous skill domain"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span aria-live="polite" className="font-mono text-[10px] text-ink-faint">
            {Math.min(active, skills.length - 1) + 1} of {skills.length}
            <span className="sr-only">
              {" "}— {skill.name}, level {skill.level} of 5 ({levelWord(skill.level)})
            </span>
          </span>
          <button
            type="button"
            onClick={next}
            aria-label="Next skill domain"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Resume auto-advance" : "Pause auto-advance"}
            title={paused ? "Resume auto-advance" : "Pause auto-advance"}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              paused
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-card-border bg-card text-ink-faint shadow-card hover:border-accent/40 hover:text-accent"
            }`}
          >
            {paused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-ink-faint md:hidden">
          ‹ swipe to browse ›
        </p>
      </div>

      {/* P27: level spread — a tiny bar chart (pure CSS, data-driven):
          how many domains sit at each of the 1–5 levels. */}
      <LevelSpread skills={skills} />

      {/* Phase 14 (#15): faint skill-name texture at the foot of the
          band — decorative (aria-hidden), desktop only, print-hidden. */}
      <div
        aria-hidden="true"
        className="skills-deco-chips mt-10 hidden select-none flex-wrap justify-center gap-x-4 gap-y-1 opacity-[0.07] sm:flex"
      >
        {skills.map((s) => (
          <span key={s.name} className="font-display text-sm font-semibold">
            {s.name}
          </span>
        ))}
      </div>

      {/* Phase 14 (#17): print-only compact list — the one-at-a-time
          focus card can't survive paper; this two-column list can. */}
      <div className="skills-print-list hidden print:block">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider">
          Skill domains
        </p>
        <ul>
          {skills.map((s) => (
            <li key={s.name}>
              {s.name} <span>— {levelWord(s.level)} ({s.level}/5)</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function LevelSpread({ skills }: { skills: Skill[] }) {
  const dist = [1, 2, 3, 4, 5].map(
    (lv) => skills.filter((s) => s.level === lv).length,
  );
  const max = Math.max(1, ...dist);
  const summary = dist
    .map((c, i) => `${c} at level ${i + 1}`)
    .filter((_, i) => dist[i] > 0)
    .join(", ");
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className="flex items-end gap-2" aria-hidden="true">
        {dist.map((c, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            {/* P25: hover reveals the count; bars stagger in on view */}
            <div className="group relative flex h-12 w-full cursor-default items-end overflow-hidden rounded-md bg-paper-deep">
              <div
                title={`${c} skill${c === 1 ? "" : "s"} at level ${i + 1}`}
                className="w-full rounded-md bg-gradient-to-t from-accent to-accent-cyan/80 transition-[height] duration-500"
                style={{
                  height: `${(c / max) * 100}%`,
                  transitionDelay: `${i * 70}ms`,
                }}
              />
              {c > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-card-border bg-accent px-1 py-px font-mono text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {c}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-ink-faint">
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <p className="sr-only">Domains by level: {summary || "none yet"}.</p>
      <p className="mt-1 text-center font-mono text-[10px] text-ink-faint">
        level spread · 1 getting started → 5 confident
      </p>
    </div>
  );
}
