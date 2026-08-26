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
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { openCommandPalette } from "./ui/CommandPalette";
import BrandIcon from "./ui/BrandIcon";
import Kbd from "./ui/Kbd";
import ThemeToggle from "./ThemeToggle";
import Tooltip from "./ui/Tooltip";
import { useSmartNav } from "@/lib/smartNav";
import type { SectionsEnabled } from "@/types";

interface HeaderProps {
  name: string;
  currentlyLearning: string;
  github: string;
  /** CMS section toggles — nav links to hidden sections are omitted. */
  sectionsEnabled: SectionsEnabled;
  // `availability` was removed: hero + contact both render the same CMS
  // line, so a third copy in the nav was pure duplication at xl+.
}

/** `id` drives the active state (scrollspy on home, pathname on pages);
 *  `href` is the logical destination — #anchors resolve via smartNav so
 *  they work from ANY page (P23). Blog points at the archive (/blog) —
 *  the full notes collection — not the home teaser section.
 *  `section` = the sectionsEnabled key that gates the link. */
const NAV_LINKS: {
  id: string;
  href: string;
  label: string;
  section?: keyof SectionsEnabled;
}[] = [
  { id: "skills", href: "#skills", label: "skills", section: "skills" },
  { id: "galaxy", href: "/detailed-galaxy", label: "galaxy", section: "galaxy" }, // full explorer page (Galaxy v4)
  { id: "projects", href: "#projects", label: "projects", section: "projects" },
  { id: "blog", href: "/blog", label: "blog", section: "blog" },
  { id: "contact", href: "#contact", label: "contact", section: "contact" },
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

export default function Header({
  name,
  currentlyLearning,
  github,
  sectionsEnabled,
}: HeaderProps) {
  const pathname = usePathname();
  const { navigate, hrefFor } = useSmartNav();
  // Hidden sections lose their nav link (CMS-controlled, no dead anchors).
  const navLinks = NAV_LINKS.filter(
    (l) => !l.section || sectionsEnabled[l.section] !== false
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Focus management refs (mobile menu a11y).
  const headerRef = useRef<HTMLElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);
  /** Scrollspy: the section currently in view, highlighted in the nav. */
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // One passive scroll listener drives just the header shadow now.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // initial state without waiting for a scroll event
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy via IntersectionObserver — no offsetTop reads per scroll
  // event (the old probe forced layout every frame). A section counts
  // as "active" while it intersects a band around 35% viewport height;
  // when several do, the topmost wins (same semantics as before).
  const isHome = pathname === "/";
  useEffect(() => {
    if (!isHome) return;
    const visible = new Map<string, boolean>();
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set((e.target as HTMLElement).id, e.isIntersecting);
        // Coalesce bursts of entries into one state write per frame.
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          let current: string | null = null;
          for (const id of SCROLLSPY_IDS) {
            if (visible.get(id)) {
              current = id;
              break; // document order — first intersecting section is active
            }
          }
          setActiveSection(current);
        });
      },
      // The band: a section is "current" while it overlaps the zone
      // from 35% viewport height down to ~45%.
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    for (const id of SCROLLSPY_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [isHome]);

  // Active nav item: scrollspy on home, else the page you're on
  // (galaxy highlighted in the explorer, blog on archive/post pages).
  const activeId =
    activeSection ??
    (pathname.startsWith("/blog") ? "blog" : pathname === "/detailed-galaxy" ? "galaxy" : null);

  // Mobile menu a11y: Escape closes (as before) AND Tab is trapped
  // inside the header so keyboard users can't land on content behind
  // the open panel; body scroll locks so the page doesn't slide under;
  // closing returns focus to the burger (where a keyboard user left it).
  useEffect(() => {
    if (!menuOpen) {
      // Restore focus once, on the open → close transition.
      if (wasOpen.current) {
        wasOpen.current = false;
        burgerRef.current?.focus();
      }
      return;
    }
    wasOpen.current = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const root = headerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
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
      ref={headerRef}
      className={`sticky top-0 z-50 border-b border-card-border bg-paper/70 backdrop-blur-xl transition-shadow supports-[backdrop-filter]:bg-paper/60 ${
        scrolled ? "shadow-card" : ""
      }`}
    >
      {/* Subtle accent hairline — identity color at the top of every page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent/20"
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
          {navLinks.map((link) => {
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
          {/* Momentum badge (plan §4.2 core) — header, desktop+.
              Hidden when the galaxy section is off (its target). */}
          {/* P18: the momentum badge is a shortcut INTO the galaxy — the
              "currently learning" topic lives there as a planet */}
          {sectionsEnabled.galaxy !== false && (
            <a
              href={hrefFor("/detailed-galaxy")}
              onClick={navClickHandler(navigate, "/detailed-galaxy")}
              title="See this topic in the learning galaxy"
              className="hidden items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1 text-xs text-ink-soft transition-colors hover:border-accent/40 hover:text-accent lg:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" aria-hidden="true" />
              learning: {currentlyLearning}
            </a>
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
            ref={burgerRef}
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

      {/* Mobile nav panel (rendered under the header row) */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-card-border bg-paper/95 backdrop-blur-sm md:hidden"
        >
          <ul className="mx-auto max-w-5xl space-y-1 px-6 py-4">
            {navLinks.map((link) => (
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
