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
 *
 * Correctness notes (learned the hard way):
 * · Every state update is deferred through a timer. The browser can
 *   dispatch `navigate` synchronously (e.g. during prefetch), and
 *   scheduling a React update from inside such an event crashes with
 *   "useInsertionEffect must not schedule updates".
 * · The Navigation API subscription mounts ONCE (not per-pathname).
 *   The old per-pathname effect cancelled its own timers on cleanup,
 *   so a success event landing during the pathname swap could leave
 *   the bar stuck on screen forever.
 */
"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal shape of the WHATWG Navigation API (not yet in TS DOM lib). */
type NavLike = {
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
};

function getNav(): NavLike | null {
  return (window as unknown as { navigation?: NavLike | null }).navigation ?? null;
}

export default function RouteProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  /** All in-flight defer timers — cancelled together on unmount so a
   *  late setState can't fire after the component is gone. */
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  // Unmount-only cleanup: per-navigation cleanups would cancel finish
  // events mid-swap (the stuck-bar bug).
  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
      timers.current.clear();
    },
    []
  );

  /** Defer a setState one tick — never synchronous from an event. */
  const deferSet = useCallback((value: boolean) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      setPending(value);
    }, 0);
    timers.current.add(t);
  }, []);

  // Navigation API subscription — mounted once for the component's life.
  useEffect(() => {
    const nav = getNav();
    if (!nav) return;
    const start = () => deferSet(true);
    const finish = () => deferSet(false);
    nav.addEventListener("navigate", start);
    nav.addEventListener("navigatesuccess", finish);
    nav.addEventListener("navigateerror", finish);
    return () => {
      nav.removeEventListener("navigate", start);
      nav.removeEventListener("navigatesuccess", finish);
      nav.removeEventListener("navigateerror", finish);
    };
  }, [deferSet]);

  // Per-pathname effect: drives the no-Navigation-API fallback flash
  // AND acts as a safety net — every landed navigation schedules a
  // hide, so a missed success event can't leave the bar up forever.
  useEffect(() => {
    const hasNav = getNav() !== null;
    if (!hasNav) deferSet(true);
    const hide = setTimeout(() => deferSet(false), hasNav ? 0 : 400);
    return () => clearTimeout(hide);
  }, [pathname, deferSet]);

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
