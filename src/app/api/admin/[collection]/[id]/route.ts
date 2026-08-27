/**
 * api/admin/[collection]/[id]/route.ts -- plan D10 / ui-ux-design.md P0
 * Read (GET), update (PUT), delete (DELETE) a single admin doc.
 * Session-checked; revalidates the site after mutations so edits go
 * live immediately. siteConfig is a singleton -- its form uses the
 * list route's POST/upsert instead of id-based endpoints.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/collections";
import { assertGalaxyLayoutValid, MODEL_GETTERS, slugError, validateData } from "@/lib/collections.server";
import { connectDb } from "@/lib/db";
import { requireAdmin, revalidateFor } from "@/lib/adminApi";
import { rebalanceGalaxyPlanets, rebalanceGalaxyMoons } from "@/lib/galaxyLayout";

export const dynamic = "force-dynamic";

/** #3: Filter body.data to only keys the collection spec declares. */
function whitelistFields(
  data: Record<string, unknown>,
  spec: ReturnType<typeof getCollection>
): Record<string, unknown> {
  if (!spec) return data;
  const allowed = new Set(spec.fields.map((f) => f.key));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

/** Mongo ObjectIds are 24 hex chars -- anything else would make
 *  findById throw a CastError (500). Guard so bad ids get a clean 404. */
function isValidId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { collection, id } = await params;
  const spec = getCollection(collection);
  if (!spec || spec.singleDoc || !isValidId(id)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const mongoose = await connectDb();
  if (!mongoose) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const doc = await MODEL_GETTERS[collection]().findById(id).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: doc });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { collection, id } = await params;
  const spec = getCollection(collection);
  if (!spec || spec.singleDoc || !isValidId(id)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const mongoose = await connectDb();
  if (!mongoose) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.data !== "object") {
    return NextResponse.json({ error: "Body must be { data: {…} }" }, { status: 400 });
  }

  // #3: only allow fields the collection spec declares.
  let safeData = whitelistFields(body.data as Record<string, unknown>, spec);

  // Auto-computed orbit fields — strip any manual overrides so the
  // admin can't break the zero-overlap layout.
  if (collection === "galaxyPlanet") {
    const { orbitRadius, orbitAngle, orbitSpeed, ...rest } = safeData;
    void orbitRadius; void orbitAngle; void orbitSpeed;
    safeData = rest;
  }
  if (collection === "galaxyMoon") {
    const { orbitRadius, orbitAngle, ...rest } = safeData;
    void orbitRadius; void orbitAngle;
    safeData = rest;
  }

  // #13 + #14: Validate JSON structure and URL formats.
  const validationErr = validateData(safeData, spec, collection);
  if (validationErr) {
    return NextResponse.json({ error: validationErr }, { status: 400 });
  }

  // Galaxy v4: reject writes that would break the zero-overlap layout.
  const layoutError = await assertGalaxyLayoutValid(collection, safeData, id);
  if (layoutError) {
    return NextResponse.json({ error: layoutError }, { status: 400 });
  }

  // Slugs power deep links — reject URL-unsafe input before it's saved.
  const slugErr = slugError(safeData.slug);
  if (slugErr) return NextResponse.json({ error: slugErr }, { status: 400 });

  try {
    const doc = await MODEL_GETTERS[collection]()
      .findByIdAndUpdate(id, safeData, { new: true, runValidators: true })
      .lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Auto-rebalance after visibility/order changes so positions stay correct.
    if (collection === "galaxyPlanet") {
      await rebalanceGalaxyPlanets();
    }
    if (collection === "galaxyMoon" && doc.planetId) {
      await rebalanceGalaxyMoons(String(doc.planetId));
    }
    revalidateFor(collection);
    return NextResponse.json({ data: doc });
  } catch (err) {
    // Translate raw E11000 (unique slug/name) into something the admin
    // can act on instead of a Mongo internals dump.
    const dup = (err as { code?: number })?.code === 11000;
    const message = dup
      ? "A document with this slug (or name) already exists -- pick a unique slug before saving."
      : err instanceof Error
        ? err.message
        : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { collection, id } = await params;
  const spec = getCollection(collection);
  if (!spec || spec.singleDoc || !isValidId(id)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const mongoose = await connectDb();
  if (!mongoose) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  // #4: Delete moons BEFORE the planet — if moon deletion fails,
  // the planet still exists and the admin sees the error. The old
  // order (planet first) left orphaned moons on partial failure.
  if (collection === "galaxyPlanet") {
    await MODEL_GETTERS.galaxyMoon().deleteMany({ planetId: id });
  }

  const doc = await MODEL_GETTERS[collection]().findByIdAndDelete(id).lean();
  if (!doc) {
    // Moons already deleted — re-create them is impossible, but at
    // least the admin sees a 404 instead of orphaned data.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auto-rebalance remaining planets so spacing stays even after a delete.
  if (collection === "galaxyPlanet") {
    await rebalanceGalaxyPlanets();
  }
  // Auto-rebalance remaining moons around the parent planet.
  if (collection === "galaxyMoon" && doc.planetId) {
    await rebalanceGalaxyMoons(String(doc.planetId));
  }

  revalidateFor(collection);
  return NextResponse.json({ data: { id } });
}
