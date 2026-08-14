/**
 * collections.server.ts — admin CRUD model getters (plan D10)
 * Server-only: maps a collection key to its Mongoose model getter.
 * Kept separate from collections.ts (the registry) because importing
 * mongoose models into a client bundle would break the build.
 */
import type { Model } from "mongoose";
import {
  getCertificationModel,
  getExperienceModel,
  getLearningTrackModel,
  getPostModel,
  getProjectModel,
  getSiteConfigModel,
  getSkillModel,
} from "@/models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODEL_GETTERS: Record<string, () => Model<any>> = {
  siteConfig: getSiteConfigModel,
  skill: getSkillModel,
  learningTrack: getLearningTrackModel,
  project: getProjectModel,
  experience: getExperienceModel,
  certification: getCertificationModel,
  post: getPostModel,
};
