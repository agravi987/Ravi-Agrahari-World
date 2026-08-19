/**
 * GalaxyBackground.tsx — the ambient deep-space backdrop behind the galaxy
 * (v4 §5 + celestial-bodies pass). Rendered behind BOTH tiers (2D world and
 * 3D canvas) and the home preview. Pure CSS layers — zero DOM per star —
 * cheap at any starDensity. Server-safe (no client code).
 *
 * Layers (all aria-hidden, pointer-events: none):
 *  - stars: static dot field (existing)
 *  - twinkle: a ::after star layer that pulses (twinkling stars)
 *  - nebula: soft indigo/cyan nebula blobs — wired to settings.nebulaVisible
 *
 * (Comets do NOT live here: they revolve the sun inside the world, so
 * they scale/zoom with the system — see .galaxy-comet-orbit.)
 *
 * Every animation is transform/opacity-only and folded into the global
 * reduced-motion override (plan §4), so static-preference users just get
 * a frozen backdrop.
 */
export default function GalaxyBackground({
  showStars,
  density = "medium",
  nebula = false,
}: {
  showStars: boolean;
  density?: "low" | "medium" | "high";
  nebula?: boolean;
}) {
  if (!showStars && !nebula) return null;
  const opacity = density === "high" ? 1 : density === "low" ? 0.5 : 0.75;
  return (
    <div className="galaxy-bg" aria-hidden="true">
      {nebula && <span className="galaxy-nebula" />}
      {showStars && <span className="galaxy-stars" style={{ opacity }} />}
    </div>
  );
}
