/**
 * TableOfContents.tsx (client) — P11 blog polish.
 * "On this page": a sticky scrollspy sidebar (desktop) / compact
 * chip list (mobile) of the article's h2/h3 headings, extracted
 * from the rendered `.markdown` DOM after mount. Clicking a row
 * smooth-scrolls to it; the active row highlights as you scroll
 * (IntersectionObserver, updated only on intersection events).
 * SSR-safe: renders nothing until headings exist; reduced-motion
 * users get instant scroll.
 */
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  // Scan the rendered markdown once, after hydration. Only h2/h3
  // become TOC rows (h1 is the post title). The setState runs inside
  // requestAnimationFrame — an async callback, so it stays outside
  // React's synchronous-effect lint rule.
  useEffect(() => {
    const host = document.querySelector(".markdown");
    if (!host) return;
    const raf = requestAnimationFrame(() => {
      const found: Heading[] = [];
      for (const el of host.querySelectorAll<HTMLElement>("h2, h3")) {
        const text = el.textContent?.trim();
        if (!text) continue;
        // Stable, readable anchor (like GitHub's slugger, without the dep).
        const id =
          (el.id ??
            text
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-")) || `heading-${found.length}`;
        el.id = id; // make it anchorable + scroll-margin applies (.markdown h2/h3)
        found.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
      }
      setHeadings(found);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Scrollspy: the last heading above the viewport center is active.
  useEffect(() => {
    if (headings.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id);
            break; // topmost intersecting heading wins
          }
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [headings]);

  if (headings.length === 0) return null; // no h2/h3 — nothing to index

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // scroll-mt on .markdown h2/h3 accounts for the sticky header.
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      {/* Mobile collapsible table of contents (< lg) */}
      <div className="mb-6 rounded-card border border-card-border bg-paper/70 p-3.5 lg:hidden">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between font-mono text-xs font-semibold text-ink-soft select-none hover:text-ink">
            <span>On this page ({headings.length} sections)</span>
            <span className="text-xs transition-transform duration-200 group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <nav className="mt-3 space-y-1 border-t border-card-border/60 pt-2.5">
            {headings.map((h) => (
              <button
                key={h.id}
                type="button"
                data-compact-touch
                onClick={() => jump(h.id)}
                aria-current={active === h.id ? "true" : undefined}
                className={`block w-full rounded-md py-1.5 text-left text-sm leading-snug transition-colors ${
                  h.level === 3 ? "pl-4 text-xs" : "pl-2"
                } ${
                  active === h.id
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-soft hover:bg-card hover:text-accent"
                }`}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </details>
      </div>

      {/* Desktop sticky sidebar (lg+) */}
      <aside
        aria-label="On this page"
        className="hidden w-56 shrink-0 lg:block"
      >
        <div className="sticky top-24">
          <p className="font-mono text-xs font-medium tracking-tight text-ink-faint">
            on this page
          </p>
          <nav className="mt-3 space-y-1 border-l border-card-border pl-3">
            {headings.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => jump(h.id)}
                aria-current={active === h.id ? "true" : undefined}
                className={`block w-full rounded-r-md py-1 text-left text-sm leading-snug transition-colors ${
                  h.level === 3 ? "pl-3 text-xs" : ""
                } ${
                  active === h.id
                    ? "border-l-2 border-accent bg-accent-soft/60 font-medium text-accent"
                    : "border-l-2 border-transparent text-ink-soft hover:text-accent"
                }`}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
