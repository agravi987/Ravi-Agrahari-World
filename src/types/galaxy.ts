/**
 * types/galaxy.ts — Galaxy v4 shared types (galaxy-v4-plan.md §2/§3)
 * Mirrors the galaxyPlanet / galaxyMoon / galaxySettings MongoDB
 * collections exactly so lib/content.ts can map seed → Mongo with
 * zero shape drift. The public galaxy shape (GalaxyData) is what
 * the home preview + /detailed-galaxy render — never hardcoded.
 */

/** A technical skill/domain = a planet orbiting the sun. */
export interface GalaxyPlanet {
  name: string;
  slug: string;
  description: string;
  /** Emoji or lucide key shown on the planet face (✦ ☁️ 🐳 ☸️ …). */
  icon: string;
  /** Optional Cloudinary image (unused by the flat-disc look, kept for future). */
  image?: string;
  /** Hex color — validated in the admin (color field type). */
  color: string;
  /** px — 36–96, default 56. */
  size: number;
  /** px — spacing-validated by validateGalaxyLayout (lane math, §4.2). */
  orbitRadius: number;
  /** seconds per revolution — 20–120, default 60 (locked constellation). */
  orbitSpeed: number;
  /** deg — fixed phase offset so the constellation never starts aligned. */
  orbitAngle: number;
  displayOrder: number;
  isVisible: boolean;
}

/** A learning artifact = a moon orbiting its parent planet (1:N via planetId). */
export interface GalaxyMoon {
  /** Parent planet — ObjectId string (slug in seed data). */
  planetId: string;
  name: string;
  slug: string;
  /** From the configurable settings.moonTypes list — never hardcoded. */
  type: string;
  description: string;
  icon: string;
  image?: string;
  /** Optional links — cards render a button only when the URL exists. */
  githubUrl?: string;
  liveUrl?: string;
  documentationUrl?: string;
  technologies: string[];
  /** px — 8–24, default 12 (small dots). */
  size: number;
  /** px — must stay inside the parent's lane (§4.2). */
  orbitRadius: number;
  /** seconds per revolution — default 60 (locked with the planet). */
  orbitSpeed: number;
  orbitAngle: number;
  isFeatured: boolean;
  isVisible: boolean;
  displayOrder: number;
  /** Phase 15: ISO timestamp of the last edit (from Mongo timestamps).
   *  Only set when the doc carries one (seed fallback has none) — the
   *  "mission log" renders nothing without it (zero-data rule). */
  lastUpdated?: string;
}

/** Global galaxy appearance/interaction settings (singleton doc). */
export interface GalaxySettings {
  /** Orbit paths — always rendered FAINT (never dark), toggleable. */
  showOrbitLines: boolean;
  showStars: boolean;
  starDensity: "low" | "medium" | "high";
  nebulaVisible: boolean;
  animationEnabled: boolean;
  /** Multiplier on every orbit speed, 0.5–2. */
  globalSpeedScale: number;
  hoverCardsEnabled: boolean;
  clickCardsEnabled: boolean;
  /** Configurable moon types — drives moon type select + filter chips. */
  moonTypes: string[];
  /** How many planets the home preview shows (default 6). */
  homePreviewPlanets: number;
  /** ms — hover cards must stay at least this long (default 3000, §7.2). */
  cardDismissDelay: number;
  /** T2 WebGL effect on /detailed-galaxy (default on for capable devices). */
  threeDEffect: boolean;
  /** Drag-to-rotate on the detail page (clamped), default on. */
  allowDragRotate: boolean;
}

/** The sun: profile photo + name + tagline — derived from siteConfig. */
export interface GalaxyProfile {
  name: string;
  tagline: string;
  image?: string;
}

/** A planet with its moons nested — the shape the frontend renders. */
export type GalaxyPlanetWithMoons = GalaxyPlanet & { moons: GalaxyMoon[] };

/** The complete public galaxy payload from lib/content.ts. */
export interface GalaxyData {
  profile: GalaxyProfile;
  settings: GalaxySettings;
  planets: GalaxyPlanetWithMoons[];
}

/** Defaults — merged over any partial settings doc so fields never go missing. */
export const DEFAULT_GALAXY_SETTINGS: GalaxySettings = {
  showOrbitLines: true,
  showStars: true,
  starDensity: "medium",
  nebulaVisible: true,
  animationEnabled: true,
  globalSpeedScale: 1,
  hoverCardsEnabled: true,
  clickCardsEnabled: true,
  moonTypes: ["project", "lab", "notes", "certification", "blog", "achievement"],
  homePreviewPlanets: 6,
  cardDismissDelay: 3000,
  threeDEffect: true,
  allowDragRotate: true,
};
