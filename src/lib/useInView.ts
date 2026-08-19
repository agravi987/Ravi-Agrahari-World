/**
 * useInView.ts — tiny scroll-reveal hook (P5: replaces framer-motion's
 * whileInView, dropping the library from the bundle).
 *
 * SSR/no-JS safe: the element starts VISIBLE (inView = true), so the
 * server-rendered HTML is never hidden. A layout effect runs before the
 * first client paint: sections that are fully BELOW the fold get hidden
 * and are revealed by an IntersectionObserver when scrolled into view.
 * On-screen content is never hidden, so there is zero flash.
 */
"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>(rootMargin = "-80px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Only below-fold sections get the reveal treatment — anything at
    // least partially on screen stays visible (no flash, no jank).
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setInView(false);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
