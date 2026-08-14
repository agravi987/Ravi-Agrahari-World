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

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import BrandIcon from "./ui/BrandIcon";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  name: string;
  currentlyLearning: string;
  github: string;
}

const NAV_LINKS = [
  { href: "#skills", label: "skills" },
  { href: "#galaxy", label: "galaxy" },
  { href: "#projects", label: "projects" },
  { href: "#blog", label: "blog" },
  { href: "#contact", label: "contact" },
];

export default function Header({ name, currentlyLearning, github }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Shadow once past the very top — cheap scroll listener, passive.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // set initial state without waiting for a scroll event
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile panel on Escape so keyboard users never get stuck.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-card-border bg-paper/80 backdrop-blur-sm transition-shadow ${
        scrolled ? "shadow-card" : ""
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <a href="#hero" className="font-display text-lg font-semibold tracking-tight text-ink">
          {name}
          <span className="text-accent">.</span>
        </a>

        {/* Nav (desktop) */}
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs text-ink-soft transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Momentum badge (plan §4.2 core) — header, desktop+ */}
          <span className="hidden items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1 text-xs text-ink-soft lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" aria-hidden="true" />
            learning: {currentlyLearning}
          </span>
          <a
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="text-ink-soft transition-colors hover:text-accent"
          >
            <BrandIcon name="github" className="h-5 w-5" aria-hidden="true" />
          </a>
          <ThemeToggle />

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

      {/* Mobile nav panel (rendered under the header row) */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-card-border bg-paper/95 backdrop-blur-sm md:hidden"
        >
          <ul className="mx-auto max-w-5xl space-y-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)} // navigate + close
                  className="block rounded-lg px-3 py-3 font-mono text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
