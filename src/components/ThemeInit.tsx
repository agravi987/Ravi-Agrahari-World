/**
 * ThemeInit.tsx (client) — no-flash theme init (React 19 safe)
 *
 * Problem: React 19 warns ("Encountered a script tag while rendering
 * React component") for ANY <script> rendered inside the React tree —
 * raw scripts in layouts, next/script, even suppressHydrationWarning.
 *
 * Fix: useServerInsertedHTML injects the script into the SSR stream
 * OUTSIDE React's component tree. The browser gets the inline script
 * in the initial HTML → it runs before first paint (no theme flash),
 * and React never "sees" it during hydration → no warning.
 *
 * ThemeToggle (useSyncExternalStore) picks up the applied data-theme
 * after hydration, so the icon always matches what the user sees.
 */
"use client";

import { useServerInsertedHTML } from "next/navigation";

/** Sets html[data-theme] from localStorage BEFORE first paint.
 *  Stored choice wins; otherwise the OS preference decides (P16),
 *  falling back to light (plan §1 — the design is light-tuned). */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme;
    if (stored === "dark" || stored === "light") {
      theme = stored;
    } else {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"; // light-first portfolio (plan §1)
    }
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    // Phase 10: tint the browser chrome (address bar etc.) to the paper
    // color before first paint — same values as lib/theme.ts.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#0c0a09" : "#faf9f6";
  } catch (e) { /* private mode etc. — default to light */ }
})();
`;

export default function ThemeInit() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  ));
  return null; // injection only — renders nothing itself
}
