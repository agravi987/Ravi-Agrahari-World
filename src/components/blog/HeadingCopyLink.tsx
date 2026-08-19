/**
 * HeadingCopyLink.tsx (client) — Phase 17 (blog backlog #24).
 * A hover-revealed copy-link pill for markdown h2/h3 headings: gives
 * every section of a post a shareable #anchor (parity with the home
 * sections' copy-link affordance). The pill copies the full URL
 * (location + hash) with a transient ✓ + toast; reduced-motion users
 * get the same behavior without the hover reveal (focusable).
 *
 * SSR-safe: renders nothing until mounted (the id lives in the DOM,
 * so we read location after hydration).
 */
"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { showToast } from "@/components/ui/Toast";

export default function HeadingCopyLink({ id }: { id: string }) {
  // The pill is opacity-0 until hover/focus (pure CSS) — no mounted
  // guard needed, so SSR and hydration render the same button. window
  // is only touched inside the click handler, never during render.
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Heading link copied");
    } catch {
      /* clipboard unavailable — leave as-is */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy link to this section`}
      title="Copy link to this section"
      className="ml-2 inline-flex h-6 w-6 translate-y-[-2px] items-center justify-center rounded-md border border-card-border bg-card text-ink-faint opacity-0 transition-all hover:border-accent/40 hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
    >
      {copied ? (
        <Check className="h-3 w-3 text-accent" aria-hidden="true" />
      ) : (
        <Link2 className="h-3 w-3" aria-hidden="true" />
      )}
    </button>
  );
}
