/**
 * collections.ts — admin CRUD registry (plan D10 / ui-ux-design.md P0)
 * One schema per collection drives the /admin list + form pages and
 * the API routes. Adding a field = one entry here.
 *
 * IMPORTANT: this file must stay free of server-only imports
 * (mongoose, next-auth…) because the admin PAGES import it on the
 * client. Model getters live in collections.server.ts instead.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "color"
  | "stringList"
  | "json"
  | "sectionsEnabled"
  | "refSelect"
  | "moonType";

export interface CollectionField {
  /** Key on the document. */
  key: string;
  label: string;
  type: FieldType;
  /** For select: allowed values. For sectionsEnabled: section keys. */
  options?: string[];
  /** For refSelect: the collection whose docs populate the dropdown (galaxy v4). */
  refCollection?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  /** text fields: show a Cloudinary upload button + preview (plan D8). */
  image?: boolean;
  /** #17: Number fields — HTML min/max attributes for client-side hints. */
  min?: number;
  max?: number;
}

export interface CollectionSpec {
  /** URL slug + Mongo collection key, e.g. "project". */
  key: string;
  /** Human name for buttons/headings, e.g. "Project". */
  label: string;
  description: string;
  /**
   * siteConfig is a singleton document — its page renders the edit
   * form directly, and there is no list/new/delete for it.
   */
  singleDoc?: boolean;
  fields: CollectionField[];
  /** Keys shown as columns in the list table. */
  listColumns: string[];
  /**
   * When set (e.g. "displayOrder"), the list renders up/down arrows
   * that swap this numeric field between neighbors (galaxy v4 §13).
   */
  orderKey?: string;
  /** Shown in the delete confirmation (galaxy v4: cascade warning). */
  deleteWarning?: string;
  /**
   * Phase 11: a text field holding an image URL — the list renders a
   * small thumbnail in a leading column so rows scan visually.
   */
  previewKey?: string;
}

export const COLLECTIONS: CollectionSpec[] = [
  {
    key: "siteConfig",
    label: "Site config",
    description: "Name, headline, roles, streak, sections — the single source of identity.",
    singleDoc: true,
    listColumns: ["name", "email", "github"],
    previewKey: "profileImage",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "headline", label: "Headline", type: "textarea" },
      { key: "roles", label: "Rotating roles", type: "stringList", help: "One role per line (e.g. Cloud Enthusiast)" },
      { key: "currentlyLearning", label: "Currently learning", type: "text", help: "Shown in the header + hero momentum badge" },
      { key: "streak", label: "Learning streak (days)", type: "number", help: "Only shown on the site when ≥ 2 (plan §5.3)" },
      { key: "availability", label: "Availability line", type: "text", help: "Hero pill (e.g. \"Open to internships & full-time roles\") — hidden when empty" },
      { key: "location", label: "Location", type: "text", help: "\"based in\" line (e.g. India) — hidden when empty" },
      { key: "email", label: "Email", type: "text", required: true },
      { key: "github", label: "GitHub username", type: "text", required: true },
      {
        key: "profileImage",
        label: "Profile photo (the sun)",
        type: "text",
        image: true,
        help: "Cloudinary URL — shown at the center of the Learning Galaxy (galaxy v4)",
      },
      {
        key: "socialLinks",
        label: "Social links",
        type: "json",
        help: 'JSON array, e.g. [{"label":"GitHub","url":"https://github.com/you"}]',
      },
      {
        key: "sectionsEnabled",
        label: "Sections enabled",
        type: "sectionsEnabled",
        options: ["hero", "skills", "galaxy", "projects", "experience", "certifications", "blog", "contact"],
      },
    ],
  },
  {
    key: "skill",
    label: "Skill",
    description: "Skill cards with honest 1–5 level bars.",
    listColumns: ["name", "icon", "level"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "icon", label: "Icon", type: "text", help: "lucide key: cloud, workflow, bot…" },
      { key: "level", label: "Level (1–5)", type: "number", required: true, min: 1, max: 5 },
      { key: "blurb", label: "Blurb", type: "textarea" },
    ],
  },
  {
    key: "galaxyPlanet",
    label: "Galaxy planet",
    description: "A skill planet in the Learning Galaxy — with its moons (galaxy v4).",
    listColumns: ["name", "color", "orbitRadius", "isVisible"],
    orderKey: "displayOrder",
    deleteWarning: "This planet AND all of its moons will be permanently deleted.",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true, help: "URL-ish key, e.g. aws" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon", type: "text", help: "Emoji or lucide key (☁️ 🐳 ☸️ 🧱 …)" },
      { key: "color", label: "Theme color", type: "color", help: "Planet color — pick a swatch or paste a hex" },
      { key: "size", label: "Size (px)", type: "number", help: "36–96", min: 36, max: 96 },
      {
        key: "orbitRadius",
        label: "Orbit radius (px)",
        type: "number",
        required: true,
        help: "Spacing is validated so planets never overlap the sun or each other",
      },
      { key: "orbitSpeed", label: "Orbit speed (s/rev)", type: "number", help: "20–120 — keep planets equal for a locked, overlap-free constellation" },
      { key: "orbitAngle", label: "Orbit phase (deg)", type: "number", help: "Stagger planets so they never start aligned" },
      { key: "displayOrder", label: "Display order", type: "number" },
      { key: "isVisible", label: "Visible on site", type: "boolean" },
    ],
  },
  {
    key: "galaxyMoon",
    label: "Galaxy moon",
    description: "A learning artifact orbiting a planet (project, lab, notes…).",
    listColumns: ["name", "type", "planetId", "isVisible"],
    orderKey: "displayOrder",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      {
        key: "planetId",
        label: "Parent planet",
        type: "refSelect",
        refCollection: "galaxyPlanet",
        required: true,
        help: "The planet this moon orbits",
      },
      {
        key: "type",
        label: "Type",
        // moonType: options are LOADED from galaxySettings.moonTypes at
        // form render (the settings page is the single source of truth),
        // with the seed defaults as fallback. The old hardcoded select
        // contradicted the help text — custom types could never be picked.
        type: "moonType",
        help: "Loaded from Galaxy settings → Moon types (configurable there)",
      },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon", type: "text", help: "Emoji (🚀 🛠️ 🗒️ …)" },
      { key: "githubUrl", label: "GitHub URL", type: "text", help: "Repo link — the card shows a button only when this is set" },
      { key: "liveUrl", label: "Live URL", type: "text" },
      { key: "documentationUrl", label: "Docs URL", type: "text" },
      { key: "technologies", label: "Technologies", type: "stringList", help: "One per line" },
      { key: "size", label: "Size (px)", type: "number", help: "8–24", min: 8, max: 24 },
      { key: "orbitRadius", label: "Orbit radius (px)", type: "number", help: "Stays inside the parent planet's lane" },
      { key: "orbitSpeed", label: "Orbit speed (s/rev)", type: "number" },
      { key: "orbitAngle", label: "Orbit phase (deg)", type: "number" },
      { key: "isFeatured", label: "Featured", type: "boolean" },
      { key: "isVisible", label: "Visible on site", type: "boolean" },
      { key: "displayOrder", label: "Display order", type: "number" },
    ],
  },
  {
    key: "galaxySettings",
    label: "Galaxy settings",
    description: "Global appearance + interaction settings for the Learning Galaxy.",
    singleDoc: true,
    listColumns: ["showOrbitLines", "starDensity", "homePreviewPlanets"],
    fields: [
      { key: "showOrbitLines", label: "Show orbit lines", type: "boolean", help: "Always rendered faint — never dark" },
      { key: "showStars", label: "Show starfield", type: "boolean" },
      { key: "starDensity", label: "Star density", type: "select", options: ["low", "medium", "high"] },
      { key: "nebulaVisible", label: "Show nebula", type: "boolean" },
      { key: "animationEnabled", label: "Enable orbit animation", type: "boolean" },
      { key: "globalSpeedScale", label: "Global speed scale", type: "number", help: "0.5–2 — multiplies every orbit speed" },
      { key: "hoverCardsEnabled", label: "Enable hover cards", type: "boolean" },
      { key: "clickCardsEnabled", label: "Enable click cards", type: "boolean" },
      {
        key: "moonTypes",
        label: "Moon types",
        type: "stringList",
        help: "One per line — configurable, drives the moon type select + filters",
      },
      { key: "homePreviewPlanets", label: "Home preview planet count", type: "number", help: "How many planets show on the home preview" },
      {
        key: "cardDismissDelay",
        label: "Card dismiss delay (ms)",
        type: "number",
        help: "Hover cards must stay at least this long — default 3000",
      },
      { key: "threeDEffect", label: "3D effect (detail page)", type: "boolean" },
      { key: "allowDragRotate", label: "Drag to rotate (detail page)", type: "boolean" },
    ],
  },
  {
    key: "project",
    label: "Project",
    description: "Project cards with tech badges + links + optional case-study pages.",
    listColumns: ["title", "slug", "featured"],
    orderKey: "order",
    previewKey: "coverImage",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      {
        key: "slug",
        label: "Slug",
        type: "text",
        help: "Optional — enables a public /projects/<slug> case-study page (Phase 13)",
      },
      { key: "description", label: "Description", type: "textarea" },
      { key: "coverImage", label: "Cover image URL", type: "text", image: true, help: "Optional — upload or paste a Cloudinary URL (plan D8)" },
      { key: "tech", label: "Tech stack", type: "stringList", help: "One per line (e.g. Next.js)" },
      { key: "repoUrl", label: "Repo URL", type: "text" },
      { key: "demoUrl", label: "Demo URL", type: "text" },
      {
        key: "caseStudy",
        label: "Case study (markdown)",
        type: "markdown",
        help: "Optional — the full write-up shown on the case-study page; hidden when empty",
      },
      { key: "featured", label: "Featured (large card)", type: "boolean" },
      { key: "order", label: "Order", type: "number" },
    ],
  },
  {
    key: "message",
    label: "Message",
    description: "Contact-inbox submissions from the public form (Phase 13).",
    listColumns: ["name", "email", "subject", "read"],
    deleteWarning: "This message will be permanently deleted.",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "text", required: true, help: "Reply address from the form" },
      { key: "subject", label: "Subject", type: "text", required: true },
      { key: "message", label: "Message", type: "textarea", required: true },
      { key: "read", label: "Read", type: "boolean", help: "Unread = shown amber in the list" },
    ],
  },
  {
    key: "experience",
    label: "Experience",
    description: "Timeline entries — hides until content exists (plan §5.2).",
    listColumns: ["company", "role", "period"],
    orderKey: "order",
    fields: [
      { key: "company", label: "Company", type: "text", required: true },
      { key: "role", label: "Role", type: "text", required: true },
      { key: "period", label: "Period", type: "text", placeholder: "e.g. Jun 2026 – Aug 2026" },
      { key: "slug", label: "Slug", type: "text", help: "Optional — enables #experience-<slug> deep-links (Phase 16)" },
      {
        key: "companyLogo",
        label: "Company logo URL",
        type: "text",
        image: true,
        help: "Optional — upload or paste a URL; monogram fallback when empty",
      },
      { key: "description", label: "Description", type: "textarea" },
      { key: "metrics", label: "Metrics / highlights", type: "stringList", help: "One per line" },
      { key: "tools", label: "Tools used", type: "stringList", help: "Optional — one per line (Phase 16)" },
      { key: "order", label: "Order", type: "number" },
    ],
  },
  {
    key: "certification",
    label: "Certification",
    description: "Badge cards with official verify links (plan §4.3).",
    listColumns: ["name", "issuer", "category"],
    previewKey: "logo",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "issuer", label: "Issuer", type: "text" },
      { key: "date", label: "Date", type: "date" },
      { key: "verifyUrl", label: "Verify URL", type: "text", help: "Official badge link — the proof (plan §4.3)" },
      { key: "logo", label: "Logo URL", type: "text", image: true, help: "Optional — upload or paste a URL" },
      { key: "category", label: "Category", type: "text" },
    ],
  },
  {
    key: "post",
    label: "Post",
    description: "Blog notes — markdown rendered on /blog/[slug].",
    listColumns: ["title", "publishedAt", "slug"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true, help: "URL path, e.g. what-i-learned-setting-up-ci" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "contentMarkdown", label: "Content (markdown)", type: "markdown" },
      { key: "tags", label: "Tags", type: "stringList", help: "One per line" },
      { key: "publishedAt", label: "Published date", type: "date" },
    ],
  },
];

/** key → spec lookup. */
export const COLLECTION_MAP: Record<string, CollectionSpec> = Object.fromEntries(
  COLLECTIONS.map((c) => [c.key, c])
);

export function getCollection(key: string): CollectionSpec | undefined {
  return COLLECTION_MAP[key];
}

/**
 * Phase 11: where a doc lives on the public site — { href, external }.
 * Used by the admin list (per-row "View") + edit page ("View on site").
 * Returns null when the collection has no public surface.
 */
export function publicUrlFor(
  doc: Record<string, unknown>,
  collection: string
): { href: string; external: boolean } | null {
  const slug = String(doc.slug ?? "");
  if (collection === "post" && slug) return { href: `/blog/${slug}`, external: false };
  if (collection === "galaxyPlanet" && slug)
    return { href: `/detailed-galaxy#planet-${slug}`, external: false };
  if (collection === "project") return projectUrl(doc);
  if (collection === "certification") {
    const verify = String(doc.verifyUrl ?? "");
    if (/^https?:\/\//.test(verify)) return { href: verify, external: true };
    return null;
  }
  if (collection === "galaxyMoon") return { href: "/detailed-galaxy", external: false };
  if (collection === "experience") return { href: "/#experience", external: false };
  return null;
}

/**
 * Phase 13: per-project case-study URL. The admin "View" link and the
 * site both call this — a project with a slug gets /projects/<slug>;
 * otherwise the demo link or the section anchor. Never returns a URL
 * for a slug-less project.
 */
export function projectUrl(
  doc: Record<string, unknown>
): { href: string; external: boolean } | null {
  const slug = String(doc.slug ?? "");
  if (slug) return { href: `/projects/${slug}`, external: false };
  const demo = String(doc.demoUrl ?? "");
  if (/^https?:\/\//.test(demo)) return { href: demo, external: true };
  return { href: "/#projects", external: false };
}

/** Per-field default so forms never render uncontrolled inputs. */
export function defaultForField(field: CollectionField): unknown {
  switch (field.type) {
    // Empty string, not 0: an empty number field means "use the schema
    // default" (e.g. planet size 56) — 0 would trip min-validators.
    case "number":
      return "";
    case "boolean":
      return false;
    case "stringList":
      return [];
    case "json":
      return null;
    case "sectionsEnabled":
      return Object.fromEntries((field.options ?? []).map((k) => [k, true]));
    case "select":
      return field.options?.[0] ?? "";
    default:
      return "";
  }
}

/** Initial form state for a doc (or empty when creating). */
export function emptyDoc(spec: CollectionSpec): Record<string, unknown> {
  return Object.fromEntries(spec.fields.map((f) => [f.key, defaultForField(f)]));
}
