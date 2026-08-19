/**
 * scrollTo.ts — section scrolling that respects prefers-reduced-motion.
 *
 * The CSS media query only governs `scroll-behavior`; an explicit
 * scrollIntoView({ behavior: "smooth" }) overrides it, so reduced-
 * motion users still got smooth jumps from the nav, palette and
 * shortcuts. This helper checks the media query itself.
 */

/** Smooth-scrolls to an element id. Returns false when it doesn't exist
 *  (callers then fall back to navigating home with the hash). */
export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  return true;
}
