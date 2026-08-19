/**
 * feed.xml/route.ts — Phase 17 (blog backlog #11).
 * A real RSS 2.0 feed at /feed.xml, server-rendered from lib/content.ts
 * (never hardcoded — CMS posts appear immediately). Content reads through
 * the same boundary as the site, so it's always fresh.
 *
 * This is a ROUTE HANDLER that returns XML — Next's metadata conventions
 * (app/feed.xml/route.ts + xml content type) serve it at /feed.xml.
 */
import type { Post } from "@/types";
import { getContent } from "@/lib/content";
import { dateMs } from "@/lib/date";

export const revalidate = 3600; // 1h ISR fallback, like the rest of the site

/** XML-escapes a string for safe embedding in the feed. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Safely wraps content in CDATA — a literal `]]>` in the markdown
 *  would TERMINATE the CDATA section and corrupt the feed XML. The
 *  standard trick splits it: `]]>` → `]]]]><![CDATA[>`. */
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function itemXml(post: Post, base: string): string {
  const url = `${base}/blog/${post.slug}`;
  const iso =
    post.publishedAt && !Number.isNaN(new Date(post.publishedAt).getTime())
      ? new Date(post.publishedAt).toISOString()
      : new Date().toISOString();
  const tags = post.tags
    .map((t) => `      <category>${esc(t)}</category>\n`)
    .join("");
  return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${new Date(iso).toUTCString()}</pubDate>
      <description>${esc(post.excerpt)}</description>
      <content:encoded>${cdata(post.contentMarkdown)}</content:encoded>
${tags}    </item>`;
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { posts } = await getContent();

  const sorted = [...posts].sort((a, b) => dateMs(b.publishedAt) - dateMs(a.publishedAt));
  const items = sorted
    .map((p) => itemXml(p, base))
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Notes &amp; learnings — learning in public</title>
    <link>${esc(base)}/blog</link>
    <description>Short write-ups on what I'm studying — consistency beats polish.</description>
    <language>en</language>
    <atom:link href="${esc(base)}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
    },
  });
}
