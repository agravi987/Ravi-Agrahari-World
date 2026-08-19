/**
 * FilterChips.tsx — moon-type filter (shared: T2 3D + T3 fallback).
 * The type list is data-driven from galaxySettings.moonTypes. The
 * ACTIVE chip wears that type's own color (color pass) instead of the
 * indigo accent — each filter identifies itself on screen.
 */
"use client";

import type { CSSProperties } from "react";
import { moonTypeColor } from "./MoonCard";

/** Active-chip styling per type: border + text + translucent fill. */
function activeStyle(t: string): CSSProperties {
  if (t === "all") {
    return {
      borderColor: "var(--color-accent)",
      color: "var(--color-accent)",
      background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
    };
  }
  const color = moonTypeColor(t);
  return { borderColor: color, color, background: `${color}1f` };
}

export default function FilterChips({
  moonTypes,
  filter,
  onChange,
}: {
  moonTypes: string[];
  filter: string;
  onChange: (f: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter moons by type">
      {["all", ...moonTypes].map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={filter === t}
          style={filter === t ? activeStyle(t) : undefined}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            filter === t
              ? "shadow-card"
              : "border-card-border bg-card text-ink-soft hover:text-accent"
          }`}
        >
          {t === "all" ? "All" : t}
        </button>
      ))}
    </div>
  );
}
