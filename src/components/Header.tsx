/**
 * Header.tsx (client) — plan S9 + ui-ux-design.md P0
 * Sticky top nav: logo, desktop section links, "currently learning"
 * momentum badge (plan §4.2 core), GitHub icon and ThemeToggle.
 * Mobile: a hamburger toggles a dropdown panel with the same links
 * at 44px touch-target height (skill UX #22) — the desktop nav is
 * hidden below md, so phones had NO navigation before this fix.
 * Adds a soft shadow once the page is scrolled.
 */
"use client";

import { Menu, Search, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { openCommandPalette } from "./ui/CommandPalette";
import BrandIcon from "./ui/BrandIcon";
import Kbd from "./ui/Kbd";
import ThemeToggle from "./ThemeToggle";
import Tooltip from "./ui/Tooltip";
import { useSmartNav } from "@/lib/smartNav";

interface HeaderProps {
  name: string;
  currentlyLearning: string;
  github: string;
  /** Phase 10: availability line from the CMS (recruiter-first) —
   *  hidden when empty; shown only on very wide screens so the nav
   *  never crowds. */
  availability?: string;
}

/** `id` drives the active state (scrollspy on home, pathname on pages);
 *  `href` is the logical destination — #anchors resolve via smartNav so
 *  they work from ANY page (P23). Blog points at the archive (/blog) —
 *  the full notes collection — not the home teaser section. */
const NAV_LINKS = [
  { id: "skills", href: "#skills", label: "skills" },
  { id: "galaxy", href: "/detailed-galaxy", label: "galaxy" }, // full explorer page (Galaxy v4)
  { id: "projects", href: "#projects", label: "projects" },
  { id: "blog", href: "/blog", label: "blog" },
  { id: "contact", href: "#contact", label: "contact" },
];

/** Home-only section ids the scrollspy tracks. */
const SCROLLSPY_IDS = ["skills", "projects", "blog", "contact"];

/** Phase 9 color: each nav item gets its section's topic hue when it's
 *  the one you're on — the underline + text answer "where am I" in
 *  color, matching the SectionRail dots and section eyebrows. */
const NAV_HUE: Record<string, string> = {
  skills: "var(--color-topic-cloud)",
  galaxy: "var(--color-accent)",
  projects: "var(--color-topic-devops)",
  blog: "var(--color-topic-linux)",
  contact: "var(--color-topic-mars)",
};
const NAV_TEXT_ACTIVE: Record<string, string> = {
  skills: "text-topic-cloud-deep",
  galaxy: "text-accent",
  projects: "text-topic-devops-deep",
  blog: "text-topic-linux-deep",
  contact: "text-topic-mars-deep",
};

/** Smart <a>: right-click/middle-click/⌘-click fall through to the
 *  browser (real resolved href); plain clicks navigate in-app. */
function navClickHandler(navigate: (href: string) => void, href: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
}

export default function Header({ name, currentlyLearning, github, availability }: HeaderProps) {
  const pathname = usePathname();
  const { navigate, hrefFor } = useSmartNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Page scroll progress 0–1 — drives the "flight path" line below the
   *  header (plan §4.2 optional, ui-ux-design.md P2). */
  const [progress, setProgress] = useState(0);
  /** Scrollspy: the section currently in view, highlighted in the nav. */
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // One passive scroll listener drives: the header shadow, the flight-
  // path progress line, and the scrollspy (which section is in view).
  // Only meaningful on home — the section ids don't exist on other
  // pages, so the probe is gated on isHome (P23).
  const isHome = pathname === "/";
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);

      // Scrollspy: the last section whose top passed ~35% of the viewport.
      let current: string | null = null;
      if (isHome) {
        const probe = Math.min(window.scrollY + window.innerHeight * 0.35, doc.scrollHeight - 1);
        for (const id of SCROLLSPY_IDS) {
          const el = document.getElementById(id);
          if (el && el.offsetTop <= probe) current = id;
        }
      }
      setActiveSection(current);
    };
    onScroll(); // set initial state without waiting for a scroll event
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  // Active nav item: scrollspy on home, else the page you're on
  // (galaxy highlighted in the explorer, blog on archive/post pages).
  const activeId =
    activeSection ??
    (pathname.startsWith("/blog") ? "blog" : pathname === "/detailed-galaxy" ? "galaxy" : null);

  // Close the mobile panel on Escape so keyboard users never get stuck.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // BUGFIX: close it on browser back/forward too (popstate) — plain
  // link clicks already close it in the handler, but back/forward
  // left the panel open over the new page. (setState only runs in the
  // event callback — stays React-Compiler lint-clean.)
  useEffect(() => {
    if (!menuOpen) return;
    const onPop = () => setMenuOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [menuOpen]);

  // `/` opens the command palette (Google/Linear muscle memory). Never
  // hijacks typing into a real input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      )
        return;
      e.preventDefault();
      openCommandPalette();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-card-border bg-paper/70 backdrop-blur-xl transition-shadow supports-[backdrop-filter]:bg-paper/60 ${
        scrolled ? "shadow-card" : ""
      }`}
    >
      {/* Color pass: a 3px gradient hairline sits on the very top edge —
          identity color at the top of every page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent-cyan to-topic-ai"
      />
      {/* P25: the bar compacts on scroll (py-3 → py-2) — subtle, feels alive */}
      <div
        className={`mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 transition-[padding] duration-200 ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        {/* Logo — #hero on home (scroll to top), /#hero elsewhere.
            No aria-label: the visible name IS the accessible name (the
            P25 a11y audit flags mismatched label vs. visible text). */}
        <a
          href={hrefFor("#hero")}
          onClick={navClickHandler(navigate, "#hero")}
          className="font-display text-lg font-semibold tracking-tight text-ink transition-colors hover:text-accent"
        >
          {name}
          <span className="text-accent">.</span>
        </a>

        {/* Nav (desktop) */}
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const active = link.id === activeId;
            return (
              <a
                key={link.id}
                href={hrefFor(link.href)}
                onClick={navClickHandler(navigate, link.href)}
                aria-current={active ? "page" : undefined}
                className={`nav-link relative font-mono text-xs transition-colors hover:text-accent ${
                  active
                    ? `nav-link-active font-medium ${NAV_TEXT_ACTIVE[link.id] ?? "text-accent"}`
                    : "text-ink-soft"
                }`}
                style={
                  active
                    ? ({ "--nav-hue": NAV_HUE[link.id] ?? "var(--color-accent)" } as CSSProperties)
                    : undefined
                }
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Command palette trigger (P7) — ⌘K or / from anywhere */}
          <Tooltip label="Jump anywhere — Ctrl+K or /">
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open command palette (Ctrl+K)"
              className="hidden h-9 items-center gap-2 rounded-full border border-card-border bg-card px-3 font-mono text-xs text-ink-faint transition-colors hover:border-accent/40 hover:text-ink md:inline-flex"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>jump…</span>
              <Kbd>⌘K</Kbd>
            </button>
          </Tooltip>
          {/* Momentum badge (plan §4.2 core) — header, desktop+ */}
          {/* P18: the momentum badge is a shortcut INTO the galaxy — the
              "currently learning" topic lives there as a planet */}
          <a
            href="/detailed-galaxy"
            title="See this topic in the learning galaxy"
            className="hidden items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1 text-xs text-ink-soft transition-colors hover:border-accent/40 hover:text-accent lg:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" aria-hidden="true" />
            learning: {currentlyLearning}
          </a>
          {/* Phase 10: availability pill — recruiter-first signal, same
              CMS line as the hero/contact; xl+ only to protect the nav. */}
          {availability && (
            <span
              title="Availability"
              className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 xl:inline-flex"
            >
              <span
                aria-hidden="true"
                className="relative flex h-1.5 w-1.5"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {availability}
            </span>
          )}
          <Tooltip label="GitHub profile">
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile (opens in a new tab)"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              <BrandIcon name="github" className="h-5 w-5" aria-hidden="true" />
            </a>
          </Tooltip>
          <Tooltip label="Toggle theme">
            <ThemeToggle />
          </Tooltip>

          {/* Mobile menu toggle — md:hidden; links live in the panel below */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-colors hover:text-accent md:hidden"
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Flight-path scroll progress (plan §4.2) — gradient accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-transparent"
      >
        <div
          className="h-full bg-gradient-to-r from-accent via-accent-cyan to-accent-cyan/40 transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Mobile nav panel (rendered under the header row) */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-card-border bg-paper/95 backdrop-blur-sm md:hidden"
        >
          <ul className="mx-auto max-w-5xl space-y-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={hrefFor(link.href)}
                  onClick={(e) => {
                    navClickHandler(navigate, link.href)(e); // navigate (if plain click)
                    setMenuOpen(false); // …and close the panel either way
                  }}
                  aria-current={link.id === activeId ? "page" : undefined}
                  className={`block rounded-lg px-3 py-3 font-mono text-sm transition-colors hover:bg-accent-soft hover:text-accent ${
                    // P26: the mobile menu shows where you are, like desktop;
                    // Phase 9: colored by the section's topic hue
                    link.id === activeId
                      ? `font-medium ${NAV_TEXT_ACTIVE[link.id] ?? "text-accent"}`
                      : "text-ink-soft"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openCommandPalette();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left font-mono text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Jump anywhere…
                <span className="ml-auto">
                  <Kbd>⌘K</Kbd>
                </span>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
