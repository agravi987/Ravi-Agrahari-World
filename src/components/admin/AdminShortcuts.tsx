/**
 * AdminShortcuts.tsx (client) — lightweight global keyboard helper.
 *
 * Shortcuts (only when no input/textarea is focused):
 *   D       → /admin (dashboard)
 *   N       → /admin/<collection>/new (if on a collection page)
 *   /       → focus the search/filter input (if visible)
 *   Escape  → close the overlay
 *   ?       → toggle the cheatsheet overlay
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { key: "D", label: "Dashboard" },
  { key: "N", label: "New document" },
  { key: "/", label: "Focus search" },
  { key: "?", label: "Toggle shortcuts" },
];

export default function AdminShortcuts() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Escape always closes the overlay
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      // Don't intercept when typing in a form field
      if (isInput) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // Only fire shortcuts when overlay is closed
      if (open) return;

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        router.push("/admin");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        // Extract collection from /admin/<collection>...
        const match = pathname.match(/^\/admin\/([^/]+)/);
        if (match && match[1] !== "login") {
          router.push(`/admin/${match[1]}/new`);
        }
      } else if (e.key === "/") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Filter" i], input[placeholder*="Search" i]',
        );
        input?.focus();
      }
    },
    [open, pathname, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <>
      {/* Floating trigger button — bottom-right corner */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 left-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-ink-faint shadow-card transition-all hover:-translate-y-0.5 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        title="Keyboard shortcuts (?)"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      {/* Cheatsheet overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div
            className="rounded-card border border-card-border bg-card p-6 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-xs text-accent">~/shortcuts</p>
            <h2 className="mt-2 font-display text-lg font-semibold text-ink">
              Keyboard shortcuts
            </h2>
            <ul className="mt-4 space-y-2">
              {shortcuts.map((s) => (
                <li key={s.key} className="flex items-center gap-3 text-sm">
                  <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-card-border bg-paper-deep px-1.5 font-mono text-xs text-ink-soft">
                    {s.key}
                  </kbd>
                  <span className="text-ink-soft">{s.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-faint">
              Shortcuts are disabled while typing in a form field.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
