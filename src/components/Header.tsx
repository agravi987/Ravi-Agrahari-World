/**
 * Header.tsx (client)
 * Sleek High-End Tech Navbar (Stripe & GitHub Universe inspired with Cyber HUD touches).
 * Full-width edge-to-edge frosted glass bar with glowing bottom separator,
 * live telemetry status dot, monospace section indexing, Command Palette trigger,
 * and glowing quick CTA.
 */
"use client";

import { Menu, Search, X, Terminal, ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { openCommandPalette } from "./ui/CommandPalette";
import BrandIcon from "./ui/BrandIcon";
import CmdKey from "./ui/CmdKey";
import Tooltip from "./ui/Tooltip";
import { useSmartNav } from "@/lib/smartNav";
import type { SectionsEnabled } from "@/types";

interface HeaderProps {
  name: string;
  currentlyLearning: string;
  github: string;
  sectionsEnabled: SectionsEnabled;
}

const NAV_ITEMS: {
  id: string;
  href: string;
  tag: string;
  label: string;
  section?: keyof SectionsEnabled;
}[] = [
  { id: "hero", href: "#hero", tag: "00", label: "ABOUT" },
  { id: "skills", href: "#skills", tag: "01", label: "SKILLS", section: "skills" },
  { id: "galaxy", href: "/detailed-galaxy", tag: "02", label: "GALAXY", section: "galaxy" },
  { id: "projects", href: "#projects", tag: "03", label: "PROJECTS", section: "projects" },
  { id: "experience", href: "#experience", tag: "04", label: "EXPERIENCE", section: "experience" },
  { id: "blog", href: "/blog", tag: "05", label: "BLOG", section: "blog" },
  { id: "contact", href: "#contact", tag: "06", label: "CONTACT", section: "contact" },
];

const SCROLLSPY_IDS = ["hero", "skills", "projects", "experience", "blog", "contact"];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("hero");
  const isHome = pathname === "/";

  const navLinks = NAV_ITEMS.filter(
    (l) => !l.section || sectionsEnabled[l.section] !== false
  );

  // Monitor scroll for styling compaction
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for active section highlight
  useEffect(() => {
    if (!isHome) return;
    const visible = new Map<string, boolean>();
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set((e.target as HTMLElement).id, e.isIntersecting);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          let current: string | null = null;
          for (const id of SCROLLSPY_IDS) {
            if (visible.get(id)) {
              current = id;
              break;
            }
          }
          if (current) setActiveSection(current);
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
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

  const activeId =
    (pathname.startsWith("/blog")
      ? "blog"
      : pathname === "/detailed-galaxy"
      ? "galaxy"
      : activeSection) || "hero";

  // Global keydown handler for '/' shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable ||
        target?.closest?.("[contenteditable]")
      )
        return;
      e.preventDefault();
      openCommandPalette();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock scroll on mobile menu open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#070b14]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            : "bg-[#070b14]/60 backdrop-blur-md border-b border-white/[0.05]"
        }`}
      >
        {/* Subtle luminous accent bar at bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 via-indigo-500/30 to-transparent"
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-18 transition-all">
          {/* Brand Identity / Terminal Tag */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={hrefFor("#hero")}
              onClick={navClickHandler(navigate, "#hero")}
              className="group flex items-center gap-2.5 focus-visible:outline-accent"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.45)]">
                <span className="relative z-10">&gt;_</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  {name}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 font-medium tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SYSTEM ONLINE
                </span>
              </div>
            </a>
          </div>

          {/* Central Monospace Navigation */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => {
              const isActive = item.id === activeId;
              return (
                <a
                  key={item.id}
                  href={hrefFor(item.href)}
                  onClick={navClickHandler(navigate, item.href)}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs tracking-wider transition-all duration-200 ${
                    isActive
                      ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold transition-colors ${
                      isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-cyan-500/70"
                    }`}
                  >
                    {item.tag}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 h-[2px] w-6 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Command Trigger */}
            <Tooltip label="Command Launcher (Ctrl+K or /)">
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label="Open command palette"
                className="hidden sm:inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 font-mono text-[11px] text-slate-300 transition-all hover:border-cyan-500/40 hover:bg-white/[0.08] hover:text-white"
              >
                <Search className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span className="tracking-wide">SEARCH</span>
                <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-semibold text-slate-400">
                  /
                </span>
              </button>
            </Tooltip>

            {/* GitHub Link */}
            <Tooltip label="GitHub Repository / Profile">
              <a
                href={`https://github.com/${github}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-cyan-500/40 hover:bg-white/[0.08] hover:text-white"
              >
                <BrandIcon name="github" className="h-4 w-4" aria-hidden="true" />
              </a>
            </Tooltip>

            {/* Primary Contact CTA Button */}
            <a
              href={hrefFor("#contact")}
              onClick={navClickHandler(navigate, "#contact")}
              className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all hover:brightness-110 hover:shadow-[0_0_22px_rgba(6,182,212,0.55)] active:scale-95"
            >
              <span className="tracking-wide">INIT_CONTACT</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:text-white hover:bg-white/[0.08]"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          id="mobile-nav-panel"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xl lg:hidden flex flex-col justify-start pt-20 px-4"
        >
          <div className="relative rounded-2xl border border-cyan-500/30 bg-[#070b14]/95 p-5 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-semibold text-cyan-400 tracking-wider">
                NAVIGATION_MENU
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            <ul className="py-3 space-y-1">
              {navLinks.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <li key={item.id}>
                    <a
                      href={hrefFor(item.href)}
                      onClick={(e) => {
                        navClickHandler(navigate, item.href)(e);
                        setMenuOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 font-mono text-sm transition-colors ${
                        isActive
                          ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.tag}</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openCommandPalette();
                }}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-xs text-slate-300 hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-cyan-400" />
                  JUMP TO SECTION
                </span>
                <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] font-semibold text-slate-400">
                  Ctrl+K
                </span>
              </button>

              <a
                href={hrefFor("#contact")}
                onClick={(e) => {
                  navClickHandler(navigate, "#contact")(e);
                  setMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2.5 font-mono text-xs font-bold text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.35)]"
              >
                <span>CONNECT NOW</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
