import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import CodeBlock from "@/components/blog/CodeBlock";
import CopyLinkButton from "@/components/blog/CopyLinkButton";
import HeadingCopyLink from "@/components/blog/HeadingCopyLink";
import ReadingProgress from "@/components/blog/ReadingProgress";
import TableOfContents from "@/components/blog/TableOfContents";
import Badge from "@/components/ui/Badge";
import BrandIcon from "@/components/ui/BrandIcon";
import Eyebrow from "@/components/ui/Eyebrow";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getContent, getGalaxy } from "@/lib/content";
import { tagHueClasses } from "@/lib/tagHue";
import { dateMs, formatDateSafe, parseDate } from "@/lib/date";

// Phase 9 perf: 1h ISR safety net — post edits revalidatePath the
// slug instantly; the TTL is a fallback so readers hit the cache.
export const revalidate = 3600;

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    title: `${post.title} — Notes & learnings`,
    description: post.excerpt,
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
    // P11: per-post OG/Twitter metadata — share links get a real preview.
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `${siteUrl}/blog/${post.slug}`,
      tags: post.tags,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.excerpt,
    },
  };
}

/** Rough read-time from word count, matching the card component. */
function readTimeMinutes(contentMarkdown: string): number {
  const words = contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Phase 17 (#24): stable, readable heading id — same algorithm as
 *  TableOfContents so the TOC finds server-rendered ids and skips its
 *  own assignment. Empty text → "" (the caller assigns heading-N).
 *  BUGFIX: the old Math.random() fallback produced a DIFFERENT id on
 *  the server vs. the client hydration pass → React hydration
 *  mismatch whenever a post had an empty heading. */
function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Phase 17 (#24): pull plain text out of markdown heading children
 *  (strings + nested inline nodes) for the anchor id. */
function headingText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(headingText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return headingText((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

/** Phase 17 (#20): does a post tag name a galaxy planet? Returns its
 *  deep-link slug when matched (name OR slug, case-insensitive). */
function planetForTags(
  tags: string[],
  planets: { name: string; slug: string }[]
): { name: string; slug: string } | null {
  for (const tag of tags) {
    const t = tag.toLowerCase();
    const hit = planets.find(
      (p) => p.slug.toLowerCase() === t || p.name.toLowerCase() === t
    );
    if (hit) return hit;
  }
  return null;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { posts, config } = await getContent();
  const configName = config.name;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // BUGFIX: two headings with the same text produced DUPLICATE id
  // attributes (invalid HTML, TOC scrollspy broke on the first one).
  // Dedupe deterministically per render — server and client compute
  // the same ids, and empty headings get index-based ids (no random).
  const usedHeadingIds = new Set<string>();
  const uniqueHeadingId = (text: string) => {
    const base = headingId(text) || `heading-${usedHeadingIds.size + 1}`;
    let id = base;
    let n = 2;
    while (usedHeadingIds.has(id)) id = `${base}-${n++}`;
    usedHeadingIds.add(id);
    return id;
  };

  // Phase 17 (#20): the planet this post is "learning while" (tag-name
  // match), so the write-up links back into the galaxy. Zero-data:
  // hidden when no tag names a planet.
  const galaxy = await getGalaxy();
  const learningPlanet = planetForTags(post.tags, galaxy.planets);

  // SEO: typed BlogPosting entity — search engines get author, dates
  // and tags as data, not just prose. Server component, so a plain
  // script tag is SSR-streamed safely (same escaping rule as JsonLd).
  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: (post.updatedAt as string | undefined) || post.publishedAt || undefined,
    keywords: post.tags.join(", ") || undefined,
    url: `${siteUrl}/blog/${post.slug}`,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    author: { "@type": "Person", name: configName },
  };

  // Phase 17 (#13): show "updated" only when the doc was meaningfully
  // edited after publish (Mongo timestamps; seed fallback has none).
  const updatedAt = post.updatedAt ? parseDate(post.updatedAt) : null;
  const published = parseDate(post.publishedAt); // null for empty/invalid
  const showUpdated =
    !!updatedAt &&
    !!published &&
    !Number.isNaN(updatedAt.getTime()) &&
    !Number.isNaN(published.getTime()) &&
    updatedAt.getTime() - published.getTime() > 24 * 60 * 60 * 1000;
  const updatedIso = showUpdated ? updatedAt.toISOString() : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* P8: scroll reading-progress bar (accent gradient, hidden for
          reduced-motion users). */}
      <ReadingProgress />
      {/* SEO: typed entity for this post (see blogPosting above) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting).replace(/</g, "\\u003c") }}
      />
      {/* Breadcrumbs — hierarchy navigation for deep pages */}
      <Breadcrumbs
        items={[
          { label: "Portfolio", href: "/" },
          { label: "Notes & learnings", href: "/blog" },
          { label: post.title },
        ]}
      />
      <Eyebrow label="blog" />
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          <time dateTime={post.publishedAt}>
            {/* BUGFIX: formatDateSafe — an empty publishedAt used to
                throw RangeError and 500 the whole post page. */}
            {formatDateSafe(post.publishedAt, {
              year: "numeric",
              month: "long",
              day: "numeric",
            }) ?? "someday"}
          </time>
          {/* Phase 17 (#13): honest "updated" marker — only when the doc
              was edited after publish (hidden for fresh/seed posts). */}
          {updatedIso && (
            <>
              <span aria-hidden="true">·</span>
              <time
                dateTime={updatedIso}
                title={`Last edited ${new Date(updatedIso).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`}
              >
                updated {new Date(updatedIso).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{readTimeMinutes(post.contentMarkdown)} min read</span>
        </p>
        {/* P27: share to X / LinkedIn — URL-based intents, no handle
            needed; CopyLinkButton (P10) copies the URL with a toast */}
        {(() => {
          const shareUrl = `${siteUrl}/blog/${post.slug}`;
          const shareBtn =
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
          return (
            <span className="flex items-center gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share ${post.title} on X`}
                title="Share on X"
                className={`${shareBtn} hover:border-ink/40 hover:text-ink`}
              >
                <BrandIcon name="x" className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share ${post.title} on LinkedIn`}
                title="Share on LinkedIn"
                className={`${shareBtn} hover:border-topic-cloud/50 hover:text-topic-cloud-deep`}
              >
                <span aria-hidden="true" className="text-xs font-bold leading-none">
                  in
                </span>
              </a>
              <CopyLinkButton />
            </span>
          );
        })()}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="colored" className={tagHueClasses(tag)}>
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Phase 17 (#20): "written while learning X" — links this note
          back into the galaxy planet it belongs to (hidden when no tag
          matches a planet; zero-data rule). */}
      {learningPlanet && (
        <Link
          href={`/detailed-galaxy#planet-${learningPlanet.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft/60 px-4 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent/50 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">🌌</span>
          written while learning {learningPlanet.name} — see it in the galaxy
        </Link>
      )}

      {/* P11: two-column content — TOC sidebar (desktop) + article */}
      <div className="mt-10 flex gap-10 border-t border-card-border pt-10">
        <TableOfContents />
        <div className="min-w-0 flex-1">
          {/* Styled in globals.css under .markdown — matches the design system */}
          <div className="markdown">
            <ReactMarkdown
              components={{
                // P8: fenced code blocks get a copy button; inline code stays plain.
                code(props) {
                  const { className, children } = props;
                  const isBlock = String(className ?? "").includes("language-");
                  if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
                  return <code className={className}>{children}</code>;
                },
                // Phase 17 (#24): h2/h3 get a stable id + a hover-revealed
                // copy-link pill (parity with home sections). Group class
                // lets the pill fade in; TOC reuses the same id.
                h2(props) {
                  const { children } = props;
                  const id = uniqueHeadingId(headingText(children));
                  return (
                    <h2 id={id} className="group scroll-mt-24">
                      {children}
                      <HeadingCopyLink id={id} />
                    </h2>
                  );
                },
                h3(props) {
                  const { children } = props;
                  const id = uniqueHeadingId(headingText(children));
                  return (
                    <h3 id={id} className="group scroll-mt-24">
                      {children}
                      <HeadingCopyLink id={id} />
                    </h3>
                  );
                },
              }}
            >
              {post.contentMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* P9: related posts — same-tag notes, so readers keep going.
          Zero-data policy: hidden when no other post shares a tag. */}
      {(() => {
        const related = posts.filter(
          (p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t))
        );
        if (related.length === 0) return null;
        return (
          <section className="mt-14 border-t border-card-border pt-10" aria-labelledby="related-title">
            <h2 id="related-title" className="font-display text-xl font-semibold text-ink">
              Keep reading
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.slice(0, 2).map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group rounded-card border border-card-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover"
                >
                  <h3 className="font-display text-base font-semibold text-ink transition-colors group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{p.excerpt}</p>
                  {p.tags.length > 0 && (
                    <p className="mt-3 font-mono text-xs text-ink-soft">
                      {p.tags.map((t) => `#${t}`).join(" ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* P22: prev/next by date — classic archive flow, so readers move
          through the notes in order. Zero-data: sides hide when there's
          no neighbor in that direction. */}
      {(() => {
        const ordered = [...posts].sort(
          (a, b) => dateMs(a.publishedAt) - dateMs(b.publishedAt)
        );
        const idx = ordered.findIndex((p) => p.slug === post.slug);
        const prev = idx > 0 ? ordered[idx - 1] : null;
        const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
        if (!prev && !next) return null;
        return (
          <nav aria-label="Post navigation" className="mt-10 flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="group min-w-0 max-w-[45%] text-left"
              >
                <span className="block text-xs text-ink-faint">← older note</span>
                <span className="mt-0.5 block truncate text-sm font-medium text-ink-soft transition-colors group-hover:text-accent">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <Link
              href="/blog"
              className="shrink-0 rounded-full border border-card-border bg-card px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
            >
              All notes
            </Link>
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="group min-w-0 max-w-[45%] text-right"
              >
                <span className="block text-xs text-ink-faint">newer note →</span>
                <span className="mt-0.5 block truncate text-sm font-medium text-ink-soft transition-colors group-hover:text-accent">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        );
      })()}
    </article>
  );
}
