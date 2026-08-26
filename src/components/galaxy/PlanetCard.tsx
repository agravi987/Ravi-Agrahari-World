/**
 * PlanetCard.tsx — glass card for a planet (spec §5, v4 §6.2)
 * Name, description, counts by moon type ("3 labs · 2 projects"),
 * and the planet's moons as clickable chips (opening the moon
 * card). Pure markup — sticky behavior from useStickyCard.
 */
"use client";

import { Link2, Maximize2 } from "lucide-react";
import type { GalaxyPlanetWithMoons } from "@/types/galaxy";
import { showToast } from "@/components/ui/Toast";
import { moonTypeColor } from "./MoonCard";

/** P26: shareable deep-link — copies /detailed-galaxy#planet-<slug>. */
async function copyPlanetLink(slug: string) {
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}/detailed-galaxy#planet-${slug}`
    );
    showToast("Planet link copied — share it");
  } catch {
    showToast("Could not copy — try manually");
  }
}

export default function PlanetCard({
  planet,
  onMoonClick,
  onFocus,
}: {
  planet: GalaxyPlanetWithMoons;
  onMoonClick: (moonId: string) => void;
  /** Phase 13: opens the full-screen focus view (planet + all moons). */
  onFocus?: () => void;
}) {
  const byType = new Map<string, number>();
  for (const m of planet.moons) {
    byType.set(m.type, (byType.get(m.type) ?? 0) + 1);
  }
  const counts = [...byType.entries()].slice(0, 4);

  return (
    <div className="rounded-2xl border border-card-border bg-card/90 p-4 shadow-card backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg text-white"
          style={{ background: planet.color }}
        >
          {planet.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-sm font-semibold text-ink">{planet.name}</h4>
          {counts.length > 0 && (
            <p className="text-[11px] text-ink-soft">
              {counts.map(([type, n], i) => (
                <span key={type}>
                  {i > 0 && " · "}
                  <span style={{ color: moonTypeColor(type) }}>{n}</span> {type}
                  {n !== 1 ? "s" : ""}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* P26: share the planet — copies the deep-link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyPlanetLink(planet.slug);
            }}
            title="Copy link to this planet"
            aria-label={`Copy link to ${planet.name}`}
            className="grid h-7 w-7 place-items-center rounded-full border border-card-border bg-paper text-ink-faint transition-colors hover:border-accent/40 hover:text-accent"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {/* Phase 13: full-screen focus — the planet and every moon */}
          {onFocus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFocus();
              }}
              title={`Focus on ${planet.name}`}
              aria-label={`Open the full view of ${planet.name}`}
              className="grid h-7 w-7 place-items-center rounded-full border border-card-border bg-paper text-ink-faint transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {planet.description && (
        <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{planet.description}</p>
      )}

      {planet.moons.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Moons</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {planet.moons.slice(0, 6).map((m) => (
              <button
                key={m.slug}
                type="button"
                data-galaxy-trigger={m.slug}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoonClick(m.slug);
                }}
                className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-card-border bg-paper px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: moonTypeColor(m.type) }}
                />
                <span className="truncate">{m.name}</span>
              </button>
            ))}
            {planet.moons.length > 6 && (
              <span className="rounded-full bg-paper-deep px-2 py-1 text-[10px] text-ink-faint">
                +{planet.moons.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
