/**
 * SocialLink.tsx — ONE social-link primitive for all three surfaces
 * (audit #72/#197). Before this, Hero (icon pills), Contact (text
 * pills) and Footer (text links) each hand-rolled their own markup
 * with drift already present (LinkedIn missing from Hero's brand map).
 *
 * Variants:
 *  - "icon"  → square icon pill (hero social row)
 *  - "pill"  → label pill with optional brand icon (contact "Elsewhere")
 *  - "text"  → underlined text link (footer "Connect")
 *
 * Shared behavior: external new-tab + noopener, "(opens in a new tab)"
 * in the accessible name (audit #54), brand-colored hover, fallback
 * hover for unknown brands.
 */
import BrandIcon from "@/components/ui/BrandIcon";
import { socialBrandFor, socialHoverFor } from "@/lib/social";
import { clsx } from "clsx";

interface SocialLinkProps {
  label: string;
  url: string;
  variant: "icon" | "pill" | "text";
  className?: string;
}

export default function SocialLink({ label, url, variant, className }: SocialLinkProps) {
  const brand = socialBrandFor(label);
  const hover =
    socialHoverFor(label, variant === "text" ? "text" : "pill") ||
    (variant === "text" ? "hover:text-accent" : "hover:border-accent/40 hover:text-accent");
  const externalName = `${label} (opens in a new tab)`;

  if (variant === "icon") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={externalName}
        title={label}
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          hover,
          className
        )}
      >
        {brand && <BrandIcon name={brand} className="h-4 w-4" aria-hidden="true" />}
      </a>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={externalName}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          hover,
          className
        )}
      >
        {brand && <BrandIcon name={brand} className="h-4 w-4" aria-hidden="true" />}
        {label}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={externalName}
      className={clsx(
        "link-underline inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors",
        hover,
        className
      )}
    >
      {brand && <BrandIcon name={brand} className="h-4 w-4" aria-hidden="true" />}
      {label}
    </a>
  );
}
