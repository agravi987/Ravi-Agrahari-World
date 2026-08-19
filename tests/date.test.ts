/**
 * tests/date.test.ts — unit tests for the safe date helpers (src/lib/date).
 * These exist because a dateless post (the CMS date field is optional)
 * used to throw RangeError across the home blog section, /blog, tag
 * pages, the post page and the feed. The helpers must NEVER throw and
 * never return NaN.
 */
import { describe, expect, it } from "vitest";
import { dateMs, formatDateSafe, parseDate } from "../src/lib/date";

describe("parseDate", () => {
  it("parses a full ISO date", () => {
    expect(parseDate("2026-08-10")?.getTime()).toBe(new Date("2026-08-10").getTime());
  });

  it("parses a month-only CMS value", () => {
    expect(parseDate("2026-06")?.getTime()).toBe(new Date("2026-06-01").getTime());
  });

  it("returns null for null / undefined", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });

  it("returns null for an empty string instead of an Invalid Date", () => {
    expect(parseDate("")).toBeNull();
  });

  it("returns null for garbage instead of an Invalid Date", () => {
    expect(parseDate("not a date")).toBeNull();
    expect(parseDate("2026-99-99")).toBeNull();
  });

  it("passes Date instances through", () => {
    const d = new Date("2026-01-01");
    expect(parseDate(d)).toBe(d);
  });
});

describe("dateMs", () => {
  it("returns the epoch millis for valid dates", () => {
    expect(dateMs("2026-08-10")).toBe(new Date("2026-08-10").getTime());
  });

  it("returns -Infinity (never NaN) for empty/invalid input", () => {
    expect(dateMs("")).toBe(-Infinity);
    expect(dateMs("garbage")).toBe(-Infinity);
    expect(Number.isNaN(dateMs("garbage"))).toBe(false);
  });

  it("never ranks an undated post as newest (newest-first sort)", () => {
    const posts = ["", "2026-01-01", "2026-08-10"];
    const newestFirst = [...posts].sort((a, b) => dateMs(b) - dateMs(a));
    expect(newestFirst).toEqual(["2026-08-10", "2026-01-01", ""]);
  });

  it("is a well-defined comparator (never NaN) for ascending sorts", () => {
    const posts = ["", "2026-01-01", "2026-08-10"];
    const ascending = [...posts].sort((a, b) => dateMs(a) - dateMs(b));
    // Undated lands first (reads as "oldest") — importantly the sort
    // is stable and doesn't crash, unlike the NaN it replaced.
    expect(ascending).toEqual(["", "2026-01-01", "2026-08-10"]);
  });
});

describe("formatDateSafe", () => {
  it("formats valid dates", () => {
    expect(formatDateSafe("2026-08-10", { month: "short", year: "numeric" })).toMatch(/Aug 2026/);
  });

  it("returns null instead of throwing on an empty string", () => {
    expect(() => formatDateSafe("")).not.toThrow();
    expect(formatDateSafe("")).toBeNull();
  });

  it("returns null instead of throwing on invalid input", () => {
    expect(() => formatDateSafe("definitely not a date")).not.toThrow();
    expect(formatDateSafe("definitely not a date")).toBeNull();
  });
});
