/**
 * MoonCard.tsx — compact artifact card (spec §8, v4 §6.2)
 * Type badge, description, technologies, and buttons ONLY for the
 * URLs that actually exist (GitHub / Live / Docs). Pure markup —
 * the sticky behavior comes from useStickyCard in GalaxySystem.
 */
import type { GalaxyMoon } from "@/types/galaxy";

/** Moon type → accent color (configurable list, unknown → indigo). */
export const MOON_TYPE_COLORS: Record<string, string> = {
  project: "#10b981",
  lab: "#0ea5e9",
  notes: "#f59e0b",
  certification: "#8b5cf6",
  blog: "#f43f5e",
  achievement: "#6366f1",
};

export function moonTypeColor(type: string): string {
  return MOON_TYPE_COLORS[type] ?? "#6366f1";
}

const links = (m: GalaxyMoon) =>
  [
    m.githubUrl && { label: "GitHub", href: m.githubUrl, icon: "▦" },
    m.liveUrl && { label: "Live", href: m.liveUrl, icon: "↗" },
    m.documentationUrl && { label: "Docs", href: m.documentationUrl, icon: "📖" },
  ].filter((l): l is { label: string; href: string; icon: string } => Boolean(l));

export default function MoonCard({ moon }: { moon: GalaxyMoon }) {
  const color = moonTypeColor(moon.type);
  const available = links(moon);
  return (
    <div className="rounded-2xl border border-card-border bg-card/90 p-4 shadow-card backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-sm font-semibold text-ink">
          {moon.icon && <span aria-hidden="true">{moon.icon} </span>}
          {moon.name}
        </h4>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide"
          style={{ background: `${color}1a`, color }}
        >
          {moon.type}
        </span>
      </div>

      {moon.description && (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{moon.description}</p>
      )}

      {moon.technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {moon.technologies.map((t) => (
            <span
              key={t}
              className="rounded-full border border-card-border bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {available.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <span aria-hidden="true">{l.icon}</span>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
