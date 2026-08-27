/**
 * api/admin/[collection]/route.ts -- plan D10 / ui-ux-design.md P0
 * List (GET) + create (POST) for admin collections. Session-checked
 * server-side (proxy.ts already gates the path; this is the
 * second line of defense). After every mutation we revalidate the
 * whole site so edits go live immediately (plan D10).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/collections";
import { assertGalaxyLayoutValid, MODEL_GETTERS, slugError, validateData } from "@/lib/collections.server";
import { connectDb } from "@/lib/db";
import { requireAdmin, revalidateFor } from "@/lib/adminApi";
import { seedContent } from "@/lib/seed";
import { rebalanceGalaxyPlanets, rebalanceGalaxyMoons } from "@/lib/galaxyLayout";

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

// Admin reads/writes must never be served from a stale static cache.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { collection } = await params;
  const spec = getCollection(collection);
  if (!spec) return NextResponse.json({ error: "Unknown collection" }, { status: 400 });

  const mongoose = await connectDb();
  if (!mongoose) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const Model = MODEL_GETTERS[collection]();

  if (spec.singleDoc) {
    const doc = await Model.findOne().lean();
    return NextResponse.json({ data: doc ?? null });
  }

  // Sort by the registry's orderKey when one exists (galaxy displayOrder,
  // project/experience order) so the server order matches what the list
  // shows — the old hardcoded { order: 1 } was a no-op for displayOrder.
  const docs = spec.orderKey
    ? await Model.find().sort({ [spec.orderKey]: 1 }).lean()
    : await Model.find().lean();
  return NextResponse.json({ data: docs });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { collection } = await params;
  const spec = getCollection(collection);
  if (!spec) return NextResponse.json({ error: "Unknown collection" }, { status: 400 });

  const mongoose = await connectDb();
  if (!mongoose) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.data !== "object") {
    return NextResponse.json({ error: "Body must be { data: {…} }" }, { status: 400 });
  }

  // #3: only allow fields the collection spec declares — prevents
  // injection of arbitrary keys (e.g. _id, __v, internal fields).
  const safeData = whitelistFields(body.data as Record<string, unknown>, spec);

  // #13 + #14: Validate JSON structure and URL formats.
  const validationErr = validateData(safeData, spec, collection);
  if (validationErr) {
    return NextResponse.json({ error: validationErr }, { status: 400 });
  }

  // Galaxy v4: reject writes that would break the zero-overlap layout.
  const layoutError = await assertGalaxyLayoutValid(collection, safeData);
  if (layoutError) {
    return NextResponse.json({ error: layoutError }, { status: 400 });
  }

  // Slugs power deep links — reject URL-unsafe input before it's saved
  // (a "My Cool Post!" slug breaks /blog/<slug> and galaxy anchors).
  const slugErr = slugError(safeData.slug);
  if (slugErr) return NextResponse.json({ error: slugErr }, { status: 400 });

  const Model = MODEL_GETTERS[collection]();

  try {
    if (spec.singleDoc) {
      // #27: For singletons, merge seed defaults so the admin never
      // gets an empty doc. The client sends {} when clicking "Create".
      const defaults: Record<string, unknown> =
        collection === "siteConfig" ? { ...seedContent.config } : {};
      const mergedData = { ...defaults, ...safeData };
      // #1: Atomic upsert — eliminates the race condition where two
      // concurrent POSTs both see no doc and both create duplicates.
      const doc = await Model.findOneAndUpdate({}, mergedData, {
        upsert: true,
        new: true,
        runValidators: true,
      }).lean();
      revalidateFor(collection);
      return NextResponse.json({ data: doc });
    }

    const doc = await Model.create(safeData);
    // Auto-rebalance galaxy planets so the new planet gets a computed
    // orbitRadius, orbitAngle, and orbitSpeed (no manual entry needed).
    if (collection === "galaxyPlanet") {
      await rebalanceGalaxyPlanets();
    }
    // Auto-rebalance moons around the parent planet.
    if (collection === "galaxyMoon" && safeData.planetId) {
      await rebalanceGalaxyMoons(String(safeData.planetId));
    }
    revalidateFor(collection);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    // Mongoose validation errors bubble up as readable messages; the raw
    // E11000 duplicate-key text (unique slug/name indexes) is not one of
    // them, so translate it before the admin sees it.
    const dup = (err as { code?: number })?.code === 11000;
    const message = dup
      ? "A document with this slug (or name) already exists — pick a unique slug before saving."
      : err instanceof Error
        ? err.message
        : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
