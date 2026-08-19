/**
 * LazyMount.tsx (client) — defers mounting (and therefore hydrating)
 * a heavy below-the-fold section until it scrolls near the viewport.
 *
 * The fallback is server-rendered (a slim placeholder), so the page
 * paints instantly; the real content — with all its DOM + JS — only
 * materializes when the user is actually about to see it. Sections
 * already in/near view (e.g. mid-page reload) mount immediately.
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO (ancient browsers): mount on the next tick — never
      // synchronously inside the effect body.
      const t = setTimeout(() => setMounted(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      // rootMargin: treat the viewport as ~1200px taller, so content
      // mounts just before it's actually seen — a seamless swap.
      { rootMargin },
    );
    io.observe(el); // fires immediately with the current state
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {mounted ? children : fallback}
    </div>
  );
}
