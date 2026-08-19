/**
 * blog/page.tsx — P17: the notes archive.
 * Hierarchy: the home blog section teases the latest notes; this
 * page holds the full archive with tag filtering. Loads through
 * lib/content.ts (D6) — never hardcoded; revalidate like home.
 */
import BlogArchive from "@/components/blog/BlogArchive";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContent } from "@/lib/content";
import { tagHueClasses } from "@/lib/tagHue";

// Phase 9 perf: 1h ISR safety net — CMS mutations revalidatePath('/blog')
// instantly, so the TTL is a fallback, not the freshness contract.
export const revalidate = 3600;

export const metadata = {
  title: "Notes & learnings",
  description: "Short write-ups on what I'm studying — consistency beats polish.",
};

export default async function BlogIndex() {
  const { posts } = await getContent();

  // Phase 17 (#17): every tag in the data is a real destination — the
  // chips in the archive are filters, this row links to the tag pages.
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-16">
      {/* Breadcrumb home link — the archive is a sub-page (parity with
          the galaxy explorer and post pages). */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>
      <p className="text-center font-mono text-xs text-accent">~/notes</p>
      <h1 className="mt-3 text-center font-display text-4xl font-semibold tracking-tight text-ink">
        Notes &amp; learnings
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
        Short write-ups on what I&apos;m studying — consistency beats polish.
      </p>

      {/* Phase 17 (#17): browse by tag — direct links to each tag page */}
      {tags.length > 0 && (
        <nav
          aria-label="Browse notes by tag"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            browse by tag
          </span>
          {tags.map((tag) => (
            <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
              <Badge
                variant="colored"
                className={`${tagHueClasses(tag)} transition-transform hover:-translate-y-0.5`}
              >
                #{tag}
              </Badge>
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-10">
        <BlogArchive posts={posts} />
      </div>
    </main>
  );
}
