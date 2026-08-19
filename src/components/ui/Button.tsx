/**
 * Button.tsx — UI primitive (plan S2)
 * Variants: primary (indigo), secondary (outlined), ghost.
 * Renders an <a> when href is given, else a <button>.
 */
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface BaseProps {
  variant?: Variant;
  className?: string;
}

type ButtonProps = BaseProps &
  ({ href: string } | { href?: undefined }) &
  Omit<ComponentPropsWithoutRef<"button">, "className">;

const variantClasses: Record<Variant, string> = {
  // active:translate-y-px is the tactile "pressed" state (P7 polish)
  primary:
    "bg-accent-btn text-white shadow-card transition-colors hover:bg-accent-btn-hover active:translate-y-px",
  secondary:
    "border border-card-border bg-card text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px",
  ghost: "text-ink-soft transition-colors hover:text-accent",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function Button({ variant = "primary", className, href, ...rest }: ButtonProps) {
  const classes = clsx(baseClasses, variantClasses[variant], className);

  if (href) {
    return (
      <a href={href} className={classes} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {rest.children}
      </a>
    );
  }

  return <button className={classes} {...rest} />;
}
