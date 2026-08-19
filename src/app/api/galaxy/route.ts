/**
 * api/galaxy/route.ts — Galaxy v4 public read API (plan §9)
 * Returns the complete assembled galaxy — profile, settings, and
 * only VISIBLE planets + moons. Same assembler as the pages
 * (getGalaxy in lib/content.ts), cached via ISR + revalidated on
 * every admin mutation, so this endpoint never hits the DB per hit.
 */
import { NextResponse } from "next/server";
import { getGalaxy } from "@/lib/content";

// Phase 9 perf: 1h ISR safety net (galaxy edits revalidatePath instantly).
export const revalidate = 3600;

export async function GET() {
  try {
    const galaxy = await getGalaxy();
    return NextResponse.json(galaxy, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    // getGalaxy falls back to seed internally; this guards against
    // truly unexpected failures so the API never returns a crash.
    console.error("[api/galaxy] unexpected error:", err);
    return NextResponse.json(
      { error: "Galaxy temporarily unavailable." },
      { status: 500 }
    );
  }
}
