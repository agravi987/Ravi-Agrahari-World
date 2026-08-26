/**
 * api/upload/route.ts -- plan D8
 * Admin-only image upload -> Cloudinary, returns the secure URL so
 * the admin form can fill image fields (project covers, cert logos).
 * Session-checked server-side (proxy.ts + this handler); returns 503
 * when Cloudinary env isn't configured (the form then falls back to
 * pasting a URL).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { cloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/** Images the site renders — keep SVG out (Cloudinary doesn't sanitize it). */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Cap uploads so a fat image can't blow the request or the CDN bill. */
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large — max 5 MB." }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type — upload a JPEG, PNG, WEBP, GIF, or AVIF image." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageBuffer(buffer, file.type);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
