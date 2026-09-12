"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight, Home } from "lucide-react";
import { useServerInsertedHTML } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs.tsx — navigation breadcrumbs for deep pages.
 * Shows hierarchy: Home > Section > Sub-section > Current.
 * Last item is current page (no link). Keyboard accessible.
 * Colorful: eachcrumb gets a topic hue based on position.
 */
export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  // SEO: wherever visible breadcrumbs render, search engines get the
  // typed BreadcrumbList entity too — one source of truth, no drift.
  // Same SSR-stream injection pattern as JsonLd (React 19 warns on raw
  // <script> nodes inside its tree).
  useServerInsertedHTML(() => {
    if (items.length <= 1) return null;
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const data = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        ...items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 2,
          name: it.label,
          ...(i < items.length - 1 && it.href
            ? { item: `${base}${it.href}` }
            : {}),
        })),
      ],
    };
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
    );
  });

  if (items.length <= 1) return null;

  // DEEP tokens (audit #59): the soft topic hues failed AA contrast at
  // 14px crumb text — same fix family as the tag badges (audit #19).
  const HUES = [
    "text-topic-cloud-deep",
    "text-topic-devops-deep",
    "text-topic-ai-deep",
    "text-topic-linux-deep",
    "text-topic-mars-deep",
    "text-topic-ice-deep",
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx("mx-auto max-w-5xl px-6 mb-8", className)}
    >
      <ol className="flex flex-wrap items-center gap-2 text-sm font-mono" role="list">
        <li className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 text-ink-soft hover:text-accent transition-colors"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const hue = HUES[(index + 1) % HUES.length];
          return (
            // aria-current goes on the element that NAMES the current
            // page (the link/span), not the <li> — screen readers
            // announce it on the focused/read element.
            <li key={`${index}-${item.label}`} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={isLast ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-1 text-ink-soft hover:text-accent transition-colors",
                    isLast && "font-medium text-ink",
                    hue
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={clsx("font-medium text-ink", hue)}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}