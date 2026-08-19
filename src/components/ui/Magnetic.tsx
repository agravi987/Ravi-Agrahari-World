/**
 * Magnetic.tsx (client) — magnetic hover wrapper (UX pass).
 * Child "attracts" toward the cursor on hover (translate follows the
 * pointer), then springs back on leave. A subtle depth gesture used on
 * primary CTAs (hero, contact). Disabled for reduced-motion users.
 */
"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface MagneticProps extends Omit<ComponentPropsWithoutRef<"div">, "ref"> {
  /** Pull factor — higher = stronger attraction (default 0.3). */
  strength?: number;
  children: ReactNode;
}

export default function Magnetic({ strength = 0.3, children, className, ...rest }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: "transform 0.3s ease", willChange: "transform" }}
      {...rest}
    >
      {children}
    </div>
  );
}