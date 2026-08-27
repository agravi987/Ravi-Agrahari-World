/**
 * api/admin/galaxyPlanet/auto-arrange/route.ts — #1
 * POST: manually trigger a full galaxy rebalance.
 * Positions are auto-computed on every create/delete/visibility toggle,
 * but this endpoint lets the admin force a redistribution at any time.
 */
import { NextResponse } from "next/server";
import { requireAdmin, revalidateFor } from "@/lib/adminApi";
import { connectDb } from "@/lib/db";
import { rebalanceGalaxyPlanets } from "@/lib/galaxyLayout";

export const dynamic = "force-dynamic";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const mongoose = await connectDb();
  if (!mongoose) {
    return NextResponse.json({ error: "MongoDB unavailable" }, { status: 503 });
  }

  try {
    await rebalanceGalaxyPlanets();
    revalidateFor("galaxyPlanet");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auto-arrange]", err);
    return NextResponse.json({ error: "Auto-arrange failed" }, { status: 500 });
  }
}
