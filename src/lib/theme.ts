/**
 * theme.ts — Multi-theme system: system + 5 named themes.
 *
 * Themes: system, light, dark, midnight, nord, rose
 * - "system" follows OS prefers-color-scheme → resolves to light or dark
 * - All others force their palette regardless of OS
 * - The data-theme attribute is always a REAL theme name (never "system")
 * - localStorage stores the user's choice
 * - applyTheme() sets DOM + persists + syncs <meta theme-color>
 */

export type ThemeName =
  | "light"
  | "dark"
  | "midnight"
  | "nord"
  | "rose";

export type ThemeChoice = "system" | ThemeName;

export interface ThemeDef {
  label: string;
  icon: string;       // lucide icon name
  paper: string;      // browser chrome tint
  dark: boolean;      // is this a dark-family theme?
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  light:    { label: "Light",    icon: "Sun",          paper: "#faf9f6", dark: false },
  dark:     { label: "Dark",     icon: "Moon",         paper: "#0c0a09", dark: true  },
  midnight: { label: "Midnight", icon: "MoonStar",     paper: "#0b1120", dark: true  },
  nord:     { label: "Nord",     icon: "Snowflake",    paper: "#2e3440", dark: true  },
  rose:     { label: "Rose",     icon: "Flower2",      paper: "#fff1f2", dark: false },
};

export const THEME_LIST: (ThemeChoice)[] = [
  "system", "light", "dark", "midnight", "nord", "rose",
];

/** The "system" choice resolves to light or dark based on OS pref. */
function osPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/** Resolve "system" → actual ThemeName. */
function resolve(choice: ThemeChoice): ThemeName {
  if (choice === "system") return osPrefersDark() ? "dark" : "light";
  return choice;
}

/** Reads the actual applied theme from the DOM. */
export function currentTheme(): ThemeName {
  if (typeof document === "undefined") return "light";
  const v = document.documentElement.getAttribute("data-theme");
  if (v && v in THEMES) return v as ThemeName;
  return "light";
}

/** Reads the user's stored choice. */
export function storedChoice(): ThemeChoice {
  if (typeof document === "undefined") return "system";
  try {
    const v = localStorage.getItem("theme");
    if (v && (THEME_LIST as string[]).includes(v)) return v as ThemeChoice;
  } catch { /* private mode */ }
  return "system";
}

// --- OS preference listener (for "system" mode) ---

let systemMql: MediaQueryList | null = null;
let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function startSystemListener() {
  if (systemMql) return;
  if (typeof window === "undefined") return;
  systemMql = window.matchMedia("(prefers-color-scheme: dark)");
  systemListener = () => {
    if (storedChoice() === "system") applyTheme("system");
  };
  systemMql.addEventListener("change", systemListener);
}

function stopSystemListener() {
  if (systemMql && systemListener) {
    systemMql.removeEventListener("change", systemListener);
    systemMql = null;
    systemListener = null;
  }
}

/** Applies a theme choice to the DOM + persistence. */
export function applyTheme(choice: ThemeChoice) {
  if (typeof document === "undefined") return;

  const theme = resolve(choice);
  document.documentElement.setAttribute("data-theme", theme);

  try { localStorage.setItem("theme", choice); } catch { /* private */ }

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEMES[theme].paper;

  if (choice === "system") startSystemListener();
  else stopSystemListener();
}

/** Cycle through all themes in order. */
export function cycleTheme(): ThemeChoice {
  const cur = storedChoice();
  const idx = THEME_LIST.indexOf(cur);
  const next = THEME_LIST[(idx + 1) % THEME_LIST.length];
  applyTheme(next);
  return next;
}
