/**
 * admin/error.tsx — admin-specific error boundary.
 * Shows a crash message tailored to the admin context (database
 * connection failure, API errors, etc.) with a retry button.
 * Uses the same visual language as the root error.tsx but with
 * admin-specific copy and a "Back to dashboard" link.
 */
"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-xs text-topic-mars">~/mission-control-error</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
        Admin operation failed
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-soft">
        The request hit an error — this usually means the database is
        unreachable or the API returned an unexpected response. Check
        your connection and try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-faint">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-card border border-accent bg-accent-btn px-5 py-2.5 text-sm font-medium text-white shadow-card transition-colors hover:bg-accent-btn-hover"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="rounded-card border border-card-border bg-card px-5 py-2.5 text-sm font-medium text-ink-soft shadow-card transition-colors hover:border-accent/40 hover:text-accent"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
