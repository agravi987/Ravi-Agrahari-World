/**
 * blog/tag/[tag]/loading.tsx — instant skeleton while a tag page's
 * static HTML regenerates on cache miss. Same quiet skeleton language
 * as the other blog routes (pulse card rows), so navigation between
 * archive surfaces feels consistent.
 */
export default function TagLoading() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-16">
      <div className="h-5 w-28 animate-pulse rounded-full bg-paper-deep" />
      <div className="mx-auto mt-8 h-4 w-24 animate-pulse rounded-full bg-paper-deep" />
      <div className="mx-auto mt-4 h-10 w-40 animate-pulse rounded-card bg-paper-deep" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-card border border-card-border bg-card p-6"
          >
            <div className="h-3 w-16 animate-pulse rounded-full bg-paper-deep" />
            <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-paper-deep" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-paper-deep/70" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-paper-deep/70" />
          </div>
        ))}
      </div>
    </main>
  );
}
