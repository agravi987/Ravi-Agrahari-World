/**
 * ThemeToggle.tsx (client) — plan §4 optional dark mode
 * Toggles html[data-theme] and persists to localStorage.
 *
 * Hydration-safe by design: the component reads the theme through
 * useSyncExternalStore. React uses the SERVER snapshot during
 * hydration (so SSR HTML never mismatches), then re-reads the DOM
 * after hydration and flips the icon if the stored theme was dark.
 * The no-flash inline script in layout.tsx (next/script,
 * beforeInteractive) already set data-theme before first paint.
 */
"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { applyTheme } from "@/lib/theme";

/* --- Tiny module-level theme store (avoids effect-based state sync) --- */

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Live value: is the current theme dark? Reads the DOM attribute. */
function getSnapshot(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
  );
}

/** Server value: always light during SSR → hydration never mismatches. */
function getServerSnapshot(): boolean {
  return false;
}

function emit() {
  listeners.forEach((l) => l());
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    // Phase 10: applyTheme also syncs the <meta name="theme-color"> so
    // the browser chrome tints match the page paper.
    applyTheme(dark ? "light" : "dark");
    emit(); // notify other subscribers (only this component today)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-card-border bg-card text-ink-soft transition-colors hover:text-accent"
    >
      {/* P10: the icon swap rotates through — a 90° tumble instead of an
          instant blink. Keyed by theme so React remounts + re-runs the
          animation. Reduced-motion skips it (global rule). */}
      <span key={dark ? "sun" : "moon"} className="animate-theme-swap">
        {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      </span>
    </button>
  );
}
