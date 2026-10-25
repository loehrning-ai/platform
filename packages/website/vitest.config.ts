import { defineConfig, defaultExclude } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // A focused test accidentally committed with `.only` must never turn any
    // local or CI verification command into partial-suite proof.
    allowOnly: false,
    setupFiles: ["./src/test/setup.ts"],
    // Booting jsdom costs more than most tests it hosts, so only component
    // tests (.tsx) get it by default. A .ts test that needs the DOM opts in
    // with a `// @vitest-environment jsdom` docblock.
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["src/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          include: ["src/**/*.{test,spec}.tsx"],
          environment: "jsdom",
        },
      },
    ],
    // The complete suite runs thousands of assertions. A small
    // number of otherwise deterministic tests exceeded Vitest's five-second
    // default only under full-suite CPU contention and passed in isolation.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    // Thread workers avoid fork-startup failures on constrained developer and
    // CI hosts. Four workers preserve isolation while preventing process storms.
    pool: "threads",
    maxWorkers: 4,
    // Playwright specs live in tests/e2e and use @playwright/test's test
    // runtime, not Vitest, so we keep them out of the unit-test run.
    exclude: [...defaultExclude, "**/tests/e2e/**"],
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
