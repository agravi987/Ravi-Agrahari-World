import { type CSSProperties } from "react";
import { clsx } from "clsx";

export type DockLink = {
  id: string;
  href: string;
  label: string;
  hue: string;
};

type Props = {
  links: DockLink[];
  activeId: string | null;
  hidden: boolean;
  hrefFor: (href: string) => string;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
};

const DOT = 32; // px — node dot diameter (h-8)
const GAP = 10; // px — dot pitch minus diameter (gap-2.5)
const ROW = DOT / 2; // dot center, measured from the dot row's top edge

/** Orbit/constellation dock (nav v2): the primary navigation is a glass
 *  pill floating bottom-center; every link is a "planet" node threaded by
 *  a faint constellation line. When one is current, the connecting fan
 *  re-converges on it in the section's topic hue AND an orbit ring spins
 *  around it with two moons trailing — the literal reading of the site's
 *  space theme. Rendered fixed/absolute: it never claims flow space, so
 *  hiding it can't leave an empty band (the sticky-header gotcha).
 *
 *  The SVG uses a 100-wide viewBox with `preserveAspectRatio: none` and
 *  x-coordinates expressed as fractions of the content box, so the lines
 *  pass through the real node centers whatever the link count or width.
 *  Reduced-motion users keep the fully static dock (transitions + orbits
 *  are motion-safe / killed by the global override).
 */
export default function ConstellationDock({
  links,
  activeId,
  hidden,
  hrefFor,
  onNavigate,
}: Props) {
  if (links.length === 0) return null;
  const activeIndex = links.findIndex((l) => l.id === activeId);
  const contentW = links.length * DOT + (links.length - 1) * GAP;
  const yv = ROW; // dot-row center, relative to the SVG box
  const xv = (i: number) => {
    const cx = i * (DOT + GAP) + DOT / 2; // px from the content box's left edge
    return (cx / contentW) * 100;
  };
  const points = links.map((_, i) => `${xv(i)},${yv}`).join(" ");

  return (
    <nav
      aria-label="Primary"
      inert={hidden || undefined}
      className={clsx(
        "pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center",
        "transition-[transform,opacity] duration-300 ease-out",
        hidden ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"
      )}
    >
      <div
        className={clsx(
          "pointer-events-auto relative flex items-start gap-2.5 rounded-full",
          "border border-card-border bg-paper/80 px-3 py-3 shadow-card backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-paper/70"
        )}
        style={
          activeIndex >= 0
            ? ({ "--nav-hue": links[activeIndex].hue } as CSSProperties)
            : undefined
        }
      >
        {/* Constellation: faint thread through all nodes, plus straight
            "rewire" segments converging on the current planet. */}
        <svg
          aria-hidden="true"
          viewBox={`0 0 100 ${DOT}`}
          preserveAspectRatio="none"
          fill="none"
          className="pointer-events-none absolute inset-x-3 top-[12px] h-8"
        >
          <polyline
            points={points}
            stroke="var(--color-ink-faint)"
            strokeOpacity={0.4}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {activeIndex >= 0 &&
            links.map(
              (link, i) =>
                i !== activeIndex && (
                  <line
                    key={link.id}
                    x1={xv(activeIndex)}
                    y1={yv}
                    x2={xv(i)}
                    y2={yv}
                    stroke="var(--nav-hue)"
                    strokeOpacity={0.55}
                    strokeWidth={1}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )
            )}
        </svg>

        {links.map((link, i) => {
          const active = i === activeIndex;
          return (
            <a
              key={link.id}
              href={hrefFor(link.href)}
              onClick={(e) => onNavigate(e, link.href)}
              aria-current={active ? "page" : undefined}
              className="group flex flex-col items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <span
                className={clsx(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200",
                  active
                    ? "border-[var(--nav-hue)]"
                    : "border-card-border bg-card group-hover:border-accent/40 group-focus-visible:border-accent/60"
                )}
                style={
                  active
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--nav-hue) 18%, transparent)",
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "h-2 w-2 rounded-full transition-colors",
                    active
                      ? "bg-[var(--nav-hue)]"
                      : "bg-current text-ink-faint group-hover:text-accent group-focus-visible:text-accent"
                  )}
                />
                {active && (
                  <>
                    {/* Orbit ring + moons around the current planet */}
                    <span
                      aria-hidden="true"
                      className="absolute -inset-2 rounded-full border border-dashed border-[var(--nav-hue)]/50 motion-safe:animate-[orbit-spin_12s_linear_infinite]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -inset-2 motion-safe:animate-[orbit-spin_5s_linear_infinite]"
                    >
                      <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--nav-hue)] shadow-[0_0_6px_var(--nav-hue)]" />
                    </span>
                  </>
                )}
              </span>
              <span
                className={clsx(
                  "hidden font-mono text-[10px] uppercase tracking-wider leading-none md:block",
                  active
                    ? "font-medium text-[var(--nav-hue)]"
                    : "text-ink-faint group-hover:text-ink-soft"
                )}
              >
                {link.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}