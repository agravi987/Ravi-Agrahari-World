/**
 * RouteLoader.tsx (client) — a branded, on-message loading state for
 * route transitions and suspended sections. A pulsing orbit ring +
 * a rotating line of copy that narrates what is being fetched, so a
 * wait feels intentional instead of like a hang (Google/MNC touch).
 */
"use client";

import { cn } from "@/lib/utils";
import LoadingMessages from "./LoadingMessages";

export default function RouteLoader({
  messages,
  detail,
  className,
}: {
  messages: string[];
  detail?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-5 px-6 py-28 text-center",
        className,
      )}
    >
      <div className="relative h-14 w-14">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-accent/15"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-accent [animation-duration:3s]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-[13px] rounded-full bg-accent/10"
        />
      </div>
      <p className="font-display text-sm font-semibold tracking-wide text-ink-soft">
        <LoadingMessages messages={messages} />
      </p>
      {detail ? <p className="text-xs text-ink-faint">{detail}</p> : null}
    </div>
  );
}
