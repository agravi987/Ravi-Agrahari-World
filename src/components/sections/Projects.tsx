/**
 * Projects.tsx (client) — plan S7 + P13 progressive disclosure + P25/P26.
 * Compact uniform grid: cover + title + teaser + tech preview. Click a
 * card to open a focused Dialog "quick view" — full description, all
 * tech, GitHub / live links live there, one at a time (Google-style
 * modal instead of an in-place accordion). Cards stay uniform height so
 * the grid reads as a clean wall; detail is earned by the click.
 *
 * P25: hued tech chips (tagHue), 3D tilt + spotlight, mono index.
 * P26: tech FILTER (All/Featured + chips, live count). Internal demo
 * links (own-site "/" URLs like "This portfolio") render as <Link> —
 * never a fake new tab. Auto-hides when empty (plan §5.2).
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Share2, Star } from "lucide-react";
import { SamplePill } from "@/components/ui/Badge";
import { useSwipe } from "@/lib/useSwipe";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import CosmicDecor from "@/components/ui/CosmicDecor";
import ProjectCover from "@/components/ui/ProjectCover";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import TiltCard from "@/components/ui/TiltCard";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/Dialog";
import { showToast } from "@/components/ui/Toast";
import ExploreLink from "@/components/ui/ExploreLink";
import { tagHueClasses } from "@/lib/tagHue";
import type { Project } from "@/types";

interface ProjectsProps {
  projects: Project[];
  /** Phase 15 (#24): GitHub username for the "more on GitHub" link. */
  github?: string;
  /** Detail-page route for the "Explore all" pill. When provided the
   *  home surface shows only a taste (INITIAL_COUNT) and every overflow
   *  project lives on that page; when omitted the FULL wall renders
   *  (used by the /projects detail page). */
  exploreHref?: string;
  /** Slide viewport (Section fit) — see Section.tsx. */
  fit?: boolean;
  cue?: boolean;
}

/** Progressive disclosure: on the home surface only this many cards show
 *  until the "Explore all projects" pill routes to the /projects detail
 *  page — one full viewport, the rest lives on the next screen. */
const INITIAL_COUNT = 3;

/** Own-site URLs open in-app; everything else opens a new tab. */
function ProjectLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const internal = href.startsWith("/") || href.startsWith("#");
  const cls =
    className ??
    "inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-strong hover:underline";
  if (internal) {
    return (
      <Link href={href} className={cls}>
        {label}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

/** Copy a stable deep-link to the projects section (clipboard + toast). */
async function copySectionLink() {
  const url = `${window.location.origin}${window.location.pathname}#projects`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied — points to the projects section");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("Link copied — points to the projects section");
    } catch {
      /* clipboard blocked — nothing to do */
    }
    ta.remove();
  }
}

export default function Projects({ projects, github, exploreHref, fit, cue }: ProjectsProps) {
  // Multi-select tech filter (feature pass): any number of tech chips
  // combine (AND); Featured is an independent toggle. Clear resets both.
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  // Quick-view dialog state — one modal, controlled (Radix handles
  // focus trap, Esc, scroll-lock and focus return). Phase 9: we keep
  // the INDEX into the filtered list so ‹ › / ← → can walk the grid
  // "one project after another" without closing the dialog.
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  // Surface mode (home): collapsed wall — INITIAL_COUNT cards, "Explore
  // all projects" pills off to the /projects detail page. Full mode
  // (that detail page): every project at once, no clamp.
  // BUGFIX: the share-button title read `navigator` during render, so
  // the server (no navigator) said "Copy project link" while the client
  // said "Share this project" → every hydration pass warning. Capability
  // is now detected AFTER mount (rAF keeps it out of the sync-effect
  // lint rule); until then both passes agree on "Copy project link".
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setCanShare("share" in navigator));
    return () => cancelAnimationFrame(raf);
  }, []);

  // The tech list is small — a plain computation.
  const techs = Array.from(new Set(projects.flatMap((p) => p.tech))).sort();

  // Computed early so hooks can reference it.
  const filtersActive = selectedTechs.length > 0 || featuredOnly;
  const visible = projects.filter(
    (p) =>
      (selectedTechs.length === 0 || selectedTechs.every((t) => p.tech.includes(t))) &&
      (!featuredOnly || p.featured)
  );
  /** The cards actually rendered — a taste (home surface) or the whole
   *  wall (detail page). Filtering still respects both. */
  const shownProjects = exploreHref
    ? visible.slice(0, INITIAL_COUNT)
    : visible;
  const hasHidden = visible.length > shownProjects.length;
  const techCount = new Set(projects.flatMap((p) => p.tech)).size; // P27 footnote

  // Phase 9: the project currently open in the dialog (derived from the
  // index so filters + prev/next stay in sync).
  const selected =
    selectedIdx != null && visible.length > 0
      ? visible[Math.min(selectedIdx, visible.length - 1)]
      : null;

  /** Phase 9: step the dialog to the previous/next project (wraps). */
  const stepProject = (dir: 1 | -1) => {
    if (visible.length === 0) return;
    setSelectedIdx((i) => {
      const cur = i ?? 0;
      return (cur + dir + visible.length) % visible.length;
    });
  };

  // Phase 15 (#13): swipe the dialog body left/right to browse.
  const swipe = useSwipe(() => stepProject(1), () => stepProject(-1));

  // Phase 15 (#10): native share when available, clipboard fallback.
  async function shareProject(p: Project) {
    const url = `${window.location.origin}/#projects`;
    const data = { title: p.title, text: p.description, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      throw new Error("share unsupported");
    } catch {
      try {
        await navigator.clipboard.writeText(`${p.title} — ${url}`);
        showToast("Copied project link");
      } catch {
        /* clipboard blocked — nothing to do */
      }
    }
  }

  // Arrow-key grid navigation (roving tabindex) — Google/Launcher feel.
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  // Sync-ref so the keydown effect (which only re-subscribes when
  // visible.length/cols change) always reads the CURRENT index.
  const focusedIdxRef = useRef(-1);
  useEffect(() => {
    focusedIdxRef.current = focusedIdx;
  }, [focusedIdx]);
  // Mirror of the SHOWN card count so the roving-tabindex effect always
  // clamps to cards actually rendered (collapsed vs expanded).
  const shownLenRef = useRef(0);
  useEffect(() => {
    shownLenRef.current = shownProjects.length;
  }, [shownProjects.length]);
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const update = () => setCols(window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    // BUGFIX: roving tabindex must MOVE FOCUS — the old handler only
    // updated tabIndex=0, so arrow keys "selected" a card without ever
    // focusing it (keyboard flow felt broken: Tab landed on the OLD
    // card). move() updates state AND focuses the new card together.
    const move = (next: number) => {
      // Roving tabindex walks the SHOWN grid — hidden (collapsed) cards
      // can't be focused.
      const normalized = ((next % shownLenRef.current) + shownLenRef.current) % shownLenRef.current;
      focusedIdxRef.current = normalized;
      setFocusedIdx(normalized);
      requestAnimationFrame(() => {
        el.querySelector<HTMLElement>(`[data-project-index="${normalized}"]`)?.focus();
      });
    };
    // Column-aware vertical navigation: featured cards span the full row
    // (sm:col-span-2), so the old naive ±cols stepping landed on the
    // wrong card (audit #12). Walk the shown list and give every card
    // its actual (row, col) slot, then step rows by nearest column.
    const slots: { row: number; col: number; idx: number }[] = [];
    {
      let row = 0;
      let col = 0;
      shownProjects.forEach((p, idx) => {
        const span = cols === 2 && p.featured ? 2 : 1;
        if (col > 0 && col + span > cols) {
          row += 1;
          col = 0;
        }
        slots.push({ row, col, idx });
        col += span;
        if (col >= cols) {
          row += 1;
          col = 0;
        }
      });
    }
    const stepRow = (from: number, dir: 1 | -1) => {
      const cur = slots.find((s) => s.idx === from);
      if (!cur) return;
      const targetRow = cur.row + dir;
      const candidates = slots.filter((s) => s.row === targetRow);
      if (candidates.length === 0) return; // already on the first/last row
      move(
        candidates.reduce((best, s) =>
          Math.abs(s.col - cur.col) < Math.abs(best.col - cur.col) ? s : best
        ).idx
      );
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !el.contains(target)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(focusedIdxRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(focusedIdxRef.current - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepRow(focusedIdxRef.current, 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        stepRow(focusedIdxRef.current, -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        move(0);
      } else if (e.key === "End") {
        e.preventDefault();
        move(shownLenRef.current - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        const btn = target.closest("button") as HTMLButtonElement | null;
        if (btn && !btn.closest("[role=dialog]")) {
          e.preventDefault();
          btn.click();
        }
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [shownProjects, cols]);

  if (projects.length === 0) return null; // auto-hide (§5.2)

  function toggleTech(t: string) {
    setSelectedTechs((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function clearFilters() {
    setSelectedTechs([]);
    setFeaturedOnly(false);
  }

  function openProject(project: Project) {
    const i = visible.findIndex((p) => p.title === project.title);
    setSelectedIdx(i >= 0 ? i : 0);
    setOpen(true);
  }

  return (
    <Section
      id="projects"
      index="02"
      eyebrow="projects"
      title="Projects"
      description="Small, real, shipped — click one to open it. Every one taught me something I can point to."
      tone="cloud"
      fit={fit}
      cue={cue}
    >
      <CosmicDecor
        hue="cloud"
        stars="dense"
        planet="top-right"
        planetSrc="/images/planets/jupiter.jpg"
        ring
        ship
        shipSpot="bottom-right"
        satellite
        satelliteSpot="bottom-left"
      />

      {/* Filter row — multi-select tech chips + Featured toggle + clear.
          Chips combine (AND) so you can narrow to e.g. "React AND Docker";
          a × Clear appears once anything is active. */}
      {techs.length > 1 && (
        <div
          role="group"
          aria-label="Filter projects by technology"
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={clearFilters}
            aria-pressed={!filtersActive}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              !filtersActive
                ? "border-transparent bg-accent-btn text-white shadow-card"
                : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
            }`}
          >
            All
          </button>
          {projects.some((p) => p.featured) && (
            <button
              type="button"
              onClick={() => setFeaturedOnly((v) => !v)}
              aria-pressed={featuredOnly}
              className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                featuredOnly
                  ? "border-transparent bg-accent text-white shadow-card"
                  : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
              }`}
            >
              <Star
                className={`h-3 w-3 ${featuredOnly ? "fill-white" : "fill-warning text-warning"}`} /* #84 star via status token */
                aria-hidden="true"
              />
              Featured
            </button>
          )}
          {techs.map((t) => {
            const on = selectedTechs.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTech(t)}
                aria-pressed={on}
                title={on ? `Remove ${t} filter` : `Filter by ${t}`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  on
                    ? "border-transparent bg-topic-cloud text-white shadow-card"
                    : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
                }`}
              >
                {t}
                {on && (
                  <span className="ml-1.5" aria-hidden="true">
                    ×
                  </span>
                )}
              </button>
            );
          })}
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-ink-faint/30 px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              clear
            </button>
          )}
          <span
            aria-live="polite"
            className="ml-1 font-mono text-[10px] text-ink-faint"
          >
            {filtersActive
              ? `${visible.length} of ${projects.length} shown`
              : `${projects.length} shown`}
          </span>
        </div>
      )}

      {/* Uniform grid wall — every card is a trigger for the quick view. */}
      {visible.length === 0 ? (
        /* Honest empty state — a dead wall teaches nothing. */
        <div className="mx-auto max-w-sm rounded-card border border-dashed border-card-border bg-card/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">
            Nothing matches that combination.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Try removing a filter or two.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-full bg-accent-btn px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            clear filters
          </button>
        </div>
      ) : (
        // Plain container (no role): the old role="grid" was invalid ARIA —
        // it had no role=row/gridcell children (audit #11). Cards are
        // buttons in a visual grid; keyboard nav is handled above.
        <div ref={gridRef} id="projects-grid" className="projects-grid grid gap-6 sm:grid-cols-2">
        {shownProjects.map((project, i) => {
          const visibleTech = project.tech.slice(0, 3);
          const hiddenCount = project.tech.length - visibleTech.length;
          // Phase 15 (#1): featured projects lead as HERO cards — full
          // width with a taller cover (the wall reads: one big, then the
          // regular grid). Zero-data: only when a project is featured.
          const hero = project.featured;
          return (
            <Reveal
              key={project.title}
              delay={(i % 4) * 70}
              className={`h-full ${hero ? "sm:col-span-2 featured-aura rounded-card" : ""}`}
            >
              <TiltCard max={6} className="h-full rounded-card">
                <Card
                  hover
                  onMouseMove={(e) => {
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    (e.currentTarget as HTMLElement).style.setProperty(
                      "--sx",
                      `${((e.clientX - r.left) / r.width) * 100}%`,
                    );
                    (e.currentTarget as HTMLElement).style.setProperty(
                      "--sy",
                      `${((e.clientY - r.top) / r.height) * 100}%`,
                    );
                  }}
                  className="group card-spotlight h-full overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => openProject(project)}
                    aria-haspopup="dialog"
                    aria-label={`Open ${project.title} details`}
                    tabIndex={focusedIdx === i ? 0 : -1}
                    data-project-index={i}
                    className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {/* Browser Mockup Chrome Header */}
                    <div className="browser-chrome" aria-hidden="true">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="browser-dot browser-dot-red" />
                        <span className="browser-dot browser-dot-yellow" />
                        <span className="browser-dot browser-dot-green" />
                      </div>
                      <div className="browser-url-bar">
                        <span className="text-emerald-500 font-bold">🔒</span>
                        <span>ravi.dev/projects/{project.slug || project.title.toLowerCase().replace(/\W+/g, "-")}</span>
                      </div>
                    </div>

                    {/* Cover-forward card: the cover dominates and the
                        title sits ON it (dark scrim keeps white text AA),
                        so the grid reads as a premium gallery wall. */}
                    <div className="relative">
                      <ProjectCover
                        image={project.coverImage}
                        title={project.title}
                        tech={project.tech}
                        className={`cover-zoom ${hero ? "h-48 sm:h-56" : "h-40 sm:h-36"}`}
                      />
                      {/* Scrim — guarantees the overlay text reads on any image */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent transition-opacity duration-300 group-hover:from-ink/85"
                      />
                      {/* Title on the cover */}
                      <div className="absolute inset-x-0 bottom-0 flex items-start justify-between gap-3 p-4">
                        <h3 className="flex items-center gap-1.5 font-display text-lg font-semibold text-white">
                          {project.title}
                          {project.featured && (
                            <Star
                              className="h-4 w-4 -translate-y-0.5 fill-warning text-warning" /* #84 */
                              role="img"
                              aria-label="Featured project"
                            />
                          )}
                        </h3>
                      </div>
                      {/* Mono index — the collection reads as a series */}
                      <span
                        aria-hidden="true"
                        className="absolute right-3 top-3 rounded-full bg-ink/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-white/90 backdrop-blur-sm"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {/* Phase 15 (#1): hero ribbon on featured cards */}
                      {hero && (
                        <span
                          aria-hidden="true"
                          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink shadow-card backdrop-blur-sm"
                        >
                          <Star className="h-3 w-3 fill-ink" />
                          featured
                        </span>
                      )}
                    </div>
                    <div className="p-5 pt-4">
                      {/* Teaser only — the full story waits in the modal. */}
                      <p className="line-clamp-2 text-sm text-ink-soft">
                        {project.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {visibleTech.map((t) => (
                          <Badge key={t} variant="colored" className={tagHueClasses(t)}>
                            {t}
                          </Badge>
                        ))}
                        {hiddenCount > 0 && (
                          <Badge variant="neutral">+{hiddenCount}</Badge>
                        )}
                        {project.isSample && (
                          <SamplePill className="ml-1.5">sample</SamplePill>
                        )}
                      </div>

                      {/* Architecture Pipeline Flow Strip (MNC Engineering Proof) */}
                      {hero && (
                        <div className="mt-4 rounded-xl border border-card-border/70 bg-paper-deep/50 p-3">
                          <div className="flex items-center justify-between font-mono text-[10px] text-ink-faint mb-2">
                            <span className="flex items-center gap-1.5 uppercase font-semibold tracking-wider text-accent">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" aria-hidden="true" />
                              System Pipeline Flow
                            </span>
                            <span className="hidden sm:inline">Automated Cloud CI/CD</span>
                          </div>
                          <div className="relative flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono">
                            {/* Animated track line connecting steps */}
                            <div
                              aria-hidden="true"
                              className="pipeline-flow-track absolute inset-x-3 top-1/2 -z-0 h-0.5 -translate-y-1/2 bg-card-border"
                            >
                              <div className="pipeline-flow-pulse h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent" />
                            </div>
                            <span className="relative z-10 rounded-md border border-card-border bg-card px-1.5 sm:px-2 py-0.5 sm:py-1 text-ink shadow-sm">
                              Git Push
                            </span>
                            <span className="relative z-10 text-ink-faint text-[10px]">➔</span>
                            <span className="relative z-10 rounded-md border border-card-border bg-card px-1.5 sm:px-2 py-0.5 sm:py-1 text-ink shadow-sm">
                              Actions CI
                            </span>
                            <span className="relative z-10 text-ink-faint text-[10px]">➔</span>
                            <span className="relative z-10 rounded-md border border-card-border bg-card px-1.5 sm:px-2 py-0.5 sm:py-1 text-ink shadow-sm">
                              Docker Build
                            </span>
                            <span className="relative z-10 text-ink-faint text-[10px]">➔</span>
                            <span className="relative z-10 rounded-md border border-accent/40 bg-accent-soft px-1.5 sm:px-2 py-0.5 sm:py-1 font-semibold text-accent shadow-sm">
                              Cloud Deploy
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Instant Launchpad — Direct 1-Click Access for Recruiters */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-card-border/60 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-full bg-accent-btn px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:bg-accent-btn-hover hover:-translate-y-0.5"
                            >
                              Live Demo
                              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            </a>
                          )}
                          {project.repoUrl && (
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-ink-soft shadow-sm transition-all hover:border-accent/40 hover:text-ink hover:-translate-y-0.5"
                            >
                              <span className="font-mono text-[10px] font-bold">GH</span>
                              Code
                            </a>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-accent font-medium inline-flex items-center gap-0.5 group-hover:underline">
                          Quick Specs ➔
                        </span>
                      </div>
                    </div>
                  </button>
                </Card>
              </TiltCard>
            </Reveal>
          );
        })}
        </div>
      )}

      {/* Surface-mode overflow: everything after the taste lives on the
          /projects detail page — one route, one click. */}
      {exploreHref && hasHidden && (
        <div className="mt-6 text-center">
          <ExploreLink
            href={exploreHref}
            label="Explore all projects"
            count={visible.length - shownProjects.length}
          />
        </div>
      )}

      {/* P25 footnote, P27: adds the tech count — both from the data */}
      <p className="mt-8 text-center font-mono text-xs text-ink-faint">
        {projects.length} project{projects.length === 1 ? "" : "s"} · {techCount}{" "}
        technolog{techCount === 1 ? "y" : "ies"} — every one taught me something.
        {github && (
          <>
            {" · "}
            <a
              href={`https://github.com/${github}?tab=repositories`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-ink-soft transition-colors hover:text-accent"
            >
              more on GitHub
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </>
        )}
      </p>

      {/* Phase 15 (#21): print-only list — the interactive wall collapses
          to title + repo URL on paper. */}
      <div className="projects-print-list">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider">
          Projects
        </p>
        <ul>
          {projects.map((p) => (
            <li key={p.title}>
              {p.title}
              {p.repoUrl ? (
                <>
                  {" — "}
                  <a href={p.repoUrl} rel="noopener noreferrer" target="_blank">{p.repoUrl}</a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick-view dialog — controlled by `open`, one instance for the
          whole grid (Radix focus-trap + Esc + scroll-lock built in). */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={selected?.title ?? ""}
          description={selected?.description}
          // Phase 9: ← / → walk the grid inside the modal — "one after
          // another" browsing without close-and-reopen.
          onKeyDown={(e) => {
            // Phase 15 (#16): arrows AND J/K browse the wall.
            if (e.key === "ArrowLeft" || e.key === "k") {
              e.preventDefault();
              stepProject(-1);
            } else if (e.key === "ArrowRight" || e.key === "j") {
              e.preventDefault();
              stepProject(1);
            }
          }}
        >
          {selected && (
            <>
              <DialogBody {...swipe}>
                <ProjectCover
                  image={selected.coverImage}
                  title={selected.title}
                  tech={selected.tech}
                  className="h-40 rounded-xl"
                />
                {selected.isSample && <SamplePill>sample</SamplePill>}
                {/* Phase 15 (#8): a tech badge FILTERS the wall — click it
                    to see only projects with that tech (dialog closes). */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selected.tech.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTechs([t]);
                        setOpen(false);
                      }}
                      title={`Filter projects by ${t}`}
                      className="cursor-pointer transition-transform hover:-translate-y-0.5"
                    >
                      <Badge variant="colored" className={tagHueClasses(t)}>
                        {t}
                      </Badge>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {selected.description}
                </p>

                {/* Engineering & Cloud Highlights for Recruiters */}
                <div className="mt-4 rounded-xl border border-card-border/80 bg-paper-deep/50 p-3.5">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    Engineering Highlights &amp; Systems Design
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                    <li>• <strong>Containerized Workflow:</strong> Multi-stage Docker optimization with lean runtime images.</li>
                    <li>• <strong>High Reliability:</strong> Serverless caching singleton and graceful seed data fallbacks.</li>
                    <li>• <strong>Automated CI/CD:</strong> GitHub Actions pipeline verifying typecheck and linting on every push.</li>
                  </ul>
                </div>

                {/* Phase 15 (#13): thumbnail strip — jump anywhere in the
                    filtered set; the active one is ringed. */}
                {visible.length > 1 && (
                  <div
                    role="tablist"
                    aria-label="Projects in this set"
                    className="mt-5 flex gap-2 overflow-x-auto pb-1"
                  >
                    {visible.map((p, i) => {
                      const current = Math.min(selectedIdx ?? 0, visible.length - 1) === i;
                      return (
                        <button
                          key={p.title}
                          type="button"
                          role="tab"
                          aria-selected={current}
                          onClick={() => setSelectedIdx(i)}
                          title={p.title}
                          aria-label={`Go to ${p.title}`}
                          className={`grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md border transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                            current
                              ? "border-accent shadow-card"
                              : "border-card-border opacity-60 hover:opacity-100"
                          }`}
                        >
                          <ProjectCover
                            image={p.coverImage}
                            title={p.title}
                            tech={p.tech}
                            className="h-full w-full"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </DialogBody>
              <DialogFooter>
                {/* Phase 9: prev/next + position — browse the wall from
                    inside the quick view (wraps, respects filters) */}
                {visible.length > 1 && (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stepProject(-1)}
                      aria-label="Previous project"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span aria-live="polite" className="font-mono text-[10px] text-ink-faint">
                      {Math.min(selectedIdx ?? 0, visible.length - 1) + 1} of {visible.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => stepProject(1)}
                      aria-label="Next project"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                )}
                {(selected.repoUrl || selected.demoUrl) && (
                  <span className="flex flex-wrap items-center gap-3">
                    {selected.repoUrl && (
                      <ProjectLink href={selected.repoUrl} label="GitHub" />
                    )}
                    {selected.demoUrl && (
                      <ProjectLink
                        href={selected.demoUrl}
                        label="Live demo"
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent-btn px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover"
                      />
                    )}
                  </span>
                )}
                {/* Phase 13: dedicated case-study page — the full story,
                    one click deeper (only when a slug + write-up exist) */}
                {selected.slug && selected.caseStudy && (
                  <ProjectLink
                    href={`/projects/${selected.slug}`}
                    label="Read the case study"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-strong hover:underline"
                  />
                )}
                <button
                  type="button"
                  onClick={() => void shareProject(selected)}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  title={canShare ? "Share this project" : "Copy project link"}
                >
                  <Share2 className="h-3 w-3" aria-hidden="true" />
                  share
                </button>
                <button
                  type="button"
                  onClick={copySectionLink}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  copy link
                </button>
              </DialogFooter>
              {visible.length > 1 && (
                <p className="mt-3 text-center font-mono text-[10px] text-ink-faint">
                  ← → / J K to browse · swipe on touch
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
