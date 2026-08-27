/**
 * admin/[collection]/new/loading.tsx — skeleton while the schema-driven
 * form hydrates. Shows a generic 3-field skeleton (adapts to any collection).
 */
export default function NewDocLoading() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-3 w-14 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-3 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-20 animate-pulse rounded bg-paper-deep" />
      </div>

      <div className="h-7 w-48 animate-pulse rounded-lg bg-paper-deep" />

      <div className="mt-8 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-paper-deep" />
            <div className="h-10 w-full animate-pulse rounded-card bg-paper-deep" />
          </div>
        ))}
        <div className="mt-8 flex gap-3">
          <div className="h-10 w-32 animate-pulse rounded-card bg-paper-deep" />
          <div className="h-10 w-24 animate-pulse rounded-card bg-paper-deep" />
        </div>
      </div>
    </main>
  );
}
