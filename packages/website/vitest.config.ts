import { defineConfig, defaultExclude } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // The complete jsdom suite runs nearly two thousand assertions. A small
    // number of otherwise deterministic tests exceeded Vitest's five-second
    // default only under full-suite CPU contention and passed in isolation.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    // Thread workers avoid fork-startup failures on constrained developer and
    // CI hosts. Four workers preserve isolation while preventing process storms.
    pool: "threads",
    maxWorkers: 4,
    // Playwright specs live in tests/e2e (CI smoke) and tests/qa (manual QA
    // harness - see /qa command). Both use @playwright/test's test runtime,
    // not Vitest, so we keep them out of the unit-test run.
    exclude: [...defaultExclude, "**/tests/e2e/**", "**/tests/qa/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/**/__tests__/**",
        "src/test/**",
        "src/**/types.ts",
        "src/instrumentation.ts",
      ],
      // Coverage floors retain a 1.5 percentage-point margin below the latest
      // complete local measurement to absorb runtime variance without allowing
      // material coverage regression.
      thresholds: {
        lines: 53,
        functions: 52,
        branches: 52,
        statements: 52,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/server-only.ts"),
      "next/font/google": path.resolve(__dirname, "./src/test/next-font-google.ts"),
    },
  },
});
