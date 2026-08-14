/**
 * blog/[slug]/page.tsx — ui-ux-design.md P0
 * Blog detail pages. Renders a post's markdown via react-markdown
 * (installed in S11 but previously never used — this makes the CMS
 * markdown textarea meaningful). SSG slugs from content; ISR 60s so
 * post edits go live quickly after an admin mutation.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Badge from "@/components/ui/Badge";
import Eyebrow from "@/components/ui/Eyebrow";
import { getContent } from "@/lib/content";

export const revalidate = 60;

export async function generateStaticParams() {
  const { posts } = await getContent();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { posts } = await getContent();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Note not found" };
  return {
    title: `${post.title} — Notes & learnings`,
    description: post.excerpt,
  };
}

/** Rough read-time from word count, matching the card component. */
function readTimeMinutes(contentMarkdown: string): number {
  const words = contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { posts } = await getContent();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Eyebrow label="blog" />
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {post.title}
      </h1>

      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <span aria-hidden="true">·</span>
        <span>{readTimeMinutes(post.contentMarkdown)} min read</span>
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-card-border pt-10">
        {/* Styled in globals.css under .markdown — matches the design system */}
        <div className="markdown">
          <ReactMarkdown>{post.contentMarkdown}</ReactMarkdown>
        </div>
      </div>

      <nav className="mt-14 border-t border-card-border pt-8" aria-label="Post navigation">
        <Link href="/#blog" className="text-sm font-medium text-accent hover:underline">
          ← Back to notes
        </Link>
      </nav>
    </article>
  );
}
