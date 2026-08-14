/**
 * types/index.ts
 * Shared content types for the whole site.
 * Mirrors the MongoDB collections exactly (plan §3.1 / D6) so the
 * seed → Mongo swap in lib/content.ts stays drop-in. Components
 * import from here — never duplicate these shapes.
 */

/** Moon/repo type inside a learning track (plan §3.1). */
export type LearningItemType = "notes" | "hands-on" | "project";

export interface LearningItem {
  type: LearningItemType;
  title: string;
  description: string;
  githubUrl: string;
  tags: string[];
  /** Drive the planet glow: recency, updated by the user in the CMS (D3). */
  updatedAt?: string;
}

/** A learning topic = a planet in the galaxy (plan §3.1). */
export interface LearningTrack {
  name: string;
  /** Emoji shown on the planet (🐳 ☸️ 🐧 🌐…) — the one place emojis shine. */
  icon: string;
  /** Tailwind color token name from globals.css (topic-cloud, topic-devops…). */
  color: string;
  /** Honest self-rating: beginner < learning < growing (plan §3.1). */
  level: "beginner" | "learning" | "growing";
  description: string;
  /** Positioning inside the galaxy (planet orbit number). */
  order: number;
  items: LearningItem[];
}

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
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  metrics: string[];
  order: number;
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
  email: string;
  github: string;
  socialLinks: { label: string; url: string }[];
  sectionsEnabled: SectionsEnabled;
  /** "What I learned this week" micro-notes (plan §4.2 core). */
  weeklyNotes: string[];
}

/** Everything the site renders, as returned by lib/content.ts. */
export interface SiteContent {
  config: SiteConfig;
  skills: Skill[];
  learningTracks: LearningTrack[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  posts: Post[];
}
