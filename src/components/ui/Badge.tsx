/**
 * Badge.tsx — UI primitive (plan S2)
 * Pill-shaped label for tech tags, filter chips, status dots.
 * Variants: neutral (card), accent (indigo), colored (any token).
 */
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "neutral" | "accent" | "colored";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  neutral: "bg-paper-deep text-ink-soft",
  accent: "bg-accent-soft text-accent",
  colored: "bg-accent-soft text-accent",
};

export default function Badge({ variant = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...rest}
    />
  );
}

/** Honest "sample / placeholder" pill — shown on sample content so visitors
 *  aren't misled about what's a real shipped artifact. Subtle, muted, never
 *  accented — honest trumps flashy. */
export function SamplePill({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-ink-faint/30 bg-ink-faint/8 px-2 py-0.5 font-mono text-[10px] font-medium text-ink-faint",
        className
      )}
    >
      {children ?? "sample"}
    </span>
  );
}
