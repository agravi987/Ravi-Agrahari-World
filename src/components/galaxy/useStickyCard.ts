/**
 * useStickyCard.ts — Galaxy v4 §7.2 "sticky interactive cards"
 * Tooltip-style cards that are actually usable:
 *  1. Open on hover (150ms intent delay) or focus.
 *  2. Hold while the cursor is over the trigger OR the card, and
 *     for at least `dismissDelay` ms after leaving both — long
 *     enough to move onto the card and click its links.
 *  3. Dismiss only when: cursor off trigger AND off card AND the
 *     grace period elapsed — or Escape / clicking elsewhere
 *     (immediate). Clicking a link inside never dismisses.
 * Keyboard mirrors the same rule via focus/blur tracking.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INTENT_DELAY = 150;

export function useStickyCard(dismissDelay = 3000) {
  const [activeId, setActiveId] = useState<string | null>(null);
  /** ids currently under the pointer or focused (trigger or card). */
  const heldRef = useRef<Set<string>>(new Set());
  const intentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIntent = useCallback(() => {
    if (intentTimerRef.current) {
      clearTimeout(intentTimerRef.current);
      intentTimerRef.current = null;
    }
  }, []);
  const clearDismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  /** Opens a card immediately (click / focus / already-intent). */
  const open = useCallback(
    (id: string) => {
      clearIntent();
      clearDismiss();
      setActiveId(id);
    },
    [clearIntent, clearDismiss]
  );

  const close = useCallback(() => {
    clearIntent();
    clearDismiss();
    setActiveId(null);
  }, [clearIntent, clearDismiss]);

  /** The grace-period scheduler — closes only if nothing holds the id. */
  const scheduleClose = useCallback(
    (id: string) => {
      clearDismiss();
      dismissTimerRef.current = setTimeout(() => {
        if (!heldRef.current.has(id)) {
          setActiveId((cur) => (cur === id ? null : cur));
        }
      }, dismissDelay);
    },
    [dismissDelay, clearDismiss]
  );

  // Escape dismisses the open card.
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, close]);

  // Clicking anywhere outside a trigger/card dismisses immediately.
  useEffect(() => {
    if (!activeId) return;
    const onClick = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-galaxy-card]") || t?.closest("[data-galaxy-trigger]")) return;
      close();
    };
    window.addEventListener("pointerdown", onClick);
    return () => window.removeEventListener("pointerdown", onClick);
  }, [activeId, close]);

  /** Handlers for a trigger (planet/moon/index row). */
  const triggerHandlers = useCallback(
    (id: string) => ({
      onPointerEnter: () => {
        heldRef.current.add(id);
        clearIntent();
        // Short intent delay so sweeping across the system doesn't
        // spam cards; clicks/focus open instantly via `open`.
        intentTimerRef.current = setTimeout(() => setActiveId(id), INTENT_DELAY);
      },
      onPointerLeave: () => {
        heldRef.current.delete(id);
        clearIntent();
        scheduleClose(id);
      },
      onFocus: () => open(id),
      onBlur: () => {
        heldRef.current.delete(id);
        scheduleClose(id);
      },
      onClick: () => open(id),
    }),
    [open, scheduleClose, clearIntent]
  );

  /** Handlers for the card itself — holding it keeps it open. */
  const cardHandlers = useCallback(
    (id: string) => ({
      "data-galaxy-card": true as const,
      onPointerEnter: () => {
        heldRef.current.add(id);
        clearDismiss();
      },
      onPointerLeave: () => {
        heldRef.current.delete(id);
        scheduleClose(id);
      },
      onFocusCapture: () => heldRef.current.add(id),
      onBlurCapture: () => {
        heldRef.current.delete(id);
        scheduleClose(id);
      },
    }),
    [scheduleClose, clearDismiss]
  );

  return { activeId, open, close, triggerHandlers, cardHandlers };
}
