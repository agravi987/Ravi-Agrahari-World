/**
 * ClosingStatement.tsx (client) — the portfolio's signature close (P39).
 * A single large, silent line above the footer columns that scrubs up +
 * fades in as the reader approaches the end of the page — the "signature
 * closing move" good portfolios end on. Scroll-driven, so it follows the
 * repo's established scrub pattern (Experience timeline): reduced-motion
 * users never fetch the GSAP chunk and just see the line statically
 * (SSR default). Transform + opacity only — no layout, no LCP risk
 * (it sits at the very bottom of the page).
 */
"use client";

import { useEffect, useRef } from "react";
import { gsapReady } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function ClosingStatement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled) return;
        const ctx = gsap.context(() => {
          gsap.fromTo(
            el,
            { yPercent: 42, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                // Starts the moment its top reaches the bottom edge and
                // completes by the time it's a third of the way up the
                // viewport — "the page ends, the statement arrives".
                start: "top bottom",
                end: "top 35%",
                scrub: true,
              },
            }
          );
        });
        dispose = () => ctx.revert();
      })
      .catch(() => {
        /* GSAP failed — the line just sits there, nothing breaks */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduceMotion]);

  return (
    <p
      ref={ref}
      className="mx-auto max-w-5xl px-6 pb-10 pt-14 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl"
      style={{ willChange: "transform, opacity" }}
    >
      If it&apos;s worth building,
      <br className="hidden sm:block" />{" "}
      <span className="text-accent">it&apos;s worth doing in public.</span>
    </p>
  );
}