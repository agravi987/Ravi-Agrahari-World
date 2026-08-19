/**
 * smartNav.ts — the single source of truth for site navigation (P23).
 *
 * The bug it fixes: section anchors (`#skills`, `#projects`, …) only
 * exist on the home page, so every nav surface that used plain
 * `<a href="#…">` DIED on `/detailed-galaxy`, `/blog`, `/blog/[slug]`
 * and the 404 — click → nothing happens. This module makes every
 * anchor work from anywhere:
 *
 *   "#skills"   on home   → smooth-scroll in place (header offset via
 *                           html scroll-padding)
 *   "#skills"   elsewhere → router.push("/#skills") — Next navigates
 *                           home and scrolls to the section after render
 *   "/page"               → router.push(page)
 *
 * `hrefFor()` renders the *resolved* href attribute (so middle-click /
 * open-in-new-tab also lands correctly), while `navigate()` handles the
 * in-app click. Used by Header, Footer, Shortcuts and the terminal.
 */
"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { scrollToSection } from "@/lib/scrollTo";

/** Home is the only page that carries the section anchors. */
export function isHomePath(pathname: string): boolean {
  return pathname === "/";
}

/** Resolve a nav href so it works from ANY page:
 *  "#skills" → "#skills" on home, "/#skills" elsewhere. */
export function smartHref(pathname: string, href: string): string {
  if (href.startsWith("#")) return isHomePath(pathname) ? href : `/${href}`;
  return href;
}

/**
 * useSmartNav() — navigation that works from every page.
 * Returns { navigate, hrefFor, isHome, pathname }.
 */
export function useSmartNav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const navigate = useCallback(
    (href: string) => {
      if (href.startsWith("#")) {
        if (isHomePath(pathname)) {
          // Reduced-motion-aware: the CSS media query only governs
          // scroll-behavior; an explicit smooth call overrides it.
          scrollToSection(href.slice(1));
        } else {
          router.push(`/${href}`);
        }
        return;
      }
      router.push(href);
    },
    [pathname, router]
  );

  const hrefFor = useCallback((href: string) => smartHref(pathname, href), [pathname]);

  return { pathname, navigate, hrefFor, isHome: isHomePath(pathname) };
}
