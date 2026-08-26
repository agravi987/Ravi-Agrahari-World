/**
 * sitemap.ts — plan S9 SEO
 * Home + the Learning Galaxy explorer + every blog post. Base comes
 * from NEXT_PUBLIC_SITE_URL (set on Vercel) with a local fallback.
 * Content reads through lib/content.ts (D6) so CMS posts appear.
 *
 * Phase: dynamic lastmod from updatedAt (not just new Date()).
 */
import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { parseDate } from "@/lib/date";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { posts, projects } = await getContent();

  /** Safe lastMod — falls back to now for malformed/missing dates. */
  function lastMod(raw: string | Date | null | undefined): Date {
    return parseDate(raw) ?? new Date();
  }

  // Phase 17 (#17): tag pages join the crawl (only tags with posts).
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags))).map((tag) => ({
    url: `${base}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  // Phase 13: case-study pages join the crawl (only projects with slugs).
  const caseStudies = projects
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${base}/projects/${p.slug}`,
      // Use updatedAt when available (projects may have it from Mongo
      // timestamps); fallback to now.
      lastModified: p.updatedAt ? lastMod(p.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/detailed-galaxy`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/feed.xml`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
    ...posts.map((post) => {
      // lastmod should reflect the last EDIT: prefer updatedAt when it's
      // newer than publishedAt (edited posts re-crawl sooner).
      const published = lastMod(post.publishedAt);
      const edited = post.updatedAt ? lastMod(post.updatedAt) : published;
      return {
        url: `${base}/blog/${post.slug}`,
        lastModified:
          edited.getTime() > published.getTime() ? edited : published,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    }),
    ...tags,
    ...caseStudies,
  ];
}
