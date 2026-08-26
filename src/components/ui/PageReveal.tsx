/**
 * PageReveal.tsx (client) — first-load curtain animation.
 * A full-viewport accent overlay that slides down then fades out on
 * initial page load, revealing the content beneath. Gives the first
 * paint a "curtain up" feeling — the portfolio equivalent of a stage
 * light snapping on. Only runs once (sessionStorage gated).
 *
 * Reduced-motion: curtain is never injected at all (early return).
 * On subsequent navigations within the SPA: does nothing — the
 * sessionStorage flag persists, so it only fires on a fresh visit.
 */
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const STORAGE_KEY = "page-reveal-seen";

export default function PageReveal() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip entirely for reduced-motion users.
    if (reduceMotion) return;
    // Only show on first visit of the session.
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // sessionStorage unavailable (SSR / private mode) — show it anyway.
    }
    // One-shot mount flag: flip visibility after the storage gate. This is
    // deliberately synchronous — the curtain must exist before first paint
    // of this effect, not on a later render pass.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    // Auto-dismiss after the slide + fade duration.
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  if (!visible || reduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200]"
    >
      {/* The curtain — slides down from top, then fades out. */}
      <div className="absolute inset-0 bg-accent page-reveal-slide" />
    </div>
  );
}
