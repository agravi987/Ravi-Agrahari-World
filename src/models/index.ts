/**
 * models/index.ts — Mongoose schemas (plan S11c, §3.1)
 * Each schema mirrors the seed types in types/index.ts EXACTLY
 * (D6) so lib/content.ts can map Mongo docs → SiteContent with
 * zero shape drift. Only `user` is Mongo-specific (auth, D7).
 */
import { Schema, model, models, type Model } from "mongoose";
import type {
  Certification,
  ContactMessage,
  Experience,
  Post,
  Project,
  SectionsEnabled,
  SiteConfig,
  Skill,
} from "@/types";

/* Galaxy v4 schemas live in ./galaxy.ts (galaxyPlanet/Moon/Settings). */
export * from "./galaxy";

/* --- Helpers --- */

const socialLinkSchema = new Schema(
  { label: { type: String, required: true }, url: { type: String, required: true } },
  { _id: false }
);

const sectionsEnabledSchema = new Schema<SectionsEnabled>(
  {
    hero: { type: Boolean, default: true },
    skills: { type: Boolean, default: true },
    galaxy: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    experience: { type: Boolean, default: true },
    certifications: { type: Boolean, default: true },
    blog: { type: Boolean, default: true },
    contact: { type: Boolean, default: true },
  },
  { _id: false }
);

/* --- siteConfig (single document, singleton pattern) --- */

/* Phase 11: content models carry createdAt/updatedAt — the admin
   dashboard's "Recently edited" feed reads updatedAt, and edits set
   it automatically (additive; old docs simply lack it until edited). */
const timestamps = { timestamps: true };

const siteConfigSchema = new Schema<SiteConfig>(
  {
    name: { type: String, required: true },
    headline: { type: String, required: true },
    roles: { type: [String], default: [] },
    currentlyLearning: { type: String, default: "" },
    streak: { type: Number, default: 0 }, // shown only when ≥ 2 (§5.3)
    availability: { type: String, default: "" }, // hero pill; hidden when empty
    location: { type: String, default: "" }, // "based in" line; hidden when empty (Phase 17)
    email: { type: String, required: true },
    github: { type: String, required: true },
    socialLinks: { type: [socialLinkSchema], default: [] },
    sectionsEnabled: { type: sectionsEnabledSchema, default: () => ({}) },
    profileImage: { type: String }, // sun photo for the Learning Galaxy (v4)
  },
  timestamps
);

/* --- skills --- */

const skillSchema = new Schema<Skill>(
  {
    name: { type: String, required: true },
    icon: { type: String, default: "cloud" },
    level: { type: Number, min: 1, max: 5, required: true }, // honest 1–5
    blurb: { type: String, default: "" },
  },
  timestamps
);
// #29: Index for sort by level in content.ts.
skillSchema.index({ level: -1 });

/* --- project --- */

const projectSchema = new Schema<Project>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: undefined }, // Cloudinary URL (D8)
    tech: { type: [String], default: [] },
    repoUrl: { type: String, default: undefined },
    demoUrl: { type: String, default: undefined },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    /* Phase 13: optional case-study page — /projects/<slug> renders
       caseStudy markdown (hidden entirely when either is absent). */
    slug: { type: String, unique: true, sparse: true, default: undefined },
    caseStudy: { type: String, default: undefined },
    /* Honest flag: sample/placeholder content — rendered as a subtle badge. */
    isSample: { type: Boolean, default: false },
  },
  timestamps
);
// #29: Index for sort by order in content.ts.
projectSchema.index({ order: 1 });
projectSchema.index({ updatedAt: -1 });

/* --- experience --- */

const experienceSchema = new Schema<Experience>(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    period: { type: String, default: "" },
    description: { type: String, default: "" },
    metrics: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    /* Phase 16: optional polish fields — all render only when present. */
    companyLogo: { type: String, default: undefined },
    tools: { type: [String], default: [] },
    slug: { type: String, unique: true, sparse: true, default: undefined },
    /* Honest flag: sample/placeholder entry — rendered as a subtle badge. */
    isSample: { type: Boolean, default: false },
  },
  timestamps
);
// #29: Index for sort by order in content.ts.
experienceSchema.index({ order: 1 });
experienceSchema.index({ updatedAt: -1 });

/* --- certification --- */

const certificationSchema = new Schema<Certification>(
  {
    name: { type: String, required: true },
    issuer: { type: String, default: "" },
    date: { type: String, default: "" },
    verifyUrl: { type: String, default: undefined }, // official verify link (§4.3)
    logo: { type: String, default: undefined },
    category: { type: String, default: "" },
    /* Honest flag: sample/placeholder certification. */
    isSample: { type: Boolean, default: false },
  },
  timestamps
);

/* --- post (markdown content, D9) --- */

const postSchema = new Schema<Post>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    contentMarkdown: { type: String, default: "" },
    tags: { type: [String], default: [] },
    publishedAt: { type: String, default: "" },
    /* Honest flag: sample/placeholder note. */
    isSample: { type: Boolean, default: false },
  },
  timestamps
);
// #29: Index for sort queries in content.ts and dashboard recent edits.
postSchema.index({ publishedAt: -1 });
postSchema.index({ updatedAt: -1 });

/* --- message (contact inbox, Phase 13) ---
   Written only by the public /api/contact route; read in the admin.
   Timestamps double as a received-at clock. `read` flips in the CMS
   list (bulk or per-row edit). */

const messageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  timestamps
);
// #29: Index for sort by updatedAt in dashboard recent edits.
messageSchema.index({ updatedAt: -1 });

/* --- user (single admin, D7) --- */

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // bcryptjs hash (D7)
});

/* --- Export model getters (cache-safe for dev hot-reload) --- */

export function getSiteConfigModel(): Model<SiteConfig> {
  return models.SiteConfig ?? model<SiteConfig>("SiteConfig", siteConfigSchema);
}
export function getSkillModel(): Model<Skill> {
  return models.Skill ?? model<Skill>("Skill", skillSchema);
}
export function getProjectModel(): Model<Project> {
  return models.Project ?? model<Project>("Project", projectSchema);
}
export function getExperienceModel(): Model<Experience> {
  return models.Experience ?? model<Experience>("Experience", experienceSchema);
}
export function getCertificationModel(): Model<Certification> {
  return models.Certification ?? model<Certification>("Certification", certificationSchema);
}
export function getPostModel(): Model<Post> {
  return models.Post ?? model<Post>("Post", postSchema);
}
export function getMessageModel(): Model<ContactMessage> {
  return models.Message ?? model<ContactMessage>("Message", messageSchema);
}
export interface UserDoc {
  email: string;
  passwordHash: string;
}
export function getUserModel(): Model<UserDoc> {
  return models.User ?? model<UserDoc>("User", userSchema);
}
