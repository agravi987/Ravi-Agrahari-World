/**
 * write-deploy-meta.mjs — plan S10
 * Writes public/deploy-meta.json at build time from the deploy env:
 *   - VERCEL_GIT_COMMIT_SHA (Vercel build) or GITHUB_SHA (Actions)
 *   - the build timestamp
 * The footer badge reads this file (Footer.tsx). Runs before
 * `next build` via the package.json build script — this is the
 * reliable local source (no write-back from a workflow needed,
 * since a workflow can't write into a live deploy).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "";

// "owner/repo" for the footer's commit link — Vercel splits it across two
// vars, GitHub Actions provides GITHUB_REPOSITORY directly. Without this
// the footer guessed a hardcoded repo name and every badge link 404'd.
const repo =
  process.env.GITHUB_REPOSITORY ??
  (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : "");

const meta = { commit, builtAt: new Date().toISOString(), repo };

mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(
  join(root, "public", "deploy-meta.json"),
  JSON.stringify(meta, null, 2) + "\n"
);

console.log(
  `[deploy-meta] ${commit ? commit.slice(0, 7) : "(no commit — local dev)"} @ ${meta.builtAt}`
);
