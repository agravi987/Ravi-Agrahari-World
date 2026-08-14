/**
 * models/index.ts — Mongoose schemas (plan S11c, §3.1)
 * Each schema mirrors the seed types in types/index.ts EXACTLY
 * (D6) so lib/content.ts can map Mongo docs → SiteContent with
 * zero shape drift. Only `user` is Mongo-specific (auth, D7).
 */
import { Schema, model, models, type Model } from "mongoose";
import type {
  Certification,
  Experience,
  LearningItem,
  LearningTrack,
  Post,
  Project,
  SectionsEnabled,
  SiteConfig,
  Skill,
} from "@/types";

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

const siteConfigSchema = new Schema<SiteConfig>({
  name: { type: String, required: true },
  headline: { type: String, required: true },
  roles: { type: [String], default: [] },
  currentlyLearning: { type: String, default: "" },
  streak: { type: Number, default: 0 }, // shown only when ≥ 2 (§5.3)
  email: { type: String, required: true },
  github: { type: String, required: true },
  socialLinks: { type: [socialLinkSchema], default: [] },
  sectionsEnabled: { type: sectionsEnabledSchema, default: () => ({}) },
  weeklyNotes: { type: [String], default: [] }, // mission log (plan §4.2)
});

/* --- skills --- */

const skillSchema = new Schema<Skill>({
  name: { type: String, required: true },
  icon: { type: String, default: "cloud" },
  level: { type: Number, min: 1, max: 5, required: true }, // honest 1–5
  blurb: { type: String, default: "" },
});

/* --- learningTrack (planets + moons, plan §3.1) --- */

const learningItemSchema = new Schema<LearningItem>(
  {
    type: {
      type: String,
      enum: ["notes", "hands-on", "project"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    githubUrl: { type: String, required: true },
    tags: { type: [String], default: [] },
    updatedAt: { type: String, default: "" }, // ISO date, drives planet glow (D3)
  },
  { _id: false }
);

const learningTrackSchema = new Schema<LearningTrack>({
  name: { type: String, required: true },
  icon: { type: String, default: "✦" },
  color: { type: String, default: "topic-cloud" },
  level: {
    type: String,
    enum: ["beginner", "learning", "growing"],
    default: "beginner",
  },
  description: { type: String, default: "" },
  order: { type: Number, default: 0 },
  items: { type: [learningItemSchema], default: [] },
});

/* --- project --- */

const projectSchema = new Schema<Project>({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  coverImage: { type: String, default: undefined }, // Cloudinary URL (D8)
  tech: { type: [String], default: [] },
  repoUrl: { type: String, default: undefined },
  demoUrl: { type: String, default: undefined },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

/* --- experience --- */

const experienceSchema = new Schema<Experience>({
  company: { type: String, required: true },
  role: { type: String, required: true },
  period: { type: String, default: "" },
  description: { type: String, default: "" },
  metrics: { type: [String], default: [] },
  order: { type: Number, default: 0 },
});

/* --- certification --- */

const certificationSchema = new Schema<Certification>({
  name: { type: String, required: true },
  issuer: { type: String, default: "" },
  date: { type: String, default: "" },
  verifyUrl: { type: String, default: undefined }, // official verify link (§4.3)
  logo: { type: String, default: undefined },
  category: { type: String, default: "" },
});

/* --- post (markdown content, D9) --- */

const postSchema = new Schema<Post>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, default: "" },
  contentMarkdown: { type: String, default: "" },
  tags: { type: [String], default: [] },
  publishedAt: { type: String, default: "" },
});

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
export function getLearningTrackModel(): Model<LearningTrack> {
  return models.LearningTrack ?? model<LearningTrack>("LearningTrack", learningTrackSchema);
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
export interface UserDoc {
  email: string;
  passwordHash: string;
}
export function getUserModel(): Model<UserDoc> {
  return models.User ?? model<UserDoc>("User", userSchema);
}
