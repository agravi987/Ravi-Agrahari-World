/**
 * blog/[slug]/loading.tsx — skeleton while a post's SSG page streams.
 * Mirrors the article layout so the swap to real content doesn't jump.
 */
import LoadingMessages from "@/components/ui/LoadingMessages";

export default function BlogPostLoading() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16" aria-busy="true" aria-label="Loading note">
      <p className="mb-8 text-center font-display text-sm font-semibold tracking-wide text-ink-soft">
        <LoadingMessages
          messages={[
            "warming up the reading lamp…",
            "pouring a fresh coffee…",
            "finding a comfortable chair…",
            "turning to page one…",
          ]}
        />
      </p>
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="skeleton mt-6 h-9 w-full rounded-md" />
      <div className="skeleton mt-3 h-9 w-2/3 rounded-md" />
      <div className="mt-5 flex items-center gap-3">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-3 w-16 rounded-full" />
      </div>
      <div className="mt-10 flex gap-10 border-t border-card-border pt-10">
        <div className="hidden w-48 shrink-0 lg:block">
          <div className="skeleton h-40 w-full rounded-md" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-3 rounded-full"
              style={{ width: `${100 - (i % 4) * 12}%` }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
