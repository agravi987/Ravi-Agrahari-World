/**
 * LiveTimeAgo.tsx (client) — a "3m ago" label that keeps counting.
 *
 * The dashboard's recently-edited feed rendered timeAgo() server-side,
 * so "just now" froze until the next revalidation. This island renders
 * the server value first (no hydration mismatch), then recomputes
 * client-side every 30s.
 */
"use client";

import { useEffect, useState } from "react";

/** Same vocabulary as collections.server.timeAgo — one voice everywhere. */
function compute(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LiveTimeAgo({
  iso,
  fallback,
}: {
  /** ISO timestamp to count from. */
  iso: string;
  /** Server-rendered label shown before hydration (and without JS). */
  fallback: string;
}) {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    const tick = () => setLabel(compute(iso));
    // First update deferred one tick — an effect body that calls
    // setState synchronously trips the react-compiler lint rule.
    const t = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [iso]);

  return <>{label}</>;
}
