/**
 * SectionRail.tsx (client) — desktop section-scroll dot rail (UI/UX pass).
 * A slim vertical column on the right edge showing each section as a
 * topic-hued dot. The active section glows/expands; clicking a dot
 * smooth-scrolls to that section. Only renders on home ("/" pathname)
 * and on desktop (hidden below xl).
 *
 * FIX: the old detector compared `el.offsetTop` (document-relative,
 * offsetParent-dependent) against a `window.scrollY`-based probe line.
 * Two things broke it: (1) the home page applies `content-visibility:
 * auto` to all top-level blocks, so below-fold sections are sized from
 * `contain-intrinsic-size` (480px) until rendered — their `offsetTop`
 * therefore drifts until the browser computes the real height; and
 * (2) any positioned ancestor shifts the offsetParent origin, so the
 * coordinates never matched the scroll probe. The detector now works
 * entirely in VIEWPORT coordinates — `getBoundingClientRect().top`
 * compared against `innerHeight * 0.35` — which is always the live
 * geometry: immune to lazy sizing, reveal transforms, and ancestor
 * positioning. `resize` is re-checked too, since lazy layout reflows
 * and image loads change section heights without a scroll event.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface RailSection {
  id: string;
  label: string;
  /** Topic-hue background class for the dot fill. */
  bg: string;
  /** Matching CSS variable, used for the active halo (color-mix). */
  ring: string;
}

const RAIL_SECTIONS: RailSection[] = [
  { id: "skills", label: "Skills", bg: "bg-topic-cloud", ring: "var(--color-topic-cloud)" },
  { id: "projects", label: "Projects", bg: "bg-topic-devops", ring: "var(--color-topic-devops)" },
  { id: "experience", label: "Experience", bg: "bg-topic-linux", ring: "var(--color-topic-linux)" },
  { id: "certifications", label: "Certs", bg: "bg-topic-ai", ring: "var(--color-topic-ai)" },
  { id: "blog", label: "Blog", bg: "bg-topic-ice", ring: "var(--color-topic-ice)" },
  { id: "contact", label: "Contact", bg: "bg-topic-mars", ring: "var(--color-topic-mars)" },
];

export default function SectionRail() {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  // Sections actually present in the DOM — CMS-hidden sections render
  // no element (and no LazyMount placeholder), so their dot is omitted
  // instead of offering a dead anchor.
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (pathname !== "/") return; // home-only

    /** The last section whose top sits above the 35% probe line is the
     *  one you're in. Viewport-reads only — see the FIX note in the
     *  file header. rAF-throttled so a pass can't run mid-frame. */
    const updateActive = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const probeY = window.innerHeight * 0.35;
        let found: string | null = null;
        for (const s of RAIL_SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= probeY) found = s.id;
        }
        setActive(found);
      });
    };

    // One DOM probe on mount (deferred a frame so the DOM is settled):
    // every rendered section (or its lazy placeholder) carries its
    // anchor id already.
    const mountProbe = requestAnimationFrame(() => {
      setExisting(
        new Set(RAIL_SECTIONS.filter((s) => document.getElementById(s.id)).map((s) => s.id))
      );
      updateActive();
    });

    window.addEventListener("scroll", updateActive, { passive: true });
    // content-visibility reflows + image loads resize sections w/o scroll.
    window.addEventListener("resize", updateActive, { passive: true });
    return () => {
      cancelAnimationFrame(mountProbe);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
      cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <nav
      aria-label="Section quick navigation"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex"
    >
      {RAIL_SECTIONS.filter((s) => existing.has(s.id)).map((s) => {
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            title={s.label}
            // Icon-only nav targets need a real accessible name (the
            // title alone is unreliable — audit #44), and the active dot
            // should announce itself as the current section.
            aria-label={s.label}
            aria-current={isActive ? "true" : undefined}
            className="group relative flex items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? `${s.bg} h-3.5 w-3.5`
                  : "h-2 w-2 bg-card-border group-hover:h-2.5 group-hover:w-2.5 group-hover:bg-ink-faint"
              }`}
              // Phase 9 halo: a soft ring in the section's own topic hue
              // (was shadow-current = ink — never matched the dot fill).
              style={
                isActive
                  ? {
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${s.ring} 45%, transparent)`,
                    }
                  : undefined
              }
            />
            <span className="absolute right-full mr-3 whitespace-nowrap rounded-md border border-card-border bg-card px-2 py-1 font-mono text-[10px] text-ink-soft opacity-0 shadow-card transition-opacity duration-200 group-hover:opacity-100">
              {s.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}