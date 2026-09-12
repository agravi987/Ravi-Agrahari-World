/**
 * Toast.tsx — P9 toast system (zero-dependency, same pattern as the
 * CommandPalette's module store).
 *
 * `showToast(msg, icon?)` can be called from anywhere (Contact copy,
 * CodeBlock copy, palette actions). A single <Toaster /> mounted in
 * the root layout renders stacked toasts bottom-center on mobile /
 * bottom-right on desktop. Auto-dismiss ~2.4s, Escape dismisses,
 * aria-live="polite" so screen readers announce without interrupting.
 * Reduced-motion users get instant (non-animated) toasts.
 */
"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface ToastItem {
  id: number;
  message: string;
  /** Set when the user (or timer) starts dismissing — drives the exit
   *  animation. Exit is faster than enter (audit #111). */
  leaving?: boolean;
}

const listeners = new Set<() => void>();
let toasts: ToastItem[] = [];
let nextId = 1;

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

/** Call from anywhere — shows a toast for ~2.4s. */
export function showToast(message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  notify();
  // Exit first (faster than enter — audit #111), then unmount.
  setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    notify();
  }, 2200);
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 2420);
}

/** Dismiss a toast immediately (click-to-dismiss, audit #48). */
function dismissToast(id: number) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 200);
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const reduceMotion = useReducedMotion();

  // Subscribe to the module store (event-callback setState — lint-clean).
  useEffect(() => {
    const sync = () => setItems(toasts);
    return subscribe(sync);
  }, []);

  // Escape dismisses the top toast (keyboard parity) — via the animated
  // exit, not an abrupt unmount.
  useEffect(() => {
    if (items.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && items[0]) {
        dismissToast(items[0].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {items.map((t, i) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          aria-label={`Dismiss: ${t.message}`}
          // Slide-up on desktop (transform-only, compositor-friendly);
          // reduced-motion gets a plain fade via opacity transition.
          // Now a real button — click/tap dismisses (audit #48); Escape
          // still works for keyboard users.
          className={`pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2.5 text-left text-sm text-ink shadow-card-hover transition-colors hover:border-accent/40 ${
            reduceMotion
              ? ""
              : t.leaving
                ? "animate-toast-out"
                : "animate-toast-in"
          }`}
          style={{ zIndex: 95 - i }}
        >
          <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          {t.message}
        </button>
      ))}
    </div>
  );
}
