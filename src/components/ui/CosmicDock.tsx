/**
 * CosmicDock.tsx (client)
 * Minimalist Floating Space & Galaxy Navigation Dock.
 * Positioned cleanly at the bottom-center of the viewport.
 *
 * Updates:
 * - All links point directly to the on-page sections (#hero, #skills, #galaxy, #projects, #experience, #certifications, #blog, #contact) instead of external pages.
 * - Robust geometry-based scrollspy that tracks EXACTLY which section is in view, updating live as the user scrolls.
 * - Clicking any planetary node smoothly scrolls directly to that section on the page.
 * - Planetary orbital nodes with real topic hues, active celestial orbit rings, and trailing moon satellites.
 */
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { openCommandPalette } from "@/components/ui/CommandPalette";
import { useSmartNav } from "@/lib/smartNav";
import { scrollToSection } from "@/lib/scrollTo";
import Tooltip from "@/components/ui/Tooltip";
import type { SectionsEnabled } from "@/types";

interface CosmicDockProps {
  sectionsEnabled: SectionsEnabled;
}

type CosmicNode = {
  id: string;
  name: string;
  hue: string;
  glow: string;
  section?: keyof SectionsEnabled;
};

// All nodes represent real on-page sections on the home portfolio
const COSMIC_NODES: CosmicNode[] = [
  { id: "hero", name: "Core", hue: "#38bdf8", glow: "rgba(56,189,248,0.5)" },
  { id: "skills", name: "Skills", hue: "#818cf8", glow: "rgba(129,140,248,0.5)", section: "skills" },
  { id: "galaxy", name: "Galaxy", hue: "#c084fc", glow: "rgba(192,132,252,0.6)", section: "galaxy" },
  { id: "projects", name: "Projects", hue: "#34d399", glow: "rgba(52,211,153,0.5)", section: "projects" },
  { id: "experience", name: "Exp", hue: "#fbbf24", glow: "rgba(251,191,36,0.5)", section: "experience" },
  { id: "certifications", name: "Certs", hue: "#f472b6", glow: "rgba(244,114,182,0.5)", section: "certifications" },
  { id: "blog", name: "Blog", hue: "#67e8f9", glow: "rgba(103,232,249,0.5)", section: "blog" },
  { id: "contact", name: "Contact", hue: "#f43f5e", glow: "rgba(244,63,94,0.5)", section: "contact" },
];

export default function CosmicDock({ sectionsEnabled }: CosmicDockProps) {
  const pathname = usePathname();
  const { navigate, hrefFor } = useSmartNav();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const rafRef = useRef<number>(0);
  const isHome = pathname === "/";

  // Filter nodes according to CMS-enabled sections
  const nodes = COSMIC_NODES.filter(
    (n) => !n.section || sectionsEnabled[n.section] !== false
  );

  // Live geometry-based viewport tracker: detects accurately as you scroll across sections
  useEffect(() => {
    if (!isHome) return;

    const probeActiveSection = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Probe line sits at 40% of viewport height
        const probeY = window.innerHeight * 0.4;
        let bestSection = "hero";

        for (const node of nodes) {
          const el = document.getElementById(node.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // If the section spans across the probe line, or top is above probe line
            if (rect.top <= probeY) {
              bestSection = node.id;
            }
          }
        }

        // Bottom of page safety check (activates contact when scrolled to bottom)
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
          bestSection = "contact";
        }

        setActiveSection(bestSection);
      });
    };

    probeActiveSection();
    window.addEventListener("scroll", probeActiveSection, { passive: true });
    window.addEventListener("resize", probeActiveSection, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", probeActiveSection);
      window.removeEventListener("resize", probeActiveSection);
    };
  }, [isHome, nodes]);

  const activeId = isHome ? activeSection : (pathname.replace("/", "") || "hero");

  const handleNodeClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();

    if (isHome) {
      if (id === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        scrollToSection(id);
      }
      setActiveSection(id);
    } else {
      // If on another route, navigate home to the anchor
      navigate(`/#${id}`);
    }
  };

  return (
    <nav
      aria-label="Cosmic Planetary Dock"
      className="pointer-events-none fixed inset-x-0 bottom-5 sm:bottom-6 z-50 flex justify-center px-3"
    >
      <div className="pointer-events-auto relative flex items-center gap-1 sm:gap-2 rounded-full border border-indigo-400/25 bg-[#090e1a]/90 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_12px_45px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.25)] backdrop-blur-2xl transition-all duration-300">
        {/* Subtle top starlight hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
        />

        {/* Constellation thread line through the center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
        />

        {/* Planetary nodes */}
        {nodes.map((node) => {
          const isActive = node.id === activeId;

          return (
            <Tooltip key={node.id} label={node.name}>
              <a
                href={hrefFor(`#${node.id}`)}
                onClick={(e) => handleNodeClick(e, node.id)}
                aria-label={`Jump to section ${node.name}`}
                aria-current={isActive ? "page" : undefined}
                className="group relative flex items-center justify-center p-1.5 sm:p-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {/* Planet Node Body */}
                <span
                  className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? node.hue : "rgba(255,255,255,0.12)"}`,
                    boxShadow: isActive ? `0 0 16px ${node.glow}` : "none",
                  }}
                >
                  {/* Planet core dot */}
                  <span
                    className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-transform duration-300 group-hover:scale-125"
                    style={{
                      backgroundColor: node.hue,
                      boxShadow: isActive ? `0 0 8px ${node.hue}` : "none",
                    }}
                  />

                  {/* Active Celestial Orbit Ring + Trailing Moon */}
                  {isActive && (
                    <>
                      {/* Dashed orbit path */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-1.5 rounded-full border border-dashed motion-safe:animate-[orbit-spin_10s_linear_infinite]"
                        style={{ borderColor: `${node.hue}60` }}
                      />
                      {/* Revolving micro satellite moon */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-1.5 motion-safe:animate-[orbit-spin_4s_linear_infinite]"
                      >
                        <span
                          className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                          style={{
                            backgroundColor: node.hue,
                            boxShadow: `0 0 6px ${node.hue}`,
                          }}
                        />
                      </span>
                    </>
                  )}
                </span>

                {/* Monospace Micro Label on hover / active */}
                <span
                  className={`hidden sm:block absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#070b14]/90 px-1.5 py-0.5 font-mono text-[10px] tracking-wider transition-all duration-200 pointer-events-none ${
                    isActive
                      ? "opacity-100 text-white font-semibold"
                      : "opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 text-slate-400"
                  }`}
                  style={{
                    borderColor: isActive ? `${node.hue}60` : undefined,
                    color: isActive ? node.hue : undefined,
                  }}
                >
                  {node.name}
                </span>
              </a>
            </Tooltip>
          );
        })}

        {/* Constellation divider */}
        <div aria-hidden="true" className="mx-0.5 sm:mx-1 h-3.5 w-[1px] bg-white/15" />

        {/* Quick Search Tool / Command Palette */}
        <Tooltip label="Search portfolio (Ctrl+K or /)">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Open command search"
            className="group flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 hover:border-cyan-400/50 hover:bg-white/10 hover:text-cyan-300"
          >
            <Search className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}
