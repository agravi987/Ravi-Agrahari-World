/**
 * social.ts — single source of truth for social-link rendering (#197).
 *
 * Before this module, Hero / Contact / Footer each kept their own
 * SOCIAL_BRANDS + BRAND_HOVER maps and they had already drifted:
 * Hero's brand map was missing LinkedIn while Contact/Footer had it,
 * and Contact alone knew about telegram/whatsapp. One map now feeds
 * all three surfaces (see components/ui/SocialLink.tsx).
 */
import type { BrandIconName } from "@/components/ui/BrandIcon";

/** Normalized label → brand icon (labels like "GitHub", "github", "X (Twitter)"). */
export function socialBrandFor(label: string): BrandIconName | undefined {
  const key = label.toLowerCase().replace(/\W/g, "");
  const MAP: Record<string, BrandIconName> = {
    github: "github",
    x: "x",
    twitter: "x",
    linkedin: "linkedin",
    telegram: "telegram",
    whatsapp: "whatsapp",
  };
  return MAP[key];
}

/** Brand-colored hover classes per surface style (audit #72):
 *  - "pill"  → bordered pills (hero + contact): border AND text hover
 *  - "text"  → bare text links (footer): text-color hover only
 */
export function socialHoverFor(
  label: string,
  style: "pill" | "text"
): string {
  const key = label.toLowerCase().replace(/\W/g, "");
  const PILL: Record<string, string> = {
    github: "hover:border-ink/40 hover:text-ink",
    x: "hover:border-ink/40 hover:text-ink",
    twitter: "hover:border-ink/40 hover:text-ink",
    linkedin: "hover:border-topic-cloud/50 hover:text-topic-cloud-deep",
    telegram: "hover:border-topic-cloud/50 hover:text-topic-cloud-deep",
    whatsapp: "hover:border-emerald-500/50 hover:text-emerald-600",
  };
  const TEXT: Record<string, string> = {
    github: "hover:text-ink",
    x: "hover:text-ink",
    twitter: "hover:text-ink",
    linkedin: "hover:text-topic-cloud-deep",
    telegram: "hover:text-topic-cloud-deep",
    whatsapp: "hover:text-emerald-600",
  };
  const table = style === "pill" ? PILL : TEXT;
  return table[key] ?? "";
}
