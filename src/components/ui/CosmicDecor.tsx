/**
 * CosmicDecor.tsx (server) — the shared celestial dressing for sections.
 *
 * Two modes per planet: a pure-CSS radial sphere (zero assets, the hero
 * keeps the heavyweight PNGs) OR a real planet/spacecraft photo passed
 * in `planetSrc` (next/image — lazy, sizes-aware, optimized). The
 * satellite `ship` doodle reuses the hero's spaceship PNG at postage
 * stamp size so it stays cheap.
 *
 * Everything is aria-hidden, pointer-transparent and no-print; the
 * global reduced-motion override (globals.css) freezes the keyframes.
 * Star positions are fixed literals (deterministic) and the section is
 * expected to be `position: relative` (Section's base class). Place as
 * the FIRST child so the rest of the section's content paints above.
 */
import Image from "next/image";
import clsx from "clsx";

export type DecorHue = "cloud" | "devops" | "ai" | "linux" | "mars" | "ice" | "accent";

export type DecorSpot = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface DecorStar {
  x: number;
  y: number;
  size: number;
  delay: number;
  hueVariant: boolean;
}

/** Sparse field — corner accents that read as star dust, never noise. */
const SPARSE: DecorStar[] = [
  { x: 6, y: 10, size: 2, delay: 0.0, hueVariant: false },
  { x: 15, y: 4, size: 3, delay: 1.2, hueVariant: true },
  { x: 24, y: 17, size: 2, delay: 0.5, hueVariant: false },
  { x: 35, y: 7, size: 2, delay: 2.1, hueVariant: false },
  { x: 47, y: 13, size: 3, delay: 0.9, hueVariant: true },
  { x: 61, y: 6, size: 2, delay: 1.6, hueVariant: false },
  { x: 70, y: 18, size: 2, delay: 0.3, hueVariant: false },
  { x: 82, y: 9, size: 2, delay: 2.4, hueVariant: false },
  { x: 91, y: 15, size: 3, delay: 0.6, hueVariant: true },
  { x: 96, y: 5, size: 2, delay: 1.8, hueVariant: false },
];

/** Dense field — the Projects/Experience band sky. */
const DENSE: DecorStar[] = [
  ...SPARSE,
  { x: 2, y: 24, size: 2, delay: 0.7, hueVariant: false },
  { x: 12, y: 27, size: 2, delay: 1.9, hueVariant: true },
  { x: 20, y: 23, size: 2, delay: 0.2, hueVariant: false },
  { x: 30, y: 27, size: 2, delay: 1.4, hueVariant: false },
  { x: 56, y: 24, size: 2, delay: 1.1, hueVariant: true },
  { x: 66, y: 28, size: 2, delay: 0.5, hueVariant: false },
  { x: 78, y: 24, size: 2, delay: 2.0, hueVariant: false },
  { x: 88, y: 29, size: 2, delay: 0.4, hueVariant: true },
  { x: 4, y: 34, size: 2, delay: 1.5, hueVariant: false },
  { x: 39, y: 31, size: 2, delay: 0.9, hueVariant: false },
  { x: 52, y: 33, size: 2, delay: 2.3, hueVariant: false },
  { x: 93, y: 35, size: 2, delay: 1.0, hueVariant: true },
];

const HUES: Record<DecorHue, string> = {
  cloud: "var(--color-topic-cloud)",
  devops: "var(--color-topic-devops)",
  ai: "var(--color-topic-ai)",
  linux: "var(--color-topic-linux)",
  mars: "var(--color-topic-mars)",
  ice: "var(--color-topic-ice)",
  accent: "var(--color-accent)",
};

/** Inward-inset spots so the full planet (and its small ring glow) sits
 *  inside the section rather than being half-cropped at a corner. */
const SPOT: Record<DecorSpot, string> = {
  "top-left": "top-[11%] left-[4%]",
  "top-right": "top-[12%] right-[4%]",
  "bottom-left": "bottom-[13%] left-[4%]",
  "bottom-right": "bottom-[12%] right-[4%]",
};

/** Decorative planet render size (the hero owns the big ones). */
const ORB_SIZE = "clamp(64px, 9vw, 108px)";

interface CosmicDecorProps {
  /** Topic hue driving the ring + glow halo + hue-flavored flecks. */
  hue?: DecorHue;
  /** Star density. */
  stars?: "sparse" | "dense" | "none";
  /** Corner where the planet lives ("none" hides the planet). */
  planet?: DecorSpot | "none";
  /** Real planet image (local path) — next/image crops it round.
   *  Omit to fall back to a pure-CSS radial sphere (zero assets). */
  planetSrc?: string;
  /** Dashed orbit ring spinning around the planet. */
  ring?: boolean;
  /** Tiny spaceship doodle drifting near the section corner. */
  ship?: boolean;
  shipSpot?: DecorSpot;
  /** Tiny vector satellite drifting near the section corner. */
  satellite?: boolean;
  satelliteSpot?: DecorSpot;
  /** Extra positioning tweaks (rarely needed). */
  className?: string;
}

export default function CosmicDecor({
  hue = "accent",
  stars = "sparse",
  planet = "top-right",
  planetSrc,
  ring = false,
  ship = false,
  shipSpot = "bottom-left",
  satellite = false,
  satelliteSpot = "top-left",
  className,
}: CosmicDecorProps) {
  const c = HUES[hue];
  const field = stars === "dense" ? DENSE : stars === "sparse" ? SPARSE : [];

  return (
    <div
      aria-hidden="true"
      className={clsx(
        "cs-layer pointer-events-none absolute inset-0 no-print",
        className
      )}
    >
      {/* Star flecks — ink-flavored dust with a few in the section's hue. */}
      {field.map((s, i) => (
        <i
          key={i}
          className="cs-star twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.hueVariant
              ? `color-mix(in srgb, ${c} 55%, transparent)`
              : "color-mix(in srgb, var(--color-ink) 30%, transparent)",
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {planet !== "none" && (
        <span className={clsx("absolute", SPOT[planet])}>
          {/* Orbit ring behind the orb — smaller insets so the ellipse
              fits (and reads full) instead of being corner-cropped. */}
          {ring && (
            <span
              className="cs-ring"
              style={{
                inset: "-30% -44%",
                borderColor: `color-mix(in srgb, ${c} 55%, transparent)`,
              }}
            />
          )}
          {/* Breathing halo glued to the planet's limb — LOW brightness
              glow (kept subtle so the planet never blooms into glare). */}
          <span
            className="cs-halo"
            style={{
              inset: "-52%",
              background: `color-mix(in srgb, ${c} 24%, transparent)`,
            }}
          />
          {planetSrc ? (
            /* Real photography — square crop, rounded to a sphere. */
            <span className="cs-planet-photo" style={{ width: ORB_SIZE, height: ORB_SIZE }}>
              <Image
                src={planetSrc}
                alt=""
                width={480}
                height={480}
                sizes={`(min-width: 1024px) 108px, 76px`}
                loading="lazy"
                className="cs-planet-img"
              />
            </span>
          ) : (
            /* Pure-CSS sphere — zero assets. */
            <span
              className="cs-orb"
              style={{
                width: ORB_SIZE,
                height: ORB_SIZE,
                background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${c} 95%, #fff) 0%, ${c} 46%, color-mix(in srgb, ${c} 55%, #000) 100%)`,
                boxShadow: `0 0 28px 2px color-mix(in srgb, ${c} 16%, transparent)`,
              }}
            />
          )}
        </span>
      )}

      {ship && (
        <span className={clsx("cs-ship absolute", SPOT[shipSpot])}>
          <Image
            src="/images/spacecraft/spaceship.png"
            alt=""
            width={2000}
            height={2000}
            sizes="56px"
            loading="lazy"
            className="cs-ship-img"
          />
        </span>
      )}

      {satellite && (
        <span className={clsx("absolute pointer-events-none satellite-orbit-drift w-10 sm:w-14", SPOT[satelliteSpot])}>
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-sm opacity-75">
            <rect x="8" y="54" width="34" height="12" rx="2" fill="#312e81" stroke="#4f46e5" strokeWidth="1" />
            <line x1="42" y1="60" x2="48" y2="60" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="48" y="48" width="24" height="24" rx="2" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <line x1="72" y1="60" x2="78" y2="60" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="78" y="54" width="34" height="12" rx="2" fill="#312e81" stroke="#4f46e5" strokeWidth="1" />
            <path d="M52 40 C56 34 64 34 68 40" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
            <line x1="60" y1="48" x2="60" y2="38" stroke="#cbd5e1" strokeWidth="1" />
          </svg>
        </span>
      )}
    </div>
  );
}