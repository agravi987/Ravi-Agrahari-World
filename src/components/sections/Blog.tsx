/**
 * Blog.tsx — plan S7 + ui-ux-design.md P0
 * Small note cards (title, excerpt, tags, date) — learning-in-public
 * signal, not a full blog engine (plan §3). Each card now links to
 * its /blog/[slug] detail page where the markdown is rendered
 * (react-markdown was installed but unused before this fix).
 * Auto-hides when empty (plan §5.2).
 */
import { ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import type { Post } from "@/types";

interface BlogProps {
  posts: Post[];
}

/** Rough read-time from word count — content is markdown, keep it simple. */
function readTimeMinutes(contentMarkdown: string): number {
  const words = contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function Blog({ posts }: BlogProps) {
  if (posts.length === 0) return null; // auto-hide (§5.2)

  return (
    <Section
      id="blog"
      eyebrow="blog"
      title="Notes & learnings"
      description="Short write-ups on what I'm studying — consistency beats polish."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-card border border-card-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between text-xs text-ink-faint">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <span>{readTimeMinutes(post.contentMarkdown)} min read</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold text-ink transition-colors group-hover:text-accent">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-ink-soft">{post.excerpt}</p>
            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
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
          </a>
        ))}
      </div>
    </Section>
  );
}
