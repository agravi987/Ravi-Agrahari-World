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
 *  #28: Targeted revalidation — only revalidate paths affected by
 *  the specific collection, not the entire layout. */
export function revalidateFor(collection: string) {
  // Always revalidate the admin list for this collection.
  revalidatePath(`/admin/${collection}`);

  // Map collections to their public-facing paths.
  const publicPaths: Record<string, string[]> = {
    siteConfig: ["/", "/detailed-galaxy"],
    skill: ["/"],
    galaxyPlanet: ["/", "/detailed-galaxy"],
    galaxyMoon: ["/", "/detailed-galaxy"],
    galaxySettings: ["/detailed-galaxy"],
    project: ["/", "/projects"],
    experience: ["/", "/#experience"],
    certification: ["/", "/#certifications"],
    post: ["/", "/blog"],
    message: [], // messages have no public surface
  };

  const paths = publicPaths[collection] ?? ["/"];
  for (const p of paths) {
    revalidatePath(p);
  }
}
