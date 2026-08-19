/**
 * RouteProgress.tsx (client) — route-change feedback.
 * A thin gradient bar at the very top of the page that appears while
 * a navigation is in flight and sweeps itself away when it lands —
 * the classic Google/MNC "something is happening" cue.
 *
 * Implementation: uses the WHATWG Navigation API (window.navigation)
 * when available for real start/stop events, with a pathname-change
 * fallback so the bar still flashes on link clicks everywhere else.
 * Reduced-motion users get a simple fade (no sweep) via CSS.
 */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Minimal shape of the WHATWG Navigation API (not yet in TS DOM lib). */
type NavLike = {
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
};

export default function RouteProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const nav =
      (window as unknown as { navigation?: NavLike | null }).navigation ?? null;

    if (!nav) {
      // Fallback: flash the bar on every pathname change so it still
      // reads as "you navigated somewhere". Both transitions run in
      // timers (never synchronously in the effect body).
      t1 = setTimeout(() => setPending(true), 0);
      t2 = setTimeout(() => setPending(false), 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    const start = () => setPending(true);
    const finish = () => {
      setPending(false);
    };
    nav.addEventListener("navigate", start);
    nav.addEventListener("navigatesuccess", finish);
    nav.addEventListener("navigateerror", finish);
    return () => {
      nav?.removeEventListener("navigate", start);
      nav?.removeEventListener("navigatesuccess", finish);
      nav?.removeEventListener("navigateerror", finish);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
    >
      <div
        className="h-full w-full bg-gradient-to-r from-accent via-accent-cyan to-topic-ai transition-all duration-500"
        style={{
          transform: pending ? "translateX(0%)" : "translateX(-101%)",
          opacity: pending ? 1 : 0,
        }}
      />
    </div>
  );
}
