/**
 * content.ts — THE content boundary (plan D6, agents.md)
 * Every component reads content through this file — nothing is
 * hardcoded in components.
 *
 * Two backends, same shape:
 *  - MONGODB_URI present → read from MongoDB (S11+)
 *  - absent → return seed data (fresh clones / no-DB builds)
 * Components cannot tell which one ran (D6 drop-in swap).
 */
import type {
  Certification,
  Experience,
  LearningTrack,
  Post,
  Project,
  SiteContent,
  Skill,
} from "@/types";
import { connectDb, dbConfigured } from "./db";
import { seedContent } from "./seed";

/** Maps a Mongo doc to our SiteContent types (docs use _id, we don't expose it). */
function pick<T>(doc: T | null | undefined): T | null {
  return doc ?? null;
}

/**
 * Strips Mongoose internals (_id, __v) from lean docs.
 * REQUIRED before passing data to client components: the ObjectId
 * instance has a toJSON method, and React throws on such props.
 * Nested subdocs use _id:false in the schemas, so no recursion needed.
 */
function stripMongo<T>(docs: T[] | T | null | undefined): T[] | T | null | undefined {
  if (docs == null) return docs;
  const arr = Array.isArray(docs) ? docs : [docs];
  const cleaned = arr.map((doc) => {
    // _id/__v are Mongoose internals we intentionally drop (client-safe).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, ...rest } = doc as Record<string, unknown>;
    return rest as T;
  });
  return Array.isArray(docs) ? cleaned : cleaned[0];
}

/**
 * Loads all site content from MongoDB.
 * Called only when dbConfigured() — the seed fallback lives in
 * getContent() so builds without MONGODB_URI still work (D1/D6).
 */
async function fetchFromMongo(): Promise<SiteContent> {
  const mongoose = await connectDb();
  if (!mongoose) return seedContent; // unreachable when dbConfigured, but safe

  const {
    getSiteConfigModel,
    getSkillModel,
    getLearningTrackModel,
    getProjectModel,
    getExperienceModel,
    getCertificationModel,
    getPostModel,
  } = await import("@/models");

  const [configRaw, skillsRaw, learningTracksRaw, projectsRaw, experienceRaw, certificationsRaw, postsRaw] =
    await Promise.all([
      getSiteConfigModel().findOne().lean(),
      getSkillModel().find().sort({ level: -1 }).lean(),
      getLearningTrackModel().find().sort({ order: 1 }).lean(),
      getProjectModel().find().sort({ order: 1 }).lean(),
      getExperienceModel().find().sort({ order: 1 }).lean(),
      getCertificationModel().find().lean(),
      getPostModel().find().sort({ publishedAt: -1 }).lean(),
    ]);

  // Strip _id/__v so every prop is a plain object (client-safe).
  const config = stripMongo(configRaw) as SiteContent["config"] | null;
  const skills = stripMongo(skillsRaw) as Skill[] | null;
  const learningTracks = stripMongo(learningTracksRaw) as LearningTrack[] | null;
  const projects = stripMongo(projectsRaw) as Project[] | null;
  const experience = stripMongo(experienceRaw) as Experience[] | null;
  const certifications = stripMongo(certificationsRaw) as Certification[] | null;
  const posts = stripMongo(postsRaw) as Post[] | null;

  // No config in DB yet → treat as unseeded; fall back to seed so the
  // site never renders blank before `npm run seed` (plan D1).
  if (!config) return seedContent;

  return {
    config: pick(config)!,
    skills: pick(skills) ?? [],
    learningTracks: pick(learningTracks) ?? [],
    projects: pick(projects) ?? [],
    experience: pick(experience) ?? [],
    certifications: pick(certifications) ?? [],
    posts: pick(posts) ?? [],
  };
}

/**
 * Returns all site content. Seed fallback when MongoDB isn't
 * configured — zero component changes needed for either source.
 */
export async function getContent(): Promise<SiteContent> {
  if (dbConfigured()) {
    try {
      return await fetchFromMongo();
    } catch (err) {
      // DB unreachable (e.g. Docker stopped) → serve seed, don't crash.
      console.warn("[content] Mongo read failed, falling back to seed:", err);
      return seedContent;
    }
  }
  return seedContent;
}
