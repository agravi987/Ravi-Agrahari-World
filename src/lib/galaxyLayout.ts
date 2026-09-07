/**
 * galaxyLayout.ts — Galaxy v4 zero-overlap validator + auto-arrange (plan §4)
 * The validator + layout fns (validateGalaxyLayout, autoLayoutPlanets,
 * autoLayoutMoons) are PURE — no DB, no server imports — usable from
 * admin forms and API routes alike. The rebalanceGalaxy* wrappers below
 * are the only DB-touching parts (dynamic imports, server-only).
 *
 * The guarantee: with a LOCKED constellation (all planets share one
 * orbit speed, fixed phases), relative positions never change, so we
 * validate the ACTUAL distances at each planet's fixed orbitAngle
 * (chord distance). If an admin sets DIFFERENT speeds, planets can
 * drift into alignment over time, so the stricter worst-case rule
 * (full radial lane clearance) is enforced instead.
 */
import type { GalaxyMoon, GalaxyPlanet } from "@/types/galaxy";

export interface GalaxyLayoutResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export const GALAXY_CONSTRAINTS = {
  /** Sun (profile avatar) radius, px. */
  sunRadius: 44,
  /** Extra clearance between bodies, px. */
  gap: 10,
  /** Sanity cap on how far a moon may sweep around its planet, px. */
  moonSweepMax: 60,
  /** Hard cap on moons per planet (keeps lanes small + view clean). */
  moonMaxCount: 8,
  planetMinSize: 36,
  planetMaxSize: 96,
  moonMinSize: 8,
  moonMaxSize: 24,
  orbitRadiusMin: 100,
  orbitRadiusMax: 2000,
  orbitSpeedMin: 20,
  orbitSpeedMax: 120,
  /**
   * Compact auto-arrange band (px). Kept well under the validation max
   * (orbitRadiusMax) so the whole system fits the ~720px stage without
   * far-flung planets. A freshly added planet lands inside THIS band,
   * never out at the rim.
   */
  autoRadiusMax: 480,
  /** Smallest radial gap between neighbouring planets during auto-arrange, px. */
  autoMinStep: 12,
} as const;

const num = (v: unknown, d: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : d;

const nameOf = (p: Partial<GalaxyPlanet>): string => p.name ?? p.slug ?? "planet";

/** How far a planet + its moons sweep outward from the sun's center. */
export function planetSweep(p: Partial<GalaxyPlanet>): number {
  return num(p.size, 56) / 2;
}

/** Total outward reach of a planet INCLUDING its moon sweep (px). */
export function planetLane(p: Partial<GalaxyPlanet>, maxMoonSweep: number): number {
  return num(p.size, 56) / 2 + maxMoonSweep + GALAXY_CONSTRAINTS.gap;
}

/** Chord distance between two planets at their fixed orbit angles. */
function chord(r1: number, a1: number, r2: number, a2: number): number {
  let d = Math.abs(((a2 - a1) % 360) + 360) % 360;
  d = Math.min(d, 360 - d);
  const rad = (d * Math.PI) / 180;
  return Math.sqrt(r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(rad));
}

const isValidHttpUrl = (u: unknown): boolean =>
  typeof u === "string" && /^https?:\/\/\S+$/i.test(u);

/**
 * Validates a full galaxy layout. `planets` and `moons` are the
 * complete sets (including the doc being saved). Returns human-
 * readable errors that the admin form can surface directly.
 */
export function validateGalaxyLayout(
  planets: Partial<GalaxyPlanet>[],
  moons: Partial<GalaxyMoon>[]
): GalaxyLayoutResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Per-planet bounds ---
  for (const p of planets) {
    const n = nameOf(p);
    const size = num(p.size, 56);
    if (size < GALAXY_CONSTRAINTS.planetMinSize || size > GALAXY_CONSTRAINTS.planetMaxSize) {
      errors.push(`"${n}": planet size must be 36–96px (got ${size}px).`);
    }
    const r = num(p.orbitRadius, 0);
    if (r < GALAXY_CONSTRAINTS.orbitRadiusMin || r > GALAXY_CONSTRAINTS.orbitRadiusMax) {
      errors.push(`"${n}": orbit radius must be 100–2000px (got ${r}px).`);
    }
    const s = num(p.orbitSpeed, 60);
    if (s < GALAXY_CONSTRAINTS.orbitSpeedMin || s > GALAXY_CONSTRAINTS.orbitSpeedMax) {
      errors.push(`"${n}": orbit speed must be 20–120s per revolution (got ${s}s).`);
    }
  }

  // --- Moon sanity ---
  const sweeps = new Map<string, number>(); // planetId (or slug) → max moon sweep
  const counts = new Map<string, number>();
  for (const m of moons) {
    const pid = typeof m.planetId === "string" ? m.planetId : "";
    const size = num(m.size, 12);
    if (size < GALAXY_CONSTRAINTS.moonMinSize || size > GALAXY_CONSTRAINTS.moonMaxSize) {
      errors.push(`Moon "${m.name ?? m.slug ?? "?"}": size must be 8–24px (got ${size}px).`);
    }
    for (const key of ["githubUrl", "liveUrl", "documentationUrl"] as const) {
      const u = m[key];
      if (u !== undefined && u !== null && u !== "" && !isValidHttpUrl(u)) {
        errors.push(`Moon "${m.name ?? m.slug ?? "?"}": ${key} must be a full http(s) URL (got "${u}").`);
      }
    }
    // HIDDEN moons don't render — they must not push planets apart,
    // count toward the per-planet cap, or trigger sweep errors. Layout
    // validation is about what's visible (data quality is still checked
    // above for size/URLs on every moon).
    if (m.isVisible === false) continue;
    if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
    const sweep = num(m.orbitRadius, 16) + size / 2;
    if (sweep > GALAXY_CONSTRAINTS.moonSweepMax) {
      errors.push(`Moon "${m.name ?? m.slug ?? "?"}": orbit + size reaches ${Math.round(sweep)}px — must stay under ${GALAXY_CONSTRAINTS.moonSweepMax}px so it can't reach neighbouring planets.`);
    }
    sweeps.set(pid, Math.max(sweeps.get(pid) ?? 0, sweep));
  }
  for (const n of counts.values()) {
    if (n > GALAXY_CONSTRAINTS.moonMaxCount) {
      errors.push(`A planet has ${n} moons — the cap is ${GALAXY_CONSTRAINTS.moonMaxCount} per planet. Split some into a new planet.`);
    }
  }

  // --- Moon-moon overlap (two moons of the SAME planet, locked mode) ---
  // Moons of one planet share its center, so two identical orbit
  // radii + angles would sit exactly on top of each other. Same
  // locked/worst-case logic as the planets, but around one center.
  const moonGroups = new Map<string, Partial<GalaxyMoon>[]>();
  for (const m of moons) {
    if (m.isVisible === false) continue;
    const pid = typeof m.planetId === "string" ? m.planetId : "";
    if (!pid) continue;
    const group = moonGroups.get(pid) ?? [];
    group.push(m);
    moonGroups.set(pid, group);
  }
  for (const group of moonGroups.values()) {
    if (group.length < 2) continue;
    const moonSpeeds = new Set(group.map((m) => num(m.orbitSpeed, 60)));
    const moonLocked = moonSpeeds.size === 1;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        const need = num(a.size, 12) / 2 + num(b.size, 12) / 2 + GALAXY_CONSTRAINTS.gap;
        const nameA = a.name ?? a.slug ?? "?";
        const nameB = b.name ?? b.slug ?? "?";
        if (moonLocked) {
          const dist = chord(
            num(a.orbitRadius, 16),
            num(a.orbitAngle, 0),
            num(b.orbitRadius, 16),
            num(b.orbitAngle, 0)
          );
          if (dist < need) {
            errors.push(
              `Moons "${nameA}" and "${nameB}" (same planet) would overlap (${Math.round(dist)}px apart, need ≥ ${Math.round(need)}px). Give one a different angle or orbit radius.`
            );
          }
        } else if (Math.abs(num(a.orbitRadius, 16) - num(b.orbitRadius, 16)) < need) {
          errors.push(
            `Moons "${nameA}" and "${nameB}" orbit the same planet at different speeds — keep their orbit speeds equal or separate their orbit radii.`
          );
        }
      }
    }
  }

  // --- Position checks (only visible planets participate) ---
  const visible = planets.filter((p) => p.isVisible !== false);

  // Moons key their parent by ObjectId (Mongo) or slug (seed) — resolve
  // a planet's key the same way.
  const sweepFor = (p: Partial<GalaxyPlanet>): number => {
    const id = (p as { _id?: unknown })._id != null ? String((p as { _id?: unknown })._id) : p.slug ?? "";
    return sweeps.get(id) ?? 0;
  };

  let anyDifferentSpeeds = false;
  if (visible.length > 1) {
    for (let i = 0; i < visible.length; i++) {
      const a = visible[i];
      for (let j = i + 1; j < visible.length; j++) {
        const b = visible[j];
        const rA = num(a.orbitRadius, 0);
        const rB = num(b.orbitRadius, 0);
        const speedA = num(a.orbitSpeed, 60);
        const speedB = num(b.orbitSpeed, 60);
        const sweepA = sweepFor(a);
        const sweepB = sweepFor(b);
        const need = num(a.size, 56) / 2 + num(b.size, 56) / 2 + sweepA + sweepB + GALAXY_CONSTRAINTS.gap;

        // PER-PAIR rule (P6): a pair that shares one orbit speed is a
        // locked pair — their relative positions never change, so the
        // exact chord distance at their fixed angles is checked. A pair
        // with different speeds can drift into alignment over time, so
        // the stricter worst-case rule (full radial lane clearance) is
        // enforced instead. This lets admin give planets different
        // speeds ("some fast, some slow") while preserving the
        // zero-overlap guarantee: close neighbours must share a speed,
        // speed boundaries need room.
        if (Math.abs(speedA - speedB) < 0.5) {
          const dist = chord(rA, num(a.orbitAngle, 0), rB, num(b.orbitAngle, 0));
          if (dist < need) {
            errors.push(
              `"${nameOf(a)}" and "${nameOf(b)}" would overlap (${Math.round(dist)}px apart, need ≥ ${Math.round(need)}px). Increase their orbit radius / angle separation.`
            );
          }
        } else {
          anyDifferentSpeeds = true;
          if (Math.abs(rA - rB) < planetLane(a, sweepA) + planetLane(b, sweepB)) {
            errors.push(
              `"${nameOf(a)}" and "${nameOf(b)}" orbit at different speeds and their lanes could collide over time. Keep their orbit speeds equal, or increase the radius gap between them.`
            );
          }
        }
      }
    }
  }

  // Sun clearance (same in both modes — locked angles don't change it).
  // Runs even with ONE planet: a lone planet can still sit on the sun.
  for (const p of visible) {
    const sweep = sweepFor(p);
    const inner = num(p.orbitRadius, 0) - (num(p.size, 56) / 2 + sweep);
    if (inner < GALAXY_CONSTRAINTS.sunRadius + GALAXY_CONSTRAINTS.gap) {
      // BUGFIX: the suggested radius used sweeps.get(p.slug) which is
      // ALWAYS 0 for Mongo planets (keyed by _id) — the guidance was
      // wrong whenever the planet had moons. sweepFor() resolves the
      // parent key the same way the check does.
      errors.push(
        `"${nameOf(p)}" would overlap the sun — orbit radius needs to be at least ${Math.round(GALAXY_CONSTRAINTS.sunRadius + num(p.size, 56) / 2 + sweep + GALAXY_CONSTRAINTS.gap)}px.`
      );
    }
  }

  if (anyDifferentSpeeds) {
    warnings.push(
      "Different orbit speeds are allowed only where lanes have full clearance — planets that share a speed stay locked (never overlap)."
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Key a moon group by the same thing the validator does: the parent's
 * Mongo `_id` when present, else its slug (seed-style placeholder).
 */
const planetKey = (p: Partial<GalaxyPlanet>): string =>
  (p as { _id?: unknown })._id != null ? String((p as { _id?: unknown })._id) : String(p.slug ?? "");

/** Max outward reach of a planet's VISIBLE moons (moon ring + half moon). */
function moonSweepOf(planet: Partial<GalaxyPlanet>, moons: Partial<GalaxyMoon>[]): number {
  const key = planetKey(planet);
  let sweep = 0;
  for (const m of moons) {
    if (m.isVisible === false) continue;
    const pid = typeof m.planetId === "string" ? m.planetId : "";
    if (pid !== key && pid !== String(planet.slug ?? "")) continue;
    sweep = Math.max(sweep, num(m.orbitRadius, 16) + num(m.size, 12) / 2);
  }
  return sweep;
}

/**
 * Minimum outer radius needed so planet `b` (at angle `aB`, size `sB`,
 * sweep `wB`) clears planet `a` (radius `rA`, angle `aA`, size `sA`,
 * sweep `wA`) by the required chord distance. If the two are already far
 * enough apart because of their angle separation, returns a small value.
 */
function minRadiusForChord(
  rA: number,
  aA: number,
  sA: number,
  wA: number,
  aB: number,
  sB: number,
  wB: number
): number {
  const need = sA / 2 + sB / 2 + wA + wB + GALAXY_CONSTRAINTS.gap;
  let d = Math.abs(((aB - aA) % 360) + 360) % 360;
  d = Math.min(d, 360 - d);
  if (d <= 0.0001) return rA + need; // same ray — must stack outside the previous lane
  const rad = (d * Math.PI) / 180;
  const sin2 = Math.sin(rad) * Math.sin(rad);
  const inner = need * need - rA * rA * sin2;
  if (inner <= 0) return 0; // already clears at radius <= current — keep compact
  return rA * Math.cos(rad) + Math.sqrt(inner);
}

/**
 * #1: Auto-arrange planets in a compact, zero-overlap radial layout.
 * Given N visible planets sorted by displayOrder, distributes them on an
 * even angle ladder (radius steps with angle → a subtle spiral look; the
 * smallest guaranteed angular gap keeps orbits as tight as they can be)
 * and grows each planet's orbit outward just enough to clear every
 * previously-placed planet (including BOTH planets' moon sweeps). All
 * share one locked speed, so relative positions never change and the
 * constellation can never drift into an overlap — matching the
 * validator's locked rule.
 *
 * Returns computed orbitRadius / orbitAngle / orbitSpeed for each planet.
 */
export function autoLayoutPlanets(
  planets: Partial<GalaxyPlanet>[],
  moons: Partial<GalaxyMoon>[] = []
): { slug: string; orbitRadius: number; orbitAngle: number; orbitSpeed: number }[] {
  const visible = planets
    .filter((p) => p.isVisible !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const n = visible.length;
  if (n === 0) return [];

  const { orbitRadiusMin, autoRadiusMax, autoMinStep, sunRadius, gap } =
    GALAXY_CONSTRAINTS;
  const lockedSpeed = 60;
  // Round angles FIRST so the clearance math matches the exact angles that
  // get stored (a 27.69° spread stored as 28° vs 55° narrows it to 27° and
  // would otherwise shave the chord by a few px).
  const angleOf = (i: number) => Math.round((360 / n) * i);

  const radii: number[] = [];
  const sweeps = visible.map((p) => moonSweepOf(p, moons));

  for (let i = 0; i < n; i++) {
    const p = visible[i];
    const size = num(p.size, 56);
    const sweep = sweeps[i];

    // Sun clearance: inner edge of the planet's occupied lane must clear
    // the sun by `gap`. This fixes the first few radii for small systems.
    let r = i === 0 ? orbitRadiusMin : Math.max(orbitRadiusMin, radii[i - 1] + autoMinStep);
    const sunLane = sunRadius + size / 2 + sweep + gap;
    if (orbitRadiusMin < sunLane) r = Math.max(r, sunLane);

    // Clear every earlier planet at its fixed angle (locked constellation).
    const aCur = angleOf(i);
    for (let j = 0; j < i; j++) {
      const needR = minRadiusForChord(
        radii[j],
        angleOf(j),
        num(visible[j].size, 56),
        sweeps[j],
        aCur,
        size,
        sweep
      );
      if (needR > r) r = needR;
    }

    // Don't pierce the compact band — if planets genuinely can't fit it's
    // a data problem the post-rebalance validator will surface.
    radii.push(Math.min(Math.ceil(r), autoRadiusMax));
  }

  return visible.map((p, i) => ({
    slug: String(p.slug ?? ""),
    orbitRadius: radii[i],
    orbitAngle: Math.round(angleOf(i)),
    orbitSpeed: lockedSpeed,
  }));
}

/**
 * #1: Auto-arrange moons around a single planet.
 * Places moons on ONE ring, evenly spaced by angle, with a ring radius
 * large enough that even the biggest two moons clear each other at their
 * fixed angles (locked constellation ⇒ never drifts into overlap). The
 * ring also always sits outside the planet disc.
 */
export function autoLayoutMoons(
  planetSize: number,
  moons: Partial<GalaxyMoon>[]
): { slug: string; orbitRadius: number; orbitAngle: number }[] {
  const visible = moons
    .filter((m) => m.isVisible !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const n = visible.length;
  if (n === 0) return [];

  const halves = visible.map((m) => num(m.size, 12) / 2);
  const maxHalf = Math.max(...halves, 4);
  const { moonSweepMax, gap } = GALAXY_CONSTRAINTS;

  // Ring must clear the planet disc: r - maxHalf >= planetSize/2 + gap.
  let radius = Math.ceil(planetSize / 2 + maxHalf + gap);

  if (n > 1) {
    // Worst adjacent pair = the two biggest moons at even angular spread.
    const sorted = [...halves].sort((a, b) => b - a);
    const need = sorted[0] + (sorted[1] ?? sorted[0]) + gap;
    const neededForChord = need / (2 * Math.sin(Math.PI / n));
    radius = Math.max(radius, Math.ceil(neededForChord));
  }

  // Never exceed the sweep cap (validator enforces orbit + half ≤ 60).
  radius = Math.min(radius, moonSweepMax - maxHalf);

  const angleStep = 360 / n;
  return visible.map((m, i) => ({
    slug: String(m.slug ?? ""),
    orbitRadius: radius,
    orbitAngle: Math.round(angleStep * i),
  }));
}

/**
 * Auto-rebalance all visible planets after a create/delete/visibility toggle.
 * Fetches all planets from MongoDB, runs autoLayoutPlanets(), and bulk-updates
 * orbitRadius, orbitAngle, and orbitSpeed so no manual positioning is needed.
 *
 * Called from the POST, DELETE, and PUT handlers for galaxyPlanet.
 */
export async function rebalanceGalaxyPlanets(): Promise<void> {
  const { connectDb } = await import("@/lib/db");
  const mongoose = await connectDb();
  if (!mongoose) return;

  const { getGalaxyPlanetModel, getGalaxyMoonModel } = await import("@/models");
  const Planet = getGalaxyPlanetModel();
  const Moon = getGalaxyMoonModel();

  const [allPlanets, allMoons] = await Promise.all([
    Planet.find({}).sort({ displayOrder: 1 }).lean(),
    Moon.find({}).lean(),
  ]);
  const layout = autoLayoutPlanets(allPlanets, allMoons);
  if (layout.length === 0) return;

  await Promise.all(
    layout.map((pos) =>
      Planet.findOneAndUpdate(
        { slug: pos.slug },
        { orbitRadius: pos.orbitRadius, orbitAngle: pos.orbitAngle, orbitSpeed: pos.orbitSpeed },
        { new: true }
      )
    )
  );
}

/**
 * Auto-rebalance all visible moons around a single planet.
 * Given a planetId, fetches the parent planet's size and all its moons,
 * then runs autoLayoutMoons() and bulk-updates orbitRadius + orbitAngle.
 *
 * Called from the POST, DELETE, and PUT handlers for galaxyMoon.
 */
export async function rebalanceGalaxyMoons(planetId: string): Promise<void> {
  const { connectDb } = await import("@/lib/db");
  const mongoose = await connectDb();
  if (!mongoose) return;

  const { getGalaxyPlanetModel, getGalaxyMoonModel } = await import("@/models");
  const Planet = getGalaxyPlanetModel();
  const Moon = getGalaxyMoonModel();

  const planet = await Planet.findById(planetId).lean();
  if (!planet) return;

  const moons = await Moon.find({ planetId }).sort({ displayOrder: 1 }).lean();
  const layout = autoLayoutMoons(planet.size ?? 48, moons);
  if (layout.length === 0) return;

  await Promise.all(
    layout.map((pos) =>
      Moon.findOneAndUpdate(
        { slug: pos.slug },
        { orbitRadius: pos.orbitRadius, orbitAngle: pos.orbitAngle },
        { new: true }
      )
    )
  );
}
