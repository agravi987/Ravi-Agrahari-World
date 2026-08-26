/**
 * SectionPlaceholder.tsx (client) — the "waiting" state shown in place
 * of a below-the-fold section until LazyMount mounts it (just before it
 * scrolls into view). Renders a real `<section id>` so anchor links,
 * the scrollspy dot rail and the command palette keep working before
 * the actual section exists, and reserves enough height to avoid a jarring
 * layout shift. Includes a rotating on-brand one-liner (LoadingMessages).
 */
"use client";

import { cn } from "@/lib/utils";
import LoadingMessages from "./LoadingMessages";

export default function SectionPlaceholder({
  id,
  messages,
  className,
}: {
  id?: string;
  messages: string[];
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-busy="true"
      aria-label={id ? `Loading ${id} section` : "Loading section"}
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center gap-5 py-10 text-center sm:py-12",
        className,
      )}
    >
      <div className="skeleton h-10 w-24 rounded-full" />
      <div className="skeleton h-6 w-2/3 max-w-sm rounded-md" />
      <p className="font-display text-xs font-semibold tracking-wide text-ink-faint">
        <LoadingMessages messages={messages} />
      </p>
    </section>
  );
}
