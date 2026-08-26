/**
 * imageHosts.ts — single source of truth for the next/image allowlist.
 *
 * Mirrors the remotePatterns in next.config.ts (which imports THIS
 * file, so the two can never drift). Components that render CMS-
 * provided image URLs through next/image (the hero photo, the galaxy
 * sun) check isAllowedImageUrl() first and degrade to their initials/
 * placeholder fallback instead of throwing "hostname not configured"
 * when an admin pastes a URL from a non-allowlisted host.
 */

export interface ImageHostPattern {
  protocol: "https";
  hostname: string;
}

export const ALLOWED_IMAGE_HOSTS: ImageHostPattern[] = [
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "avatars.githubusercontent.com" },
  { protocol: "https", hostname: "raw.githubusercontent.com" },
  { protocol: "https", hostname: "github.com" },
];

/** True only for https URLs whose host is on the allowlist. */
export function isAllowedImageUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.some((p) => u.hostname === p.hostname);
  } catch {
    return false;
  }
}

/**
 * Injects Cloudinary delivery optimizations (`f_auto,q_auto`) into
 * res.cloudinary.com upload URLs — browsers get AVIF/WebP when they
 * can and a sensibly compressed fallback otherwise. Non-Cloudinary
 * URLs pass through untouched, so callers can wrap every CMS image.
 */
export function withCloudinaryOptimizations(src: string | null | undefined): string {
  if (!src) return "";
  try {
    const u = new URL(src);
    if (u.hostname !== "res.cloudinary.com") return src;
    // Match the /<type>/<transform?>/<public-id> shape; insert ours once.
    return u.pathname.includes("/upload/")
      ? src.replace("/upload/", "/upload/f_auto,q_auto/")
      : src;
  } catch {
    return src;
  }
}
