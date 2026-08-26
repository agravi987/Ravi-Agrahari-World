/**
 * ThemeToggle.tsx (client) — Multi-theme dropdown picker.
 *
 * Shows the current theme icon; clicking opens a small popover with all
 * available themes. The active theme has a checkmark. Clicking a theme
 * applies it instantly.
 *
 * Hydration-safe: reads the applied theme via useSyncExternalStore.
 * SSR renders the "light" icon; after hydration it flips to match.
 * Keyboard: Escape closes, arrow keys navigate, Enter selects.
 */
"use client";

import { Monitor, Sun, Moon, MoonStar, Snowflake, Flower2, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { applyTheme, THEME_LIST, type ThemeChoice } from "@/lib/theme";

/* --- Module-level store (avoids effect-based state sync) --- */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): string {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") || "light";
}

function getServerSnapshot(): string {
  return "light";
}

function emit() {
  listeners.forEach((l) => l());
}

const ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  Sun, Moon, MoonStar, Snowflake, Flower2, Monitor,
};

const CHOICE_ICONS: Record<ThemeChoice, string> = {
  system: "Monitor",
  light: "Sun",
  dark: "Moon",
  midnight: "MoonStar",
  nord: "Snowflake",
  rose: "Flower2",
};

const CHOICE_LABELS: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
  midnight: "Midnight",
  nord: "Nord",
  rose: "Rose",
};

export default function ThemeToggle() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const select = useCallback((choice: ThemeChoice) => {
    applyTheme(choice);
    emit();
    setOpen(false);
    btnRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Close on Escape; arrow keys navigate
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    const items = ref.current?.querySelectorAll<HTMLElement>('[role="option"]');
    if (!items?.length) return;
    const idx = Array.from(items).findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      items[(idx + 1) % items.length].focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  }, []);

  // Determine which icon to show in the trigger button
  const triggerIcon = (() => {
    if (current === "dark" || current === "midnight" || current === "nord") return Moon;
    if (current === "rose") return Flower2;
    return Sun;
  })();
  const TriggerIcon = triggerIcon;

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${CHOICE_LABELS[current as ThemeChoice] ?? "System"}`}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-card-border bg-card text-ink-soft transition-colors hover:text-accent"
      >
        <span key={current} className="animate-theme-swap">
          <TriggerIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select theme"
          onKeyDown={onKeyDown}
          className="absolute right-0 top-full z-[60] mt-2 w-40 overflow-hidden rounded-card border border-card-border bg-card shadow-card animate-overlay-in"
        >
          {THEME_LIST.map((choice) => {
            // Check if this choice is the currently stored one
            let isSelected = false;
            try {
              const stored = localStorage.getItem("theme");
              if (choice === "system" && (!stored || stored === "system")) isSelected = true;
              else if (stored === choice) isSelected = true;
            } catch { /* private */ }

            const iconName = CHOICE_ICONS[choice];
            const Icon = ICONS[iconName] ?? Sun;

            return (
              <button
                key={choice}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => select(choice)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                <span className="flex-1">{CHOICE_LABELS[choice]}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-accent" aria-hidden={true} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
