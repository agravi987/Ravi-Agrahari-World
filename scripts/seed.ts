/**
 * scripts/seed.ts — plan S11e
 * Idempotent: safe to run repeatedly (upserts by stable keys).
 * 1. Populates all collections from src/lib/seed.ts
 * 2. Creates the single admin user from ADMIN_EMAIL/ADMIN_PASSWORD
 *    (bcrypt-hashed — plan D7). Requires MONGODB_URI.
 *
 * Run: npm run seed
 */
import "dotenv/config";

// dotenv loads .env by default; we use Next.js' .env.local convention.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { seedContent, seedGalaxy } from "../src/lib/seed";
import {
  getCertificationModel,
  getExperienceModel,
  getGalaxyMoonModel,
  getGalaxyPlanetModel,
  getGalaxySettingsModel,
  getPostModel,
  getProjectModel,
  getSiteConfigModel,
  getSkillModel,
  getUserModel,
} from "../src/models";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Add it to .env.local and retry.");
  process.exit(1);
}
// Narrowed copy so TS knows it's a string past the guard (process.exit
// doesn't narrow since its return type is never).
const uri: string = MONGODB_URI;

async function main() {
  await mongoose.connect(uri);

  // Upsert siteConfig as a SINGLETON (empty filter). The admin reads it
  // with findOne() — re-keying on `github` created a duplicate singleton
  // the moment the handle was edited in the CMS, and re-seeding then
  // stacked a second doc. Empty filter + upsert = one doc, always.
  const SiteConfig = getSiteConfigModel();
  await SiteConfig.updateOne(
    {},
    { $set: seedContent.config },
    { upsert: true }
  );

  // Skills: replace-all keeps honest levels in sync with seed edits.
  const Skill = getSkillModel();
  await Skill.deleteMany({});
  await Skill.insertMany(seedContent.skills);

  // Galaxy v4 — planets + moons + settings (replaces learningTrack).
  // Planets upsert by slug; moons upsert by (planet slug placeholder + name)
  // using the seed's slug-as-planetId convention, then re-parented to the
  // real planet ObjectIds so the 1:N relationship is intact.
  const GalaxyPlanet = getGalaxyPlanetModel();
  const GalaxyMoon = getGalaxyMoonModel();
  const GalaxySettings = getGalaxySettingsModel();

  for (const planet of seedGalaxy.planets) {
    const { moons, ...planetFields } = planet;
    const planetDoc = await GalaxyPlanet.findOneAndUpdate(
      { slug: planetFields.slug },
      { $set: planetFields },
      { upsert: true, returnDocument: "after" }
    );
    for (const moon of moons) {
      // The seed uses the planet slug as a placeholder planetId.
      await GalaxyMoon.updateOne(
        { slug: moon.slug },
        { $set: { ...moon, planetId: planetDoc._id } },
        { upsert: true }
      );
    }
  }

  // Settings singleton (merge over defaults so nothing goes missing).
  await GalaxySettings.updateOne(
    {},
    { $set: seedGalaxy.settings },
    { upsert: true }
  );

  // Projects: upsert by title.
  const Project = getProjectModel();
  await Promise.all(
    seedContent.projects.map((p) =>
      Project.updateOne({ title: p.title }, { $set: p }, { upsert: true })
    )
  );

  // Experience: upsert by company+role.
  const Experience = getExperienceModel();
  await Promise.all(
    seedContent.experience.map((e) =>
      Experience.updateOne({ company: e.company, role: e.role }, { $set: e }, { upsert: true })
    )
  );

  // Certifications: upsert by name.
  const Certification = getCertificationModel();
  await Promise.all(
    seedContent.certifications.map((c) =>
      Certification.updateOne({ name: c.name }, { $set: c }, { upsert: true })
    )
  );

  // Posts: upsert by slug.
  const Post = getPostModel();
  await Promise.all(
    seedContent.posts.map((p) =>
      Post.updateOne({ slug: p.slug }, { $set: p }, { upsert: true })
    )
  );

  // Admin user (D7): created from env, bcrypt-hashed, idempotent.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const User = getUserModel();
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.updateOne(
      { email: adminEmail },
      { $set: { email: adminEmail, passwordHash } },
      { upsert: true }
    );
    console.log(`✓ admin user ready: ${adminEmail}`);
  } else {
    console.warn("⚠ ADMIN_EMAIL/ADMIN_PASSWORD not set — admin login unavailable until seeded.");
  }

  console.log("✓ seed complete");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
