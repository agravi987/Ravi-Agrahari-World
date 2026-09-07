/**
 * tests/galaxyLayout.test.ts — unit tests for the zero-overlap galaxy
 * validator (src/lib/galaxyLayout). Pure functions, no DB: an admin's
 * planet/moon edit either keeps the layout overlap-free or the API
 * route rejects it with a readable error. These tests pin the rules:
 * hidden bodies never force visible ones apart, the sun-clearance
 * guidance is CORRECT (it used to quote a too-small radius whenever
 * the planet had moons), and single-planet systems still get checked
 * against the sun.
 */
import { describe, expect, it } from "vitest";
import {
  GALAXY_CONSTRAINTS,
  autoLayoutMoons,
  autoLayoutPlanets,
  validateGalaxyLayout,
} from "../src/lib/galaxyLayout";
import type { GalaxyMoon, GalaxyPlanet } from "../src/types/galaxy";

const planet = (over: Partial<GalaxyPlanet> = {}): Partial<GalaxyPlanet> => ({
  name: "P",
  slug: "p",
  size: 56,
  orbitRadius: 300,
  orbitSpeed: 60,
  orbitAngle: 0,
  isVisible: true,
  ...over,
});

const moon = (over: Partial<GalaxyMoon> = {}): Partial<GalaxyMoon> => ({
  name: "M",
  slug: "m",
  size: 12,
  orbitRadius: 16,
  orbitAngle: 0,
  orbitSpeed: 60,
  planetId: "p",
  isVisible: true,
  ...over,
});

describe("validateGalaxyLayout — planets", () => {
  it("accepts a healthy single-planet system", () => {
    const res = validateGalaxyLayout([planet()], []);
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it("catches two visible planets on top of each other", () => {
    const res = validateGalaxyLayout(
      [
        planet({ name: "A", slug: "a" }),
        planet({ name: "B", slug: "b", orbitRadius: 310, orbitAngle: 0 }),
      ],
      []
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("overlap"))).toBe(true);
  });

  it("ignores hidden planets in collision checks", () => {
    const res = validateGalaxyLayout(
      [
        planet({ name: "A", slug: "a" }),
        planet({ name: "B", slug: "b", orbitRadius: 310, orbitAngle: 0, isVisible: false }),
      ],
      []
    );
    expect(res.ok).toBe(true);
  });

  it("rejects planets with different speeds whose lanes collide", () => {
    const res = validateGalaxyLayout(
      [
        planet({ name: "A", slug: "a", orbitRadius: 300, orbitSpeed: 60 }),
        planet({ name: "B", slug: "b", orbitRadius: 330, orbitSpeed: 45 }),
      ],
      []
    );
    // lane A ≈ 28+10, lane B ≈ 28+10 → gap 30 < 76 → rejected.
    expect(res.ok).toBe(false);
  });
});

describe("validateGalaxyLayout — sun clearance", () => {
  it("checks a single planet against the sun (previously skipped)", () => {
    const res = validateGalaxyLayout([planet({ orbitRadius: 60 })], []);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("overlap the sun"))).toBe(true);
  });

  it("quotes the CORRECT minimum radius including the moon sweep", () => {
    // orbitRadius 100, size 56 (half 28), visible moon sweeping 28px
    // (16 + 24/2). Inner edge = 100 - (28 + 28) = 44 < 54 → error, and
    // the guidance must be 44 + 28 + 28 + 10 = 110px. (It used to say
    // 82px — sweeps.get(p.slug) was always 0 for _id-keyed planets.)
    const res = validateGalaxyLayout(
      [planet({ orbitRadius: 100 })],
      [moon({ orbitRadius: 16, size: 24 })]
    );
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.includes("overlap the sun"));
    expect(msg).toBeTruthy();
    expect(msg).toContain("110");
  });
});

describe("validateGalaxyLayout — moons", () => {
  it("rejects a visible moon that sweeps too far", () => {
    const res = validateGalaxyLayout([planet()], [moon({ orbitRadius: 60, size: 24 })]);
    expect(res.ok).toBe(false);
  });

  it("ignores a HIDDEN moon that sweeps too far", () => {
    const res = validateGalaxyLayout(
      [planet()],
      [moon({ orbitRadius: 60, size: 24, isVisible: false })]
    );
    expect(res.ok).toBe(true);
  });

  it("does not let a hidden moon push its planet off the sun", () => {
    // The huge hidden moon must NOT add sweep to the clearance math.
    const res = validateGalaxyLayout(
      [planet({ orbitRadius: 100 })],
      [moon({ orbitRadius: 60, size: 24, isVisible: false })]
    );
    // Inner edge 100 - 28 = 72 > 54 → fine.
    expect(res.ok).toBe(true);
  });

  it("rejects more than moonMaxCount VISIBLE moons per planet", () => {
    const many = Array.from({ length: GALAXY_CONSTRAINTS.moonMaxCount + 1 }, (_, i) =>
      moon({ name: `M${i}`, slug: `m${i}`, orbitAngle: i * 30 })
    );
    const res = validateGalaxyLayout([planet()], many);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("cap"))).toBe(true);
  });

  it("hidden moons don't count toward the per-planet cap", () => {
    const many = Array.from({ length: GALAXY_CONSTRAINTS.moonMaxCount + 3 }, (_, i) =>
      moon({ name: `M${i}`, slug: `m${i}`, orbitAngle: i * 25, isVisible: false })
    );
    const res = validateGalaxyLayout([planet()], many);
    expect(res.ok).toBe(true);
  });

  it("catches two visible moons of one planet on top of each other", () => {
    const res = validateGalaxyLayout(
      [planet()],
      [moon({ name: "A", slug: "a" }), moon({ name: "B", slug: "b" })]
    );
    expect(res.ok).toBe(false);
  });

  it("resolves sweeps for BOTH _id-keyed and slug-keyed parents", () => {
    // Seed-style: moons key their parent by the planet's SLUG.
    const seedPlanet = planet({ name: "AWS", slug: "aws" });
    const seedMoon = moon({ name: "s3", slug: "s3", orbitRadius: 60, size: 24, planetId: "aws" });
    const res = validateGalaxyLayout([seedPlanet], [seedMoon]);
    expect(res.ok).toBe(false); // visible moon sweeps 72px > 60 cap
  });
});

describe("autoLayoutPlanets — compact, zero-overlap auto-arrange", () => {
  // Reusable fixture: a 12-planet system where every planet has moons,
  // mirroring the seed (the heaviest case the admin can hit).
  const makeGalaxy = (count: number) => {
    const planets: Partial<GalaxyPlanet>[] = Array.from({ length: count }, (_, i) =>
      planet({ name: `P${i}`, slug: `p${i}`, size: 56 + (i % 3) * 4, displayOrder: i })
    );
    const moons: Partial<GalaxyMoon>[] = [];
    for (const p of planets) {
      for (let j = 0; j < 3; j++) {
        moons.push(
          moon({ name: `${p.slug}-m${j}`, slug: `${p.slug}-m${j}`, planetId: p.slug, size: 12, displayOrder: j })
        );
      }
    }
    return { planets, moons };
  };

  const apply = (planets: Partial<GalaxyPlanet>[], moons: Partial<GalaxyMoon>[]) => {
    // Moon rings first (they set the sweeps planets must clear)…
    let moonOrder = 0;
    const grouped = new Map<string, Partial<GalaxyMoon>[]>();
    for (const m of moons) {
      const g = grouped.get(String(m.planetId)) ?? [];
      g.push(m);
      grouped.set(String(m.planetId), g);
    }
    const arrangedMoons: Partial<GalaxyMoon>[] = [];
    for (const [, g] of grouped) {
      const ring = autoLayoutMoons(56, g);
      const pos = new Map(ring.map((l) => [l.slug, l]));
      for (const m of g) {
        const mp = pos.get(String(m.slug));
        arrangedMoons.push({
          ...m,
          orbitRadius: mp?.orbitRadius,
          orbitAngle: mp?.orbitAngle,
          displayOrder: moonOrder++,
        });
      }
    }
    // …then planet positions.
    const layout = autoLayoutPlanets(planets, arrangedMoons);
    const pos = new Map(layout.map((l) => [l.slug, l]));
    const arrangedPlanets = planets.map((p) => {
      const pp = pos.get(String(p.slug))!;
      return { ...p, orbitRadius: pp.orbitRadius, orbitAngle: pp.orbitAngle, orbitSpeed: pp.orbitSpeed };
    });
    return { planets: arrangedPlanets, moons: arrangedMoons };
  };

  it("stays compact (all orbits inside the auto band) for 12 moon-heavy planets", () => {
    const { moons } = makeGalaxy(12);
    const layout = autoLayoutPlanets(makeGalaxy(12).planets, moons);
    const radii = layout.map((l) => l.orbitRadius);
    // New auto-layout must never blow past the old 2000px uniform spread —
    // that was the "planets too far" bug.
    for (const r of radii) {
      expect(r).toBeLessThanOrEqual(GALAXY_CONSTRAINTS.autoRadiusMax);
      expect(r).toBeGreaterThanOrEqual(GALAXY_CONSTRAINTS.orbitRadiusMin);
    }
    expect(Math.max(...radii)).toBeLessThan(GALAXY_CONSTRAINTS.orbitRadiusMax);
  });

  it("produces a layout the validator accepts for the 12-planet seed-equivalent", () => {
    const { planets, moons } = makeGalaxy(12);
    const arranged = apply(planets, moons);
    const res = validateGalaxyLayout(arranged.planets, arranged.moons);
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
  });

  it("adding a 13th planet keeps the whole system compact AND overlap-free", () => {
    const { planets, moons } = makeGalaxy(12);
    planets.push(planet({ name: "New", slug: "new-planet", size: 56, displayOrder: 99 }));
    moons.push(moon({ name: "new-moon", slug: "new-moon", planetId: "new-planet", size: 12 }));
    const arranged = apply(planets, moons);
    expect(Math.max(...arranged.planets.map((p) => Number(p.orbitRadius) || 0))).toBeLessThanOrEqual(
      GALAXY_CONSTRAINTS.autoRadiusMax
    );
    const res = validateGalaxyLayout(arranged.planets, arranged.moons);
    expect(res.errors).toEqual([]);
  });

  it("the newest planet is NOT dumped at the far rim (old bug: index n-1 → maxR)", () => {
    const { planets, moons } = makeGalaxy(12);
    planets.push(planet({ name: "New", slug: "new-planet", size: 56, displayOrder: 99 }));
    moons.push(moon({ name: "new-moon", slug: "new-moon", planetId: "new-planet", size: 12 }));
    const layout = autoLayoutPlanets(planets, moons);
    const newest = layout.find((l) => l.slug === "new-planet");
    // It must land somewhere in the band — NOT pinned out at orbitRadiusMax
    // like the old uniform 100→2000 spread did.
    expect(newest!.orbitRadius).toBeLessThanOrEqual(GALAXY_CONSTRAINTS.autoRadiusMax);
    expect(newest!.orbitRadius).toBeLessThan(GALAXY_CONSTRAINTS.orbitRadiusMax);
  });
});
