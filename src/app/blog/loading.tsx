/**
 * blog/loading.tsx — P-skeleton: instant feedback while the archive
 * loads. Mirrors the archive layout (search bar + card grid) with
 * pulsing skeleton blocks (`.skeleton` in globals.css) — no layout
 * jump when real cards replace them.
 */
import { clsx } from "clsx";
import LoadingMessages from "@/components/ui/LoadingMessages";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16" aria-busy="true" aria-label="Loading notes">
      <p className="mb-8 text-center font-display text-sm font-semibold tracking-wide text-ink-soft">
        <LoadingMessages
          messages={[
            "flipping through the notes…",
            "dusting off the archive…",
            "brewing a fresh cup…",
            "shuffling the ink…",
          ]}
        />
      </p>
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-full max-w-sm rounded-full bg-paper-deep">
          <div className="skeleton h-full w-full rounded-full" />
        </div>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-52 rounded-card border border-card-border bg-card p-6 shadow-card",
              i === 0 && "sm:col-span-2 h-56"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-3 w-14 rounded-full" />
            </div>
            <div className="skeleton mt-5 h-5 w-3/4 rounded-md" />
            <div className="skeleton mt-4 h-3 w-full rounded-full" />
            <div className="skeleton mt-2 h-3 w-5/6 rounded-full" />
            <div className="mt-5 flex gap-2">
              <div className="skeleton h-5 w-14 rounded-full" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
