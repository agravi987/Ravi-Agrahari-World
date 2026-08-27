/**
 * api/admin/galaxyPlanet/auto-arrange/route.ts — #1
 * POST: auto-arrange all visible planets in a radial layout.
 * Computes orbitRadius, orbitAngle, and orbitSpeed for each planet
 * so they are evenly distributed with zero overlaps.
 */
import { NextResponse } from "next/server";
import { requireAdmin, revalidateFor } from "@/lib/adminApi";
import { connectDb } from "@/lib/db";
import { autoLayoutPlanets } from "@/lib/galaxyLayout";

export const dynamic = "force-dynamic";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const mongoose = await connectDb();
  if (!mongoose) {
    return NextResponse.json({ error: "MongoDB unavailable" }, { status: 503 });
  }

  const { getGalaxyPlanetModel } = await import("@/models");
  const Planet = getGalaxyPlanetModel();

  try {
    // Fetch all planets sorted by displayOrder.
    const allPlanets = await Planet.find({}).sort({ displayOrder: 1 }).lean();
    if (allPlanets.length === 0) {
      return NextResponse.json({ error: "No planets to arrange" }, { status: 400 });
    }

    // Compute auto-layout positions.
    const layout = autoLayoutPlanets(allPlanets);
    if (layout.length === 0) {
      return NextResponse.json({ error: "No visible planets to arrange" }, { status: 400 });
    }

    // Bulk update each planet with its computed position.
    const updates = layout.map((pos) =>
      Planet.findOneAndUpdate(
        { slug: pos.slug },
        { orbitRadius: pos.orbitRadius, orbitAngle: pos.orbitAngle, orbitSpeed: pos.orbitSpeed },
        { new: true }
      )
    );
    await Promise.all(updates);

    revalidateFor("galaxyPlanet");

    return NextResponse.json({
      ok: true,
      arranged: layout.length,
      planets: layout,
    });
  } catch (err) {
    console.error("[auto-arrange]", err);
    return NextResponse.json({ error: "Auto-arrange failed" }, { status: 500 });
  }
}
