// Flat ESLint config for @loehrning/website (ESLint 9).
// Correctness-oriented: real-bug rules are errors, stylistic noise is warn/off.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

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
    },
  },
);
