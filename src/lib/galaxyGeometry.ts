/**
 * galaxyGeometry.ts — Galaxy v4 CSS style builders (plan §5/§6)
 * PURE helpers that turn GalaxyPlanet/GalaxyMoon docs into CSS
 * custom properties for the shared .galaxy-* classes. Same file
 * powers the server-rendered home preview AND the interactive
 * detail page, so the two surfaces always render identically.
 */
import type { CSSProperties } from "react";
import type { GalaxyMoon, GalaxyPlanet, GalaxySettings } from "@/types/galaxy";

/** Normalize a number to a px string. */
const px = (v: number): string => `${v}px`;

/**
 * The shared system rotation duration (s). All planets in a locked
 * constellation share one speed — take the mode, scaled by the
 * global speed scale. Different (validated) speeds are preserved
 * per-ring via --galaxy-d on each planet's own style.
 */
export function systemDuration(
  planets: Pick<GalaxyPlanet, "orbitSpeed">[],
  settings: Pick<GalaxySettings, "globalSpeedScale">
): string {
  const speeds = planets.map((p) => p.orbitSpeed).filter((s) => Number.isFinite(s));
  const scale = settings.globalSpeedScale || 1;
  if (!speeds.length) return `${60 * scale}s`;
  const counts = new Map<number, number>();
  let mode = speeds[0];
  for (const s of speeds) {
    const n = (counts.get(s) ?? 0) + 1;
    counts.set(s, n);
    if (n > (counts.get(mode) ?? 0)) mode = s;
  }
  return `${mode * scale}s`;
}

/** CSS custom props for one planet (ring duration, angle, radius, size, color). */
export function planetStyle(
  p: Pick<GalaxyPlanet, "orbitSpeed" | "orbitAngle" | "orbitRadius" | "size" | "color">,
  settings: Pick<GalaxySettings, "globalSpeedScale">
): CSSProperties {
  return {
    "--galaxy-d": `${p.orbitSpeed * (settings.globalSpeedScale || 1)}s`,
    "--galaxy-angle": `${((p.orbitAngle % 360) + 360) % 360}deg`,
    "--galaxy-r": px(p.orbitRadius),
    "--galaxy-size": px(p.size),
    "--galaxy-color": p.color,
  } as CSSProperties;
}

/** CSS custom props for one moon (orbit around its planet). The dot
 *  color is set separately from its TYPE (moonTypeColor), not a field. */
export function moonStyle(
  m: Pick<GalaxyMoon, "orbitSpeed" | "orbitAngle" | "orbitRadius" | "size">
): CSSProperties {
  return {
    "--galaxy-md": `${Math.max(20, m.orbitSpeed)}s`,
    "--galaxy-ma": `${((m.orbitAngle % 360) + 360) % 360}deg`,
    "--galaxy-mr": px(m.orbitRadius),
    // Slight visual bump: the raw size is used for the orbit/spacing
    // math; the RENDERED dot is ~1.3× so moons read as clear dots
    // instead of sub-4px specks at the world's scale.
    "--galaxy-ms": px(Math.max(8, m.size * 1.3)),
  } as CSSProperties;
}

/** Sun sizing: pass a size (px) for the avatar core. */
export function sunStyle(size: number): CSSProperties {
  return { "--galaxy-sun-size": px(size) } as CSSProperties;
}

/**
 * The full coordinate-space size of the system (px) — 2 × the
 * farthest point any planet (or its moons) reaches from center,
 * plus breathing room. The stage scales this world down to fit
 * its box via CSS container-query units (100cqw / world), so
 * nothing ever overflows or clips — pure CSS, zero JS, works in
 * the server-rendered home preview too.
 */
export function worldSize(
  planets: Array<
    Pick<GalaxyPlanet, "orbitRadius" | "size"> & { moons?: Pick<GalaxyMoon, "orbitRadius" | "size">[] }
  >,
  padding = 28
): number {
  let maxExtent = 0;
  for (const p of planets) {
    let extent = p.orbitRadius + p.size / 2;
    for (const m of p.moons ?? []) {
      extent = Math.max(extent, p.orbitRadius + m.orbitRadius + m.size / 2);
    }
    maxExtent = Math.max(maxExtent, extent);
  }
  return Math.max(240, Math.ceil((maxExtent + padding) * 2));
}

/** CSS custom props for the world wrapper (unitless number — used
 *  as both the px size and the scale divisor). */
export function worldStyle(size: number): CSSProperties {
  return { "--galaxy-world": size } as CSSProperties;
}

/** Initials for the avatar fallback ("Ravi Agrahari" → "RA"). */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
