/**
 * models/galaxy.ts — Galaxy v4 Mongoose schemas (galaxy-v4-plan.md §2)
 * galaxyPlanet (skills) ──1:N──► galaxyMoon (artifacts) via planetId,
 * plus a galaxySettings singleton. Mirrors types/galaxy.ts exactly
 * so lib/content.ts assembles GalaxyData with zero shape drift.
 */
import { Schema, model, models, type Model } from "mongoose";
import type { GalaxyMoon, GalaxyPlanet, GalaxySettings } from "@/types/galaxy";

const galaxyPlanetSchema = new Schema<GalaxyPlanet>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "✦" },
    image: { type: String },
    color: { type: String, default: "#4f46e5" },
    size: { type: Number, default: 56, min: 36, max: 96 },
    orbitRadius: { type: Number, default: 150 },
    orbitSpeed: { type: Number, default: 60, min: 20, max: 120 },
    orbitAngle: { type: Number, default: 0 },
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);
// #29: Indexes for sort by displayOrder (content.ts) and updatedAt (dashboard).
galaxyPlanetSchema.index({ displayOrder: 1 });
galaxyPlanetSchema.index({ updatedAt: -1 });

const galaxyMoonSchema = new Schema<GalaxyMoon>(
  {
    planetId: {
      // Shared type declares planetId as string (client-safe); Mongo stores
      // an ObjectId ref. The double cast satisfies both Mongoose's runtime
      // ObjectId handling and the TS string type in GalaxyMoon.
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: "GalaxyPlanet",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "✦" },
    image: { type: String },
    githubUrl: { type: String },
    liveUrl: { type: String },
    documentationUrl: { type: String },
    technologies: { type: [String], default: [] },
    size: { type: Number, default: 12, min: 8, max: 24 },
    orbitRadius: { type: Number, default: 18 },
    orbitSpeed: { type: Number, default: 60, min: 20, max: 120 },
    orbitAngle: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
// #29: Indexes for sort by displayOrder (content.ts) and updatedAt (dashboard).
galaxyMoonSchema.index({ displayOrder: 1 });
galaxyMoonSchema.index({ updatedAt: -1 });

const galaxySettingsSchema = new Schema<GalaxySettings>(
  {
    showOrbitLines: { type: Boolean, default: true },
    showStars: { type: Boolean, default: true },
    starDensity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    nebulaVisible: { type: Boolean, default: true },
    animationEnabled: { type: Boolean, default: true },
    globalSpeedScale: { type: Number, default: 1, min: 0.5, max: 2 },
    hoverCardsEnabled: { type: Boolean, default: true },
    clickCardsEnabled: { type: Boolean, default: true },
    moonTypes: {
      type: [String],
      default: ["project", "lab", "notes", "certification", "blog", "achievement"],
    },
    homePreviewPlanets: { type: Number, default: 6 },
    cardDismissDelay: { type: Number, default: 3000 },
    threeDEffect: { type: Boolean, default: true },
    allowDragRotate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* --- Export model getters (cache-safe for dev hot-reload) --- */

export function getGalaxyPlanetModel(): Model<GalaxyPlanet> {
  return models.GalaxyPlanet ?? model<GalaxyPlanet>("GalaxyPlanet", galaxyPlanetSchema);
}
export function getGalaxyMoonModel(): Model<GalaxyMoon> {
  return models.GalaxyMoon ?? model<GalaxyMoon>("GalaxyMoon", galaxyMoonSchema);
}
export function getGalaxySettingsModel(): Model<GalaxySettings> {
  return models.GalaxySettings ?? model<GalaxySettings>("GalaxySettings", galaxySettingsSchema);
}
