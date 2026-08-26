/**
 * TiltCard.tsx (client) — 3D mouse-tilt + pointer spotlight (UI/UX pass).
 * Tilts the card toward the cursor (perspective rotateX/rotateY) while a
 * radial spotlight follows the pointer on hover. Pure transform-driven;
 * disabled entirely for reduced-motion users (no tilt, no spotlight).
 *
 * Keeps the existing design language — it renders a droplet onto whatever
 * surface you give it (use inside a Card for accent snap).
 */
"use client";

import { clsx } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface TiltCardProps extends ComponentPropsWithoutRef<"div"> {
  /** Max tilt angle in degrees (default 7). */
  max?: number;
  /** Toggle the pointer-following spotlight (default true). */
  spotlight?: boolean;
}

export default function TiltCard({
  max = 7,
  spotlight = true,
  className,
  children,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    el.style.setProperty("--sx", `${px * 100}%`);
    el.style.setProperty("--sy", `${py * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--sx", "50%");
    el.style.setProperty("--sy", "50%");
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={clsx("tilt-card", spotlight && "card-spotlight", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
