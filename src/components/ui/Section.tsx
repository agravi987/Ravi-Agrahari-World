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
import { useCallback, useEffect, useRef } from "react";
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
}

/** Maps tone → eyebrow text color + title-sweep var (color pass P7). */
/** Fluid padding presets — clamp(min, preferred, max) so the space
 *  grows with the viewport between a mobile floor and a desktop ceiling.
 *  Bottom padding is ~80% of top on every preset: classic editorial
 *  rhythm (space belongs ABOVE a heading, not after the content). */
const SPACING: Record<NonNullable<SectionProps["spacing"]>, string> = {
  tight: "pt-[clamp(1.75rem,1rem+2.5vw,3rem)] pb-[clamp(1.5rem,0.875rem+2vw,2.5rem)]",
  normal:
    "pt-[clamp(2.5rem,1.25rem+4vw,5rem)] pb-[clamp(2rem,1rem+3.25vw,4rem)]",
  roomy:
    "pt-[clamp(3.5rem,1.5rem+6vw,7rem)] pb-[clamp(2.75rem,1.25rem+4.75vw,5.5rem)]",
};

/** Maps tone → eyebrow text color + title-sweep var (color pass P7). */
const TONES: Record<
  NonNullable<SectionProps["tone"]>,
  { eyebrow: string; sweep: string; pill: string }
> = {
  cloud: {
    eyebrow: "text-topic-cloud-deep",
    sweep: "var(--color-topic-cloud)",
    pill: "border-topic-cloud/40 bg-topic-cloud/10 text-topic-cloud-deep",
  },
  devops: {
    eyebrow: "text-topic-devops-deep",
    sweep: "var(--color-topic-devops)",
    pill: "border-topic-devops/40 bg-topic-devops/10 text-topic-devops-deep",
  },
  ai: {
    eyebrow: "text-topic-ai-deep",
    sweep: "var(--color-topic-ai)",
    pill: "border-topic-ai/40 bg-topic-ai/10 text-topic-ai-deep",
  },
  linux: {
    eyebrow: "text-topic-linux-deep",
    sweep: "var(--color-topic-linux)",
    pill: "border-topic-linux/40 bg-topic-linux/10 text-topic-linux-deep",
  },
  mars: {
    eyebrow: "text-topic-mars-deep",
    sweep: "var(--color-topic-mars)",
    pill: "border-topic-mars/40 bg-topic-mars/10 text-topic-mars-deep",
  },
  ice: {
    eyebrow: "text-topic-ice-deep",
    sweep: "var(--color-topic-ice)",
    pill: "border-topic-ice/40 bg-topic-ice/10 text-topic-ice-deep",
  },
  accent: {
    eyebrow: "text-accent",
    sweep: "var(--color-accent)",
    pill: "border-accent/40 bg-accent/10 text-accent",
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
}: SectionProps) {
  const { ref, inView } = useInView<HTMLElement>();
  const t = TONES[tone];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

  /** GSAP pass: masked word-rise on the title (below-fold only).
   *  SplitText wraps each word in an overflow-hidden mask; words rise
   *  yPercent 110→0 with a slight stagger while the section itself
   *  fades up — a coherent, premium cascade. One-shot ScrollTrigger.
   *  SplitText 3.13+ keeps the h2 accessible (aria-label on the
   *  heading, splits hidden from AT) and .revert() restores the
   *  original HTML on unmount. If GSAP fails to load the title simply
   *  stays static — the sweep underline still draws via CSS. */
  useEffect(() => {
    if (reduceMotion) return;
    const el = titleRef.current;
    if (!el) return;
    // Repo invariant (useInView): never hide content already on screen.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) =>
        import("gsap/SplitText").then(({ SplitText }) => {
          if (cancelled) return;
          gsap.registerPlugin(SplitText); // idempotent
          const split = SplitText.create(el, { type: "words", mask: "words" });
          const tween = gsap.from(split.words, {
            yPercent: 110,
            duration: 0.55,
            ease: "power3.out",
            stagger: 0.045,
            delay: 0.05,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
          dispose = () => {
            tween.scrollTrigger?.kill();
            tween.kill();
            split.revert();
          };
        })
      )
      .catch(() => {
        /* GSAP failed to load — title stays static, nothing breaks */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduceMotion]);

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
      // Compact-but-consistent vertical rhythm: tighter than before so
      // more content fits per screen without feeling cramped.
      // html scroll-padding (5rem) clears the sticky header — an extra
      // scroll-mt-24 here would stack and overshoot every anchor jump.
      className={clsx(
        // Fluid vertical rhythm (see SPACING): scales continuously with
        // the viewport instead of fixed steps that feel too airy on
        // phones and too cramped on wide screens.
        SPACING[spacing],
        "section-reveal",
        inView && "is-in-view",
        band && "band-bg relative",
        className
      )}
      // Phase 9 color: band sections carry a whisper of their topic hue
      // (--band-tint) layered under the paper wash in globals.css.
      style={
        band ? ({ "--band-tint": `color-mix(in oklab, ${t.sweep} 7%, transparent)` } as CSSProperties) : undefined
      }
    >
      {mesh && <GradientMesh />}
      <div className="mx-auto max-w-5xl px-6">
        <StaggerReveal staggerMs={60}>
          <div className="group/head">
            <div className="flex items-center gap-3">
              {index && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    "inline-flex h-6 items-center justify-center rounded-full border px-2 font-mono text-[11px] font-medium",
                    t.pill
                  )}
                >
                  {index}
               </span>
              )}
              <Eyebrow label={eyebrow} className={t.eyebrow} />
           </div>
            <div className="flex items-center gap-2.5">
              <h2
                ref={titleRef}
                id={`${id}-title`}
                className="title-sweep animated mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
                style={{ "--sweep": t.sweep } as CSSProperties}
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
          {description && <p className="mt-3 max-w-2xl text-ink-soft">{description}</p>}
        </StaggerReveal>
        <div className="mt-[clamp(1.5rem,1rem+2vw,2.5rem)]">{children}</div>
     </div>
   </section>
  );
}
