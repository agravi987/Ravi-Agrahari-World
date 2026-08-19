/**
 * Tooltip.tsx — shadcn/ui Tooltip on @radix-ui/react-tooltip,
 * restyled onto the Orbital tokens (dark chip, like Linear/Google).
 * Use instead of `title` attributes where the hint adds value:
 * theme toggle, header GitHub, palette trigger, issuer logos.
 *
 * Usage:
 *   <Tooltip label="Switch theme">
 *     <button>…</button>
 *   </Tooltip>
 *
 * Animations are data-state driven (Radix) + folded into the global
 * reduced-motion override.
 */
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  /** Side the tooltip prefers (default top). */
  side?: "top" | "right" | "bottom" | "left";
  /** Match the trigger's width (useful for full-width buttons). */
  asChild?: boolean;
  className?: string;
}

export default function Tooltip({
  label,
  children,
  side = "top",
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={12}
            className={clsx(
              "z-50 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-paper shadow-lg",
              "data-[state=delayed-open]:animate-tooltip-in",
              className
            )}
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-ink" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
