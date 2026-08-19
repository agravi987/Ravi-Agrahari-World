/**
 * useReducedMotion.ts — native prefers-reduced-motion hook.
 * Replaces framer-motion's useReducedMotion (P5: drops the framer-motion
 * runtime from every page's JS bundle — it was imported only for this
 * hook + section reveals).
 *
 * Built on useSyncExternalStore: the server snapshot returns TRUE
 * (assume reduced during SSR, matching framer-motion's semantics), so
 * server HTML and the hydration pass agree; after hydration React swaps
 * to the real media-query value with no warning. Lint-clean (no
 * setState inside effects).
 */
"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
