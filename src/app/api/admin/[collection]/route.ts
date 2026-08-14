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
import { MODEL_GETTERS } from "@/lib/collections.server";
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

/** Site + admin pages revalidate after any mutation (plan D10). */
function revalidateFor(collection: string) {
  revalidatePath("/", "layout");
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

  const docs = await Model.find().sort({ order: 1 }).lean();
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
    // Mongoose validation errors bubble up as readable messages.
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
