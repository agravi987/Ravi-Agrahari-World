/**
 * AvailabilityPill.tsx — the one shared "open to work" pill (audit #74).
 * The hero and contact sections used to carry two divergent copies of
 * this pill (one pulsed, one didn't; drift waiting to happen). The dot
 * + text render from the semantic success tokens (#83) so the pill
 * tracks the theme instead of hardcoded emerald utilities.
 *
 * Server-safe: no hooks, no browser APIs.
 */

export default function AvailabilityPill({
  text,
  pulse = false,
  className = "",
}: {
  /** The CMS availability line, e.g. "open to internships". */
  text: string;
  /** One-shot attention pulse on mount (hero only — audit keeps the
   *  contact copy still so the form stays the focus). */
  pulse?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`${pulse ? "pill-pulse-once " : ""}inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-4 py-1.5 text-xs font-medium text-success ${className}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
        aria-hidden="true"
      />
      {text}
    </p>
  );
}
