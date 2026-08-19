"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * IdleMount.tsx — defers rendering (and therefore hydration) of
 * non-critical UI until the browser is idle or a timeout fires.
 *
 * The fallback is rendered in SSR/initial HTML so there's no CLS;
 * the real children mount after requestIdleCallback (~1-2s) or a
 * max wait of 3s. Use for decorative/aux widgets (cursor glow,
 * back-to-top, route progress, section rail, toaster, shortcuts).
 */
export default function IdleMount({
  children,
  fallback,
  timeoutMs = 3000,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  timeoutMs?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const idle = (window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1))) as (
      cb: () => void,
      options?: { timeout: number }
    ) => number;
    const handle = idle(
      () => {
        if (!cancelled) setMounted(true);
      },
      { timeout: timeoutMs },
    );
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, [timeoutMs]);

  return mounted ? children : fallback;
}