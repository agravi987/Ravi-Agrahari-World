/**
 * Section.tsx — UI primitive (plan S2)
 * Consistent section shell: <section id> + terminal eyebrow +
 * display-font title + optional description + children.
 * Scroll reveal: fades up once via a CSS transition driven by
 * useInView (P5 — replaces framer-motion's whileInView; the section
 * starts visible in SSR so the reveal never hides no-JS content,
 * and reduced-motion users get no transition at all).
 */
"use client";

import { clsx } from "clsx";
import { useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/useInView";
import { showToast } from "./Toast";
import GradientMesh from "./GradientMesh";
import Eyebrow from "./Eyebrow";

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
}

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
}: SectionProps) {
  const { ref, inView } = useInView<HTMLElement>();
  const t = TONES[tone];

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
      // py-14 gives every section the same generous vertical rhythm
      // (ui-ux-design.md clean-up: consistent whitespace, plan §4).
      // html scroll-padding (5rem) clears the sticky header — an extra
      // scroll-mt-24 here would stack and overshoot every anchor jump.
      className={clsx(
        "py-14 section-reveal",
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
        <div className="mt-10">{children}</div>
     </div>
   </section>
  );
}
