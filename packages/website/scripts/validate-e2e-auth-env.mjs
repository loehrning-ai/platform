import { pathToFileURL } from "node:url";

export const LIVE_AUTH_ENV_NAMES = Object.freeze([
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
]);

function readRequired(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function parseSupabaseUrl(value, name) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS.`);
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
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
    readRequired(env, "SIMPLIFIED_SUPABASE_TEST_URL"),
    "SIMPLIFIED_SUPABASE_TEST_URL",
  );
  const publicUrl = parseSupabaseUrl(
    readRequired(env, "NEXT_PUBLIC_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_URL",
  );

  if (
    testUrl.projectRef !== publicUrl.projectRef ||
    testUrl.origin !== publicUrl.origin
  ) {
    throw new Error(
      "SIMPLIFIED_SUPABASE_TEST_URL and NEXT_PUBLIC_SUPABASE_URL must identify the same project origin.",
    );
  }

  if (
    readRequired(env, "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY") !==
    readRequired(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  ) {
    throw new Error(
      "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be the same project key.",
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
