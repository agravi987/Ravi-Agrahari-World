/**
 * SectionDivider.tsx — clean static accent line between sections.
 * A subtle gradient (indigo → transparent) that adds visual rhythm
 * without animation noise. Premium = still.
 */
export default function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none mx-auto max-w-5xl px-6"
    >
      <div className="h-px w-full bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
    </div>
  );
}