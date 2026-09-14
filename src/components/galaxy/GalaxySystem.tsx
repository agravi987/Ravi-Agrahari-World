/**
 * GalaxySystem.tsx (client) — /detailed-galaxy surface (v4 §6.2)
 * The mode orchestrator for the two rendering tiers:
 *   - T2 WebGL (Galaxy3D, lazy chunk) — the planetarium, when the
 *     device supports WebGL and the user hasn't opted out
 *     (prefers-reduced-motion → T3, threeDEffect=false → T3).
 *   - T3 static DOM (System2D) — the always-correct fallback with
 *     real focusable buttons (a11y, no-WebGL, reduced-motion).
 *
 * Everything else is shared across modes: filter chips, moon legend,
 * the index panel (real buttons = keyboard access in both modes),
 * and the STICKY interactive cards (useStickyCard §7.2) — cards
 * hold ≥ cardDismissDelay so the cursor can reach them and click
 * their links. Card anchoring differs by mode: 2D reads the trigger
 * DOM rect; 3D follows the planet's projected position every frame.
 */
"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GalaxyData, GalaxyMoon, GalaxyPlanetWithMoons } from "@/types/galaxy";
import {
  Dialog,
  DialogBody,
  DialogContent,
} from "@/components/ui/Dialog";
import FilterChips from "./FilterChips";
import IndexPanel from "./IndexPanel";
import MoonLegend from "./MoonLegend";
import System2D from "./System2D";
import MoonCard, { moonTypeColor } from "./MoonCard";
import PlanetCard from "./PlanetCard";
import { useStickyCard } from "./useStickyCard";
import GalaxyErrorBoundary from "./GalaxyErrorBoundary";
import type { CameraRigApi, RigState } from "./Galaxy3D/CameraRig";

type Projector = (slug: string) => { x: number; y: number } | null;

const Galaxy3D = dynamic(() => import("./Galaxy3D"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto mt-8 grid aspect-square w-full max-w-[720px] place-items-center rounded-card border border-card-border bg-card/50">
      <div className="flex flex-col items-center gap-3 text-xs text-ink-faint">
        <span
          aria-hidden="true"
          className="block h-12 w-12 animate-pulse rounded-full bg-indigo-200/70 shadow-[0_0_24px_rgba(99,102,241,0.35)]"
        />
        <span>initializing 3D view…</span>
      </div>
    </div>
  ),
});

const CARD_W = 288;
const CARD_H = 240;

export default function GalaxySystem({ galaxy }: { galaxy: GalaxyData }) {
  const { settings, planets } = galaxy;
  const dismissDelay = Math.max(500, settings.cardDismissDelay || 3000);
  const { activeId, open, triggerHandlers, cardHandlers } = useStickyCard(dismissDelay);

  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [filter, setFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  // Phase 15 (#11/#16): per-session VIEW overrides (orbit lines / stars /
  // planet labels) + an orbit-speed multiplier. Start from the CMS
  // settings so the toggle reflects what's configured; the overrides
  // only affect the 2D tier (the 3D tier has its own controls).
  const [viewOverrides, setViewOverrides] = useState(() => ({
    orbits: settings.showOrbitLines,
    stars: settings.showStars,
    labels: true,
  }));
  const [speed, setSpeed] = useState(1);
  // P6: 2D zoom multiplier + collapsible index. Default OPEN so the
  // reviewer lands on the planet directory — the always-visible toggle
  // and the X in the panel collapse it for a full-system view (P8).
  const [zoom, setZoom] = useState(1);
  const [indexOpen, setIndexOpen] = useState(true);
  // P8 2D planet-click zoom: world-space point to scale about.
  const [focusOrigin, setFocusOrigin] = useState<{ x: number; y: number } | null>(null);
  // Phase 13: focus mode — the planet currently open in the full-screen
  // dialog (null = closed). Independent of the sticky hover card.
  const [focusPlanetSlug, setFocusPlanetSlug] = useState<string | null>(null);
  // Live 3D camera state (focused planet? zoom multiplier) — drives the
  // sun fade-out, the zoom % readout and the Return-to-overview pill.
  const [rigState, setRigState] = useState<RigState>({ focused: false, distMul: 1 });
  const triggerRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const projectorRef = useRef<Projector | null>(null);
  const focusRef = useRef<(slug: string) => void>(() => {});
  const rigApiRef = useRef<CameraRigApi | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);

  // P25: deep-link — /detailed-galaxy#planet-<slug> opens that planet
  // on load (shareable: the index row + card are ready immediately).
  useEffect(() => {
    const m = window.location.hash.match(/^#planet-([\w-]+)$/);
    if (!m) return;
    const slug = decodeURIComponent(m[1]);
    if (!planets.some((p) => p.slug === slug)) return;
    open(`planet:${slug}`);
    setIndexOpen(true);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-galaxy-slug="${slug}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile = bottom-sheet cards (tap-optimized, moons as chips).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  // WebGL capability + preference detection → T2 or T3.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (settings.threeDEffect === false) return;
    let supported = false;
    try {
      const c = document.createElement("canvas");
      supported = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      supported = false;
    }
    if (supported) setMode("3d");
  }, [settings.threeDEffect]);

  // Stable registrars for the lazy 3D chunk.
  const registerProjector = useCallback((fn: Projector | null) => {
    projectorRef.current = fn;
  }, []);
  const registerFocus = useCallback((fn: (slug: string) => void) => {
    focusRef.current = fn;
  }, []);
  const handleFocusPlanet = useCallback((slug: string) => {
    if (mode === "3d") focusRef.current(slug);
  }, [mode]);

  // P6: selecting a planet (index click / moon-less explore) flies the
  // 3D camera to it and collapses the index so the system fills the
  // page. In 2D the planet's card already opens via triggerHandlers.
  const handleSelectPlanet = useCallback(
    (slug: string) => {
      if (mode === "3d") rigApiRef.current?.flyToPlanet(slug);
      setIndexOpen(false);
    },
    [mode]
  );

  // P6 zoom: 3D drives the camera, 2D scales the world. Normalized so
  // zoomIn always means "closer/bigger" in both modes (3D camera
  // distance shrinks when distMul < 1; 2D world scale grows when > 1).
  const clampZoom = (z: number) => Math.min(2.4, Math.max(0.6, z));
  const zoomIn = useCallback(() => {
    if (mode === "3d") rigApiRef.current?.zoomBy(1 / 1.3);
    else setZoom((z) => clampZoom(z * 1.3));
  }, [mode]);
  const zoomOut = useCallback(() => {
    if (mode === "3d") rigApiRef.current?.zoomBy(1.3);
    else setZoom((z) => clampZoom(z / 1.3));
  }, [mode]);
  const zoomReset = useCallback(() => {
    if (mode === "3d") rigApiRef.current?.resetView();
    else {
      setZoom(1);
      setFocusOrigin(null);
    }
  }, [mode]);

  // P8: clicking a planet in 2D zooms the world INTO it — the origin is
  // that planet's live world position (computed in System2D from the DOM
  // rects), and the index collapses so the system fills the page.
  const handle2DPlanetFocus = useCallback((origin: { x: number; y: number }) => {
    setFocusOrigin(origin);
    setZoom((z) => Math.max(z, 2.2));
    setIndexOpen(false);
  }, []);

  const registerRig = useCallback((api: CameraRigApi | null) => {
    rigApiRef.current = api;
  }, []);

  // 2D wheel zoom — the 2D tier's hint says "Use + / − to zoom"; scrolling
  // over the stage does the same (clamped), for parity with the 3D canvas.
  useEffect(() => {
    if (mode !== "2d") return;
    const el = stageWrapRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampZoom(e.deltaY > 0 ? z / 1.12 : z * 1.12));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [mode]);

  // Keyboard zoom shortcuts (+ / − / 0) in both modes — ignored while
  // typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "+" || e.key === "=") {
        zoomIn();
        e.preventDefault();
      } else if (e.key === "-" || e.key === "_") {
        zoomOut();
        e.preventDefault();
      } else if (e.key === "0") {
        zoomReset();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIn, zoomOut, zoomReset]);

  const activePlanet: GalaxyPlanetWithMoons | undefined = useMemo(
    () => (activeId?.startsWith("planet:") ? planets.find((p) => p.slug === activeId.slice(7)) : undefined),
    [activeId, planets]
  );
  const focusPlanet: GalaxyPlanetWithMoons | undefined = useMemo(
    () => (focusPlanetSlug ? planets.find((p) => p.slug === focusPlanetSlug) : undefined),
    [focusPlanetSlug, planets]
  );
  const activeMoon: GalaxyMoon | undefined = useMemo(() => {
    if (!activeId?.startsWith("moon:")) return undefined;
    const slug = activeId.slice(5);
    for (const p of planets) {
      const m = p.moons.find((x) => x.slug === slug);
      if (m) return m;
    }
    return undefined;
  }, [activeId, planets]);

  // Card anchoring.
  //  - 3D planet card: follow the projected position every frame
  //    (planets keep orbiting; direct DOM writes, no re-renders).
  //  - Otherwise: static position from the trigger's DOM rect.
  useLayoutEffect(() => {
    if (!activeId) return;
    if (mode === "3d" && !isMobile && activeId.startsWith("planet:")) {
      const place = () => {
        const proj = projectorRef.current;
        const el = cardRef.current;
        if (proj && el) {
          const p = proj(activeId.slice(7));
          if (p) {
            let x = p.x - CARD_W / 2;
            let y = p.y - CARD_H - 14;
            x = Math.min(Math.max(8, x), window.innerWidth - CARD_W - 8);
            if (y < 8) y = p.y + 14; // flip below when too tall
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
          }
        }
      };
      place(); // position before first paint, then track each frame
      let raf = requestAnimationFrame(function tick() {
        place();
        raf = requestAnimationFrame(tick);
      });
      return () => cancelAnimationFrame(raf);
    }
    const el = triggerRefs.current.get(activeId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    let x = r.left + r.width / 2 - CARD_W / 2;
    let y = r.top - CARD_H - 14;
    x = Math.min(Math.max(8, x), window.innerWidth - CARD_W - 8);
    if (y < 8) y = r.bottom + 14;
    setCardPos({ x, y });
  }, [activeId, mode, isMobile]);

  const showCard = Boolean(activePlanet || activeMoon);

  const zoomPct = Math.round((mode === "3d" ? rigState.distMul : zoom) * 100);
  const zoomControls = (
    <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
      {/* Return-to-overview — appears while the 3D camera is focused on a
          planet (click/double-click / index fly) or the 2D world is zoomed
          off-center, so there's always a way back to the full system. */}
      {(mode === "3d" && rigState.focused) ||
      (mode === "2d" && (focusOrigin !== null || zoom !== 1)) ? (
        <button
          type="button"
          onClick={zoomReset}
          className="rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-card backdrop-blur-sm transition-colors hover:text-accent"
        >
          ⌂ Return to overview
        </button>
      ) : null}
      <div
        className="flex items-center gap-1 rounded-full border border-card-border bg-card/90 p-1 shadow-card backdrop-blur-sm"
        role="group"
        aria-label="Galaxy zoom controls"
      >
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          className="grid h-7 w-7 place-items-center rounded-full text-sm text-ink-soft transition-colors hover:bg-paper hover:text-accent"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomReset}
          title="Reset view (0)"
          aria-label="Reset view to 100%"
          className="min-w-10 rounded-full px-1 font-mono text-[10px] text-ink-faint transition-colors hover:text-accent"
        >
          {zoomPct}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          className="grid h-7 w-7 place-items-center rounded-full text-sm text-ink-soft transition-colors hover:bg-paper hover:text-accent"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`grid gap-10 lg:items-start ${
        indexOpen ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "lg:grid-cols-1"
      }`}
    >
      {/* ---------- The system ---------- */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips moonTypes={settings.moonTypes} filter={filter} onChange={setFilter} />
          <div className="flex items-center gap-2">
            {/* Index toggle — ALWAYS visible so the directory is one tap
                away while the collapsed system takes the full page (P8). */}
            <button
              type="button"
              onClick={() => setIndexOpen((o) => !o)}
              aria-pressed={indexOpen}
              aria-controls="galaxy-index-panel"
              className="rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
            >
              {indexOpen ? "✕ Hide index" : "☰ Planet index"}
            </button>
            {mode === "3d" && (
              <button
                type="button"
                onClick={() => setMode("2d")}
                className="rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
              >
                ⌾ 3D view · switch to static
              </button>
            )}
            {/* Phase 15 (#11): per-session view toggles (2D tier) —
                orbits / stars / labels, starting from the CMS settings */}
            {mode === "2d" && (
              <div
                className="flex items-center gap-0.5 rounded-full border border-card-border bg-card/80 p-0.5"
                role="group"
                aria-label="View toggles"
              >
                {(
                  [
                    ["orbits", viewOverrides.orbits],
                    ["stars", viewOverrides.stars],
                    ["labels", viewOverrides.labels],
                  ] as [keyof typeof viewOverrides, boolean][]
                ).map(([key, on]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setViewOverrides((v) => ({ ...v, [key]: !v[key] }))
                    }
                    aria-pressed={on}
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                      on
                        ? "bg-accent-soft text-accent"
                        : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
            {/* Phase 15 (#16): orbit-speed multiplier — 0.5× / 1× / 2× */}
            {mode === "2d" && (
              <div
                className="flex items-center gap-0.5 rounded-full border border-card-border bg-card/80 p-0.5"
                role="group"
                aria-label="Orbit speed"
              >
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    aria-pressed={speed === s}
                    className={`rounded-full px-2 py-1 font-mono text-[10px] font-medium transition-colors ${
                      speed === s
                        ? "bg-accent-soft text-accent"
                        : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div ref={stageWrapRef} className="relative mx-auto mt-8 w-full max-w-[720px]">
          {mode === "3d" ? (
            <GalaxyErrorBoundary
              fallback={
                <div className="grid aspect-square w-full max-w-[720px] place-items-center rounded-card border border-card-border bg-card/50">
                  <div className="mx-6 flex max-w-sm flex-col items-center gap-3 text-center">
                    <span className="text-base font-semibold text-ink">
                      3D view isn&apos;t available here
                    </span>
                    <p className="text-xs leading-relaxed text-ink-faint">
                      The WebGL renderer hit an error on this device. You can
                      still explore every planet and moon in the 2D view.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("2d")}
                      className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-card transition-opacity hover:opacity-90"
                    >
                      Show 2D view
                    </button>
                  </div>
                </div>
              }
            >
              <Galaxy3D
                galaxy={galaxy}
                filter={filter}
                activeId={activeId}
                triggerHandlers={triggerHandlers}
                registerProjector={registerProjector}
                registerFocus={registerFocus}
                onRigReady={registerRig}
                onRigState={setRigState}
                onError={() => setMode("2d")}
                allowDrag={settings.allowDragRotate !== false}
              />
            </GalaxyErrorBoundary>
          ) : (
            <System2D
              galaxy={galaxy}
              filter={filter}
              activeId={activeId}
              triggerRefs={triggerRefs}
              triggerHandlers={triggerHandlers}
              paused={showCard}
              zoom={zoom}
              focusOrigin={focusOrigin}
              onPlanetFocus={handle2DPlanetFocus}
              /* Phase 15: per-session view + speed overrides */
              orbits={viewOverrides.orbits}
              stars={viewOverrides.stars}
              labels={viewOverrides.labels}
              speed={speed}
            />
          )}
          {zoomControls}
          {/* P12: first-visit controls hint — CSS-only, fades after ~6s. */}
          <div
            aria-hidden="true"
            className="galaxy-hint pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-card-border bg-card/85 px-3 py-1.5 text-[11px] text-ink-soft shadow-card backdrop-blur-sm"
          >
            {mode === "3d" ? (
              "Drag to orbit · Scroll / + − to zoom · Click a planet to explore"
            ) : (
              "Hover or tap a planet to explore · Click zooms in · Scroll / + − to zoom"
            )}
          </div>
        </div>

        <MoonLegend moonTypes={settings.moonTypes} planets={planets} />
      </div>

      {/* ---------- Index panel (planet directory, both modes) ---------- */}
      {indexOpen && (
        <IndexPanel
          id="galaxy-index-panel"
          planets={planets}
          activeId={activeId}
          triggerHandlers={triggerHandlers}
          onFocusPlanet={handleFocusPlanet}
          onSelectPlanet={handleSelectPlanet}
          onClose={() => setIndexOpen(false)}
        />
      )}

      {/* ---------- Sticky card overlay ---------- */}
      {showCard && (
        <div
          ref={cardRef}
          {...cardHandlers(activeId as string)}
          className={isMobile ? "fixed inset-x-3 bottom-3 z-50" : "fixed z-50"}
          style={isMobile ? undefined : { left: cardPos?.x, top: cardPos?.y, width: CARD_W }}
          role="dialog"
          aria-label={activePlanet ? `${activePlanet.name} details` : `${activeMoon?.name} details`}
        >
          {activePlanet ? (
            <PlanetCard
              planet={activePlanet}
              onMoonClick={(m) => open(`moon:${m}`)}
              onFocus={() => setFocusPlanetSlug(activePlanet.slug)}
            />
          ) : activeMoon ? (
            <MoonCard moon={activeMoon} />
          ) : null}
        </div>
      )}

      {/* ---------- Phase 13: planet focus mode ---------- */}
      {/* A full-screen (max-w-2xl) view of ONE planet: big color hero,
          description, moon-type counts and EVERY moon as a card — the
          sticky hover card only ever shows a preview, the focus view is
          the "read all of it" surface. Radix handles focus trap + Esc. */}
      <Dialog open={Boolean(focusPlanet)} onOpenChange={(o) => !o && setFocusPlanetSlug(null)}>
        {focusPlanet && (
          <DialogContent
            title={`${focusPlanet.name} — full view`}
            className="w-[calc(100vw-2rem)] max-w-2xl"
          >
            <DialogBody>
              {/* Hero row: big colored orb + identity + counts (the
                  accessible title comes from DialogContent above). */}
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-3xl text-white shadow-orbital"
                  style={{ background: focusPlanet.color }}
                >
                  {focusPlanet.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-ink-faint">
                    #{focusPlanet.slug} · {focusPlanet.moons.length} moon
                    {focusPlanet.moons.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {focusPlanet.description && (
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {focusPlanet.description}
                </p>
              )}

              {/* Moon-type counts — hue-coded like the legend */}
              {focusPlanet.moons.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(() => {
                    const byType = new Map<string, number>();
                    for (const m of focusPlanet.moons) {
                      byType.set(m.type, (byType.get(m.type) ?? 0) + 1);
                    }
                    return [...byType.entries()].map(([type, n]) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-medium"
                        style={{
                          borderColor: `${moonTypeColor(type)}40`,
                          background: `${moonTypeColor(type)}12`,
                          color: moonTypeColor(type),
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: moonTypeColor(type) }}
                        />
                        {n} {type}
                        {n !== 1 ? "s" : ""}
                      </span>
                    ));
                  })()}
                </div>
              )}

              {/* Every moon, as a card — the reason the focus view exists */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {focusPlanet.moons.length > 0 ? (
                  focusPlanet.moons.map((m) => <MoonCard key={m.slug} moon={m} />)
                ) : (
                  <p className="col-span-full rounded-card border border-dashed border-card-border bg-paper-deep/40 px-4 py-6 text-center text-sm text-ink-faint">
                    No moons yet — this planet is still being explored.
                  </p>
                )}
              </div>
            </DialogBody>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
