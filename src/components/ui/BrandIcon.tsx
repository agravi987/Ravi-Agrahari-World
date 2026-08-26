/**
 * BrandIcon.tsx — UI primitive (plan §4.1)
 * simple-icons v16 exports raw icon data (path strings), not React
 * components — this renders them as inline SVG, inheriting currentColor
 * so we can tint brand marks with the theme accent. Use for BRANDS
 * (GitHub, AWS, Docker…) — UI icons stay in lucide-react.
 */
import { siGithub, siTelegram, siWhatsapp, siX } from "simple-icons";

/** Named allowlist of brand icons we actually use (keeps bundle small).
 *  simple-icons 16 no longer ships LinkedIn (trademark removal) — the
 *  mark is vendored here as raw path data so social links stay icons.
 *  Phase 17: telegram/whatsapp join for quick-message links. */
const ICONS = {
  github: siGithub,
  x: siX,
  telegram: siTelegram,
  whatsapp: siWhatsapp,
  linkedin: {
    title: "LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  },
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
