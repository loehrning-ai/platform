import { pathToFileURL } from "node:url";
import { isSafePublicSupabaseKey } from "../src/lib/supabase/key-classification.mjs";

const MAX_SUPABASE_ORIGIN_LENGTH = 2048;

export const LIVE_AUTH_ENV_NAMES = Object.freeze([
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
]);

function readRequired(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readRequiredExact(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function parseSupabaseUrl(value, name) {
  if (
    value.length > MAX_SUPABASE_ORIGIN_LENGTH ||
    value !== value.trim()
  ) {
    throw new Error(
      `${name} must be an exact, whitespace-free Supabase origin no longer than ${MAX_SUPABASE_ORIGIN_LENGTH} characters.`,
    );
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS.`);
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${name} must be a bare HTTPS project origin.`);
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new Error(`${name} must not contain a path.`);
  }
  const hostMatch = parsed.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  if (!hostMatch) {
    throw new Error(
      `${name} must use the dedicated project's <project-ref>.supabase.co origin.`,
    );
  }
  return { origin: parsed.origin, projectRef: hostMatch[1] };
}

function assertPublicSupabaseKey(value, name) {
  if (!isSafePublicSupabaseKey(value)) {
    throw new Error(
      `${name} must be an exact sb_publishable_<22-char-random>_<8-char-checksum> key or a canonical HS256 legacy JWT with role anon.`,
    );
  }
}

export function validateLiveAuthEnv(env = process.env) {
  const missing = LIVE_AUTH_ENV_NAMES.filter(
    (name) => !readRequired(env, name),
  );
  if (missing.length > 0) {
    throw new Error(
      `Live authenticated E2E is disabled: missing ${missing.join(", ")}. ` +
        "Use a dedicated, disposable Supabase test project; scaffold proof needs no credentials.",
    );
  }

  const testUrl = parseSupabaseUrl(
    readRequiredExact(env, "SIMPLIFIED_SUPABASE_TEST_URL"),
    "SIMPLIFIED_SUPABASE_TEST_URL",
  );
  const publicUrl = parseSupabaseUrl(
    readRequiredExact(env, "NEXT_PUBLIC_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const productionUrl = parseSupabaseUrl(
    readRequiredExact(env, "SIMPLIFIED_SUPABASE_PRODUCTION_URL"),
    "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  );

  if (
    testUrl.projectRef !== publicUrl.projectRef ||
    testUrl.origin !== publicUrl.origin
  ) {
    throw new Error(
      "SIMPLIFIED_SUPABASE_TEST_URL and NEXT_PUBLIC_SUPABASE_URL must identify the same project origin.",
    );
  }

  if (testUrl.projectRef === productionUrl.projectRef) {
    throw new Error(
      "Live authenticated E2E refuses the configured production Supabase project.",
    );
  }
  if (
    readRequired(env, "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF") !==
    testUrl.projectRef
  ) {
    throw new Error(
      "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF must exactly acknowledge the disposable project that the live suite may mutate.",
    );
  }

  const testPublishableKey = readRequiredExact(
    env,
    "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  );
  const browserPublishableKey = readRequiredExact(
    env,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
  assertPublicSupabaseKey(
    testPublishableKey,
    "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  );
  assertPublicSupabaseKey(
    browserPublishableKey,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
  if (
    testPublishableKey !== browserPublishableKey
  ) {
    throw new Error(
      "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be the same project key.",
    );
  }

  const turnstileSiteKey = readRequired(
    env,
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  );
  if (!/^[A-Za-z0-9_-]{20,32}$/.test(turnstileSiteKey)) {
    throw new Error(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY must be a valid public Cloudflare Turnstile site key.",
    );
  }

  return { projectRef: testUrl.projectRef };
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  try {
    validateLiveAuthEnv();
    console.log("Live authenticated E2E environment contract is valid.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
