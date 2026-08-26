/**
 * projects/[slug]/loading.tsx — skeleton for a project case-study page
 * while the dynamic content streams in.
 */
export default function ProjectLoading() {
  return (
    <main id="main" className="mx-auto max-w-4xl px-6 py-16">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-14 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-3 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-24 animate-pulse rounded bg-paper-deep" />
      </div>

      {/* Title */}
      <div className="mt-8 h-10 w-80 max-w-full animate-pulse rounded-lg bg-paper-deep" />

      {/* Meta pills */}
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-6 w-20 animate-pulse rounded-full bg-paper-deep"
          />
        ))}
      </div>

      {/* Cover image placeholder */}
      <div className="mt-8 aspect-video w-full animate-pulse rounded-card bg-paper-deep" />

      {/* Content lines */}
      <div className="mt-10 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-paper-deep"
            style={{ width: `${70 + Math.sin(i) * 25}%` }}
          />
        ))}
      </div>
    </main>
  );
}
