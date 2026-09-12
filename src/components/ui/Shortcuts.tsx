/**
 * Shortcuts.tsx (client) — P15 keyboard layer (Linear/GitHub-style).
 * Press `?` anywhere → a help overlay listing the single-key
 * shortcuts; the shortcuts themselves are live from this component:
 *   s skills · p projects · e experience · b blog · c contact
 *   x galaxy explorer · t toggle theme · ⌘K palette · esc close
 * Every trigger is GUARDED: never fires while typing in an input /
 * textarea / contenteditable, and never with ctrl/meta/alt held —
 * so the shortcuts can't hijack real typing. Reduced-motion safe
 * (the overlay just appears), accessible (role=dialog, focus the
 * list, esc restores focus).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";
import { scrollToSection } from "@/lib/scrollTo";
import { cycleTheme } from "@/lib/theme";
import CmdKey from "@/components/ui/CmdKey";

interface Shortcut {
  keys: string[];
  label: string;
  hue: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["s"], label: "Jump to skills", hue: "text-topic-cloud" },
  { keys: ["p"], label: "Jump to projects", hue: "text-topic-devops" },
  { keys: ["e"], label: "Jump to experience", hue: "text-topic-linux" },
  { keys: ["b"], label: "Jump to blog", hue: "text-topic-ai" },
  { keys: ["c"], label: "Jump to contact", hue: "text-topic-mars" },
  { keys: ["x"], label: "Open the galaxy explorer", hue: "text-accent" },
  { keys: ["t"], label: "Cycle theme", hue: "text-accent-cyan" },
  { keys: ["esc"], label: "Close this overlay", hue: "text-ink-faint" },
];
/** The palette row renders a platform-correct ⌘K / Ctrl K chip (audit
 *  #27) instead of a hardcoded ⌘K that lies on Windows/Linux. */

/** Section keys must work from ANY page (P23): on home the section
 *  exists → smooth-scroll (reduced-motion-aware — the CSS media query
 *  only governs scroll-behavior, an explicit smooth call overrides
 *  it); elsewhere the anchor doesn't exist, so navigate home with the
 *  hash and let Next scroll after render. */
const goSection = (router: ReturnType<typeof useRouter>, id: string) => {
  if (scrollToSection(id)) return;
  router.push(`/#${id}`);
};

export default function Shortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    lastTriggerRef.current?.focus?.();
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Guard: never hijack typing or modified keys (except ? itself).
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT");
      const isModified = e.ctrlKey || e.metaKey || e.altKey;

      // ? TOGGLES the overlay (works even over the palette). Pressing
      // ? again while it's open closes it — parity with Esc. (A second,
      // older ShortcutOverlay component used to also bind ? — removed,
      // so only this dialog can open now.)
      if (!isModified && e.key === "?") {
        e.preventDefault();
        if (openRef.current) {
          close();
          return;
        }
        lastTriggerRef.current = document.activeElement as HTMLElement | null;
        setOpen(true);
        requestAnimationFrame(() => listRef.current?.focus());
        return;
      }
      // Everything below requires the overlay state to act on.
      if (openRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          return;
        }
        // Focus trap: Tab / Shift+Tab cycle within the dialog (P16).
        if (e.key === "Tab") {
          const el = dialogRef.current;
          if (!el) return;
          const focusables = [...el.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"]), [role="listbox"]'
          )];
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement;
          if (e.shiftKey) {
            if (active === first || !el.contains(active)) {
              e.preventDefault();
              last.focus();
            }
          } else if (active === last || !el.contains(active)) {
            e.preventDefault();
            first.focus();
          }
          return;
        }
      }
      // Single-key navigation — only when not typing.
      if (typing || isModified || e.key.length !== 1) return;
      const k = e.key.toLowerCase();
      switch (k) {
        case "s":
          e.preventDefault();
          goSection(router, "skills");
          break;
        case "p":
          e.preventDefault();
          goSection(router, "projects");
          break;
        case "e":
          e.preventDefault();
          goSection(router, "experience");
          break;
        case "b":
          e.preventDefault();
          goSection(router, "blog");
          break;
        case "c":
          e.preventDefault();
          goSection(router, "contact");
          break;
        case "x":
          e.preventDefault();
          router.push("/detailed-galaxy");
          break;
        case "t": {
          e.preventDefault();
          cycleTheme();
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, close]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-card border border-card-border bg-card shadow-orbital">
        <div className="flex items-center gap-3 border-b border-card-border px-5 py-4">
          <Keyboard className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-ink">Keyboard shortcuts</h2>
        </div>

        <div
          ref={listRef}
          tabIndex={-1}
          className="max-h-[60vh] overflow-y-auto p-3 focus:outline-none"
        >
          <ul className="space-y-1">
            {SHORTCUTS.map((sc) => (
              <li
                key={sc.keys[0] + sc.label}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-ink-soft">{sc.label}</span>
                <kbd
                  className={`rounded-md border border-card-border bg-paper-deep px-2 py-0.5 font-mono text-[11px] ${sc.hue}`}
                >
                  {sc.keys.join(" ")}
                </kbd>
              </li>
            ))}
            {/* Command palette — platform-correct key chip (audit #27) */}
            <li className="flex items-center justify-between gap-4 rounded-lg px-3 py-2">
              <span className="text-sm text-ink-soft">Command palette</span>
              <span className="text-[11px] text-ink-soft">
                <CmdKey />
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-card-border bg-paper-deep/60 px-5 py-2">
          <p className="font-mono text-[10px] text-ink-faint">
            shortcuts pause while typing · press ? again to close
          </p>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-card-border px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
