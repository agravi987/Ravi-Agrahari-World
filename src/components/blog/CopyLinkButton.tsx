/**
 * CopyLinkButton.tsx (client) — P10 blog polish.
 * Copies the current post URL to the clipboard with a toast, so
 * readers can share a note without hunting for the address bar.
 */
"use client";

import { Link2 } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function CopyLinkButton() {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard");
    } catch {
      /* clipboard unavailable — nothing to show, nothing breaks */
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      aria-label="Copy link to this note"
      className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
    >
      <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
      copy link
    </button>
  );
}
