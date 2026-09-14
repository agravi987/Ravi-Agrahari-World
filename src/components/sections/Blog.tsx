/**
 * Blog.tsx (client) — plan S7 + ui-ux-design.md P0 + P13/P17 hierarchy
 * Note cards (title, excerpt, tags, date) — learning-in-public signal,
 * not a full blog engine (plan §3). Tag chips on top filter the grid
 * (All + every tag in the data). The SURFACE shows the latest few
 * notes; once there are more than 3, a "View all notes" link points
 * to the /blog archive (P17) — surface vs. archive hierarchy.
 * Auto-hides when empty (plan §5.2).
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import CosmicDecor from "@/components/ui/CosmicDecor";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import TiltCard from "@/components/ui/TiltCard";
import { readTimeMinutes } from "@/lib/readTime";
import { tagHueBorder, tagHueClasses } from "@/lib/tagHue";
import { dateMs, formatDateSafe } from "@/lib/date";
import type { Post } from "@/types";

interface BlogProps {
  posts: Post[];
  fit?: boolean;
  cue?: boolean;
}

/** Phase 17 (#22): "new" pill — module-scope "now" (evaluated once at
 *  import, NOT during render — React-Compiler purity rule stays quiet);
 *  a session-long staleness is negligible against a 14-day window. */
const NEW_PILL_MS = 14 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

/** Home is the surface: show the latest few, archive holds the rest. */
const SURFACE_COUNT = 3;

export default function Blog({ posts, fit, cue }: BlogProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  if (posts.length === 0) return null; // auto-hide (§5.2)

  const tags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  const activeIdx = filter === "all" ? 0 : tags.indexOf(filter) + 1;
  const q = search.trim().toLowerCase();
  // Layered filter (UX pass): tag → free-text across title/excerpt/tags.
  const visible = (filter === "all" ? posts : posts.filter((p) => p.tags.includes(filter))).filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
  const shown = visible.slice(0, SURFACE_COUNT);
  const hasMore = visible.length > SURFACE_COUNT;
  // Phase 17 (#22): "new" pill — posts published within the last 14 days.
  const isNew = (iso: string) => {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return false;
    return NOW - d < NEW_PILL_MS;
  };
  // P26: newest post (data-driven) gets a pulse dot on the card.
  // BUGFIX: dateMs() — new Date("") is Invalid Date and comparing
  // invalid dates is NaN (and .toLocaleDateString on one THROWS).
  // dateMs() sorts empties to the end so the reduce always wins.
  const newestSlug =
    posts.reduce((a, b) => (dateMs(a.publishedAt) > dateMs(b.publishedAt) ? a : b)).slug;
  // P27: words written — a simple writer-signal from the data
  const totalWords = posts.reduce(
    (n, p) => n + p.contentMarkdown.trim().split(/\s+/).filter(Boolean).length,
    0
  );

  /** P25: ←/→ keys move the filter selection (roving tabindex). */
  function moveFilter(i: number, dir: 1 | -1) {
    const total = tags.length + 1; // "All" + each tag
    const next = (i + dir + total) % total;
    setFilter(next === 0 ? "all" : tags[next - 1]);
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-blog-tab="${next}"]`)?.focus();
    });
  }

  return (
    <Section
      id="blog"
      index="05"
      eyebrow="blog"
      title="Notes & learnings"
      description="Short write-ups on what I'm studying — consistency beats polish."
      tone="linux"
      band
      fit={fit}
      cue={cue}
    >
      <CosmicDecor
        hue="linux"
        stars="sparse"
        planet="bottom-right"
        planetSrc="/images/planets/devops.png"
        ring
      />

      {/* Search (UX pass) — live filter across title/excerpt/tags */}
      <div className="mx-auto mb-6 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="w-full rounded-full border border-card-border bg-card py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-shadow focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
          />
        </div>
      </div>
      {tags.length > 1 && (
        <div
          role="tablist"
          aria-label="Filter notes by tag"
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            role="tab"
            id="blog-tab-0"
            aria-selected={filter === "all"}
            aria-controls="blog-panel"
            tabIndex={filter === "all" ? 0 : -1}
            data-blog-tab="0"
            onClick={() => setFilter("all")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                moveFilter(0, -1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                moveFilter(0, 1);
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
          {tags.map((tag, i) => {
            const idx = i + 1;
            return (
              <button
                key={tag}
                type="button"
                role="tab"
                id={`blog-tab-${idx}`}
                aria-selected={filter === tag}
                aria-controls="blog-panel"
                tabIndex={filter === tag ? 0 : -1}
                data-blog-tab={idx}
                onClick={() => setFilter(tag)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    moveFilter(idx, -1);
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    moveFilter(idx, 1);
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
            );
          })}
          {/* P25: live count — how many notes match the current filter */}
          <span aria-hidden="true" className="ml-1 font-mono text-[10px] text-ink-faint">
            {visible.length} {visible.length === 1 ? "note" : "notes"}
          </span>
        </div>
      )}

      <div id="blog-panel" role="tabpanel" aria-labelledby={`blog-tab-${activeIdx}`} className="grid gap-6 sm:grid-cols-2">
        {shown.map((post, i) => {
          // Phase 9 color: a 2px topic-hued top edge from the first tag —
          // the card family reads at a glance (accent fallback for
          // unmapped tags).
          const hairline = `border-t-2 ${tagHueBorder(post.tags[0] ?? "") ?? "border-t-accent/40"}`;
          return (
          <Reveal key={post.slug} delay={(i % 4) * 70} className="h-full blog-float">
            {/* Phase 10: 3D tilt + pointer spotlight on hover — parity
                with the projects grid (same interaction language). */}
            <TiltCard max={6} className="h-full rounded-card">
            <Link
              href={`/blog/${post.slug}`}
              onMouseMove={(e) => {
                const el = e.currentTarget as HTMLElement;
                const r = el.getBoundingClientRect();
                el.style.setProperty("--sx", `${((e.clientX - r.left) / r.width) * 100}%`);
                el.style.setProperty("--sy", `${((e.clientY - r.top) / r.height) * 100}%`);
              }}
              className={`group card-spotlight relative flex h-full flex-col overflow-hidden rounded-card border border-card-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${hairline}`}
            >
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <time dateTime={post.publishedAt} className="flex items-center gap-2">
                {/* P26: newest-note pulse dot — only on the latest post */}
                {post.slug === newestSlug && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success"
                  />
                )}
                {/* BUGFIX: formatDateSafe never throws — a post saved
                    without a date renders "someday" instead of crashing
                    the whole home page (the CMS date field is optional). */}
                {formatDateSafe(post.publishedAt, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }) ?? "someday"}
                {/* Phase 17 (#22): fresh note — fades with time, zero-data */}
                {isNew(post.publishedAt) && post.slug !== newestSlug && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
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
              /* Cards are whole-card <a> — chips stay plain (nested <a>
                 is invalid HTML). Tag destinations live on the archive
                 page's browse-by-tag row (Phase 17 #17). */
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
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
            </Link>
            </TiltCard>
          </Reveal>
          );
        })}
      </div>

      {/* P25: empty-filter state — parity with the archive */}
      {shown.length === 0 && (
        <p className="py-12 text-center text-sm text-ink-faint">
          {search.trim()
            ? `No notes match “${search.trim()}”${filter !== "all" ? ` in the #${filter} view` : ""} — try a different term.`
            : `No notes tagged #${filter} yet — check back soon.`}
        </p>
      )}

      {/* P27: the writing is the signal — words + notes from the data */}
      <p className="mt-8 text-center font-mono text-xs text-ink-faint">
        {posts.length} note{posts.length === 1 ? "" : "s"} · {totalWords.toLocaleString()} words written
      </p>

      {hasMore && (
        <p className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-5 py-2.5 text-sm font-medium text-ink-soft shadow-card transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            View all notes
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      )}
    </Section>
  );
}
