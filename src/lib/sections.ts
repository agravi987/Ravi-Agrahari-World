/**
 * sections.ts — single source of truth for the CMS section toggles.
 * The canonical key order (page order), labels, and help lines live
 * here so the Site Config form and the dashboard SectionsPanel can
 * never drift apart.
 */

export type SectionKey =
  | "hero"
  | "skills"
  | "galaxy"
  | "projects"
  | "experience"
  | "certifications"
  | "blog"
  | "contact";

/** Page-order list of every toggleable section. */
export const SECTION_KEYS: SectionKey[] = [
  "hero",
  "skills",
  "galaxy",
  "projects",
  "experience",
  "certifications",
  "blog",
  "contact",
];

/** One-line description per section (admin toggle rows). */
export const SECTION_HELP: Record<SectionKey, string> = {
  hero: "Name, headline, CTAs — the first screen visitors see",
  skills: "Skill cards with honest level bars",
  galaxy: "Learning-planets preview (links into the explorer)",
  projects: "Project grid with quick-view modals",
  experience: "Career & education timeline",
  certifications: "Certificate focus carousel",
  blog: "Latest notes teaser",
  contact: "Email, socials, and the contact form",
};

/** Missing keys default to SHOWN — only an explicit false hides. */
export function sectionEnabled(
  sections: Record<string, boolean> | undefined,
  key: SectionKey
): boolean {
  return sections?.[key] !== false;
}
