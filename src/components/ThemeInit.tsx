/**
 * ThemeInit.tsx (client) — no-flash multi-theme init (React 19 safe)
 *
 * Injects an inline script into the SSR stream (outside React's tree)
 * that resolves the stored theme choice BEFORE first paint.
 *
 * "system" → resolves to OS preference; all others force their palette.
 * The data-theme attribute is always a real theme name (never "system").
 * A matchMedia listener keeps "system" mode in sync with OS changes.
 */
"use client";

import { useServerInsertedHTML } from "next/navigation";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var valid = {"light":1,"dark":1,"midnight":1,"nord":1,"rose":1};
    var stored = localStorage.getItem("theme");
    var theme;
    if (stored && valid[stored]) {
      theme = stored;
    } else if (stored === "system" || !stored) {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light";
    } else {
      theme = "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
    var papers = {"light":"#faf9f6","dark":"#0c0a09","midnight":"#0b1120","nord":"#2e3440","rose":"#fff1f2"};
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = papers[theme] || "#faf9f6";
    if (!stored || stored === "system") {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
        var t = e.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", t);
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.content = papers[t] || "#faf9f6";
      });
    }
  } catch (e) { /* private mode — default light */ }
})();
`;

export default function ThemeInit() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  ));
  return null;
}
