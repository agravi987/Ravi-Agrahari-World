/**
 * adminApi.ts -- shared helpers for /api/admin/* route handlers.
 * DRYs up requireAdmin() and revalidateFor() which were copy-pasted
 * across the collection and [id] route files.
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Rejects unauthenticated requests; returns null when allowed through. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Site + admin pages revalidate after any mutation (plan D10).
 *  Galaxy pages too -- the Learning Galaxy renders from the same
 *  content boundary and must reflect edits immediately (v4). */
export function revalidateFor(collection: string) {
  revalidatePath("/", "layout");
  revalidatePath("/detailed-galaxy");
  revalidatePath(`/admin/${collection}`);
}
