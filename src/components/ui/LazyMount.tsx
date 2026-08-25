/**
 * LazyMount.tsx (client) — defers visible rendering of a heavy
 * below-the-fold section until it scrolls near the viewport.
 *
 * FIX: Both placeholder and real content are rendered simultaneously.
 * The placeholder takes up space (min-h-[340px]) while the real content
 * is invisible (opacity-0). On intersection, we crossfade: placeholder
 * fades out, real content fades in. Since both are in the DOM at all
 * times, the container height stays stable — no layout shift, no scroll
 * jumping (the root cause of the auto-scroll bug).
 */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function LazyMount({
  children,
  fallback,
  rootMargin = "1200px 0px",
  className,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO (ancient browsers): reveal immediately.
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      // rootMargin: treat the viewport as ~1200px taller, so content
      // reveals just before it's actually seen — a seamless swap.
      { rootMargin },
    );
    io.observe(el); // fires immediately with the current state
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {/* Placeholder: always rendered, fades out when real content is ready.
          min-h ensures the container has height before real content appears. */}
      {fallback && (
        <div
          className="transition-opacity duration-500 ease-out"
          style={{
            opacity: visible ? 0 : 1,
            pointerEvents: visible ? "none" : "auto",
          }}
        >
          {fallback}
        </div>
      )}
      {/* Real content: always rendered (takes up space from the start),
          fades in when the intersection observer fires. */}
      <div
        className="transition-opacity duration-500 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
