/**
 * IndexPanel.tsx — planet directory/legend (v4 §6.2). Shared by the
 * T2 (WebGL) and T3 (DOM fallback) surfaces. Rows are REAL buttons:
 * they carry keyboard access in BOTH modes (the 3D canvas is
 * aria-hidden). Hover/focus opens the sticky card; in 3D mode
 * onFocusPlanet also pans the camera toward the planet.
 *
 * P-search: a quick filter input narrows the directory by name or
 * description — the list stays scannable as the galaxy grows.
 */
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { GalaxyPlanetWithMoons } from "@/types/galaxy";

type Handlers = Record<string, unknown>;

export default function IndexPanel({
  id,
  planets,
  activeId,
  triggerHandlers,
  onFocusPlanet,
  onSelectPlanet,
  onClose,
}: {
  id?: string;
  planets: GalaxyPlanetWithMoons[];
  activeId: string | null;
  triggerHandlers: (id: string) => Handlers;
  onFocusPlanet?: (slug: string) => void;
  /** Click a row → fly to that planet (3D) + collapse the index (P6). */
  onSelectPlanet?: (slug: string) => void;
  /** Collapse the panel (P8) — the toggle lives in GalaxySystem. */
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? planets.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    : planets;

  return (
    <aside id={id} aria-label="Planet index" className="lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-2">
        {/* h2 — Index is a major section of the detail page; keeping
            heading levels un-skipped (h1 → h2) satisfies heading-order. */}
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-faint">Index</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide planet index"
            className="grid h-7 w-7 place-items-center rounded-full border border-card-border bg-card text-xs text-ink-soft transition-colors hover:text-accent"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick filter — narrows the directory while you type */}
      <div className="relative mt-3">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter planets…"
          aria-label="Filter planets by name or description"
          autoComplete="off"
          className="w-full rounded-full border border-card-border bg-card py-1.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <ol className="mt-3 space-y-1">
        {filtered.map((p) => {
          const id = `planet:${p.slug}`;
          const h = triggerHandlers(id);
          return (
            <li key={p.slug}>
              <button
                type="button"
                {...h}
                onPointerEnter={(e) => {
                  (h.onPointerEnter as ((ev: unknown) => void) | undefined)?.(e);
                  onFocusPlanet?.(p.slug);
                }}
                onFocus={(e) => {
                  (h.onFocus as ((ev: unknown) => void) | undefined)?.(e);
                  onFocusPlanet?.(p.slug);
                }}
                onClick={(e) => {
                  (h.onClick as ((ev: unknown) => void) | undefined)?.(e);
                  onSelectPlanet?.(p.slug);
                }}
                data-galaxy-trigger
                data-galaxy-slug={p.slug}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  activeId === id
                    ? "border-accent/40 bg-accent-soft text-ink"
                    : "border-transparent text-ink-soft hover:bg-card hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="truncate font-medium">{p.name}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-faint">
                  {p.moons.length} {p.moons.length === 1 ? "moon" : "moons"}
                </span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-lg border border-dashed border-card-border px-3 py-3 text-center text-xs text-ink-faint">
            No planets match “{query.trim()}”.
          </li>
        )}
      </ol>
    </aside>
  );
}
