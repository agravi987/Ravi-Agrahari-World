"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight, Home } from "lucide-react";

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
  if (items.length <= 1) return null;

  const HUES = [
    "text-topic-cloud",
    "text-topic-devops",
    "text-topic-ai",
    "text-topic-linux",
    "text-topic-mars",
    "text-topic-ice",
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
            className={clsx(
              "flex items-center gap-1 text-ink-soft hover:text-accent transition-colors",
              HUES[0]
            )}
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