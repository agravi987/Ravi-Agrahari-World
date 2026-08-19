/**
 * OrbitLine.tsx (server-safe) — the faint orbit ring of one planet.
 * An SVG circle instead of a dashed CSS border so the dots can FLOW
 * around the orbit (stroke-dashoffset animation) — a dashed border
 * can't animate. Pure markup + CSS, zero JS: works in the
 * server-rendered home preview and the interactive system alike.
 * Sized by the ring's --galaxy-r custom property (see globals.css).
 */
export default function OrbitLine() {
  return (
    <svg className="galaxy-orbit-line" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="49.5" fill="none" />
    </svg>
  );
}
