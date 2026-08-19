/**
 * BrandIcon.tsx — UI primitive (plan §4.1)
 * simple-icons v16 exports raw icon data (path strings), not React
 * components — this renders them as inline SVG, inheriting currentColor
 * so we can tint brand marks with the theme accent. Use for BRANDS
 * (GitHub, AWS, Docker…) — UI icons stay in lucide-react.
 */
import { siGithub, siTelegram, siWhatsapp, siX } from "simple-icons";

/** Named allowlist of brand icons we actually use (keeps bundle small).
 *  (simple-icons 16 no longer ships LinkedIn — that label renders
 *  text-only in Contact.tsx until an alternative is chosen.) Phase 17:
 *  telegram/whatsapp join for quick-message links in the contact panel. */
const ICONS = {
  github: siGithub,
  x: siX,
  telegram: siTelegram,
  whatsapp: siWhatsapp,
} as const;

export type BrandIconName = keyof typeof ICONS;

interface BrandIconProps {
  name: BrandIconName;
  className?: string;
}

export default function BrandIcon({ name, className }: BrandIconProps) {
  const icon = ICONS[name];
  if (!icon) return null;

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      aria-label={icon.title}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
}
