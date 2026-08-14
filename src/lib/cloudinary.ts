/**
 * cloudinary.ts — plan D8 upload helper
 * Configures the Cloudinary SDK once and exposes a small upload
 * function for the admin /api/upload route. Guarded so a build
 * WITHOUT CLOUDINARY_* env still compiles (same pattern as db.ts):
 * the route returns 503 and the admin form falls back to pasting
 * a URL directly.
 */
import { v2 as cloudinary } from "cloudinary";

/** True only when all three Cloudinary env vars are present. */
export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
});

/**
 * Uploads a raw file buffer (from the admin form) and returns the
 * secure public URL. Uploading server-side keeps the API secret on
 * the server — never exposed to the browser (plan D8).
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  mime: string,
  folder = "portfolio"
): Promise<string> {
  // Cloudinary's SDK accepts a data URI directly — no temp file needed.
  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder });
  return result.secure_url;
}
