import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party installed skills — their scripts use require() and
    // aren't project code. The skills installer wrote BOTH .agents/ and
    // agent/ (different clients read different locations), ignore both.
    ".agents/**",
    "agent/**",
  ]),
]);

export default eslintConfig;
