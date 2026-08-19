/**
 * LevelRing.tsx (client) — animated conic skill-level ring (UX pass).
 * Shows a 1–5 level as a ring that sweeps around a tracked circle when
 * scrolled into view, with the level as a center label ("3" + "of 5").
 * Stroke uses `currentColor` so you pass the topic hue via className.
 * Reduced-motion users get the final ring instantly.
 */
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { useReducedMotion } from "@/lib/useReducedMotion";

const R = 22;
const CIRC = 2 * Math.PI * R;

export default function LevelRing({
  level,
  size,
  className,
}: {
  level: number;
  size?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [shown, setShown] = useState(true);
  const reduceMotion = useReducedMotion();
  const pct = Math.min(1, Math.max(0, level / 5));

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setShown(false);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  return (
    /* When `size` is omitted the ring sizes responsively via className
       (e.g. h-12 w-12 sm:h-14 sm:w-14) — so it can show on mobile. */
    <div
      className={clsx(
        "relative inline-flex shrink-0",
        !size && "h-12 w-12 sm:h-14 sm:w-14",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg ref={ref} viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        {/* track */}
        <circle
          cx="28"
          cy="28"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="5"
        />
        {/* filled sweep */}
        <circle
          cx="28"
          cy="28"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - (shown ? pct : 0))}
          style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-bold" style={{ color: "currentColor" }}>
          {level}
        </span>
        <span className="text-[8px] font-mono opacity-70" style={{ color: "currentColor" }}>
          of 5
        </span>
      </span>
    </div>
  );
}