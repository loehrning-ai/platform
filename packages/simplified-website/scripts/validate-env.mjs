#!/usr/bin/env node
/**
 * Pre-build environment validation for the public learning platform.
 *
 * Optional providers must be fully disabled or fully configured. A configured
 * provider must carry the non-secret compliance attestations referenced by the
 * privacy notice. This script performs local validation only; it never contacts
 * Vercel, Supabase, Sentry, Anthropic, or any other external service.
 *
 * The canonical origin is hardcoded to https://loehrning.ai. Runtime code does
 * not read NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL; if either legacy value
 * exists, it must match the canonical origin exactly.
 *
 * Errors fail CI and Vercel preview/production builds. Local development stays
 * lenient so a provider-free checkout remains buildable, but every error is
 * printed.
 */

const WARN = (msg) => console.warn(`[validate-env] WARN: ${msg}`);
const ERROR = (msg) => console.error(`[validate-env] ERROR: ${msg}`);
const INFO = (msg) => console.log(`[validate-env] ${msg}`);

let hasError = false;

function markError(message) {
  ERROR(message);
  hasError = true;
}

function isPastOrPresentIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value &&
    parsed.getTime() <= Date.now()
  );
}

function requireAttestation(name, provider) {
  if (!isPastOrPresentIsoDate(process.env[name])) {
    markError(
      `${provider} is configured but ${name} is missing or is not a valid past-or-present YYYY-MM-DD attestation.`,
    );
  }
}

const validationProfile = process.env.LOEHRNING_VALIDATION_PROFILE;
const liveAuthE2EProfile = validationProfile === "live-auth-e2e";
const LIVE_AUTH_E2E_ALLOWED_PUBLIC_VARIABLES = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
]);

function isForbiddenLiveAuthE2EVariable(name) {
  if (name.startsWith("NEXT_PUBLIC_SUPABASE_")) {
    return !LIVE_AUTH_E2E_ALLOWED_PUBLIC_VARIABLES.has(name);
  }
  return (
    name.startsWith("SUPABASE_") ||
    name.startsWith("SENTRY_") ||
    name.startsWith("NEXT_PUBLIC_SENTRY_") ||
    name.startsWith("ANTHROPIC_") ||
    name.startsWith("FEEDBACK_") ||
    name === "AI_NATIVE_PRACTICE_ENABLED" ||
    name === "NEXT_PUBLIC_SITE_URL" ||
    name === "NEXT_PUBLIC_APP_URL" ||
    name === "VERCEL" ||
    name.startsWith("VERCEL_")
  );
}

if (validationProfile && !liveAuthE2EProfile) {
  markError(
    `LOEHRNING_VALIDATION_PROFILE has unsupported value "${validationProfile}".`,
  );
}
if (liveAuthE2EProfile) {
  if (process.env.E2E_AUTH_LIVE !== "1") {
    markError("The live-auth-e2e validation profile requires E2E_AUTH_LIVE=1.");
  }
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    markError(
      "The live-auth-e2e validation profile is forbidden in Vercel preview or production builds.",
    );
  }
  const forbiddenVariables = Object.keys(process.env)
    .filter(
      (name) =>
        process.env[name] !== undefined && isForbiddenLiveAuthE2EVariable(name),
    )
    .sort();
  if (forbiddenVariables.length > 0) {
    markError(
      "The live-auth-e2e validation profile forbids privileged, deployment, telemetry, AI, feedback, and unrelated provider variables. Remove: " +
        forbiddenVariables.join(", ") +
        ".",
    );
  }
}

// Supabase: the public client, privileged API routes, and privacy disclosure
// must all point at the same EU project.
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverUrl = process.env.SUPABASE_URL;
const publicSupabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseConfigured = Boolean(
  publicUrl || serverUrl || publicSupabaseKey || serviceSupabaseKey,
);

function validatedHttpsOrigin(name, value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const originOnly =
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      (parsed.pathname === "/" || parsed.pathname === "");
    if (!originOnly) throw new Error("not an HTTPS origin");
    return parsed.origin;
  } catch {
    markError(
      `${name} must be a valid HTTPS origin without credentials, path, query, or fragment.`,
    );
    return null;
  }
}

const publicOrigin = validatedHttpsOrigin(
  "NEXT_PUBLIC_SUPABASE_URL",
  publicUrl,
);
const serverOrigin = validatedHttpsOrigin("SUPABASE_URL", serverUrl);

if (publicOrigin && serverOrigin && publicOrigin !== serverOrigin) {
  markError(
    "NEXT_PUBLIC_SUPABASE_URL does not match SUPABASE_URL. The browser CSP and server calls must target the same project.",
  );
}

if (supabaseConfigured && liveAuthE2EProfile) {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", publicUrl],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    markError(`The live-auth-e2e build is missing: ${missing.join(", ")}.`);
  }
  if (
    serverUrl ||
    serviceSupabaseKey ||
    process.env.SUPABASE_REGION ||
    process.env.SUPABASE_DPA_CONFIRMED_AT ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    markError(
      "The live-auth-e2e build accepts only the public URL and publishable key; privileged, deployment, region, DPA, and anon-alias variables must be absent.",
    );
  }
  INFO(
    "Supabase is restricted to the dedicated live-auth E2E browser/server-session profile. Privileged API features remain disabled.",
  );
} else if (supabaseConfigured) {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", publicUrl],
    ["SUPABASE_URL", serverUrl],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      publicSupabaseKey,
    ],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceSupabaseKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    markError(
      `Supabase is partially configured. Missing: ${missing.join(", ")}. ` +
        "Disable every Supabase variable or provide the complete account/feedback configuration.",
    );
  }

  const region = process.env.SUPABASE_REGION;
  if (!region || !/^eu(?:-|$)/i.test(region)) {
    markError(
      "Supabase is configured but SUPABASE_REGION is missing or is not an explicit EU region identifier (for example eu-central-1).",
    );
  }
  requireAttestation("SUPABASE_DPA_CONFIRMED_AT", "Supabase");
} else if (liveAuthE2EProfile) {
  markError(
    "The live-auth-e2e build requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
} else {
  WARN(
    "Supabase is disabled. Login, cross-device sync, account management, and stored feedback are unavailable; public learning content remains available.",
  );
}

// Stored feedback is independent from accounts. It remains disabled until the
// fixed 180-day pruning migration and its daily Cron job have been applied and
// attested. A service-role key alone must never publish the free-text form.
const feedbackEnabled = process.env.FEEDBACK_ENABLED;
if (
  feedbackEnabled &&
  feedbackEnabled !== "true" &&
  feedbackEnabled !== "false"
) {
  markError("FEEDBACK_ENABLED must be exactly true or false when set.");
}
if (feedbackEnabled === "true") {
  if (!supabaseConfigured) {
    markError(
      "FEEDBACK_ENABLED=true requires the complete Supabase configuration.",
    );
  }
  requireAttestation(
    "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
    "Feedback retention Cron",
  );
}

// Canonical origin guard.
const HARDCODED_ORIGIN = "https://loehrning.ai";
for (const [name, value] of [
  ["NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL],
  ["NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL],
]) {
  if (!value) continue;
  if (value !== HARDCODED_ORIGIN) {
    markError(
      `${name} is set to "${value}" but runtime code hardcodes ${HARDCODED_ORIGIN}. Unset the variable or use the canonical origin.`,
    );
  }
}

// Sentry: reject malformed DSNs and unverified retention/disclosure state.
const sentryDsns = [
  ["SENTRY_DSN", process.env.SENTRY_DSN],
  ["NEXT_PUBLIC_SENTRY_DSN", process.env.NEXT_PUBLIC_SENTRY_DSN],
].filter(([, value]) => Boolean(value));
if (sentryDsns.length > 0) {
  const dsnPattern =
    /^https:\/\/[a-f0-9]+@[a-z0-9.-]+(?:\.de)?\.sentry\.io\/\d+$/;
  for (const [name, value] of sentryDsns) {
    if (!dsnPattern.test(value)) {
      markError(
        `${name} appears malformed. Expected https://<key>@<host>.sentry.io/<project-id>.`,
      );
    }
  }
  requireAttestation("SENTRY_DPA_CONFIRMED_AT", "Sentry");
  const retentionDays = Number(process.env.SENTRY_RETENTION_DAYS);
  if (
    !Number.isInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 3650
  ) {
    markError(
      "Sentry is configured but SENTRY_RETENTION_DAYS is not an integer between 1 and 3650.",
    );
  }
}

// Anthropic: live practice requires both the feature flag and key. A planted
// key still counts as configured and therefore needs a recorded DPA date.
const aiEnabled = process.env.AI_NATIVE_PRACTICE_ENABLED;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (aiEnabled === "true" && !anthropicKey) {
  markError(
    "AI_NATIVE_PRACTICE_ENABLED=true but ANTHROPIC_API_KEY is not set.",
  );
}
if (aiEnabled === "true" && !supabaseConfigured) {
  markError(
    "AI_NATIVE_PRACTICE_ENABLED=true requires the complete Supabase configuration because production AI quotas fail closed through the durable rate limiter.",
  );
}
if (anthropicKey || aiEnabled === "true") {
  requireAttestation("ANTHROPIC_DPA_CONFIRMED_AT", "Anthropic");
  const rawRetention = process.env.ANTHROPIC_RETENTION_DAYS;
  const retentionDays = rawRetention?.trim()
    ? Number(rawRetention)
    : Number.NaN;
  if (
    !Number.isInteger(retentionDays) ||
    retentionDays < 0 ||
    retentionDays > 3650
  ) {
    markError(
      "Anthropic is configured but ANTHROPIC_RETENTION_DAYS is not an integer between 0 and 3650 matching the accepted API contract.",
    );
  }
}
if (anthropicKey && aiEnabled !== "true") {
  WARN(
    "ANTHROPIC_API_KEY is present while AI_NATIVE_PRACTICE_ENABLED is not true. The key is configured but live AI practice remains disabled.",
  );
}

// Vercel hosting is independent from optional analytics. Telemetry requires an
// explicit opt-in plus a dated TDDDG assessment; being deployed on Vercel alone
// must never silently activate measurement.
const vercelConfigured = process.env.VERCEL === "1";
const vercelTelemetryEnabled = process.env.VERCEL_TELEMETRY_ENABLED === "true";

if (vercelConfigured) {
  requireAttestation("VERCEL_DPA_CONFIRMED_AT", "Vercel");
}
if (vercelTelemetryEnabled) {
  if (!vercelConfigured) {
    markError(
      "VERCEL_TELEMETRY_ENABLED=true but VERCEL=1 is absent. Telemetry is supported only in a verified Vercel runtime.",
    );
  }
  requireAttestation(
    "VERCEL_TDDDG_ASSESSMENT_AT",
    "Vercel Web Analytics and Speed Insights",
  );
}

// Release/CI behavior.
const vercelEnv = process.env.VERCEL_ENV;
const isGatedBuild =
  vercelEnv === "production" ||
  vercelEnv === "preview" ||
  Boolean(process.env.CI) ||
  process.env.RELEASE_VALIDATION === "1" ||
  Boolean(validationProfile);

if (hasError && isGatedBuild) {
  ERROR("Environment validation failed. Failing the gated build.");
} else if (hasError) {
  ERROR(
    "Environment validation found critical mismatches. Build continues for local development only.",
  );
} else {
  INFO("Environment validation passed.");
}

process.exit(hasError && isGatedBuild ? 1 : 0);
