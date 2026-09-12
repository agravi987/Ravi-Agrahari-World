/**
 * Magnetic.tsx (client) — magnetic hover wrapper (GSAP pass).
 * Child "attracts" toward the cursor on hover, then springs back on
 * leave. Used on primary CTAs (hero, contact).
 *
 * GSAP UPGRADE: the previous version wrote el.style.transform on every
 * mousemove and cleared it on leave — the return was an instant snap
 * (a visible jump). gsap.quickTo retargets an in-flight tween on every
 * pointermove (smooth catch-up), and the leave handler tweens back to
 * zero with an elastic ease, which reads as a spring. Transform-only,
 * no per-frame layout reads — the element rect is cached and refreshed
 * on resize. Tailwind v4 translate utilities use the standalone
 * `translate` property, which composes additively with GSAP's
 * `transform`, so hover classes elsewhere are unaffected.
 *
 * Reduced-motion + touch: no listeners attached and the GSAP chunk is
 * never fetched (repo pattern: useReducedMotion gate before loading).
 */
"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";

interface MagneticProps extends Omit<ComponentPropsWithoutRef<"div">, "ref"> {
  /** Pull factor — higher = stronger attraction (default 0.3). */
  strength?: number;
  children: ReactNode;
}

export default function Magnetic({ strength = 0.3, children, className, ...rest }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const strengthRef = useRef(strength);
  // Sync the latest prop outside render (react-hooks/refs).
  useEffect(() => {
    strengthRef.current = strength;
  }, [strength]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let disposed = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (disposed) return;

        let rect = el.getBoundingClientRect();
        const measure = () => {
          rect = el.getBoundingClientRect();
        };

        // quickTo: one persistent tween per axis, retargeted on every
        // move — no tween churn, no listener-lag jump.
        const toX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const toY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          toX((e.clientX - (rect.left + rect.width / 2)) * strengthRef.current);
          toY((e.clientY - (rect.top + rect.height / 2)) * strengthRef.current);
        };
        const onLeave = () => {
          // Spring home instead of snapping.
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.55)" });
        };

        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave, { passive: true });
        window.addEventListener("resize", measure);

        dispose = () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("resize", measure);
          gsap.killTweensOf(el);
          el.style.transform = "";
        };
      })
      .catch(() => {
        /* GSAP failed to load — the element simply has no magnetic pull */
      });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, [reduceMotion]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: "transform" }}
      {...rest}
    >
      {children}
    </div>
  );
}