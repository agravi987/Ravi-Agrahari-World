/**
 * GalaxyComets.tsx — the fixed ELLIPTICAL comet orbits that revolve the
 * sun (real-solar-system feel: comets aren't shooting stars, they orbit).
 * Pure CSS markup + inline vars — no hooks — so it renders in BOTH the
 * server-rendered home preview (GalaxyPreview) and the client 2D fallback
 * (System2D). The classes live in globals.css:
 *   .galaxy-comet-orbit   → the fixed dashed ellipse (squashed + rotated)
 *   .galaxy-comet-spinner → rotates about the ellipse center
 *   .galaxy-comet-body    → counter-squashes to stay round, counter-rotates
 *                           to stay upright, glowing tail behind it.
 * Sized as a fraction of --galaxy-world, so comets scale/zoom with the
 * system exactly like every other body.
 */
import type { CSSProperties } from "react";

const COMETS: Array<{ a: number; squash: number; rot: number; dur: number }> = [
  { a: 0.38, squash: 0.42, rot: -15, dur: 150 },
  { a: 0.46, squash: 0.26, rot: 55, dur: 240 },
];

export default function GalaxyComets() {
  return (
    <>
      {COMETS.map((c) => (
        <div
          key={`${c.a}-${c.rot}`}
          aria-hidden="true"
          className="galaxy-comet-orbit"
          style={
            {
              "--galaxy-ce-a": c.a,
              "--galaxy-ce-squash": c.squash,
              "--galaxy-ce-rot": `${c.rot}deg`,
              "--galaxy-ce-d": `${c.dur}s`,
            } as CSSProperties
          }
        >
          <div className="galaxy-comet-spinner">
            <div className="galaxy-comet-body" />
          </div>
        </div>
      ))}
    </>
  );
}
