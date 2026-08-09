/**
 * Minimal child-process environment policy for local verification.
 *
 * Verification commands execute dependency code. They receive only the OS
 * values required to launch tools plus explicitly named test controls.
 * Provider validation/build steps additionally receive only application-owned
 * provider variables. Arbitrary shell credentials and agent sockets are not
 * forwarded through the child environment. This is functional isolation, not
 * an OS/filesystem/network sandbox.
 */

import { fileURLToPath } from "node:url";

export const SYSTEM_ENVIRONMENT_KEYS = Object.freeze([
  "CI",
  "FORCE_COLOR",
  "GITHUB_ACTIONS",
  "HOME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "LOGNAME",
  "NO_COLOR",
  "PATH",
  "SHELL",
  "TEMP",
  "TERM",
  "TMP",
  "TMPDIR",
  "TZ",
  "USER",
]);

export const VERIFICATION_ENVIRONMENT_KEYS = Object.freeze([
  "E2E_GLOBAL_TIMEOUT",
  "E2E_PORT",
  "E2E_AUTH_PRESERVE_STORAGE_STATE",
  "E2E_AUTH_STORAGE_STATE",
  "E2E_REUSE_EXISTING_SERVER",
  "E2E_SERVER_MODE",
  "PLAYWRIGHT_BROWSERS_PATH",
  "PLAYWRIGHT_BLOB_OUTPUT_DIR",
  "PLAYWRIGHT_CAPTURE_VISUALS",
  "PLAYWRIGHT_HTML_OPEN",
  "PLAYWRIGHT_HTML_OUTPUT_DIR",
  "PLAYWRIGHT_OUTPUT_DIR",
  "RELEASE_VALIDATION",
  "RUN_LAUNCH_GATE",
  "RUN_WEBKIT",
]);

export const APPLICATION_PROVIDER_ENVIRONMENT_KEYS = Object.freeze([
  "AI_NATIVE_PRACTICE_ENABLED",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_DPA_CONFIRMED_AT",
  "ANTHROPIC_RETENTION_DAYS",
  "E2E_AUTH_LIVE",
  "FEEDBACK_ENABLED",
  "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
  "LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME",
  "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
  "LOEHRNING_VALIDATION_PROFILE",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_DPA_CONFIRMED_AT",
  "SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_RETENTION_DAYS",
  "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
  "SUPABASE_CAPTCHA_CONFIRMED_AT",
  "SUPABASE_DPA_CONFIRMED_AT",
  "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
  "SUPABASE_REGION",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
  "VERCEL",
  "VERCEL_BRANCH_URL",
  "VERCEL_DPA_CONFIRMED_AT",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_SHA",
  "VERCEL_TDDDG_ASSESSMENT_AT",
  "VERCEL_TELEMETRY_ENABLED",
  "VERCEL_URL",
]);

const DOTENV_GUARD_PATH = fileURLToPath(
  new URL("./deny-dotenv-loading.cjs", import.meta.url),
);
const DOTENV_GUARD_NODE_OPTIONS = `--require=${DOTENV_GUARD_PATH}`;
const DOTENV_GUARD_BUN_OPTIONS =
  `--no-env-file --preload=${DOTENV_GUARD_PATH}`;
const BOOLEAN_VERIFICATION_ENVIRONMENT_KEYS = Object.freeze([
  "E2E_AUTH_PRESERVE_STORAGE_STATE",
  "E2E_REUSE_EXISTING_SERVER",
  "PLAYWRIGHT_CAPTURE_VISUALS",
  "RELEASE_VALIDATION",
  "RUN_LAUNCH_GATE",
  "RUN_WEBKIT",
]);

export function pickEnvironment(source, keys) {
  const selected = {};
  for (const key of keys) {
    if (typeof source[key] === "string") selected[key] = source[key];
  }
  return selected;
}

export function minimalVerificationEnvironment(source = process.env) {
  const selected = pickEnvironment(source, [
    ...SYSTEM_ENVIRONMENT_KEYS,
    ...VERIFICATION_ENVIRONMENT_KEYS,
  ]);
  for (const key of BOOLEAN_VERIFICATION_ENVIRONMENT_KEYS) {
    if (selected[key] !== "1") delete selected[key];
  }
  return {
    ...selected,
    // Bun reads .env files before application code runs. Keep this setting in
    // the child environment so nested `bun run` processes inherit the same
    // fail-closed policy. The Node preload independently blocks Next's dotenv
    // loader.
    BUN_OPTIONS: DOTENV_GUARD_BUN_OPTIONS,
    NODE_OPTIONS: DOTENV_GUARD_NODE_OPTIONS,
  };
}

export const PROVIDER_FREE_APPLICATION_ENVIRONMENT = Object.freeze({
  AI_NATIVE_PRACTICE_ENABLED: "false",
  ANTHROPIC_API_KEY: "",
  ANTHROPIC_DPA_CONFIRMED_AT: "",
  ANTHROPIC_RETENTION_DAYS: "",
  E2E_AUTH_LIVE: "",
  FEEDBACK_ENABLED: "false",
  FEEDBACK_RETENTION_CRON_CONFIRMED_AT: "",
  LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME: "",
  LOEHRNING_LOCAL_VERIFICATION_ORIGIN: "",
  LOEHRNING_VALIDATION_PROFILE: "",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_APP_URL: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
  NEXT_PUBLIC_SITE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
  RATE_LIMIT_HMAC_SECRET: "",
  SENTRY_AUTH_TOKEN: "",
  SENTRY_DPA_CONFIRMED_AT: "",
  SENTRY_DSN: "",
  SENTRY_ORG: "",
  SENTRY_PROJECT: "",
  SENTRY_RETENTION_DAYS: "",
  SIMPLIFIED_SUPABASE_TEST_EMAIL: "",
  SIMPLIFIED_SUPABASE_TEST_PASSWORD: "",
  SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY: "",
  SIMPLIFIED_SUPABASE_TEST_URL: "",
  SIMPLIFIED_SUPABASE_PRODUCTION_URL: "",
  SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF: "",
  SUPABASE_DPA_CONFIRMED_AT: "",
  SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT: "",
  SUPABASE_REGION: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_CAPTCHA_CONFIRMED_AT: "",
  TURNSTILE_CONFIGURATION_CONFIRMED_AT: "",
  VERCEL: "",
  VERCEL_DPA_CONFIRMED_AT: "",
  VERCEL_ENV: "",
  VERCEL_TDDDG_ASSESSMENT_AT: "",
  VERCEL_TELEMETRY_ENABLED: "false",
});

function localVerificationOrigin(source) {
  if (source.E2E_SERVER_MODE !== "production") return "";
  const rawPort = source.E2E_PORT;
  if (typeof rawPort !== "string" || !/^[1-9]\d*$/.test(rawPort)) return "";
  const port = Number(rawPort);
  return Number.isSafeInteger(port) && port <= 65_535
    ? `http://localhost:${port}`
    : "";
}

export function providerFreeVerificationEnvironment(source = process.env) {
  return {
    ...minimalVerificationEnvironment(source),
    ...PROVIDER_FREE_APPLICATION_ENVIRONMENT,
    LOEHRNING_LOCAL_VERIFICATION_ORIGIN: localVerificationOrigin(source),
  };
}

export function configuredApplicationEnvironment(source = process.env) {
  const selected = pickEnvironment(source, [
    ...SYSTEM_ENVIRONMENT_KEYS,
    ...VERIFICATION_ENVIRONMENT_KEYS,
    ...APPLICATION_PROVIDER_ENVIRONMENT_KEYS,
  ]);
  for (const key of BOOLEAN_VERIFICATION_ENVIRONMENT_KEYS) {
    if (selected[key] !== "1") delete selected[key];
  }
  return {
    ...selected,
    BUN_OPTIONS: DOTENV_GUARD_BUN_OPTIONS,
    NODE_OPTIONS: DOTENV_GUARD_NODE_OPTIONS,
  };
}
