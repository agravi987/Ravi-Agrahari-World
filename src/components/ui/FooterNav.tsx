/**
 * FooterNav.tsx (client) — the Footer's Explore column (P23).
 * Footer itself is a server component (reads deploy-meta.json), but its
 * section links (#skills, #projects…) used plain anchors that DIED on
 * non-home pages. This tiny client island renders the same links with
 * smart navigation — every href resolves from any page.
 */
"use client";

import { useSmartNav } from "@/lib/smartNav";

export interface FooterLink {
  href: string;
  label: string;
}

export default function FooterNav({ links }: { links: FooterLink[] }) {
  const { navigate, hrefFor } = useSmartNav();

  return (
    <nav aria-label="Footer">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Explore
      </p>
      <div className="flex flex-col items-start gap-1">
        {links.map((link) => (
          <a
            key={link.href + link.label}
            href={hrefFor(link.href)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              navigate(link.href);
            }}
            className="text-sm text-ink-soft transition-colors hover:text-accent"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
