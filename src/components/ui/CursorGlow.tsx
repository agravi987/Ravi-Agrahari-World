/**
 * CursorGlow.tsx (client) — ambient pointer ambience (GSAP pass).
 * TWO layers trail the cursor at different speeds, which reads as
 * depth rather than a flat blob:
 *   • a tight bright core dot (fast catch-up, ~0.15s)
 *   • a large soft indigo→cyan glow (slow drift, ~0.8s)
 * Pure decoration (pointer-events: none) and strictly opt-in: only
 * on fine pointers (mouse/trackpad), never on touch, and skipped
 * entirely for prefers-reduced-motion (no GSAP chunk fetched).
 *
 * Performance: gsap.quickTo keeps one persistent tween per layer —
 * transform-only writes, no per-frame layout work, no tween churn.
 */
"use client";

import { useEffect, useRef } from "react";
import { gsapReady } from "@/lib/gsap";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const core = coreRef.current;
    if (!glow || !core) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let disposed = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (disposed) return;

        // quickTo: persistent per-layer tweens, retargeted on every
        // pointermove — different durations create the depth lag.
        const glowX = gsap.quickTo(glow, "x", { duration: 0.8, ease: "power3.out" });
        const glowY = gsap.quickTo(glow, "y", { duration: 0.8, ease: "power3.out" });
        const coreX = gsap.quickTo(core, "x", { duration: 0.15, ease: "power3.out" });
        const coreY = gsap.quickTo(core, "y", { duration: 0.15, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          glowX(e.clientX);
          glowY(e.clientY);
          coreX(e.clientX);
          coreY(e.clientY);
        };

        window.addEventListener("pointermove", onMove, { passive: true });

        dispose = () => {
          window.removeEventListener("pointermove", onMove);
          gsap.killTweensOf([glow, core]);
          glow.style.transform = "";
          core.style.transform = "";
        };
      })
      .catch(() => {
        /* GSAP failed to load — no cursor ambience, nothing breaks */
      });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Wide soft glow — the slow layer. Centered on the cursor via
          translate(-50%) + GSAP x/y (transform composition). */}
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgb(79 70 229 / 0.10), rgb(6 182 212 / 0.05) 40%, transparent 65%)",
          willChange: "transform",
        }}
      />
      {/* Tight core — the fast layer. A small lens-flare dot that
          tracks the cursor closely. */}
      <span
        ref={coreRef}
        className="absolute left-0 top-0 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/40 shadow-[0_0_12px_2px_rgb(6_182_212/0.35)]"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
