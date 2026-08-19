/**
 * error.tsx — P11 resilience.
 * Route-level error boundary (renders when a page throws — e.g. a
 * transient Mongo/API blip). Themed like the 404: calm, on-brand,
 * with a working "try again" (reset re-renders the route) and a
 * way home. "use client" is required for error boundaries.
 */
"use client";

import Button from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-xs text-topic-mars">~/signal-lost</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Something broke mid-orbit
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        A hiccup between here and the data source. The page didn&apos;t load
        cleanly — no stress, a retry usually fixes it.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Back home
        </Button>
      </div>
    </div>
  );
}
