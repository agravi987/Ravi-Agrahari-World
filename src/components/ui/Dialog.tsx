/**
 * Dialog.tsx — shadcn/ui Dialog on @radix-ui/react-dialog, restyled
 * onto the Orbital tokens (paper card, hairline border, soft blur
 * overlay). Powers the project "quick view" modal.
 *
 * Radix gives us: focus trap, Escape-to-close, click-outside close,
 * scroll-lock while open, aria-modal + role=dialog, and focus return
 * to the trigger on close — the a11y-heavy work for free.
 */
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/* --- Root --- */
export function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

export function DialogTrigger({ children, ...props }: DialogPrimitive.DialogTriggerProps) {
  return <DialogPrimitive.Trigger asChild {...props}>{children}</DialogPrimitive.Trigger>;
}

export function DialogClose({ children, ...props }: DialogPrimitive.DialogCloseProps) {
  return <DialogPrimitive.Close asChild {...props}>{children}</DialogPrimitive.Close>;
}

/* --- Portal + overlay --- */
function DialogContentPrimitive({ className, children, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* Overlay: soft ink wash + blur, animates in. */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-overlay-in" />
      {/* Panel: paper card, scales in. */}
      <DialogPrimitive.Content
        className={clsx(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl border border-card-border bg-card p-6 shadow-orbital",
          "data-[state=open]:animate-dialog-in",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Close dialog"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* --- Named parts (matching shadcn/ui) --- */
export function DialogContent({
  title,
  description,
  children,
  ...props
}: DialogPrimitive.DialogContentProps & {
  title: string;
  description?: string;
}) {
  return (
    <DialogContentPrimitive {...props}>
      <DialogPrimitive.Title className="font-display text-xl font-semibold tracking-tight text-ink">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="mt-1 text-sm text-ink-soft">
          {description}
        </DialogPrimitive.Description>
      ) : null}
      {children}
    </DialogContentPrimitive>
  );
}

export function DialogBody({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & ComponentPropsWithoutRef<"div">) {
  return (
    <div className={clsx("mt-4 max-h-[55vh] overflow-y-auto pr-1", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-card-border pt-4" {...props}>
      {children}
    </div>
  );
}
