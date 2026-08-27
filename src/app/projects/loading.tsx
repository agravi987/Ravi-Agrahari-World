/**
 * projects/loading.tsx — skeleton while the project archive streams.
 * Matches the grid layout: hero area + card rows with pulse placeholders.
 */
export default function ProjectsLoading() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-6 h-3 w-14 animate-pulse rounded bg-paper-deep" />
      <div className="h-7 w-48 animate-pulse rounded-lg bg-paper-deep" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-paper-deep" />

      <div className="mt-8 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-paper-deep" />
            <div className="h-10 w-full animate-pulse rounded-card bg-paper-deep" />
          </div>
        ))}
      </div>
    </main>
  );
}
