/**
 * System2D.tsx — the T3 ring system (v4 §6.2 fallback + reduced-motion).
 * Extracted from GalaxySystem: sun + planets + moons in the locked
 * constellation with real focusable buttons and faint orbit lines.
 * Rendered whenever the WebGL tier is unavailable (reduced-motion /
 * no-WebGL / error) — the always-correct, keyboard-first baseline.
 */
"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import type { GalaxyData, GalaxyPlanetWithMoons } from "@/types/galaxy";
import { moonStyle, planetStyle, sunStyle, worldSize, worldStyle } from "@/lib/galaxyGeometry";
import Tooltip from "@/components/ui/Tooltip";
import GalaxyBackground from "./GalaxyBackground";
import GalaxyComets from "./GalaxyComets";
import OrbitLine from "./OrbitLine";
import Sun from "./Sun";
import { moonTypeColor } from "./MoonCard";

export default function System2D({
  galaxy,
  filter,
  activeId,
  triggerRefs,
  triggerHandlers,
  paused,
  zoom = 1,
  focusOrigin,
  onPlanetFocus,
  /* Phase 15 (#11/#16): per-session overrides — the caller (GalaxySystem)
     merges CMS settings with the user's toggles, so defaults are fine. */
  orbits = true,
  stars = true,
  labels = true,
  speed = 1,
}: {
  galaxy: GalaxyData;
  filter: string;
  activeId: string | null;
  triggerRefs: { current: Map<string, HTMLElement | null> };
  triggerHandlers: (id: string) => Record<string, unknown>;
  paused?: boolean;
  /** P6 zoom multiplier — scales the world (clipped at the stage). */
  zoom?: number;
  /** P8 planet-click zoom: world-space point to scale about (null =
   *  sun center). Lets the world "zoom INTO" the clicked planet. */
  focusOrigin?: { x: number; y: number } | null;
  /** Fired on planet click with the planet's live world position. */
  onPlanetFocus?: (origin: { x: number; y: number }) => void;
  /** Phase 15: view toggles + speed multiplier (defaults = settings). */
  orbits?: boolean;
  stars?: boolean;
  labels?: boolean;
  speed?: number;
}) {
  const { profile, settings, planets } = galaxy;
  const world = useMemo(() => worldSize(planets), [planets]);
  const worldRef = useRef<HTMLDivElement>(null);

  const visibleMoons = (p: GalaxyPlanetWithMoons) =>
    filter === "all" ? p.moons : p.moons.filter((m) => m.type === filter);

  /** Duration overridden by the session speed multiplier (default 1×). */
  const planetDur = (p: GalaxyPlanetWithMoons) =>
    `${(p.orbitSpeed * (settings.globalSpeedScale || 1)) / speed}s`;
  const moonDur = (m: { orbitSpeed: number }) =>
    `${Math.max(20, m.orbitSpeed) / speed}s`;

  return (
    <div
      className="galaxy-stage relative mx-auto w-full max-w-[720px]"
      data-static={!settings.animationEnabled || undefined}
      data-paused={paused || undefined}
      data-zoom={zoom !== 1 ? zoom : undefined}
      data-labels={labels ? undefined : "false"}
      style={{ ...sunStyle(96), "--galaxy-zoom": zoom } as CSSProperties}
    >
      {/* Ambient backdrop at STAGE level (not world): stars/nebula stay
          fixed in screen space while the system zooms. */}
      <GalaxyBackground
        showStars={stars}
        density={settings.starDensity}
        nebula={settings.nebulaVisible}
      />
      <div
        ref={worldRef}
        className="galaxy-world"
        style={
          {
            ...worldStyle(world),
            ...(focusOrigin
              ? { "--galaxy-ox": `${focusOrigin.x}px`, "--galaxy-oy": `${focusOrigin.y}px` }
              : {}),
          } as CSSProperties
        }
      >
        <Sun profile={profile} size={96} />
        {/* Comets revolve the SUN on fixed elliptical orbits (they live
            inside the world so they scale/zoom with the system). */}
        <GalaxyComets />

        <div className="galaxy-rotator">
          {planets.map((p) => {
            const moons = visibleMoons(p);
            return (
              <div
                key={p.slug}
                className="galaxy-orbit-ring"
                data-active={activeId === `planet:${p.slug}` || undefined}
                style={{ ...planetStyle(p, settings), "--galaxy-d": planetDur(p) } as CSSProperties}
              >
                {orbits && <OrbitLine />}
                <div className="galaxy-planet-holder">
                  {/* Moons orbit their planet inside its lane */}
                  {moons.map((m) => (
                    <div
                      key={m.slug}
                      className="galaxy-moon-orbit"
                      style={
                        { ...moonStyle(m), "--galaxy-md": moonDur(m) } as CSSProperties
                      }
                    >
                      <div className="galaxy-moon-holder">
                        {/* Phase 15 (#6): the moon names itself before the
                            hover card arrives — instant recognition. */}
                        <Tooltip label={`${m.name} — ${m.type}`} side="top">
                          <button
                            type="button"
                            ref={(el) => {
                              triggerRefs.current.set(`moon:${m.slug}`, el);
                            }}
                            {...triggerHandlers(`moon:${m.slug}`)}
                            data-galaxy-trigger
                            aria-label={`${m.name} — ${m.type}`}
                            className="galaxy-moon"
                            style={{ "--galaxy-color": moonTypeColor(m.type) } as CSSProperties}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                  <div className="galaxy-planet-inner">
                    <div className="galaxy-planet-face">
                      <button
                        type="button"
                        ref={(el) => {
                          triggerRefs.current.set(`planet:${p.slug}`, el);
                        }}
                        {...triggerHandlers(`planet:${p.slug}`)}
                        data-galaxy-trigger
                        aria-label={`${p.name} — ${p.moons.length} ${p.moons.length === 1 ? "moon" : "moons"}. Click for details.`}
                        className="galaxy-planet"
                        data-active={activeId === `planet:${p.slug}` || undefined}
                        onClick={(e) => {
                          // Hover already opens the card; CLICK additionally
                          // zooms the world into this planet (P8). The origin
                          // is read from the live DOM rects, so it's exact
                          // even while the planet keeps orbiting.
                          (triggerHandlers(`planet:${p.slug}`).onClick as
                            | ((ev: unknown) => void)
                            | undefined)?.(e);
                          const btn = e.currentTarget;
                          const worldEl = worldRef.current;
                          if (!worldEl || !onPlanetFocus) return;
                          const wr = worldEl.getBoundingClientRect();
                          const br = btn.getBoundingClientRect();
                          const px = br.left + br.width / 2;
                          const py = br.top + br.height / 2;
                          onPlanetFocus({
                            x: ((px - wr.left) / wr.width) * world,
                            y: ((py - wr.top) / wr.height) * world,
                          });
                        }}
                      >
                        <span aria-hidden="true">{p.icon}</span>
                      </button>
                    </div>
                    <span className="galaxy-planet-chip" aria-hidden="true">
                      {p.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
