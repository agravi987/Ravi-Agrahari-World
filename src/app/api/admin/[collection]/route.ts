/**
 * api/admin/[collection]/route.ts — plan D10 / ui-ux-design.md P0
 * List (GET) + create (POST) for admin collections. Session-checked
 * server-side (middleware.ts already gates the path; this is the
 * second line of defense). After every mutation we revalidate the
 * whole site so edits go live immediately (plan D10).
 */
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCollection } from "@/lib/collections";
import { assertGalaxyLayoutValid, MODEL_GETTERS, slugError } from "@/lib/collections.server";
import { connectDb } from "@/lib/db";

// Admin reads/writes must never be served from a stale static cache.
export const dynamic = "force-dynamic";

/** Rejects unauthenticated requests; returns null when allowed through. */
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Site + admin pages revalidate after any mutation (plan D10).
 *  Galaxy pages too — the Learning Galaxy renders from the same
 *  content boundary and must reflect edits immediately (v4). */
function revalidateFor(collection: string) {
  revalidatePath("/", "layout");
  revalidatePath("/detailed-galaxy");
  revalidatePath(`/admin/${collection}`);
}

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

  // Galaxy v4: reject writes that would break the zero-overlap layout.
  const layoutError = await assertGalaxyLayoutValid(collection, body.data);
  if (layoutError) {
    return NextResponse.json({ error: layoutError }, { status: 400 });
  }

  // Slugs power deep links — reject URL-unsafe input before it's saved
  // (a "My Cool Post!" slug breaks /blog/<slug> and galaxy anchors).
  const slugErr = slugError(body.data.slug);
  if (slugErr) return NextResponse.json({ error: slugErr }, { status: 400 });

  const Model = MODEL_GETTERS[collection]();

  try {
    if (spec.singleDoc) {
      // Singleton: update the one document, or create it on first run.
      const doc = await Model.findOneAndUpdate({}, body.data, {
        new: true,
        upsert: true,
        runValidators: true,
      }).lean();
      revalidateFor(collection);
      return NextResponse.json({ data: doc });
    }

    const doc = await Model.create(body.data);
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
