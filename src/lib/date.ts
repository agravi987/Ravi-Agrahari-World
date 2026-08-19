/**
 * date.ts — safe date parsing/formatting for CMS free-form strings.
 *
 * The CMS stores dates as plain strings ("2026-06", "2026-06-01", or
 * empty). Several surfaces used `new Date(...).toLocaleDateString()`
 * directly, which THROWS RangeError for empty/invalid values and
 * produced NaN comparisons in sorting. Everything goes through these
 * helpers now — they never throw and never return NaN.
 */

/** Parses a CMS date string (or Date) — null for empty/invalid input. */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Milliseconds for sorting; -Infinity for empty/invalid (never ranks
 *  as newest in newest-first sorts — in a plain ascending sort they
 *  fall first, which reads as "oldest", the honest place for an
 *  undated item). Never NaN, so comparators stay well-defined. */
export function dateMs(value: string | Date | null | undefined): number {
  const d = parseDate(value);
  return d ? d.getTime() : -Infinity;
}

/** toLocaleDateString without the Invalid-Date crash — null when unparseable. */
export function formatDateSafe(
  value: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string | null {
  const d = parseDate(value);
  return d ? d.toLocaleDateString("en-US", opts) : null;
}
