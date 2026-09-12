/**
 * ScrollProgressBar.tsx (client) — persistent scroll position indicator.
 * A thin accent→cyan gradient bar pinned to the very top of the viewport
 * that fills left→right as the user scrolls through the page. Unlike
 * RouteProgress (which flashes during navigation), this bar persists and
 * shows overall page reading progress.
 *
 * Pointer-fine only (no space on touch), reduced-motion: hidden.
 * Transform-only (scaleX on a fixed-position div — compositor, no layout).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);
  // Blog post pages render their own ARTICLE-scoped ReadingProgress bar —
  // two bars at the top edge read as a glitch (audit #24).
  const pathname = usePathname();
  const isPostPage = /^\/blog\/[^/]+/.test(pathname ?? "");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const update = () => {
      rafRef.current = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Reduced-motion users get nothing — the bar is purely decorative.
  // Touch users get nothing — the bar wastes precious vertical space.
  // Post pages get nothing — ReadingProgress owns the top edge there.
  if (progress <= 0 || isPostPage) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] hidden h-[3px] sm:block"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-accent via-accent-cyan to-accent transition-[transform] duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
