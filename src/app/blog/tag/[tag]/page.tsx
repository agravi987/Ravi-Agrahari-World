/**
 * blog/tag/[tag]/page.tsx — Phase 17 (blog backlog #17).
 * Tag pages: /blog/tag/<tag> lists every post carrying that tag,
 * reusing the archive surface with the tag preselected. SSG slugs
 * from the data; 1h ISR fallback like the rest of the blog. A tag
 * with zero posts 404s (honest — nothing to list).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BlogArchive from "@/components/blog/BlogArchive";
import { getContent } from "@/lib/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { posts } = await getContent();
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/blog/tag/${encodeURIComponent(tag)}`;
  return {
    title: `#${tag} — Notes & learnings`,
    description: `Every note tagged #${tag}.`,
    alternates: { canonical: url },
    openGraph: {
      title: `#${tag} — Notes & learnings`,
      description: `Every note tagged #${tag}.`,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `#${tag} — Notes & learnings`,
      description: `Every note tagged #${tag}.`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const { posts } = await getContent();
  const matching = posts.filter((p) => p.tags.includes(tag));
  if (matching.length === 0) return notFound();

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All notes
      </Link>
      <p className="text-center font-mono text-xs text-accent">~/notes/tag</p>
      <h1 className="mt-3 text-center font-display text-4xl font-semibold tracking-tight text-ink">
        #{tag}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
        {matching.length} {matching.length === 1 ? "note" : "notes"} tagged{" "}
        <span className="font-mono text-ink">#{tag}</span>.
      </p>

      <div className="mt-10">
        <BlogArchive posts={matching} initialTag={tag} />
      </div>
    </main>
  );
}
