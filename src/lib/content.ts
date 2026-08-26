/**
 * content.ts — THE content boundary (plan D6, agents.md)
 * Every component reads content through this file — nothing is
 * hardcoded in components.
 *
 * Two backends, same shape:
 *  - MONGODB_URI present → read from MongoDB (S11+)
 *  - absent → return seed data (fresh clones / no-DB builds)
 * Components cannot tell which one ran (D6 drop-in swap).
 *
 * getGalaxy() (Galaxy v4) assembles the public galaxy: settings
 * merged over defaults, visible planets + their visible moons
 * nested, profile derived from siteConfig (sun = your photo).
 *
 * PERF: React.cache() wraps the public exports so a single request
 * (layout + generateMetadata + page) does ONE Mongo round-trip for
 * content + ONE for galaxy instead of 4+ serialized queries.
 */
import { cache } from "react";
import type {
  Certification,
  Experience,
  Post,
  Project,
  SiteContent,
  Skill,
} from "@/types";
import type { GalaxyData, GalaxyMoon, GalaxyPlanet, GalaxySettings } from "@/types/galaxy";
import { DEFAULT_GALAXY_SETTINGS } from "@/types/galaxy";
import { connectDb, dbConfigured } from "./db";
import { seedContent, seedGalaxy } from "./seed";

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
    getProjectModel,
    getExperienceModel,
    getCertificationModel,
    getPostModel,
  } = await import("@/models");

  const [configRaw, skillsRaw, projectsRaw, experienceRaw, certificationsRaw, postsRaw] =
    await Promise.all([
      getSiteConfigModel().findOne().lean(),
      getSkillModel().find().sort({ level: -1 }).lean(),
      getProjectModel().find().sort({ order: 1 }).lean(),
      getExperienceModel().find().sort({ order: 1 }).lean(),
      getCertificationModel().find().lean(),
      getPostModel().find().sort({ publishedAt: -1 }).lean(),
    ]);

  // Strip _id/__v so every prop is a plain object (client-safe).
  const config = stripMongo(configRaw) as SiteContent["config"] | null;
  const skills = stripMongo(skillsRaw) as Skill[] | null;
  const projects = stripMongo(projectsRaw) as Project[] | null;
  const experience = stripMongo(experienceRaw) as Experience[] | null;
  const certifications = stripMongo(certificationsRaw) as Certification[] | null;
  const posts = stripMongo(postsRaw) as Post[] | null;
  // Phase 17: expose Mongo updatedAt as an ISO string on each post (the
  // model has timestamps; the seed fallback has none → hides, zero-data).
  posts?.forEach((p) => {
    const u = (p as Post & { updatedAt?: unknown }).updatedAt as
      | Date
      | string
      | undefined;
    const d = u instanceof Date ? u : u ? new Date(u) : null;
    if (d && !Number.isNaN(d.getTime())) {
      (p as Post).updatedAt = d.toISOString();
    } else {
      delete (p as Partial<Post>).updatedAt;
    }
  });

  // No config in DB yet → treat as unseeded; fall back to seed so the
  // site never renders blank before `npm run seed` (plan D1).
  if (!config) return seedContent;

  // Normalize sectionsEnabled: a config saved before a section key
  // existed (or a partial save) must not silently hide that section —
  // missing keys default to SHOWN; only an explicit false hides.
  const saved = (config.sectionsEnabled ?? {}) as Partial<SiteContent["config"]["sectionsEnabled"]>;
  const withSections: SiteContent["config"] = {
    ...config,
    sectionsEnabled: {
      hero: saved.hero ?? true,
      skills: saved.skills ?? true,
      galaxy: saved.galaxy ?? true,
      projects: saved.projects ?? true,
      experience: saved.experience ?? true,
      certifications: saved.certifications ?? true,
      blog: saved.blog ?? true,
      contact: saved.contact ?? true,
    },
  };

  return {
    config: pick(withSections)!,
    skills: pick(skills) ?? [],
    projects: pick(projects) ?? [],
    experience: pick(experience) ?? [],
    certifications: pick(certifications) ?? [],
    posts: pick(posts) ?? [],
  };
}

/**
 * Returns all site content. Seed fallback when MongoDB isn't
 * configured — zero component changes needed for either source.
 *
 * PERF: cached per-request so layout + generateMetadata + page share
 * a single DB round-trip.
 */
export const getContent = cache(async function getContent(): Promise<SiteContent> {
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
});

/* ------------------------------------------------------------------
   Galaxy v4 — getGalaxy()
   ------------------------------------------------------------------ */

/** Stringifies an ObjectId planetId so moons are client-safe. */
function asString(v: unknown): string {
  return typeof v === "string" ? v : v != null ? String(v) : "";
}

/** Phase 15: moon updatedAt → ISO string (mission log). Returns
 *  undefined when the doc has none (e.g. seed fallback). */
function updatedAtIso(doc: unknown): string | undefined {
  const u = (doc as Record<string, unknown> | null | undefined)?.updatedAt;
  if (u instanceof Date && !Number.isNaN(u.getTime())) return u.toISOString();
  if (typeof u === "string") return u;
  return undefined;
}

async function fetchGalaxyFromMongo(config: SiteContent["config"]): Promise<GalaxyData> {
  // Await the connection like fetchFromMongo does — with bufferCommands:false
  // the model calls below reject instantly when Mongo is unreachable, so the
  // galaxy falls back to seed in ~4s instead of buffering 10s per query.
  const mongoose = await connectDb();
  if (!mongoose) throw new Error("mongodb unavailable");

  const { getGalaxyPlanetModel, getGalaxyMoonModel, getGalaxySettingsModel } =
    await import("@/models");

  const [settingsRaw, planetsRaw, moonsRaw] = await Promise.all([
    getGalaxySettingsModel().findOne().lean(),
    getGalaxyPlanetModel().find().sort({ displayOrder: 1 }).lean(),
    getGalaxyMoonModel().find().sort({ displayOrder: 1 }).lean(),
  ]);

  // Merge DB settings over defaults so every field is always present.
  const settingsDoc = stripMongo(settingsRaw) as Partial<GalaxySettings> | null;
  const settings: GalaxySettings = { ...DEFAULT_GALAXY_SETTINGS, ...(settingsDoc ?? {}) };

  // Build an _id → stripped-planet map BEFORE stripping so moons can
  // be nested by their ObjectId planetId reference (1:N relationship).
  const planetById = new Map<string, GalaxyPlanet>();
  for (const raw of (planetsRaw as unknown as Array<Record<string, unknown>>) ?? []) {
    const id = asString(raw._id);
    planetById.set(id, stripMongo(raw) as GalaxyPlanet);
  }

  const moons = (stripMongo(moonsRaw) as GalaxyMoon[] | null) ?? [];
  const moonsByPlanet = new Map<string, GalaxyMoon[]>();
  for (const moon of moons) {
    if (!moon.isVisible) continue;
    const pid = asString(moon.planetId);
    const list = moonsByPlanet.get(pid) ?? [];
    list.push({ ...moon, planetId: pid, lastUpdated: updatedAtIso(moon) });
    moonsByPlanet.set(pid, list);
  }

  // planetById keys are the raw ObjectId strings — exactly what
  // moons reference in planetId. Iterate entries to keep the id.
  const planets = [...planetById.entries()]
    .filter(([, p]) => p.isVisible)
    .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
    .map(([id, p]) => ({ ...p, moons: moonsByPlanet.get(id) ?? [] }));

  return {
    profile: {
      name: config.name,
      tagline: config.headline,
      image: config.profileImage,
    },
    settings,
    planets,
  };
}

/**
 * The public Learning Galaxy (v4). Seed fallback when MongoDB isn't
 * configured. Only visible content is returned; empty planets list
 * auto-hides the section on the site (zero-data policy).
 *
 * PERF: cached per-request; internally calls cached getContent().
 */
export const getGalaxy = cache(async function getGalaxy(): Promise<GalaxyData> {
  const config = (await getContent()).config;
  if (dbConfigured()) {
    try {
      return await fetchGalaxyFromMongo(config);
    } catch (err) {
      console.warn("[content] Galaxy Mongo read failed, falling back to seed:", err);
    }
  }
  return {
    profile: { name: config.name, tagline: config.headline, image: config.profileImage },
    settings: seedGalaxy.settings,
    planets: seedGalaxy.planets,
  };
});
