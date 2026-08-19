/**
 * BlogArchive.tsx (client) — P17: the /blog archive surface.
 * Hierarchy: home shows the latest few notes; this page holds the
 * full archive. Tag chips filter the grid (All + every tag in the
 * data) — same interaction language as the home blog section.
 * Zero-data: renders nothing when there are no posts.
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { readTimeMinutes } from "@/lib/readTime";
import { tagHueClasses } from "@/lib/tagHue";
import { dateMs, formatDateSafe } from "@/lib/date";
import type { Post } from "@/types";

interface BlogArchiveProps {
  posts: Post[];
  /** Phase 17 (#17): when set, the archive opens with this tag selected
   *  (used by the /blog/tag/<tag> pages). */
  initialTag?: string;
}

/** Phase 17 (#22): "new" pill — posts published within the last 14 days.
 *  `now` is module-scope (evaluated once at import, NOT during render,
 *  so the React-Compiler purity rule stays quiet); a session-long
 *  staleness is negligible against a 14-day window. */
const NEW_PILL_MS = 14 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

/** One archive card — shared by the month-grouped and flat views.
 *  Phase 17 (#22): a "new" pill when published within 14 days. */
function ArchiveCard({
  post,
  featured,
  isNew,
}: {
  post: Post;
  featured: boolean;
  isNew: boolean;
}) {
  const card = (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col rounded-card border border-card-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <time dateTime={post.publishedAt} className="flex items-center gap-2">
          {/* BUGFIX: formatDateSafe — a post without a date used to
              throw RangeError here and take down the whole archive. */}
          {formatDateSafe(post.publishedAt, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }) ?? "someday"}
          {/* Phase 17 (#22): fresh note — data-driven, fades with time */}
          {isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <span
                className="h-1 w-1 animate-pulse rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              new
            </span>
          )}
        </time>
        <span>{readTimeMinutes(post.contentMarkdown)} min read</span>
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold text-ink transition-colors group-hover:text-accent">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{post.excerpt}</p>
      {post.tags.length > 0 && (
        /* Cards are whole-card links — chips stay plain (nested <a> is
           invalid). Tag destinations live in the browse-by-tag row on
           the archive page instead (Phase 17 #17). */
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="colored" className={tagHueClasses(tag)}>
              #{tag}
            </Badge>
          ))}
        </div>
      )}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
        Read note
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );

  return featured ? (
    /* Featured: gradient hairline border + full-width row */
    <div className="relative rounded-card bg-gradient-to-r from-accent via-accent-cyan to-topic-ai p-px sm:col-span-2">
      {card}
    </div>
  ) : (
    card
  );
}

export default function BlogArchive({ posts, initialTag }: BlogArchiveProps) {
  // Phase 17 (#17): open with a preselected tag when arriving from a
  // /blog/tag/<tag> page ("all" otherwise).
  const [filter, setFilter] = useState(initialTag ?? "all");
  // P26: text search over title + excerpt (the archive will grow)
  const [query, setQuery] = useState("");
  // P27: newest / oldest sort
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  if (posts.length === 0) return null; // zero-data hide

  /** Phase 10: roving-tab keyboard for the tag list (parity with the
   *  home blog section + skills) — ←/→ move, Home/End jump. */
  function moveTag(from: number, dir: 1 | -1) {
    const total = tags.length + 1; // +1 for "All"
    const next = (from + dir + total) % total;
    setFilter(next === 0 ? "all" : tags[next - 1]);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-archive-tab="${next}"]`)
        ?.focus();
    });
  }

  const tags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  const q = query.trim().toLowerCase();
  const visible = posts
    .filter((p) => {
      if (filter !== "all" && !p.tags.includes(filter)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      // BUGFIX: dateMs — empty dates were NaN here, which makes
      // Array.sort's comparator undefined behavior (unstable order).
      const d = dateMs(a.publishedAt) - dateMs(b.publishedAt);
      return sort === "newest" ? -d : d;
    });

  // Featured = the newest post in the default view — gradient border +
  // full-width row so the freshest note leads the archive.
  const featured =
    sort === "newest" && !q && filter === "all" ? visible[0] ?? null : null;

  /** Phase 17 (#16): month-group the archive — "Jun 2026", "Mar 2026"…
   *  headers with a count, so the list reads like a real journal. Only
   *  when sorted newest-first (oldest view stays flat); a single group
   *  renders without a header (no noise). */
  const groups = (() => {
    if (sort !== "newest") return null;
    const map = new Map<string, typeof visible>();
    for (const p of visible) {
      const d = new Date(p.publishedAt);
      const key = Number.isNaN(d.getTime())
        ? "later"
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, posts]) => ({
      key,
      label: key === "later"
        ? "Undated"
        : new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
      posts,
    }));
  })();

  const isNew = (iso: string) => {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return false;
    return NOW - d < NEW_PILL_MS;
  };

  return (
    <>
      {/* P26 search + P27 sort, live count (aria-live announces results) */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-sm items-center gap-2">
          <div className="relative w-full">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
              autoComplete="off"
              className="w-full rounded-full border border-card-border bg-card px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
            {/* Phase 10: a one-click × clears the search (and the tag
                filter) — never forces the user to backspace manually. */}
            {query.trim() !== "" && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                aria-label="Clear search and filters"
                title="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-paper-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                ×
              </button>
            )}
          </div>
          <div
            role="group"
            aria-label="Sort notes"
            className="flex shrink-0 overflow-hidden rounded-full border border-card-border bg-card"
          >
            <button
              type="button"
              onClick={() => setSort("newest")}
              aria-pressed={sort === "newest"}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                sort === "newest" ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-accent"
              }`}
            >
              newest
            </button>
            <button
              type="button"
              onClick={() => setSort("oldest")}
              aria-pressed={sort === "oldest"}
              className={`border-l border-card-border px-3 py-2 text-xs font-medium transition-colors ${
                sort === "oldest" ? "bg-accent-soft text-accent" : "text-ink-soft hover:text-accent"
              }`}
            >
              oldest
            </button>
          </div>
        </div>
        <p aria-live="polite" className="font-mono text-xs text-ink-faint">
          {filter === "all" && !q
            ? `${posts.length} ${posts.length === 1 ? "note" : "notes"} total`
            : `${visible.length} of ${posts.length} shown`}
        </p>
      </div>

      {tags.length > 1 && (
        <div
          role="tablist"
          aria-label="Filter notes by tag"
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            data-archive-tab="0"
            onClick={() => setFilter("all")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                moveTag(0, -1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                moveTag(0, 1);
              } else if (e.key === "Home") {
                e.preventDefault();
                setFilter("all");
                requestAnimationFrame(() =>
                  document.querySelector<HTMLButtonElement>('[data-archive-tab="0"]')?.focus()
                );
              } else if (e.key === "End") {
                e.preventDefault();
                setFilter(tags[tags.length - 1]);
                requestAnimationFrame(() =>
                  document
                    .querySelector<HTMLButtonElement>(`[data-archive-tab="${tags.length}"]`)
                    ?.focus()
                );
              }
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              filter === "all"
                ? "border-transparent bg-accent-btn text-white shadow-card"
                : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
            }`}
          >
            All
          </button>
          {tags.map((tag, i) => (
            <button
              key={tag}
              type="button"
              role="tab"
              aria-selected={filter === tag}
              data-archive-tab={i + 1}
              onClick={() => setFilter(tag)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  moveTag(i + 1, -1);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  moveTag(i + 1, 1);
                } else if (e.key === "Home") {
                  e.preventDefault();
                  setFilter("all");
                  requestAnimationFrame(() =>
                    document.querySelector<HTMLButtonElement>('[data-archive-tab="0"]')?.focus()
                  );
                } else if (e.key === "End") {
                  e.preventDefault();
                  setFilter(tags[tags.length - 1]);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>(`[data-archive-tab="${tags.length}"]`)
                      ?.focus()
                  );
                }
              }}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                filter === tag
                  ? "border-transparent bg-topic-linux text-white shadow-card"
                  : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {groups ? (
        /* Phase 17 (#16): month-grouped journal view */
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`month-${g.key}`}>
              {groups.length > 1 && (
                <h2
                  id={`month-${g.key}`}
                  className="mb-4 flex items-baseline gap-2 font-mono text-xs font-medium uppercase tracking-wider text-ink-faint"
                >
                  {g.label}
                  <span aria-hidden="true" className="text-ink-faint/60">
                    · {g.posts.length}
                  </span>
                </h2>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                {g.posts.map((post) => (
                  <ArchiveCard
                    key={post.slug}
                    post={post}
                    featured={featured?.slug === post.slug}
                    isNew={isNew(post.publishedAt)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {visible.map((post) => (
            <ArchiveCard
              key={post.slug}
              post={post}
              featured={featured?.slug === post.slug}
              isNew={isNew(post.publishedAt)}
            />
          ))}
        </div>
      )}

      {visible.length === 0 && (
        /* Phase 10: honest empty state — say WHY nothing matches (a
            search term vs. an empty tag) and offer the one-click reset. */
        <div className="mx-auto max-w-sm rounded-card border border-dashed border-card-border bg-card/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-ink">
            {query.trim()
              ? `No notes match “${query.trim()}”`
              : `No notes tagged #${filter} yet`}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            {query.trim() && filter !== "all"
              ? `…within the #${filter} view.`
              : query.trim()
                ? "Try a different term."
                : "Check back soon — consistency beats polish."}
          </p>
          {(query.trim() || filter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-4 rounded-full bg-accent-btn px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              clear search
            </button>
          )}
        </div>
      )}

      <p className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
          Back to home
        </Link>
      </p>
    </>
  );
}
