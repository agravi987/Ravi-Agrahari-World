/**
 * useSwipe.ts — Phase 9 gestures
 * Touch/pen horizontal swipe detection for "one card at a time"
 * switchers (Skills domains, Certifications spotlight).
 *
 * Spread the returned handlers on the swipable element. A swipe is a
 * horizontal drag past `threshold` px whose horizontal axis clearly
 * dominates the vertical one — so normal vertical scrolling never
 * triggers it. This is navigation, not decorative motion, so it stays
 * active for reduced-motion users (no animation is added).
 */
"use client";

import { useRef, type TouchEvent } from "react";

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipe(
  onLeft: () => void,
  onRight: () => void,
  threshold = 48
): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      // Too short, or the movement is mostly vertical (a scroll) → ignore.
      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx) * 1.2) return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}
