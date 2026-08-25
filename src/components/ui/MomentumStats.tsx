/**
 * MomentumStats.tsx (client) — P7 color/interactivity pass + P25.
 * A thin stat band under the hero: real content counts (projects,
 * posts, certs, skills, galaxy planets) that count up when scrolled
 * into view. ZERO-DATA POLICY (§5): a stat only renders when > 0 —
 * the whole band hides if nothing has content. Reduced-motion users
 * get the final value instantly (no count-up).
 *
 * P25: each stat carries a topic-hued icon; the animated numeral is
 * aria-hidden with an sr-only FINAL value (screen readers hear the
 * number once, not every count-up frame); cells with a destination
 * reveal a "→" hint on hover.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Award, BookOpen, FolderGit2, Orbit, Sparkles, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Stat {
  label: string;
  value: number;
  /** Topic hue for the value (color pass P7). */
  color: "cloud" | "devops" | "ai" | "linux" | "mars";
  /** P22: where the stat leads — each counter is navigation, not just
   *  decoration (e.g. "projects" → #projects, "notes" → /blog). */
  href?: string;
  /** P25: per-stat icon (maps to a known label from page.tsx). */
  icon?: LucideIcon;
}

// Theme-aware stat-numeral hues (--color-stat-* tokens in globals.css,
// P8): dark enough for AA on white paper, brightened in dark mode so
// the numerals never become dark-on-dark. The soft topic-* tokens are
// for fills/borders, not 30px numerals.
const COLOR_TEXT: Record<Stat["color"], string> = {
  cloud: "text-stat-cloud",
  devops: "text-stat-devops",
  ai: "text-stat-ai",
  linux: "text-stat-linux",
  mars: "text-stat-mars",
};

/** P25: stat icons + their accent text hues (lucide = UI icons). */
const ICON_BY_LABEL: Record<string, LucideIcon> = {
  projects: FolderGit2,
  notes: BookOpen,
  certifications: Award,
  "skill areas": Sparkles,
  "learning tracks": Orbit,
};

/** Animates a number from 0 → value with an ease-out ramp (rAF).
 *  Reduced-motion users render the final value directly (no animation,
 *  no setState-in-effect — the value is derived at render time).
 *  P25: the animated numeral is aria-hidden; an sr-only span carries
 *  the final value so AT announces a stable number. */
function CountUp({ value, active, delay = 0 }: { value: number; active: boolean; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reduceMotion) return;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const duration = 900;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // ease-out cubic — starts fast, settles gently
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * value));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    // P26: stagger — each cell starts its ramp `delay` ms later, so
    // the band settles left→right instead of all at once.
    if (delay > 0) timer = setTimeout(run, delay);
    else run();
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [active, value, reduceMotion, delay]);

  const shown = reduceMotion ? value : display;
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}

export default function MomentumStats({ stats }: { stats: Stat[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Reduced-motion users start active (final values shown instantly —
  // CountUp derives the value, so no setState-in-effect needed).
  const [active, setActive] = useState(reduceMotion);

  // One-shot IntersectionObserver: start counting when the band enters
  // the viewport (and only then — keeps the page idle until scrolled).
  // reduceMotion is a stable useSyncExternalStore snapshot — read once
  // at mount, so it isn't a valid (or needed) dependency.
  useEffect(() => {
    if (reduceMotion) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ZERO-DATA POLICY: only positive counts render; nothing if all are 0.
  const visible = stats.filter((s) => s.value > 0);
  if (visible.length === 0) return null;

  return (
    <div
      ref={wrapRef}
      aria-label="Portfolio stats"
      className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-card border border-card-border bg-card-border px-6 py-6 sm:grid-cols-5"
    >
      {visible.map((s, i) => {
        const Icon = s.icon ?? ICON_BY_LABEL[s.label] ?? null;
        const inner = (
          <>
            <p className={`flex items-end justify-center gap-1.5 font-display text-3xl font-semibold tracking-tight ${COLOR_TEXT[s.color]}`}>
              {Icon && (
                <Icon
                  className="mb-1 h-5 w-5 opacity-80"
                  aria-hidden="true"
                  style={{ color: "currentColor" }}
                />
              )}
              <CountUp value={s.value} active={active} delay={i * 120} />
            </p>
            <p className="mt-1 text-xs font-medium text-ink-soft">{s.label}</p>
          </>
        );
        // P22: with a destination the cell is a link — hover lifts the
        // whole stat, giving the band a second job as navigation.
        if (s.href) {
          const external = /^https?:\/\//.test(s.href);
          const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
          return (
            <a
              key={s.label}
              href={s.href}
              {...linkProps}
              title={`Jump to ${s.label}`}
              className="group bg-card px-4 py-2 text-center transition-colors hover:bg-paper-deep/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              {inner}
              {/* P25: hover reveals a "→" hint on navigable cells */}
              <span
                aria-hidden="true"
                className="mt-1 block text-xs text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                →
              </span>
            </a>
          );
        }
        return (
          <div key={s.label} className="bg-card px-4 py-2 text-center">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
