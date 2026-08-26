/**
 * projects/loading.tsx — skeleton while the project archive streams.
 * Matches the grid layout: hero area + card rows with pulse placeholders.
 */
export default function ProjectsLoading() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-16">
      <div className="h-5 w-28 animate-pulse rounded-full bg-paper-deep" />
      <div className="mt-4 h-8 w-64 animate-pulse rounded-lg bg-paper-deep" />
      <p className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-paper-deep" />

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-card border border-card-border bg-paper-deep"
          />
        ))}
      </div>
    </main>
  );
}
