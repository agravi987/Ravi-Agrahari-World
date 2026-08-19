/**
 * theme.ts — Phase 10: single source of truth for theme application.
 * Every place that flips light/dark (ThemeToggle, command palette) goes
 * through applyTheme() so the <meta name="theme-color"> always matches
 * the paper color the browser chrome should tint around the page.
 *
 * Safe to import from client components; the initial no-flash script in
 * ThemeInit.tsx inlines the same colors (it must, before React hydrates).
 */

export type Theme = "light" | "dark";

/** Paper colors from globals.css — the browser chrome tints these. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#faf9f6",
  dark: "#0c0a09",
};

export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/** Applies the theme + persists it + syncs the theme-color meta tag. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* private mode — theme still applies for this session */
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[theme];
}

/** Toggle the current theme (used by the toggle + palette action). */
export function toggleTheme(): Theme {
  const next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
