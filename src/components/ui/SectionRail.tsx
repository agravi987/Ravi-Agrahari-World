/**
 * SectionRail.tsx (client) — desktop section-scroll dot rail (UI/UX pass).
 * A slim vertical column on the right edge showing each section as a
 * topic-hued dot. The active section glows/expands; clicking a dot
 * smooth-scrolls to that section. Only renders on home ("/" pathname)
 * and on desktop (hidden below xl).
 *
 * Gives the portfolio that top-MNC "you are here" navigation feel
 * without cluttering the reading surface.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface RailSection {
  id: string;
  label: string;
  hue: string;
}

const RAIL_SECTIONS: RailSection[] = [
  { id: "skills", label: "Skills", hue: "bg-topic-cloud" },
  { id: "projects", label: "Projects", hue: "bg-topic-devops" },
  { id: "experience", label: "Experience", hue: "bg-topic-linux" },
  { id: "certifications", label: "Certs", hue: "bg-topic-ai" },
  { id: "blog", label: "Blog", hue: "bg-topic-ice" },
  { id: "contact", label: "Contact", hue: "bg-topic-mars" },
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
    // One DOM probe on mount (deferred a frame so the DOM is settled):
    // every rendered section (or its lazy placeholder) carries its
    // anchor id already.
    const mountProbe = requestAnimationFrame(() => {
      setExisting(
        new Set(RAIL_SECTIONS.filter((s) => document.getElementById(s.id)).map((s) => s.id))
      );
    });
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const probeY = window.scrollY + window.innerHeight * 0.35;
        let found: string | null = null;
        for (const s of RAIL_SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.offsetTop <= probeY) found = s.id;
        }
        setActive(found);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(mountProbe);
      window.removeEventListener("scroll", onScroll);
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
                  ? `${s.hue} h-3.5 w-3.5 shadow-[0_0_0_3px] shadow-current`
                  : "h-2 w-2 bg-card-border hover:h-2.5 hover:w-2.5 hover:bg-ink-faint"
              }`}
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