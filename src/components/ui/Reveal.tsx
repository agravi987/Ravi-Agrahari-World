/**
 * Reveal.tsx (client) — staggered scroll-in wrapper (UI/UX enhancement pass).
 * Wraps a group so each child fades/slides in as it enters the viewport,
 * with an optional per-item `delay` for a cascade (e.g. card grids).
 *
 * SSR-safe (mirrors useInView, plan P5): the element STARTS visible, so the
 * server-rendered HTML is never hidden. Only items that sit fully BELOW the
 * fold on first client paint get hidden, then revealed by an Intersection-
 * Observer. No-JS and reduced-motion users always see the content.
 */
"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Per-item stagger (ms) — pass i * 70 in a map for a cascade. */
  delay?: number;
}

export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Only below-fold items get the reveal treatment (no flash on load).
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setInView(false);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx("reveal-item", inView && "is-in-view", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
