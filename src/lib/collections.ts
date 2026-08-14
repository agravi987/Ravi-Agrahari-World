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
  | "stringList"
  | "json"
  | "sectionsEnabled";

export interface CollectionField {
  /** Key on the document. */
  key: string;
  label: string;
  type: FieldType;
  /** For select: allowed values. For sectionsEnabled: section keys. */
  options?: string[];
  help?: string;
  placeholder?: string;
  required?: boolean;
  /** text fields: show a Cloudinary upload button + preview (plan D8). */
  image?: boolean;
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
}

export const COLLECTIONS: CollectionSpec[] = [
  {
    key: "siteConfig",
    label: "Site config",
    description: "Name, headline, roles, streak, sections — the single source of identity.",
    singleDoc: true,
    listColumns: ["name", "email", "github"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "headline", label: "Headline", type: "textarea" },
      { key: "roles", label: "Rotating roles", type: "stringList", help: "One role per line (e.g. Cloud Enthusiast)" },
      { key: "currentlyLearning", label: "Currently learning", type: "text", help: "Shown in the header + hero momentum badge" },
      { key: "streak", label: "Learning streak (days)", type: "number", help: "Only shown on the site when ≥ 2 (plan §5.3)" },
      { key: "email", label: "Email", type: "text", required: true },
      { key: "github", label: "GitHub username", type: "text", required: true },
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
      { key: "weeklyNotes", label: "Weekly notes (mission log)", type: "stringList", help: "One note per line — shown under the galaxy" },
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
      { key: "level", label: "Level (1–5)", type: "number", required: true },
      { key: "blurb", label: "Blurb", type: "textarea" },
    ],
  },
  {
    key: "learningTrack",
    label: "Learning track",
    description: "A planet in the Learning Galaxy — with its moons (repos).",
    listColumns: ["name", "level", "items"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "icon", label: "Icon", type: "text", help: "Emoji — the one place emojis shine (🐳 ☸️ 🐧 🌐)" },
      {
        key: "color",
        label: "Color",
        type: "select",
        options: ["topic-cloud", "topic-devops", "topic-ai", "topic-linux", "topic-mars", "topic-ice"],
      },
      {
        key: "level",
        label: "Level",
        type: "select",
        options: ["beginner", "learning", "growing"],
      },
      { key: "description", label: "Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
      {
        key: "items",
        label: "Moons (repos)",
        type: "json",
        help: 'JSON array: [{"type":"notes","title":"…","description":"…","githubUrl":"https://…","tags":["…"],"updatedAt":"2026-08-01"}]. type: notes | hands-on | project',
      },
    ],
  },
  {
    key: "project",
    label: "Project",
    description: "Project cards with tech badges + links.",
    listColumns: ["title", "featured", "order"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "coverImage", label: "Cover image URL", type: "text", image: true, help: "Optional — upload or paste a Cloudinary URL (plan D8)" },
      { key: "tech", label: "Tech stack", type: "stringList", help: "One per line (e.g. Next.js)" },
      { key: "repoUrl", label: "Repo URL", type: "text" },
      { key: "demoUrl", label: "Demo URL", type: "text" },
      { key: "featured", label: "Featured (large card)", type: "boolean" },
      { key: "order", label: "Order", type: "number" },
    ],
  },
  {
    key: "experience",
    label: "Experience",
    description: "Timeline entries — hides until content exists (plan §5.2).",
    listColumns: ["company", "role", "period"],
    fields: [
      { key: "company", label: "Company", type: "text", required: true },
      { key: "role", label: "Role", type: "text", required: true },
      { key: "period", label: "Period", type: "text", placeholder: "e.g. Jun 2026 – Aug 2026" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "metrics", label: "Metrics / highlights", type: "stringList", help: "One per line" },
      { key: "order", label: "Order", type: "number" },
    ],
  },
  {
    key: "certification",
    label: "Certification",
    description: "Badge cards with official verify links (plan §4.3).",
    listColumns: ["name", "issuer", "category"],
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

/** Per-field default so forms never render uncontrolled inputs. */
export function defaultForField(field: CollectionField): unknown {
  switch (field.type) {
    case "number":
      return 0;
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
