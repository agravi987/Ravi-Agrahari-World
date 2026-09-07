/**
 * collections.server.ts — admin CRUD model getters (plan D10)
 * Server-only: maps a collection key to its Mongoose model getter.
 * Kept separate from collections.ts (the registry) because importing
 * mongoose models into a client bundle would break the build.
 */
import type { Model } from "mongoose";
import type { GalaxyMoon, GalaxyPlanet } from "@/types/galaxy";
import { getCollection } from "@/lib/collections";
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

/** #13: Validate JSON-type fields (e.g. socialLinks must be an array of {label, url}). */
export function jsonFieldError(
  key: string,
  value: unknown,
  collection: string
): string | null {
  if (value === null || value === undefined) return null;
  if (key === "socialLinks" && collection === "siteConfig") {
    if (!Array.isArray(value)) return `"Social links" must be a JSON array.`;
    for (const [i, item] of value.entries()) {
      if (typeof item !== "object" || item === null) {
        return `"Social links" item ${i + 1} must be an object.`;
      }
      if (typeof (item as Record<string, unknown>).label !== "string" || !(item as Record<string, unknown>).label) {
        return `"Social links" item ${i + 1} is missing a "label" string.`;
      }
      if (typeof (item as Record<string, unknown>).url !== "string" || !(item as Record<string, unknown>).url) {
        return `"Social links" item ${i + 1} is missing a "url" string.`;
      }
    }
  }
  return null;
}

/** #14: Validate URL fields must start with https:// (or be empty). */
export function urlFieldError(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const urlKeys = ["repoUrl", "demoUrl", "verifyUrl", "githubUrl", "liveUrl", "documentationUrl"];
  if (urlKeys.includes(key) && value !== "" && !/^https?:\/\//.test(value)) {
    return `"${key}" must start with http:// or https://.`;
  }
  return null;
}

/** #13 + #14: Validate all fields in a data payload. Returns first error or null. */
export function validateData(
  data: Record<string, unknown>,
  spec: ReturnType<typeof getCollection>,
  collection: string
): string | null {
  if (!spec) return null;
  for (const f of spec.fields) {
    const val = data[f.key];
    const jsonErr = jsonFieldError(f.key, val, collection);
    if (jsonErr) return jsonErr;
    const urlErr = urlFieldError(f.key, val);
    if (urlErr) return urlErr;
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
  // All collections in parallel — the sequential loop stacked 8 round
  // trips on every dashboard render before the page could paint.
  const settled = await Promise.all(
    order.map(async ([key, label]) => {
      try {
        const docs = (await MODEL_GETTERS[key]()
          .find()
          .sort({ updatedAt: -1 })
          .limit(perCollection)
          .lean()) as unknown as Record<string, unknown>[];
        return docs.flatMap((d) => {
          const updated = d.updatedAt;
          // Only real dates count (lean() returns native Date objects).
          if (!(updated instanceof Date) || Number.isNaN(updated.getTime())) return [];
          return [
            {
              collection: key,
              label,
              id: String(d._id ?? ""),
              title: String(d.title ?? d.name ?? d.company ?? key),
              updatedAt: updated,
              href: key === "siteConfig" ? "/admin/siteConfig" : `/admin/${key}/${d._id}`,
            } satisfies RecentEdit,
          ];
        });
      } catch {
        // A single broken collection shouldn't kill the dashboard.
        return [] as RecentEdit[];
      }
    })
  );
  out.push(...settled.flat());
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

/**
 * Galaxy v4 CREATE guard. `assertGalaxyLayoutValid` can't be used for
 * creates: the incoming orbit fields are auto-computed (stripped from the
 * form registry), so pre-write validation would check placeholder values
 * that are never stored. Instead this SIMULATES the exact state the
 * rebalance will write — new planet laid out among the rest, or the new
 * moon's planet ring re-arranged — and validates THAT. Runs pre-write, so
 * a layout that can't stay overlap-free is rejected before anything lands.
 */
export async function assertGalaxyCreateValid(
  collection: string,
  data: Record<string, unknown>
): Promise<string | null> {
  if (collection !== "galaxyPlanet" && collection !== "galaxyMoon") return null;

  const [planetsRaw, moonsRaw] = await Promise.all([
    getGalaxyPlanetModel().find().lean(),
    getGalaxyMoonModel().find().lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strip = (doc: any) => {
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

  const { autoLayoutMoons, autoLayoutPlanets, validateGalaxyLayout } = await import("./galaxyLayout");

  if (collection === "galaxyPlanet") {
    const candidate = [...planets, data as Partial<GalaxyPlanet>];
    const layout = autoLayoutPlanets(candidate, moons);
    const bySlug = new Map(layout.map((l) => [l.slug, l]));
    const arranged = candidate.map((p) => ({
      ...p,
      orbitRadius: bySlug.get(String(p.slug))?.orbitRadius,
      orbitAngle: bySlug.get(String(p.slug))?.orbitAngle,
      orbitSpeed: bySlug.get(String(p.slug))?.orbitSpeed,
    }));
    const res = validateGalaxyLayout(arranged, moons);
    return res.ok ? null : res.errors[0] ?? "Invalid galaxy layout";
  }

  // galaxyMoon create — re-arrange only the parent planet's ring (the real
  // route calls rebalanceGalaxyMoons, not rebalanceGalaxyPlanets).
  const planetId = String(data.planetId ?? "");
  if (!planetId) return null;
  const parentPlanet = planets.find((p) => (p as { _id?: string })._id === planetId);
  const candidateMoons = moons.filter(
    (m) => typeof m.planetId === "string" && m.planetId === planetId
  );
  candidateMoons.push(data as Partial<GalaxyMoon>);
  const ring = autoLayoutMoons(parentPlanet?.size ?? 48, candidateMoons);
  const bySlug = new Map(ring.map((r) => [r.slug, r]));
  const arranged = moons.map((m) =>
    typeof m.planetId === "string" && m.planetId === planetId
      ? { ...m, orbitRadius: bySlug.get(String(m.slug))?.orbitRadius, orbitAngle: bySlug.get(String(m.slug))?.orbitAngle }
      : m
  );
  const res = validateGalaxyLayout(planets, arranged);
  return res.ok ? null : res.errors[0] ?? "Invalid galaxy layout";
}
