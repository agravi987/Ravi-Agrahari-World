/**
 * admin/[collection]/[id]/loading.tsx — skeleton while an existing
 * document is fetched and the edit form hydrates.
 */
export default function EditDocLoading() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-3 w-14 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-3 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-20 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-3 animate-pulse rounded bg-paper-deep" />
        <div className="h-3 w-10 animate-pulse rounded bg-paper-deep" />
      </div>

      <div className="h-7 w-56 animate-pulse rounded-lg bg-paper-deep" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-paper-deep" />

      <div className="mt-8 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-28 animate-pulse rounded bg-paper-deep" />
            <div
              className="animate-pulse rounded-card bg-paper-deep"
              style={{ height: i === 3 ? 160 : 40, width: "100%" }}
            />
          </div>
        ))}
        <div className="mt-8 flex gap-3">
          <div className="h-10 w-28 animate-pulse rounded-card bg-paper-deep" />
          <div className="h-10 w-20 animate-pulse rounded-card bg-paper-deep" />
        </div>
      </div>
    </main>
  );
}
