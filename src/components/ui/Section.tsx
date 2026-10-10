/**
 * Section.tsx — UI primitive (plan S2)
 * Consistent section shell: <section id> + terminal eyebrow +
 * display-font title + optional description + children.
 * Scroll reveal: fades up once via a CSS transition driven by
 * useInView (P5 — replaces framer-motion's whileInView; the section
 * starts visible in SSR so the reveal never hides no-JS content,
 * and reduced-motion users get no transition at all).
 *
 * GSAP pass: the h2 title gets a masked word-rise (SplitText, free
 * since 3.13) on a one-shot ScrollTrigger. Layered safely INSIDE the
 * existing reveal stack: .section-reveal still fades the section,
 * StaggerReveal still staggers the header parts, and the title-sweep
 * underline (::after on the h2) still draws via CSS — SplitText only
 * rebuilds the h2's inner text nodes. Below-fold titles ONLY (same
 * invariant as useInView: on-screen content is never hidden), and
 * reduced-motion users never fetch the GSAP chunk.
 */
"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/useInView";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";
import { showToast } from "./Toast";
import GradientMesh from "./GradientMesh";
import Eyebrow from "./Eyebrow";
import StaggerReveal from "./StaggerReveal";

interface SectionProps {
  id: string;
  eyebrow: string;
  /** Optional mono index (e.g. "01") — reinforces the section order with a
   *  quiet editorial label before the eyebrow (UX pass, hierarchy). */
  index?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Topic hue for the eyebrow + title sweep (color pass P7).
   *  One of the muted topic tokens — defaults to the indigo accent. */
  tone?: "cloud" | "devops" | "ai" | "linux" | "mars" | "ice" | "accent";
  /** Alternate background band: alternating sections sit on a slightly
   *  deeper paper so the page gets vertical rhythm (premium layout). */
  band?: boolean;
  /** Add a colorful gradient mesh background (P30). Use sparingly for
   *  visual variety — not every section needs it. */
  mesh?: boolean;
  /** Vertical rhythm preset. Paddings are FLUID — they scale smoothly
   *  with the viewport via clamp() instead of jumping at breakpoints:
   *    "tight"  → compact sections that sit close to their neighbors
   *    "normal" → default editorial rhythm (a touch more air above
   *               than below, so headings breathe and pages don't end
   *               each section with a big dead zone)
   *    "roomy"  → hero-adjacent / showcase sections
   *  Per-section overrides still win: pass pt-, pb- or py- utilities
   *  via className (same specificity, later utilities layer). */
  spacing?: "tight" | "normal" | "roomy";
  /** Slide viewport: make the section at least one screen tall and
   *  vertically center its content — the page then reads as one
   *  section per screen ("curated slides"). Overflow content on a
   *  section detail page is one ExploreLink away. */
  fit?: boolean;
  /** Decorative "keep scrolling" chevron pinned to the bottom of a
   *  fit section (aria-hidden; safely ignored when motion is off). */
  cue?: boolean;
}

/** Fluid padding presets — medium, balanced spacing between sections */
const SPACING: Record<NonNullable<SectionProps["spacing"]>, string> = {
  tight: "py-6 sm:py-8",
  normal: "py-10 sm:py-14 lg:py-16",
  roomy: "py-14 sm:py-18 lg:py-20",
};

/** Maps tone → eyebrow text color + title-sweep var + chromatic heading gradient. */
const TONES: Record<
  NonNullable<SectionProps["tone"]>,
  { eyebrow: string; sweep: string; pill: string; titleGradient: string }
> = {
  cloud: {
    eyebrow: "text-topic-cloud-deep font-semibold tracking-wider",
    sweep: "var(--color-topic-cloud)",
    pill: "border-topic-cloud/40 bg-topic-cloud/15 text-topic-cloud-deep shadow-[0_0_12px_rgba(56,189,248,0.25)]",
    titleGradient: "heading-gradient-cloud",
  },
  devops: {
    eyebrow: "text-topic-devops-deep font-semibold tracking-wider",
    sweep: "var(--color-topic-devops)",
    pill: "border-topic-devops/40 bg-topic-devops/15 text-topic-devops-deep shadow-[0_0_12px_rgba(45,212,191,0.25)]",
    titleGradient: "heading-gradient-devops",
  },
  ai: {
    eyebrow: "text-topic-ai-deep font-semibold tracking-wider",
    sweep: "var(--color-topic-ai)",
    pill: "border-topic-ai/40 bg-topic-ai/15 text-topic-ai-deep shadow-[0_0_12px_rgba(192,132,252,0.25)]",
    titleGradient: "heading-gradient-ai",
  },
  linux: {
    eyebrow: "text-topic-linux-deep font-semibold tracking-wider",
    sweep: "var(--color-topic-linux)",
    pill: "border-topic-linux/40 bg-topic-linux/15 text-topic-linux-deep shadow-[0_0_12px_rgba(251,191,36,0.25)]",
    titleGradient: "heading-gradient-linux",
  },
  mars: {
    eyebrow: "text-topic-mars-deep font-semibold tracking-wider",
    sweep: "var(--color-topic-mars)",
    pill: "border-topic-mars/40 bg-topic-mars/15 text-topic-mars-deep shadow-[0_0_12px_rgba(248,113,113,0.25)]",
    titleGradient: "heading-gradient-mars",
  },
  ice: {
    eyebrow: "text-topic-ice-deep font-semibold tracking-wider",
    sweep: "var(--color-topic-ice)",
    pill: "border-topic-ice/40 bg-topic-ice/15 text-topic-ice-deep shadow-[0_0_12px_rgba(56,189,248,0.25)]",
    titleGradient: "heading-gradient-cloud",
  },
  accent: {
    eyebrow: "text-accent font-semibold tracking-wider",
    sweep: "var(--color-accent)",
    pill: "border-accent/40 bg-accent/15 text-accent shadow-[0_0_12px_rgba(129,140,248,0.25)]",
    titleGradient: "heading-gradient-accent",
  },
};

export default function Section({
  id,
  eyebrow,
  index,
  title,
  description,
  children,
  className,
  tone = "accent",
  band = false,
  mesh = false,
  spacing = "normal",
  fit = false,
  cue = false,
}: SectionProps) {
  const { ref, inView } = useInView<HTMLElement>();
  const t = TONES[tone];
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(false);
  useEffect(() => {
    if (!fit) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) setCurrent(en.isIntersecting);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fit, ref]);

  /** Phase 9: copy a stable deep link to this section (Linear/Notion-
   *  grade affordance). Appears on hover next to the title. */
  const copyLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    const done = () => showToast("Section link copied");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => done());
    } else {
      // Clipboard API unavailable — fall back to a temp textarea.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      done();
    }
  }, [id]);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className={clsx(
        SPACING[spacing],
        "section-reveal relative overflow-x-clip",
        inView && "is-in-view",
        band && "band-bg",
        className
      )}
      style={
        {
          ...(band
            ? ({ "--band-tint": `color-mix(in oklab, ${t.sweep} 7%, transparent)` } as CSSProperties)
            : {}),
          ...(fit
            ? ({ "--snap-trim": `color-mix(in oklab, ${t.sweep} 65%, transparent)` } as CSSProperties)
            : {}),
        } as CSSProperties
      }
    >
      {/* Stylish Luminous Multi-Layered Cosmic Separator */}
      <div className="absolute top-0 inset-x-0 mx-auto max-w-5xl px-4 sm:px-6 pointer-events-none" aria-hidden="true">
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow Aura */}
          <div className="absolute h-4 w-4/5 bg-gradient-to-r from-transparent via-accent/25 to-transparent blur-md" />
          {/* Outer Base Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-card-border to-transparent" />
          {/* Inner Radiant Gradient Core */}
          <div className="absolute h-[2px] w-3/4 bg-gradient-to-r from-transparent via-accent-cyan via-accent to-transparent opacity-85 shadow-[0_0_12px_rgba(129,140,248,0.7)]" />
          {/* Center Stylish Cosmic Diamond & Rings */}
          <div className="absolute flex items-center justify-center">
            <span className="absolute h-5 w-5 rounded-full bg-accent/20 blur-sm" />
            <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] border border-cyan-200 bg-gradient-to-tr from-accent to-accent-cyan shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
            <span className="absolute -left-6 h-1 w-1 rounded-full bg-accent-cyan/60" />
            <span className="absolute -right-6 h-1 w-1 rounded-full bg-accent-cyan/60" />
          </div>
        </div>
      </div>

      {mesh && <GradientMesh />}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <StaggerReveal staggerMs={60}>
          <div className="group/head">
            <div className="section-scan-line flex items-center gap-3">
              {index && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    "inline-flex h-6 items-center justify-center rounded-full border px-2.5 font-mono text-xs font-semibold",
                    t.pill
                  )}
                >
                  {index}
               </span>
              )}
              <Eyebrow label={eyebrow} cursor className={t.eyebrow} />
           </div>
            <div className="flex items-center gap-2.5">
              <h2
                id={`${id}-title`}
                className={clsx(
                  "mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl",
                  t.titleGradient
                )}
              >
                {title}
              </h2>
              {/* Phase 9: copy-section-link — appears on hover/focus, copies
                  #id so any part of the page is shareable. */}
              <button
                type="button"
                onClick={copyLink}
                aria-label={`Copy link to the ${title} section`}
                title="Copy link to this section"
                // Visible on touch (no hover) — opacity-0 only from md up;
                // parity with the code-block copy button pattern.
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-card-border bg-card font-mono text-xs font-semibold text-ink-faint shadow-card transition-all hover:border-accent/40 hover:text-accent md:opacity-0 md:focus-visible:opacity-100 md:group-hover/head:opacity-100"
              >
                #
              </button>
            </div>
          </div>
          {description && <p className="mt-3.5 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-soft">{description}</p>}
        </StaggerReveal>
        <div className="mt-[clamp(1.5rem,1rem+2vw,2.5rem)]">{children}</div>
     </div>
      {cue && (
        <span
          aria-hidden="true"
          className="section-fit-cue pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-ink-faint hidden lg:inline-block"
        >
          <ChevronDown className="h-5 w-5" />
        </span>
      )}
   </section>
  );
}
