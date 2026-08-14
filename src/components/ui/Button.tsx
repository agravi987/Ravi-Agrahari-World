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
  primary:
    "bg-accent text-white hover:bg-accent-strong shadow-card transition-colors",
  secondary:
    "border border-card-border bg-card text-ink hover:border-accent hover:text-accent transition-colors",
  ghost: "text-ink-soft hover:text-accent transition-colors",
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
