#!/usr/bin/env node
/**
 * check-bundles.mjs — Galaxy v4 bundle-budget check (plan §10, P5 exit check).
 *
 * Runs AFTER `npm run build` (CI + locally). Verifies the three-tier
 * rendering promise at the bundle level:
 *
 *   1. three.js is bundled in one (or more) LAZY chunks — loaded only
 *      when the user opens /detailed-galaxy (next/dynamic ssr:false).
 *   2. The home page's client chunk graph never contains three.js
 *      (home stays LCP-cheap — this is the "home bundle unchanged"
 *      guarantee, statically enforced instead of via network capture).
 *   3. The three chunk is reachable only from the /detailed-galaxy
 *      chunk graph, and its gzip size stays under the budget.
 *
 * Exits non-zero on any violation → CI fails the build.
 *
 * How it works (no runtime, no server needed):
 *   - `.next/static/chunks/*.js` is scanned for a three.js marker
 *     (class names like `WebGLRenderer` survive minification).
 *   - Each page's `client-reference-manifest.js` lists the client
 *     chunks its components reference; a lazy chunk's URL is baked
 *     into the parent chunk that dynamic-imports it, so we find
 *     "parents of three" by filename reference and assert those
 *     parents belong only to the detail route's chunk graph.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const NEXT_DIR = ".next";
const CHUNKS_DIR = path.join(NEXT_DIR, "static", "chunks");
const THREE_MARKERS = ["WebGLRenderer", "PerspectiveCamera"]; // three class names
const BUDGET_BYTES = 250 * 1024; // detailed-page three payload, gzipped

const out = (msg) => console.log(msg);
const ok = (msg) => console.log("  \u2705 " + msg);
const fail = (msg) => {
  console.error("  \u274c " + msg);
  process.exitCode = 1;
};

if (!fs.existsSync(CHUNKS_DIR)) {
  console.error("No build found — run `npm run build` first.");
  process.exit(1);
}

const chunkFiles = fs
  .readdirSync(CHUNKS_DIR)
  .filter((f) => f.endsWith(".js"));

const read = (f) => fs.readFileSync(path.join(CHUNKS_DIR, f), "utf8");
const gzipSize = (f) => zlib.gzipSync(fs.readFileSync(path.join(CHUNKS_DIR, f))).length;

/** Chunks whose content contains a three.js class-name marker. */
const threeChunks = chunkFiles.filter((f) => {
  const src = read(f);
  return THREE_MARKERS.some((m) => src.includes(m));
});

/** Client chunks referenced by a route, from its client-reference manifest. */
function routeChunks(manifestRel) {
  const p = path.join(NEXT_DIR, "server", "app", manifestRel);
  if (!fs.existsSync(p)) return [];
  const src = fs.readFileSync(p, "utf8");
  const urls = [...src.matchAll(/\/_next\/static\/chunks\/([A-Za-z0-9._-]+\.js)/g)].map(
    (m) => m[1]
  );
  return [...new Set(urls)];
}

/** Chunks that dynamic-import a three chunk (their content names the chunk). */
const parentsOfThree = chunkFiles.filter((f) =>
  threeChunks.some((t) => read(f).includes(t))
);

const homeChunks = routeChunks("page_client-reference-manifest.js");
const detailChunks = routeChunks("detailed-galaxy/page_client-reference-manifest.js");

out("\nBundle budget — Galaxy v4");
out("  three chunks: " + (threeChunks.length ? threeChunks.join(", ") : "none"));
out("  parent (dynamic-importing) chunks: " + (parentsOfThree.length ? parentsOfThree.join(", ") : "none"));

if (threeChunks.length === 0) {
  out("  \u26a0\ufe0f No three.js marker found in any chunk — the 3D tier may have been");
  out("    tree-shaken or renamed. The budget is vacuous; verify the WebGL tier still works.");
} else {
  // 1. Budget
  const total = threeChunks.reduce((n, f) => n + gzipSize(f), 0);
  const kb = (total / 1024).toFixed(1);
  if (total <= BUDGET_BYTES) {
    ok(`three.js payload ${kb} KB gzip ≤ ${(BUDGET_BYTES / 1024).toFixed(0)} KB budget`);
  } else {
    fail(`three.js payload ${kb} KB gzip EXCEEDS ${(BUDGET_BYTES / 1024).toFixed(0)} KB budget`);
  }

  // 2. Home must never ship three — neither directly nor via a parent chunk.
  const homeLeak = homeChunks.filter(
    (c) => threeChunks.includes(c) || parentsOfThree.includes(c)
  );
  const homeDirect = homeChunks.filter((c) => THREE_MARKERS.some((m) => read(c).includes(m)));
  const leaked = [...new Set([...homeLeak, ...homeDirect])];
  if (leaked.length === 0) {
    ok("home page ships zero three.js chunks (bundle unchanged)");
  } else {
    fail(`home page references three.js chunks: ${leaked.join(", ")}`);
  }

  // 3. The lazy chunk must be reachable only from the detail route's graph.
  const detailParents = parentsOfThree.filter((c) => detailChunks.includes(c));
  const strayParents = parentsOfThree.filter((c) => !detailChunks.includes(c));
  if (detailParents.length > 0) {
    ok("three.js reachable only from /detailed-galaxy chunk graph");
  } else {
    fail("no three.js parent chunk belongs to the /detailed-galaxy graph — the 3D tier may be unreachable");
  }
  if (strayParents.length > 0) {
    fail(`three.js parent chunks outside the detail graph: ${strayParents.join(", ")}`);
  }
}

if (process.exitCode) {
  console.error("\n\u274c Bundle budget violated — see messages above.\n");
} else {
  console.log("\n\u2705 Bundle budget passed.\n");
}
