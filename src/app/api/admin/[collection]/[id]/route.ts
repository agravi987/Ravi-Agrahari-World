/**
 * api/admin/[collection]/[id]/route.ts -- plan D10 / ui-ux-design.md P0
 * Read (GET), update (PUT), delete (DELETE) a single admin doc.
 * Session-checked; revalidates the site after mutations so edits go
 * live immediately. siteConfig is a singleton -- its form uses the
 * list route's POST/upsert instead of id-based endpoints.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/collections";
import { assertGalaxyLayoutValid, MODEL_GETTERS, slugError } from "@/lib/collections.server";
import { connectDb } from "@/lib/db";
import { requireAdmin, revalidateFor } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

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

  // Galaxy v4: reject writes that would break the zero-overlap layout.
  const layoutError = await assertGalaxyLayoutValid(collection, body.data, id);
  if (layoutError) {
    return NextResponse.json({ error: layoutError }, { status: 400 });
  }

  // Slugs power deep links -- reject URL-unsafe input before it's saved.
  const slugErr = slugError(body.data.slug);
  if (slugErr) return NextResponse.json({ error: slugErr }, { status: 400 });

  try {
    const doc = await MODEL_GETTERS[collection]()
      .findByIdAndUpdate(id, body.data, { new: true, runValidators: true })
      .lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const doc = await MODEL_GETTERS[collection]().findByIdAndDelete(id).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Galaxy v4: deleting a planet also deletes its moons (1:N cascade,
  // plan 4/33) -- no orphaned moons left behind.
  if (collection === "galaxyPlanet") {
    await MODEL_GETTERS.galaxyMoon().deleteMany({ planetId: id });
  }

  revalidateFor(collection);
  return NextResponse.json({ data: { id } });
}
