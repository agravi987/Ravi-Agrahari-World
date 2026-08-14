/**
 * ThemeToggle.tsx (client) — plan §4 optional dark mode
 * Toggles html[data-theme] and persists to localStorage.
 * The no-flash inline script in layout.tsx sets data-theme BEFORE
 * first paint, so this lazy initializer just reads the result at
 * hydration — no effect, no flash, no setState-in-effect lint.
 */
"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function ThemeToggle() {
  // Lazy initializer: runs on the client at hydration, where the
  // layout script has already applied the stored theme (plan §4).
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false; // SSR safety
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode — theme still applies for this session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-colors hover:text-accent"
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
