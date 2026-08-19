/**
 * Kbd.tsx — UI primitive
 * Consistent keyboard-key chip used across the header, footer, hero and
 * overlays. Replaces the repeated inline <kbd> markup with one component
 * so the "key look" (border, radius, mono font) lives in a single place.
 */
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef } from "react";

type KbdProps = ComponentPropsWithoutRef<"kbd">;

export default function Kbd({ className, ...rest }: KbdProps) {
  return (
    <kbd
      className={clsx(
        "inline-flex items-center rounded-md border border-card-border bg-paper-deep px-1.5 py-0.5 font-mono text-[10px] text-ink-faint",
        className
      )}
      {...rest}
    />
  );
}
