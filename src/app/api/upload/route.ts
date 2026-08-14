/**
 * api/upload/route.ts — plan D8
 * Admin-only image upload → Cloudinary, returns the secure URL so
 * the admin form can fill image fields (project covers, cert logos).
 * Session-checked server-side; returns 503 when Cloudinary env isn't
 * configured (the form then falls back to pasting a URL).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageBuffer(buffer, file.type || "application/octet-stream");
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
