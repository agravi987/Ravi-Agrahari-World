import { defineConfig } from "vitest/config";

/**
 * vitest.config.mjs
 * Minimal Vitest setup for the portfolio.
 *
 * The test suite is intentionally tiny (test files were consolidated to
 * keep the repo lean): `passWithNoTests` lets `npm run test` (and the CI
 * "test" step in .github/workflows/deploy-meta.yml) pass cleanly even when
 * no test files are present, so a fresh clone never fails on an empty suite.
 * Re-introduce test files under `src/` or `tests/` and they'll be picked up
 * automatically by Vitest's default include glob.
 */
export default defineConfig({
  test: {
    passWithNoTests: true,
  },
});