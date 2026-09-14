/**
 * MomentumStats.tsx (client) — P7 color/interactivity pass + P25.
 * A PROOF-CHIP row (relocated into the Skills section, was a full-width
 * band under the hero): each stat is a compact pill — topic-hued icon,
 * count-up numeral, label, and (when it has a destination) an arrow that
 * appears on hover. The pills wrap and center naturally on any width, so
 * no more fixed 5-col box with a ragged last cell on mobile.
 * ZERO-DATA POLICY (§5): a pill only renders when > 0 — the whole row
 * hides if nothing has content. Reduced-motion users get the final
 * value instantly (no count-up).
 *
 * P25: the animated numeral is aria-hidden with an sr-only FINAL value
 * (screen readers hear the number once, not every count-up frame);
 * pills with a destination reveal a "→" hint on hover.
 *
 * GSAP pass: the count-up is now a gsap.to tween on a proxy object
 * (same 0.9s ramp, same ease-out cubic feel, same left→right stagger
 * via per-chip delay) instead of a hand-rolled rAF loop — one code
 * path, GSAP's ticker, and the reduced-motion contract is unchanged
 * (final value rendered directly, no chunk fetched). Fail-safe the
 * old loop lacked: if GSAP fails to load, the number snaps to the
 * real value instead of sticking at 0.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Award, ArrowRight, BookOpen, FolderGit2, Orbit, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";

export interface Stat {
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
// for fills/borders, not 18px numerals.
const COLOR_TEXT: Record<Stat["color"], string> = {
  cloud: "text-stat-cloud",
  devops: "text-stat-devops",
  ai: "text-stat-ai",
  linux: "text-stat-linux",
  mars: "text-stat-mars",
};

/** The CSS variable for a stat's hue — used to tint its icon. */
const COLOR_VAR: Record<Stat["color"], string> = {
  cloud: "var(--color-stat-cloud)",
  devops: "var(--color-stat-devops)",
  ai: "var(--color-stat-ai)",
  linux: "var(--color-stat-linux)",
  mars: "var(--color-stat-mars)",
};

/** P25: stat icons (lucide = UI icons). */
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
    let cancelled = false;
    let kill: (() => void) | null = null;
    // Proxy target — GSAP tweens the number, onUpdate mirrors it into
    // React state. aria/sr-only structure around it is unchanged.
    const counter = { val: 0 };

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled) return;
        const tween = gsap.to(counter, {
          val: value,
          duration: 0.9,
          ease: "power2.out", // fast start, gentle settle ≈ old cubic ease-out
          delay: delay / 1000, // P26 stagger: chips settle left→right
          onUpdate: () => setDisplay(Math.round(counter.val)),
        });
        kill = () => tween.kill();
      })
      .catch(() => {
        // GSAP unavailable — snap to the real value, never stick at 0.
        if (!cancelled) setDisplay(value);
      });

    return () => {
      cancelled = true;
      kill?.();
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
  const wrapRef = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();
  // Reduced-motion users start active (final values shown instantly —
  // CountUp derives the value, so no setState-in-effect needed).
  const [active, setActive] = useState(reduceMotion);

  // One-shot IntersectionObserver: start counting when the row enters
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
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ZERO-DATA POLICY: only positive counts render; nothing if all are 0.
  const visible = stats.filter((s) => s.value > 0);
  if (visible.length === 0) return null;

  return (
    <ul
      ref={wrapRef}
      role="list"
      aria-label="Portfolio stats"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {visible.map((s, i) => {
        const Icon = s.icon ?? ICON_BY_LABEL[s.label] ?? null;
        // The shareable pill content — reused verbatim for link/plain.
        const body = (
          <>
            {Icon && (
              <Icon
                className="h-4 w-4 opacity-80"
                aria-hidden="true"
                style={{ color: COLOR_VAR[s.color] }}
              />
            )}
            <span
              className={`font-display text-lg font-semibold leading-none tracking-tight tabular-nums ${COLOR_TEXT[s.color]}`}
            >
              <CountUp value={s.value} active={active} delay={i * 100} />
            </span>
            <span className="text-xs font-medium text-ink-soft">{s.label}</span>
          </>
        );

        // P22: with a destination the pill is a link — hover lifts the
        // chip and reveals the "→" hint (the row doubles as navigation).
        // Path hrefs (/blog, /detailed-galaxy) use <Link> — a raw <a>
        // did a FULL page reload and dropped SPA state (audit #2).
        // Hash hrefs (#projects) stay native anchors — no reload either way.
        const pillCls =
          "inline-flex items-center gap-2.5 rounded-full border border-card-border bg-card py-2 pl-3.5 pr-4 shadow-card transition-all hover:border-accent/40 hover:shadow-card-hover hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
        const arrow = (
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        );

        if (s.href) {
          const external = /^https?:\/\//.test(s.href);
          const isHash = s.href.startsWith("#");
          const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
          if (!external && !isHash) {
            return (
              <li key={s.label} className="group stat-float">
                <Link href={s.href} title={`Jump to ${s.label}`} className={pillCls}>
                  {body}
                  {arrow}
                  <span className="sr-only">— jump to {s.label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={s.label} className="group stat-float">
              <a href={s.href} {...linkProps} title={`Jump to ${s.label}`} className={pillCls}>
                {body}
                {arrow}
                <span className="sr-only">— jump to {s.label}</span>
              </a>
            </li>
          );
        }
        return (
          <li key={s.label} className="group stat-float">
            <span className={pillCls}>{body}</span>
          </li>
        );
      })}
    </ul>
  );
}