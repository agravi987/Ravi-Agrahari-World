/**
 * Button.tsx — UI primitive (plan S2)
 * Variants: primary (indigo), secondary (outlined), ghost.
 * Renders an <a> when href is given, else a <button>. Internal hrefs
 * ("/…", "#…") render as next/link so clicks stay in-app — audit #78:
 * a raw <a> CTA forces a full page reload on internal routes.
 */
import { clsx } from "clsx";
import Link from "next/link";
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
    "bg-accent-btn text-white shadow-md hover:bg-accent-btn-hover hover:shadow-orbital active:translate-y-px transition-all duration-200",
  secondary:
    "border border-card-border/80 bg-card/80 backdrop-blur-xs text-ink shadow-xs hover:border-accent/60 hover:text-accent hover:bg-card active:translate-y-px transition-all duration-200",
  ghost: "text-ink-soft transition-colors hover:text-accent",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent shadow-xs active:scale-[0.98] transition-all";

export default function Button({ variant = "primary", className, href, ...rest }: ButtonProps) {
  const classes = clsx(baseClasses, variantClasses[variant], className);

  if (href) {
    const classes = clsx(baseClasses, variantClasses[variant], className);
    const anchorProps = rest as ComponentPropsWithoutRef<"a">;
    // Internal routes + hash anchors → SPA navigation (audit #78).
    if (href.startsWith("/") || href.startsWith("#")) {
      return (
        <Link href={href} className={classes} {...anchorProps}>
          {rest.children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorProps}>
        {rest.children}
      </a>
    );
  }

  return <button className={classes} {...rest} />;
}
