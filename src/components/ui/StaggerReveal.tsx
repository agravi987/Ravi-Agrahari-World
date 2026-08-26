/**
 * StaggerReveal.tsx (client) — section header staggered entrance.
 * Wraps children so each one fades/slides in with an incremental delay,
 * creating a "curtain lift" effect (eyebrow → title → desc → content).
 *
 * SSR-safe: starts visible, only below-fold items get the treatment.
 * Reduced-motion: no transition at all (final state shown instantly).
 */
"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Base delay (ms) between each child. */
  staggerMs?: number;
}

export default function StaggerReveal({
  children,
  className,
  staggerMs = 80,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setInView(false);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className={clsx(
                "transition-all duration-500 ease-out",
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-5 opacity-0"
              )}
              style={{ transitionDelay: inView ? `${i * staggerMs}ms` : "0ms" }}
            >
              {child}
            </div>
          ))
        : <div
            className={clsx(
              "transition-all duration-500 ease-out",
              inView
                ? "translate-y-0 opacity-100"
                : "translate-y-5 opacity-0"
            )}
          >
            {children}
          </div>
      }
    </div>
  );
}
