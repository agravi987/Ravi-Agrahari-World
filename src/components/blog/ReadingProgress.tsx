/**
 * ReadingProgress.tsx (client) — P8 blog polish.
 * A 2px accent bar pinned to the viewport top showing how far the
 * reader is through the article (like Medium/Google docs). Driven by
 * one passive scroll listener + rAF read. Hidden entirely for
 * reduced-motion users (static progress adds nothing without the
 * visual motion).
 */
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    // Measure the ARTICLE, not the document (audit #176): on short posts
    // the footer made the bar never reach 100% (and start part-filled).
    // The article's top offset is subtracted so the bar starts at 0 when
    // the article top meets the viewport top (header offset accounted).
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const article = document.querySelector("article");
        const doc = document.documentElement;
        if (article) {
          const top = article.offsetTop - 80; // clear the sticky header
          const span = Math.max(1, article.offsetHeight - window.innerHeight + 80);
          setProgress(Math.min(1, Math.max(0, (window.scrollY - top) / span)));
        } else {
          const max = doc.scrollHeight - window.innerHeight;
          setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[59] h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-accent to-accent-cyan"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
