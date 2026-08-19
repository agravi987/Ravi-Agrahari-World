/**
 * LevelBar.tsx (client) — P8 interactivity + P26 segmented.
 * The 1–5 skill level, rendered as FIVE segments (P26) — the visual
 * matches the scale exactly (3/5 = three filled ticks), instead of a
 * continuous bar. Fills appear once when scrolled into view (CSS
 * width transition; IntersectionObserver triggers it). Reduced-motion
 * users get the final width instantly (no animation). SSR-safe:
 * initial state is the FINAL value, so no-JS/SSR HTML is always
 * correct — the fill only rewinds on the client for below-fold bars,
 * then plays forward on reveal.
 */
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function LevelBar({
  level,
  fillClass,
}: {
  level: number;
  fillClass: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start filled: SSR + no-JS show the correct level.
  const [filled, setFilled] = useState(true);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Only below-fold bars get the reveal treatment (no flash on load).
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setFilled(false);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setFilled(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  return (
    <div
      ref={ref}
      className="mt-1.5 flex gap-1"
      role="img"
      aria-label={`level ${level} out of 5`}
    >
      {/* P26: five segments — one per level, filled ones in the topic
          hue, the rest a quiet track */}
      {[1, 2, 3, 4, 5].map((seg) => (
        <div
          key={seg}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-deep"
        >
          <div
            className={`relative h-full w-full overflow-hidden rounded-full transition-[width] duration-700 ease-out ${
              seg <= level ? fillClass : "bg-paper-deep"
            }`}
            style={{
              width: filled && seg <= level ? "100%" : "0%",
              transitionDelay: `${seg * 90}ms`,
            }}
          >
            {/* Gradient sweep (Skills #8): a soft highlight that runs
                across the fill once as the segment appears. Transform-
                based + CSS-only; the global reduced-motion override
                (0.01ms animations) turns it into a static fill. */}
            {seg <= level ? (
              <span
                aria-hidden="true"
                className="level-sweep pointer-events-none absolute inset-0 rounded-full"
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
