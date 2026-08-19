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
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 2400);
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const reduceMotion = useReducedMotion();

  // Subscribe to the module store (event-callback setState — lint-clean).
  useEffect(() => {
    const sync = () => setItems(toasts);
    return subscribe(sync);
  }, []);

  // Escape dismisses the top toast (keyboard parity).
  useEffect(() => {
    if (items.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toasts = toasts.slice(1);
        notify();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {items.map((t, i) => (
        <div
          key={t.id}
          // Slide-up on desktop (transform-only, compositor-friendly);
          // reduced-motion gets a plain fade via opacity transition.
          className={`pointer-events-auto flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2.5 text-sm text-ink shadow-card-hover ${
            reduceMotion ? "" : "animate-toast-in"
          }`}
          style={{ zIndex: 95 - i }}
        >
          <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
