/**
 * types/index.ts
 * Shared content types for the whole site.
 * Mirrors the MongoDB collections exactly (plan §3.1 / D6) so the
 * seed → Mongo swap in lib/content.ts stays drop-in. Components
 * import from here — never duplicate these shapes.
 *
 * Galaxy v4 types (GalaxyPlanet/GalaxyMoon/GalaxySettings) live in
 * ./galaxy.ts — the old learningTrack model is replaced by them.
 */

export interface Skill {
  name: string;
  icon: string; // lucide or simple-icons key
  /** Honest 1–5 level (plan §3: never oversold). */
  level: number;
  blurb: string;
}

export interface Project {
  title: string;
  description: string;
  coverImage?: string;
  tech: string[];
  repoUrl?: string;
  demoUrl?: string;
  featured: boolean;
  order: number;
  /** Phase 13: enables a public /projects/<slug> case-study page. */
  slug?: string;
  /** Markdown write-up rendered on that page (hidden when empty). */
  caseStudy?: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  metrics: string[];
  order: number;
  /** Phase 16: optional company logo URL (monogram fallback when empty). */
  companyLogo?: string;
  /** Phase 16: optional "tools used" chips (rendered when non-empty). */
  tools?: string[];
  /** Phase 16: optional anchor — #experience-<slug> deep-links to the row. */
  slug?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  verifyUrl?: string;
  logo?: string;
  category: string;
}

export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  tags: string[];
  publishedAt: string;
  /** Phase 17: Mongo `updatedAt` → ISO string, when present (seed fallback
   *  has none → the "updated" line hides, zero-data policy). */
  updatedAt?: string;
}

/** What the CMS can show/hide per section (plan §5.2). */
export interface SectionsEnabled {
  hero: boolean;
  skills: boolean;
  galaxy: boolean;
  projects: boolean;
  experience: boolean;
  certifications: boolean;
  blog: boolean;
  contact: boolean;
}

/** Single source of identity/site-wide content (plan §3.1 siteConfig). */
export interface SiteConfig {
  name: string;
  headline: string;
  roles: string[];
  currentlyLearning: string;
  /** Learning streak — shown only when ≥ 2 (plan §5.3). */
  streak: number;
  /** Availability line shown in the hero (e.g. "Open to internships &
   *  full-time roles") — hidden when empty (zero-data policy). */
  availability?: string;
  email: string;
  github: string;
  /** Phase 17: "based in" line — hidden when empty (zero-data). */
  location?: string;
  socialLinks: { label: string; url: string }[];
  sectionsEnabled: SectionsEnabled;
  /** Sun photo for the Learning Galaxy (Cloudinary URL, galaxy v4). */
  profileImage?: string;
}

/** Everything the site renders, as returned by lib/content.ts. */
export interface SiteContent {
  config: SiteConfig;
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  posts: Post[];
}

/** A contact-form message (Phase 13). Admin-only — mirrors the Mongo
 *  `message` collection (never returned by getContent; read through
 *  the /api/admin/message routes + dashboard counts). */
export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
}
