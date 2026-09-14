/**
 * BackToTop.tsx (client) — P7 polish.
 * A floating circular button, bottom-right, that fades in after the
 * user scrolls ~2 viewport-heights. Smoothly scrolls to the top on
 * click (instant for reduced-motion users). Sits above the galaxy
 * zoom controls' z-index but below modals.
 */
"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();
  // Last whole-percent written to state — skips 99% of the setState
  // churn on every scroll frame (audit #121).
  const lastPctRef = useRef(-1);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setVisible(window.scrollY > window.innerHeight * 1.5);
      const pct = max > 0 ? Math.round(Math.min(1, window.scrollY / max) * 100) : 0;
      if (pct !== lastPctRef.current) {
        lastPctRef.current = pct;
        setProgress(pct / 100);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
      }
      aria-label="Back to top"
      title={`Page progress ${Math.round(progress * 100)}%`}
      className={`group fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        // Entrance (audit #115): fade + settle instead of a hard pop-in.
        reduceMotion ? "" : "animate-menu-in"
      }`}
    >
      {/* Phase 10: the control names itself on hover — a small "top"
          pill slides in beside the button (desktop, pointer users). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-full mr-2 hidden -translate-x-1 whitespace-nowrap rounded-full border border-card-border bg-card px-2.5 py-1 font-mono text-[10px] font-medium text-ink-soft opacity-0 shadow-card transition-all duration-200 group-hover:-translate-x-0 group-hover:opacity-100 sm:block"
      >
        top
      </span>
      {/* Scroll-progress ring (ux pass) — accent arc fills as you read */}
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx="24"
          cy="24"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - progress)}
        />
      </svg>
      <ArrowUp className="relative h-5 w-5 backtop-pulse" aria-hidden="true" />
    </button>
  );
}
