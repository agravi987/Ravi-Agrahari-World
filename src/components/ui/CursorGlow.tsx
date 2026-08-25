/**
 * CursorGlow.tsx (client) — ambient pointer ambience.
 * A large, very soft indigo→cyan radial glow that trails the cursor
 * with a little easing. Pure decoration (pointer-events: none) and
 * strictly opt-in: only on fine pointers (mouse/trackpad), never on
 * touch, and skipped entirely for prefers-reduced-motion.
 *
 * Performance: one rAF loop lerping a translate3d — transform-only,
 * no layout reads/writes per frame.
 */
"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    let active = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      active = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      // 50% of the 700px box is centered on the cursor via translate.
      el.style.transform = `translate3d(${x - 350}px, ${y - 350}px, 0)`;
      if (active) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onLeave = () => {
      active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[500px] w-[500px]"
      style={{
        background:
          "radial-gradient(circle at center, rgb(79 70 229 / 0.04), rgb(6 182 212 / 0.02) 40%, transparent 65%)",
        willChange: "transform",
      }}
    />
  );
}
