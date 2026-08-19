/**
 * collections.server.ts — admin CRUD model getters (plan D10)
 * Server-only: maps a collection key to its Mongoose model getter.
 * Kept separate from collections.ts (the registry) because importing
 * mongoose models into a client bundle would break the build.
 */
import type { Model } from "mongoose";
import type { GalaxyMoon, GalaxyPlanet } from "@/types/galaxy";
import {
  getCertificationModel,
  getExperienceModel,
  getGalaxyMoonModel,
  getGalaxyPlanetModel,
  getGalaxySettingsModel,
  getMessageModel,
  getPostModel,
  getProjectModel,
  getSiteConfigModel,
  getSkillModel,
} from "@/models";

/**
 * Slug validation — slugs power deep links (blog URLs, galaxy
 * #planet- anchors), so free-form CMS input must stay URL-safe.
 * Returns a user-facing error string, or null when fine (missing /
 * empty slugs are allowed — the schema default fills them in).
 */
export function slugError(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;
  if (value.length > 80) return "Slug must be 80 characters or fewer.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return "Slug must be lowercase letters, numbers and hyphens — no spaces, capitals, or leading/trailing hyphens.";
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODEL_GETTERS: Record<string, () => Model<any>> = {
  siteConfig: getSiteConfigModel,
  skill: getSkillModel,
  galaxyPlanet: getGalaxyPlanetModel,
  galaxyMoon: getGalaxyMoonModel,
  galaxySettings: getGalaxySettingsModel,
  project: getProjectModel,
  experience: getExperienceModel,
  certification: getCertificationModel,
  post: getPostModel,
  message: getMessageModel,
};

/**
 * Phase 12: the admin dashboard's "Recently edited" feed.
 * Pulls the newest docs (by updatedAt) across every content collection
 * and returns them flattened, newest first. Docs without timestamps
 * (pre-Phase 12) are skipped — the feed only shows real edit recency.
 */
export interface RecentEdit {
  collection: string;
  label: string;
  id: string;
  title: string;
  updatedAt: Date;
  href: string;
}

export async function getRecentEdits(limit = 6): Promise<RecentEdit[]> {
  const perCollection = 3;
  const out: RecentEdit[] = [];
  const order: [string, string][] = [
    ["post", "Post"],
    ["project", "Project"],
    ["experience", "Experience"],
    ["certification", "Certification"],
    ["galaxyPlanet", "Planet"],
    ["galaxyMoon", "Moon"],
    ["skill", "Skill"],
    ["siteConfig", "Site config"],
  ];
  for (const [key, label] of order) {
    try {
      const docs = (await MODEL_GETTERS[key]()
        .find()
        .sort({ updatedAt: -1 })
        .limit(perCollection)
        .lean()) as unknown as Record<string, unknown>[];
      for (const d of docs) {
        const updated = d.updatedAt;
        // Only real dates count (lean() returns native Date objects).
        if (!(updated instanceof Date) || Number.isNaN(updated.getTime())) continue;
        out.push({
          collection: key,
          label,
          id: String(d._id ?? ""),
          title: String(d.title ?? d.name ?? d.company ?? key),
          updatedAt: updated,
          href: key === "siteConfig" ? "/admin/siteConfig" : `/admin/${key}/${d._id}`,
        });
      }
    } catch {
      // A single broken collection shouldn't kill the dashboard.
    }
  }
  return out
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

/** Compact "3m ago" string (dashboard-only — server computed). */
export function timeAgo(date: Date): string {
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Galaxy v4 zero-overlap guard (plan §4). Called by the admin routes
 * before any planet/moon write: re-validates the whole layout with
 * the incoming change applied and returns a plain-English error (or
 * null when the layout stays overlap-free). Requires the DB.
 */
export async function assertGalaxyLayoutValid(
  collection: string,
  data: Record<string, unknown>,
  id?: string
): Promise<string | null> {
  if (collection !== "galaxyPlanet" && collection !== "galaxyMoon") return null;  const [planetsRaw, moonsRaw] = await Promise.all([
    getGalaxyPlanetModel().find().lean(),
    getGalaxyMoonModel().find().lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strip = (doc: any) => {
    // _id/__v/timestamps are Mongoose internals we intentionally drop.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, createdAt, updatedAt, ...rest } = doc as Record<string, unknown>;
    return { _id: String(_id), ...rest };
  };

  const planets = (planetsRaw as unknown as Record<string, unknown>[]).map(
    strip
  ) as unknown as Partial<GalaxyPlanet>[];
  const moons = (moonsRaw as unknown as Record<string, unknown>[]).map(
    strip
  ) as unknown as Partial<GalaxyMoon>[];

  const { validateGalaxyLayout } = await import("./galaxyLayout");

  if (collection === "galaxyPlanet") {
    const others = planets.filter((p) => (id ? (p as { _id?: string })._id !== id : true));
    // Merge over the EXISTING doc — the admin PUT may carry a partial
    // payload (e.g. a reorder swap with only { displayOrder }), and
    // validating a bare field would reject every partial write.
    const existing = id ? planets.find((p) => (p as { _id?: string })._id === id) : undefined;
    others.push({ ...(existing ?? {}), ...data } as Partial<GalaxyPlanet>);
    const res = validateGalaxyLayout(others, moons);
    return res.ok ? null : res.errors[0] ?? "Invalid galaxy layout";
  }

  const otherMoons = moons.filter((m) => (id ? (m as { _id?: string })._id !== id : true));
  const existingMoon = id ? moons.find((m) => (m as { _id?: string })._id === id) : undefined;
  otherMoons.push({ ...(existingMoon ?? {}), ...data } as Partial<GalaxyMoon>);
  const res = validateGalaxyLayout(planets, otherMoons);
  return res.ok ? null : res.errors[0] ?? "Invalid galaxy layout";
}
