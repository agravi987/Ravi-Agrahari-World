/**
 * CommandPalette.tsx (client) — the ⌘K command hub (P7).
 * Google/Linear-style quick switcher: Ctrl/Cmd+K from anywhere opens
 * a fuzzy-ish, keyboard-driven list — jump to a section, open the
 * galaxy, read a post, copy the email, toggle theme, open the hidden
 * terminal. Zero dependencies (custom, tiny — no Radix needed for a
 * listbox this small).
 *
 * Keyboard: ↑/↓ move, Enter runs, Escape closes (focus restored),
 * click-outside closes. Reduced-motion users get instant open.
 *
 * Exposes `openCommandPalette()` (module store) so the header button
 * and the mobile nav can trigger it without prop drilling.
 */
"use client";

import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Copy,
  Flower2,
  Home,
  Monitor,
  Moon,
  MoonStar,
  Rocket,
  Search,
  Snowflake,
  Sun,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { scrollToSection } from "@/lib/scrollTo";
import { applyTheme, cycleTheme, previewTheme, storedChoice, THEMES, THEME_LIST, type ThemeChoice } from "@/lib/theme";
import { showToast } from "@/components/ui/Toast";

/* --- Tiny module store: lets the header button open the palette --- */

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

/** Call from anywhere (header button, footer hint, mobile nav). */
export function openCommandPalette() {
  notify();
}

/* --- Types + data --- */

export interface PalettePost {
  title: string;
  slug: string;
  /** Phase 13: excerpt + tags feed the palette's post search keywords
   *  (title, excerpt and tags match; bodies stay server-side). */
  excerpt?: string;
  tags?: string[];
}

export interface PaletteProject {
  title: string;
  description?: string;
}

export interface PalettePlanet {
  name: string;
  slug: string;
}

interface Action {
  id: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  keywords: string;
  run: () => void;
  /** Live preview while the row is highlighted (theme rows) — the
   *  palette restores the original theme when the highlight moves off
   *  or the palette closes without running. */
  preview?: () => void;
}

/** lucide icon per theme choice (mirrors ThemeToggle's map). */
const THEME_ICONS: Record<ThemeChoice, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  midnight: MoonStar,
  nord: Snowflake,
  rose: Flower2,
};

// (shared reduced-motion-aware helper from @/lib/scrollTo)

export default function CommandPalette({
  email,
  github,
  projects,
  posts,
  planets = [],
}: {
  email: string;
  github: string;
  projects: PaletteProject[];
  posts: PalettePost[];
  /** Phase 15 (#13): galaxy planets — searchable by name/slug. */
  planets?: PalettePlanet[];
}) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Open with a clean slate (query + selection) — called only from
  // event callbacks (keydown, store notify), never from an effect
  // (lint: set-state-in-effect). Focus happens after paint.
  const originalThemeRef = useRef<ThemeChoice>("system");
  const openPalette = useCallback(() => {
    lastTriggerRef.current = document.activeElement as HTMLElement | null;
    originalThemeRef.current = storedChoice(); // theme previews restore to this
    setQuery("");
    setIndex(0);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const closePalette = useCallback(() => {
    // A theme row may be left highlighted — undo the preview so closing
    // without running never changes the theme.
    previewTheme(originalThemeRef.current);
    setOpen(false);
    lastTriggerRef.current?.focus?.();
  }, []);

  // Module store: header button / mobile nav → open.
  useEffect(() => subscribe(() => openPalette()), [openPalette]);

  // Global Ctrl/Cmd+K (the terminal moved to Ctrl+Shift+K in P7).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) closePalette();
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette, closePalette]);

  // Escape + click-outside close (with focus restore) + focus trap:
  // Tab / Shift+Tab cycle inside the dialog so keyboard users can't
  // tab out into the page behind an open modal (P16).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePalette();
        return;
      }
      if (e.key !== "Tab") return;
      const el = dialogRef.current;
      if (!el) return;
      const focusables = [...el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !el.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !el.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closePalette]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied to clipboard");
    } catch {
      /* clipboard unavailable — the action still closes */
    }
  }, [email]);

  const openTerminal = useCallback(() => {
    window.dispatchEvent(new CustomEvent("orbital:open-terminal"));
  }, []);

  // SPA nav via the router — the old window.location.href did a FULL
  // page reload for every palette jump (perf + a white flash).
  const go = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  /* --- Phase 10: "Recent" — last-used destinations persist in
     localStorage and lead the list when the query is empty
     (Spotlight-style muscle memory). --------------------------- */
  const RECENT_KEY = "orbital:palette-recent";
  const MAX_RECENT = 4;

  const getRecent = useCallback((): string[] => {
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
      return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }, []);

  const pushRecent = useCallback((id: string) => {
    try {
      const next = [id, ...getRecent().filter((x) => x !== id)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* private mode — recents just don't persist */
    }
  }, [getRecent]);

  /** Actions are rebuilt on open so DOM-scanned sections stay fresh.
   *  SSR-safe: `document` only exists on the client — the palette is
   *  closed (returns null) during server render, so sections resolve
   *  to [] and the static pages/posts/commands still show. */
  const actions = useMemo<Action[]>(() => {
    const sections =
      typeof document === "undefined"
        ? []
        : [...document.querySelectorAll<HTMLElement>("main section[id]")].map((sec) => {
      const h = sec.querySelector("h2, h3");
      const title = h?.textContent?.trim() || sec.id;
      return {
        id: `section:${sec.id}`,
        label: title,
        hint: `~/${sec.id}`,
        icon: ArrowDown,
          keywords: `${sec.id} section ${title}`,
          // P23: sections only exist on home — on other pages the
          // palette used to do NOTHING. Fall back to navigating home
          // with the hash (Next scrolls after render).
          run: () => {
            if (!scrollToSection(sec.id)) go(`/#${sec.id}`);
          },
        };
      });

    const pages: Action[] = [
      {
        id: "home",
        label: "Home",
        hint: "/",
        icon: Home,
        keywords: "home top landing",
        run: () => go("/"),
      },
      {
        id: "galaxy",
        label: "Learning Galaxy",
        hint: "3D explorer",
        icon: Rocket,
        keywords: "galaxy planets moons 3d explorer",
        run: () => go("/detailed-galaxy"),
      },
    ];

    // Theme rows: highlight previews live, Enter commits. "Cycle" stays
    // for muscle memory (and the header toggle's keyboard sibling).
    const themeActions: Action[] = THEME_LIST.map((choice) => ({
      id: `theme:${choice}`,
      label: `Theme: ${choice === "system" ? "System" : THEMES[choice].label}`,
      hint: "live preview",
      icon: THEME_ICONS[choice],
      keywords: `theme ${choice} appearance color mode ${choice === "system" ? "auto os" : THEMES[choice].label}`,
      preview: () => previewTheme(choice),
      run: () => {
        applyTheme(choice);
        showToast(choice === "system" ? "Theme: System" : `Theme: ${THEMES[choice].label}`);
      },
    }));

    const commands: Action[] = [
      {
        id: "terminal",
        label: "Open hidden terminal",
        hint: "Ctrl+Shift+K",
        icon: Terminal,
        keywords: "terminal easter egg shell",
        run: openTerminal,
      },
      {
        id: "theme",
        label: "Cycle theme",
        icon: Moon,
        keywords: "theme dark light mode color cycle next",
        run: () => {
          const next = cycleTheme();
          showToast(`Theme: ${next === "system" ? "System" : THEMES[next].label}`);
        },
      },
      ...themeActions,
      {
        id: "email",
        label: "Copy email address",
        hint: email,
        icon: Copy,
        keywords: "email contact copy mail",
        run: copyEmail,
      },
      {
        id: "github",
        label: "GitHub profile",
        hint: "opens in a new tab",
        icon: Home,
        keywords: "github repo code profile",
        run: () => window.open(`https://github.com/${github}`, "_blank", "noopener"),
      },
    ];

    const projectActions: Action[] = projects.slice(0, 8).map((p) => ({
      id: `project:${p.title}`,
      label: p.title,
      hint: "project",
      icon: BookOpen,
      keywords: `project ${p.title} ${p.description ?? ""}`,
      run: () => {
        if (!scrollToSection("projects")) go("/#projects");
      },
    }));

    // Phase 15 (#13): each galaxy planet jumps to its deep-link.
    const planetActions: Action[] = planets.map((pl) => ({
      id: `planet:${pl.slug}`,
      label: pl.name,
      hint: "galaxy planet",
      icon: Rocket,
      keywords: `planet galaxy ${pl.name} ${pl.slug}`,
      run: () => go(`/detailed-galaxy#planet-${pl.slug}`),
    }));

    const postActions: Action[] = posts.map((p) => ({
      id: `post:${p.slug}`,
      label: p.title,
      hint: "blog post",
      icon: BookOpen,
      // Phase 13: search the post by title, tags OR excerpt — the note
      // you half-remember finds you.
      keywords: `blog post ${p.title} ${(p.tags ?? []).join(" ")} ${p.excerpt ?? ""}`,
      run: () => go(`/blog/${p.slug}`),
    }));

    return [...pages, ...sections, ...commands, ...projectActions, ...planetActions, ...postActions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, email, github, projects, posts, planets]);

  /** Resolved recent actions (ids that still exist in `actions`). */
  const recents = useMemo<Action[]>(
    () =>
      getRecent()
        .map((id) => actions.find((a) => a.id === id))
        .filter((a): a is Action => Boolean(a)),
    [actions, getRecent]
  );

  // Empty query → recents lead (deduped), then everything else.
  const base = useMemo<Action[]>(() => {
    if (query.trim()) return actions;
    if (recents.length === 0) return actions;
    const recentIds = new Set(recents.map((r) => r.id));
    return [...recents, ...actions.filter((a) => !recentIds.has(a.id))];
  }, [actions, recents, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((a) => a.keywords.toLowerCase().includes(q));
  }, [base, query]);

  // Clamp the selection to the list — derived, never setState-in-effect.
  const safeIndex = filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1);

  // Keep the active row visible while arrowing (DOM-only — allowed),
  // and drive live theme previews: highlighting a theme row previews
  // it; moving off any row restores the original until Enter commits.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-palette-row="${safeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
    if (!open) return;
    const a = filtered[safeIndex];
    if (a?.preview) a.preview();
    else previewTheme(originalThemeRef.current);
  }, [safeIndex, filtered, open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/30 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette — jump anywhere"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setOpen(false);
          lastTriggerRef.current?.focus?.();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-card border border-card-border bg-card shadow-orbital">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-card-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const a = filtered[safeIndex];
                if (a) {
                  pushRecent(a.id);
                  setOpen(false);
                  a.run();
                }
              }
            }}
            placeholder="Type to jump — sections, projects, posts, actions…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={filtered[safeIndex] ? `palette-${filtered[safeIndex].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-card-border bg-paper-deep px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:inline-block">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} id="palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {/* Phase 10: a quiet "recent" divider when recents lead the list */}
          {!query.trim() && recents.length > 0 && (
            <p className="px-3 pb-1 pt-2 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-faint">
              recent
            </p>
          )}
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">
              No matches for “{query}” — try “galaxy”, “projects” or “terminal”.
            </p>
          ) : (
            filtered.map((a, i) => {
              const RowIcon = a.icon ?? ArrowUp;
              return (
                <button
                  key={a.id}
                  type="button"
                  id={`palette-${a.id}`}
                  role="option"
                  aria-selected={i === safeIndex}
                  data-palette-row={i}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => {
                    pushRecent(a.id);
                    setOpen(false);
                    a.run();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    i === safeIndex ? "bg-accent-soft text-ink" : "text-ink-soft"
                  }`}
                >
                  <RowIcon
                    className={`h-4 w-4 shrink-0 ${i === safeIndex ? "text-accent" : "text-ink-faint"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{a.label}</span>
                  {a.hint && (
                    <span className="shrink-0 font-mono text-[10px] text-ink-faint">{a.hint}</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-card-border bg-paper-deep/60 px-4 py-2 font-mono text-[10px] text-ink-faint">
          <span>↑↓ navigate · enter run · esc close</span>
          {reduceMotion ? null : <span className="hidden sm:inline">⌘K / ctrl K</span>}
        </div>
      </div>
    </div>
  );
}
