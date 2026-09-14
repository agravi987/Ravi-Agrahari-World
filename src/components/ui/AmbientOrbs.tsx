/**
 * AmbientOrbs.tsx — fixed full-page color drift (ambient-motion pass).
 * Three large, very blurred, low-opacity blobs drift on different
 * paths behind the entire page. The result is a barely-noticeable
 * "living background" — colors slowly shift and merge as you scroll.
 * Pure CSS keyframes (globals.css .ambient-orb-*); the global
 * reduced-motion override freezes them to a static frame.
 *
 * Server-safe (no client hooks). Rendered inside IdleMount so it
 * doesn't block initial hydration.
 */
export default function AmbientOrbs() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <span className="ambient-orb ambient-orb-1" />
      <span className="ambient-orb ambient-orb-2" />
      <span className="ambient-orb ambient-orb-3" />
    </div>
  );
}
