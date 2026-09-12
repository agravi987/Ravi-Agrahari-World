/**
 * CodeBlock.tsx (client) — P8 + P18 blog polish.
 * Wraps every <pre><code> in a blog post with a copy button
 * (clipboard + transient ✓ feedback) and a LANGUAGE-HUED header
 * bar (P18): each language gets its own topic color + label, so
 * posts read like real code surfaces (GitHub/Vercel style) instead
 * of a plain grey box. Used as react-markdown's `code` renderer:
 * fenced blocks render as CodeBlock, inline code stays plain.
 */
"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { showToast } from "@/components/ui/Toast";

/** language-<x> class (react-markdown) → label + topic hue. The bar
 *  uses the site's chip style (tint bg + DEEP topic text) so the label
 *  keeps AA contrast in both themes — a solid hue bar with white text
 *  fails, and the soft topic-* text fails at 11px too (audit #20).
 *  Unknown languages fall back to the neutral ink chip instead of
 *  rendering with no bar at all (audit #93). */
const LANG_HUES: Record<string, { label: string; bar: string; dot: string }> = {
  yaml: { label: "yaml", bar: "bg-topic-cloud/10 text-topic-cloud-deep", dot: "bg-topic-cloud" },
  bash: { label: "bash", bar: "bg-topic-linux/10 text-topic-linux-deep", dot: "bg-topic-linux" },
  sh: { label: "shell", bar: "bg-topic-linux/10 text-topic-linux-deep", dot: "bg-topic-linux" },
  js: { label: "javascript", bar: "bg-topic-devops/10 text-topic-devops-deep", dot: "bg-topic-devops" },
  jsx: { label: "jsx", bar: "bg-topic-devops/10 text-topic-devops-deep", dot: "bg-topic-devops" },
  ts: { label: "typescript", bar: "bg-topic-ice/10 text-topic-ice-deep", dot: "bg-topic-ice" },
  tsx: { label: "tsx", bar: "bg-topic-ice/10 text-topic-ice-deep", dot: "bg-topic-ice" },
  py: { label: "python", bar: "bg-topic-ai/10 text-topic-ai-deep", dot: "bg-topic-ai" },
  python: { label: "python", bar: "bg-topic-ai/10 text-topic-ai-deep", dot: "bg-topic-ai" },
  json: { label: "json", bar: "bg-topic-mars/10 text-topic-mars-deep", dot: "bg-topic-mars" },
  dockerfile: { label: "dockerfile", bar: "bg-topic-cloud/10 text-topic-cloud-deep", dot: "bg-topic-cloud" },
  css: { label: "css", bar: "bg-topic-ai/10 text-topic-ai-deep", dot: "bg-topic-ai" },
  html: { label: "html", bar: "bg-topic-mars/10 text-topic-mars-deep", dot: "bg-topic-mars" },
};

/** Neutral fallback for languages not in the map (audit #93). */
const LANG_FALLBACK = {
  bar: "bg-paper-deep text-ink-soft",
  dot: "bg-ink-faint",
};

export default function CodeBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const text =
    typeof children === "string"
      ? children
      : children == null
        ? ""
        : String(children);

  const langMatch = className?.match(/language-([\w-]+)/);
  const lang = langMatch ? langMatch[1] : null;
  const meta = lang
    ? (LANG_HUES[lang] ?? { label: lang, ...LANG_FALLBACK })
    : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Code copied to clipboard");
    } catch {
      /* clipboard unavailable — leave the button as-is */
    }
  }

  return (
    <div className="group/code overflow-hidden rounded-card border border-card-border">
      {/* P18: language-hued header bar (chip style — AA-safe) */}
      {meta && (
        <div className={`flex items-center gap-2 border-b border-card-border px-4 py-1.5 text-[11px] font-semibold ${meta.bar}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
          {meta.label}
        </div>
      )}
      {/* Code area (relative so the copy button sits over the code) */}
      <div className="relative">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-card-border bg-card text-ink-faint transition-all hover:text-accent focus-visible:opacity-100 md:opacity-0 md:group-hover/code:opacity-100"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
        <pre className={className}>
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}
