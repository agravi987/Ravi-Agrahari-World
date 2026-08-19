/**
 * MoonLegend.tsx — moon-type legend (shared: T2 3D + T3 fallback).
 * Each type gets its dot color from MoonCard's moonTypeColor, and a
 * live count from the actual planets data. Zero-data policy: a type
 * with no moons renders without a number (never a bare "0").
 */
import type { GalaxyPlanetWithMoons } from "@/types/galaxy";
import { moonTypeColor } from "./MoonCard";

export default function MoonLegend({
  moonTypes,
  planets,
}: {
  moonTypes: string[];
  planets: GalaxyPlanetWithMoons[];
}) {
  const countFor = (t: string) =>
    planets.reduce((n, p) => n + p.moons.filter((m) => m.type === t).length, 0);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {moonTypes.map((t) => {
        const count = countFor(t);
        return (
          <span key={t} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ background: moonTypeColor(t) }}
            />
            {t}
            {/* Live count — hidden when zero (plan §5 zero-data policy) */}
            {count > 0 && (
              <span className="font-mono text-[10px] text-ink-faint">{count}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
