/**
 * sitemap.ts — plan S9 SEO
 * Single-page site → one URL. Base comes from NEXT_PUBLIC_SITE_URL
 * (set on Vercel) with a local fallback.
 */
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
