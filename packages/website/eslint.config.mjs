// Flat ESLint config for @loehrning/website (ESLint 9).
// Correctness-oriented: real-bug rules are errors, stylistic noise is warn/off.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

// Product analytics must go through the registry-checked dispatcher, and the
// Vercel SDK components only through the URL-sanitising telemetry wrapper.
const ANALYTICS_DISPATCH_FILE = "src/lib/analytics/dispatch.ts";
const TELEMETRY_WRAPPER_FILE = "src/components/analytics/vercel-telemetry.tsx";

const VERCEL_ANALYTICS_MESSAGE =
  "Send product events through src/lib/analytics/events.ts; only the registry-checked dispatcher and the telemetry wrapper may import the Vercel Web Analytics SDK.";
const VERCEL_ANALYTICS_SERVER_MESSAGE =
  "@vercel/analytics/server is banned: its server track() forwards the visitor's raw cookie header (which carries the Supabase session) and x-forwarded-for to the intake endpoint.";
const SPEED_INSIGHTS_MESSAGE =
  "Mount Speed Insights only through src/components/analytics/vercel-telemetry.tsx, which applies the telemetry URL policy.";

const bannedVercelAnalyticsServer = {
  name: "@vercel/analytics/server",
  message: VERCEL_ANALYTICS_SERVER_MESSAGE,
};
const bannedVercelAnalyticsRoot = {
  name: "@vercel/analytics",
  message: VERCEL_ANALYTICS_MESSAGE,
};
const bannedVercelAnalyticsSubpaths = (allowNext) => ({
  group: [
    "@vercel/analytics/*",
    "!@vercel/analytics/server",
    ...(allowNext ? ["!@vercel/analytics/next"] : []),
  ],
  message: VERCEL_ANALYTICS_MESSAGE,
});
const bannedSpeedInsights = {
  group: ["@vercel/speed-insights", "@vercel/speed-insights/*"],
  message: SPEED_INSIGHTS_MESSAGE,
};

// The loaded analytics runtime exposes identify, group and enableCookie through
// its global command queue. enableCookie would silently change the site's
// device-storage posture under Section 25 TDDDG, so no source may touch it.
const VERCEL_RUNTIME_GLOBAL_MESSAGE =
  "Do not touch the Vercel Web Analytics runtime global; send events only through src/lib/analytics/events.ts.";
const vercelRuntimeGlobalSelectors = ["window", "globalThis", "self"].flatMap(
  (root) => [
    `MemberExpression[object.name='${root}'][property.name=/^va[qim]?$/]`,
    `MemberExpression[object.name='${root}'][property.value=/^va[qim]?$/]`,
  ],
);

export default tseslint.config(
  {
    // Not linted: build output, deps, generated, data, tests, configs.
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
      "content/**",
      "scripts/**",
      "supabase/functions/**",
      "next-env.d.ts",
      "next.config.ts",
      "playwright.config.ts",
      "postcss.config.mjs",
      "sentry.edge.config.ts",
      "sentry.server.config.ts",
      "tailwind.config.ts",
      "vitest.config.ts",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "tests/**",
      "src/test/**",
    ],
  },
  {
    // Register framework plugins globally so JavaScript and TypeScript files
    // receive the same React Hooks and Next.js rule set.
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Correctness (errors)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "react-hooks/rules-of-hooks": "error",
      // Surface stray debug logging; intentional warn/error observability is allowed.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Pragmatic downgrades (warn/off) — avoid noise on a never-linted codebase
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      "prefer-const": "warn",
      // Analytics transport boundaries (errors: `eslint .` has no --max-warnings)
      "no-restricted-imports": [
        "error",
        {
          paths: [bannedVercelAnalyticsRoot, bannedVercelAnalyticsServer],
          patterns: [bannedVercelAnalyticsSubpaths(false), bannedSpeedInsights],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...vercelRuntimeGlobalSelectors.map((selector) => ({
          selector,
          message: VERCEL_RUNTIME_GLOBAL_MESSAGE,
        })),
      ],
    },
  },
  {
    files: [ANALYTICS_DISPATCH_FILE],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [bannedVercelAnalyticsServer],
          patterns: [bannedVercelAnalyticsSubpaths(true), bannedSpeedInsights],
        },
      ],
    },
  },
  {
    files: [TELEMETRY_WRAPPER_FILE],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [bannedVercelAnalyticsServer],
          patterns: [bannedVercelAnalyticsSubpaths(true)],
        },
      ],
    },
  },
);
