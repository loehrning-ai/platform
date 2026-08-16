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
 * Errors fail CI and Vercel preview/production builds. Local provider-free
 * development stays lenient, but a planted credential that can authorize
 * external side effects makes validation fail outside CI as well.
 */

import nextEnv from "@next/env";
import {
  classifySupabaseKey,
  isSafePublicSupabaseKey,
  isServiceSupabaseKey,
  SUPABASE_KEY_KIND,
} from "../src/lib/supabase/key-classification.mjs";
import { isValidRateLimitHmacSecret } from "../src/lib/security/rate-limit-secret.mjs";
import { localVerificationOrigin } from "../../../scripts/environment-policy.mjs";

// Validate the same local environment files that `next build` will load.
// Existing shell variables retain precedence, including explicit empty values
// supplied by the provider-free test launcher.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), false);

const WARN = (msg) => console.warn(`[validate-env] WARN: ${msg}`);
const ERROR = (msg) => console.error(`[validate-env] ERROR: ${msg}`);
const INFO = (msg) => console.log(`[validate-env] ${msg}`);
const MAX_ORIGIN_LENGTH = 2048;
const SIDE_EFFECT_CREDENTIALS = [
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "SENTRY_AUTH_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
];

let hasError = false;

function markError(message) {
  ERROR(message);
  hasError = true;
}

function hasNonEmptyEnvironmentValue(name) {
  return Boolean(process.env[name]);
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

function isBoundedPositiveInteger(value, maximum) {
  if (!/^[1-9]\d*$/.test(value ?? "")) return false;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= maximum;
}

const validationProfile = process.env.LOEHRNING_VALIDATION_PROFILE;
const liveAuthE2EProfile = validationProfile === "live-auth-e2e";
const TEST_ONLY_AUTH_VARIABLES = [
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
];
const leakedTestOnlyAuthVariables = TEST_ONLY_AUTH_VARIABLES.filter(
  (name) => Boolean(process.env[name]?.trim()),
);
if (leakedTestOnlyAuthVariables.length > 0) {
  markError(
    "Test-only live-auth variables are forbidden in application builds. " +
      "Run the dedicated preflight, then remove: " +
      leakedTestOnlyAuthVariables.join(", ") +
      ".",
  );
}
const LIVE_AUTH_E2E_ALLOWED_PUBLIC_VARIABLES = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
]);
// LOEHRNING_LOCAL_VERIFICATION_ORIGIN grants real trusted-redirect authority
// (src/lib/auth/origin.ts) and must never reach a gated build unexplained.
// It is trusted here in exactly one narrow case: its value is the *exact*
// derivation environment-policy.mjs's localVerificationOrigin() would itself
// produce from this same process's E2E_SERVER_MODE/E2E_PORT — i.e. this is a
// self-consistent build the CI e2e/lighthouse/auth-scaffold pipeline
// produced for its own loopback-HTTP test server, not an arbitrarily
// injected value. Any other value, or a value present with no matching
// E2E_SERVER_MODE/E2E_PORT to derive it from, still fails loudly.
const selfConsistentVerificationOrigin = localVerificationOrigin(process.env);
const localVerificationVariables = [
  "LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME",
  "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
].filter((name) => {
  const value = process.env[name];
  if (!value) return false;
  if (name === "LOEHRNING_LOCAL_VERIFICATION_ORIGIN") {
    return value !== selfConsistentVerificationOrigin;
  }
  return true;
});

if (localVerificationVariables.length > 0) {
  markError(
    "Local verification redirect authority is forbidden in validated builds. Remove: " +
      localVerificationVariables.join(", ") +
      ".",
  );
}

function isForbiddenLiveAuthE2EVariable(name) {
  if (name.startsWith("NEXT_PUBLIC_SUPABASE_")) {
    return !LIVE_AUTH_E2E_ALLOWED_PUBLIC_VARIABLES.has(name);
  }
  if (name.startsWith("NEXT_PUBLIC_TURNSTILE_")) {
    return !LIVE_AUTH_E2E_ALLOWED_PUBLIC_VARIABLES.has(name);
  }
  return (
    name.startsWith("SUPABASE_") ||
    name === "RATE_LIMIT_HMAC_SECRET" ||
    name.startsWith("TURNSTILE_") ||
    name.startsWith("SENTRY_") ||
    name.startsWith("NEXT_PUBLIC_SENTRY_") ||
    name.startsWith("ANTHROPIC_") ||
    name.startsWith("GEMINI_") ||
    name.startsWith("COURSE_TERMINAL_") ||
    name.startsWith("FEEDBACK_") ||
    name.startsWith("AI_NATIVE_PRACTICE_") ||
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
        process.env[name] !== "" && isForbiddenLiveAuthE2EVariable(name),
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
const rateLimitHmacSecret = process.env.RATE_LIMIT_HMAC_SECRET;
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
const SUPABASE_ACCOUNT_VARIABLES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SUPABASE_REGION",
  "SUPABASE_DPA_CONFIRMED_AT",
];
const SUPABASE_MAGIC_LINK_VARIABLES = [
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "SUPABASE_CAPTCHA_CONFIRMED_AT",
  "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
];
const SUPABASE_GOOGLE_OAUTH_VARIABLES = [
  "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
];
const SUPABASE_PROVIDER_VARIABLES = [
  ...SUPABASE_ACCOUNT_VARIABLES,
  ...SUPABASE_MAGIC_LINK_VARIABLES,
  ...SUPABASE_GOOGLE_OAUTH_VARIABLES,
];
const accountSupabaseConfigured = SUPABASE_ACCOUNT_VARIABLES.some(
  hasNonEmptyEnvironmentValue,
);
const magicLinkConfigured = SUPABASE_MAGIC_LINK_VARIABLES.some(
  hasNonEmptyEnvironmentValue,
);
const googleOAuthConfigured = SUPABASE_GOOGLE_OAUTH_VARIABLES.some(
  hasNonEmptyEnvironmentValue,
);
const configuredSupabaseVariables = SUPABASE_PROVIDER_VARIABLES.filter(
  hasNonEmptyEnvironmentValue,
);
const supabaseConfigured = configuredSupabaseVariables.length > 0;
const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

if (
  turnstileSiteKey &&
  !/^[A-Za-z0-9_-]{20,32}$/.test(turnstileSiteKey)
) {
  markError(
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY must be a 20-32 character Cloudflare Turnstile site key.",
  );
}
if (
  process.env.VERCEL_ENV === "production" &&
  turnstileSiteKey &&
  TURNSTILE_TEST_SITE_KEYS.has(turnstileSiteKey)
) {
  markError(
    "Cloudflare Turnstile test site keys are forbidden in production.",
  );
}
if (magicLinkConfigured && !accountSupabaseConfigured) {
  markError(
    "Turnstile is configured without Supabase Auth. Disable every Turnstile variable or provide the complete protected account configuration.",
  );
}
if (googleOAuthConfigured && !accountSupabaseConfigured) {
  markError(
    "Google OAuth is attested without Supabase Auth. Remove SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT or provide the complete account configuration.",
  );
}

// Production and Preview deliberately diverge here. Cloudflare Turnstile
// hostname allowlists cannot wildcard *.vercel.app (a public suffix), and
// each preview URL would additionally need its own entry in Supabase's auth
// uri_allow_list, which already accumulates stale entries from old branches.
// Preview accounts still work; only the magic-link path degrades (the
// runtime turns it off via isMagicLinkRuntimeReady, never advertising a
// broken feature). Production has no such excuse: a real domain always has
// exactly one Turnstile-eligible hostname, so a live account configuration
// missing magic link there is a misconfiguration, not this same asymmetry.
if (
  process.env.VERCEL_ENV === "production" &&
  accountSupabaseConfigured &&
  !magicLinkConfigured
) {
  markError(
    "Production Supabase Auth is configured without magic-link Turnstile protection. " +
      "Preview is allowed to omit Turnstile (see the comment above); production is not.",
  );
}

function validatePublicSupabaseKey(name, value) {
  if (!value) return;
  const keyKind = classifySupabaseKey(value);
  if (keyKind === SUPABASE_KEY_KIND.SECRET) {
    markError(
      `${name} contains a server-only Supabase secret key and must never be exposed to the browser.`,
    );
    return;
  }
  if (keyKind === SUPABASE_KEY_KIND.LEGACY_SERVICE_ROLE) {
    markError(
      `${name} is a legacy JWT without the required anon role and is unsafe for browser use.`,
    );
    return;
  }
  if (!isSafePublicSupabaseKey(value)) {
    markError(
      `${name} must be an exact sb_publishable_<22-char-random>_<8-char-checksum> key or a canonical HS256 legacy JWT with role anon.`,
    );
  }
}

validatePublicSupabaseKey(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
validatePublicSupabaseKey(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

if (
  publicSupabaseKey &&
  serviceSupabaseKey &&
  publicSupabaseKey === serviceSupabaseKey
) {
  markError(
    "The public Supabase key equals SUPABASE_SERVICE_ROLE_KEY. Refusing to expose a privileged key in client JavaScript.",
  );
}

if (serviceSupabaseKey) {
  if (!isServiceSupabaseKey(serviceSupabaseKey)) {
    markError(
      "SUPABASE_SERVICE_ROLE_KEY must be an exact sb_secret_<22-char-random>_<8-char-checksum> key or a canonical HS256 legacy JWT with role service_role.",
    );
  }
}
if (
  rateLimitHmacSecret &&
  !isValidRateLimitHmacSecret(rateLimitHmacSecret)
) {
  markError(
    "RATE_LIMIT_HMAC_SECRET must be an exact rlh1_ prefix followed by 64 lowercase hexadecimal characters generated from 32 random bytes.",
  );
}

function validatedHttpsOrigin(name, value) {
  if (!value) return null;
  if (
    value.length > MAX_ORIGIN_LENGTH ||
    value !== value.trim()
  ) {
    markError(
      `${name} must be an exact, whitespace-free HTTPS origin no longer than ${MAX_ORIGIN_LENGTH} characters.`,
    );
    return null;
  }
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

function validatedSupabaseOrigin(name, value) {
  const origin = validatedHttpsOrigin(name, value);
  if (!origin) return null;

  const hostname = new URL(origin).hostname;
  const port = new URL(origin).port;
  if (port || !/^[a-z0-9-]+\.supabase\.co$/i.test(hostname)) {
    markError(
      `${name} must use a Supabase project origin of the form https://<project-ref>.supabase.co with the default HTTPS port. Custom domains require an explicit code-reviewed allowlist.`,
    );
    return null;
  }
  return origin;
}

const publicOrigin = validatedSupabaseOrigin(
  "NEXT_PUBLIC_SUPABASE_URL",
  publicUrl,
);
const serverOrigin = validatedSupabaseOrigin("SUPABASE_URL", serverUrl);

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
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", turnstileSiteKey],
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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_CAPTCHA_CONFIRMED_AT ||
    process.env.TURNSTILE_CONFIGURATION_CONFIRMED_AT ||
    process.env.SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT
  ) {
    markError(
      "The live-auth-e2e build accepts only the public URL, publishable key, and public Turnstile test site key; privileged, deployment, region, DPA, and anon-alias variables must be absent.",
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
    ["RATE_LIMIT_HMAC_SECRET", rateLimitHmacSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    markError(
      `Supabase is partially configured through ${configuredSupabaseVariables.join(", ")}. Missing: ${missing.join(", ")}. ` +
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
  if (magicLinkConfigured) {
    const missingMagicLinkProtection = [
      ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", turnstileSiteKey],
      [
        "SUPABASE_CAPTCHA_CONFIRMED_AT",
        process.env.SUPABASE_CAPTCHA_CONFIRMED_AT,
      ],
      [
        "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
        process.env.TURNSTILE_CONFIGURATION_CONFIRMED_AT,
      ],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missingMagicLinkProtection.length > 0) {
      markError(
        `Magic-link authentication is partially configured. Missing: ${missingMagicLinkProtection.join(", ")}. Disable every Magic-link/Turnstile variable or provide the complete protected Magic-link configuration.`,
      );
    }
    requireAttestation(
      "SUPABASE_CAPTCHA_CONFIRMED_AT",
      "Supabase Auth CAPTCHA protection",
    );
    requireAttestation(
      "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
      "Cloudflare Turnstile hostname and privacy configuration",
    );
  }
  if (googleOAuthConfigured) {
    requireAttestation(
      "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
      "Supabase Google OAuth",
    );
  }
} else if (liveAuthE2EProfile) {
  markError(
    "The live-auth-e2e build requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_TURNSTILE_SITE_KEY.",
  );
} else {
  if (rateLimitHmacSecret) {
    markError(
      "RATE_LIMIT_HMAC_SECRET is present while Supabase is disabled. Remove the orphaned limiter secret or configure the complete protected account backend.",
    );
  }
  WARN(
    "Supabase is disabled. Login, cross-device sync, account management, and stored feedback are unavailable; public learning content remains available.",
  );
}

// Stored feedback is independent from accounts. It remains disabled until the
// fixed 180-day pruning migration and its daily Cron job have been applied and
// attested. A service-role key alone must never publish the free-text form.
const feedbackEnabled = process.env.FEEDBACK_ENABLED;
const feedbackRetentionAttestation =
  process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT;
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
} else if (feedbackRetentionAttestation) {
  markError(
    "FEEDBACK_RETENTION_CRON_CONFIRMED_AT is present while FEEDBACK_ENABLED is not true. Remove the orphaned attestation or enable and fully configure stored feedback.",
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

// Sentry: runtime reporting and source-map upload are one coherent provider
// boundary. A planted upload credential must not activate the build plugin
// while bypassing the DPA, retention, and DSN checks.
const serverSentryDsn = process.env.SENTRY_DSN;
const publicSentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryDsns = [
  ["SENTRY_DSN", serverSentryDsn],
  ["NEXT_PUBLIC_SENTRY_DSN", publicSentryDsn],
].filter(([, value]) => Boolean(value));
const sentryUploadVariables = [
  ["SENTRY_AUTH_TOKEN", process.env.SENTRY_AUTH_TOKEN],
  ["SENTRY_ORG", process.env.SENTRY_ORG],
  ["SENTRY_PROJECT", process.env.SENTRY_PROJECT],
];
const sentryConfigured = Boolean(
  sentryDsns.length > 0 ||
    sentryUploadVariables.some(([, value]) => Boolean(value)) ||
    process.env.SENTRY_DPA_CONFIRMED_AT ||
    process.env.SENTRY_RETENTION_DAYS,
);

if (sentryConfigured) {
  if (sentryDsns.length === 0) {
    markError(
      "Sentry variables are present but neither SENTRY_DSN nor NEXT_PUBLIC_SENTRY_DSN is configured.",
    );
  }
  const dsnPattern =
    /^https:\/\/[a-f0-9]+@[a-z0-9.-]+(?:\.de)?\.sentry\.io\/\d+$/;
  for (const [name, value] of sentryDsns) {
    if (!dsnPattern.test(value)) {
      markError(
        `${name} appears malformed. Expected https://<key>@<host>.sentry.io/<project-id>.`,
      );
    }
  }
  if (serverSentryDsn && publicSentryDsn && serverSentryDsn !== publicSentryDsn) {
    markError(
      "SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN must identify the same Sentry project.",
    );
  }

  const configuredUploadVariables = sentryUploadVariables.filter(([, value]) =>
    Boolean(value),
  );
  if (
    configuredUploadVariables.length > 0 &&
    configuredUploadVariables.length !== sentryUploadVariables.length
  ) {
    const missing = sentryUploadVariables
      .filter(([, value]) => !value)
      .map(([name]) => name);
    markError(
      `Sentry source-map upload is partially configured. Missing: ${missing.join(", ")}. Disable every upload variable or provide the complete token, organization, and project group.`,
    );
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

// Provider-backed practice: model IDs are a static public allowlist. Every
// selected provider is configured server-side; no client key or arbitrary
// upstream model string is accepted.
const aiEnabled = process.env.AI_NATIVE_PRACTICE_ENABLED;
const allowedModelEnv = process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS;
const KNOWN_PRACTICE_MODELS = new Set([
  "anthropic/claude-haiku-4.5",
  "google/gemini-2.5-flash-lite",
]);
const allowedModels = allowedModelEnv ? allowedModelEnv.split(",") : [];
const modelAllowlistValid =
  allowedModels.length > 0 &&
  allowedModels.every(
    (model) =>
      model.length > 0 &&
      model === model.trim() &&
      KNOWN_PRACTICE_MODELS.has(model),
  ) &&
  new Set(allowedModels).size === allowedModels.length;
const anthropicSelected = allowedModels.includes(
  "anthropic/claude-haiku-4.5",
);
const geminiSelected = allowedModels.includes("google/gemini-2.5-flash-lite");
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropicDpaAttestation = process.env.ANTHROPIC_DPA_CONFIRMED_AT;
const anthropicRetention = process.env.ANTHROPIC_RETENTION_DAYS;
const configuredAnthropicComplianceVariables = [
  ["ANTHROPIC_DPA_CONFIRMED_AT", anthropicDpaAttestation],
  ["ANTHROPIC_RETENTION_DAYS", anthropicRetention],
]
  .filter(([, value]) => Boolean(value))
  .map(([name]) => name);
const anthropicComplianceMetadataPresent =
  configuredAnthropicComplianceVariables.length > 0;
const geminiKey = process.env.GEMINI_API_KEY;
const geminiDpaAttestation = process.env.GEMINI_DPA_CONFIRMED_AT;
const geminiPaidTierAttestation =
  process.env.GEMINI_PAID_TIER_CONFIRMED_AT;
const geminiRetention = process.env.GEMINI_RETENTION_DAYS;
const configuredGeminiComplianceVariables = [
  ["GEMINI_DPA_CONFIRMED_AT", geminiDpaAttestation],
  ["GEMINI_PAID_TIER_CONFIRMED_AT", geminiPaidTierAttestation],
  ["GEMINI_RETENTION_DAYS", geminiRetention],
]
  .filter(([, value]) => Boolean(value))
  .map(([name]) => name);
const geminiComplianceMetadataPresent =
  configuredGeminiComplianceVariables.length > 0;

if (aiEnabled && aiEnabled !== "true" && aiEnabled !== "false") {
  markError("AI_NATIVE_PRACTICE_ENABLED must be exactly true or false when set.");
}
if (
  !modelAllowlistValid &&
  (aiEnabled === "true" || Boolean(allowedModelEnv))
) {
  markError(
    "AI_NATIVE_PRACTICE_ENABLED=true requires AI_NATIVE_PRACTICE_ALLOWED_MODELS as a nonempty, comma-separated, duplicate-free list containing only anthropic/claude-haiku-4.5 and google/gemini-2.5-flash-lite, with no whitespace.",
  );
}
if (aiEnabled === "true" && !supabaseConfigured) {
  markError(
    "AI_NATIVE_PRACTICE_ENABLED=true requires the complete Supabase configuration because production AI quotas fail closed through the durable rate limiter.",
  );
}
if (
  aiEnabled === "true" &&
  !isBoundedPositiveInteger(
    process.env.AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET,
    2_000_000_000,
  )
) {
  markError(
    "AI_NATIVE_PRACTICE_ENABLED=true requires AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET as an integer between 1 and 2000000000.",
  );
}
if (
  aiEnabled === "true" &&
  !isBoundedPositiveInteger(
    process.env.AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET,
    2_000_000_000,
  )
) {
  markError(
    "AI_NATIVE_PRACTICE_ENABLED=true requires AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET as an integer between 1 and 2000000000.",
  );
}
if (aiEnabled === "true" && anthropicSelected && !anthropicKey) {
  markError(
    "Anthropic is selected in AI_NATIVE_PRACTICE_ALLOWED_MODELS but ANTHROPIC_API_KEY is not set.",
  );
}
if (aiEnabled === "true" && geminiSelected && !geminiKey) {
  markError(
    "Gemini is selected in AI_NATIVE_PRACTICE_ALLOWED_MODELS but GEMINI_API_KEY is not set.",
  );
}
if (
  anthropicComplianceMetadataPresent &&
  !anthropicKey &&
  !(aiEnabled === "true" && anthropicSelected)
) {
  markError(
    `Anthropic compliance metadata (${configuredAnthropicComplianceVariables.join(", ")}) is present without ANTHROPIC_API_KEY or AI_NATIVE_PRACTICE_ENABLED=true. Remove the orphaned attestations or fully configure the provider.`,
  );
}
if (
  anthropicKey ||
  (aiEnabled === "true" && anthropicSelected) ||
  anthropicComplianceMetadataPresent
) {
  requireAttestation("ANTHROPIC_DPA_CONFIRMED_AT", "Anthropic");
  const rawRetention = anthropicRetention;
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

if (
  geminiComplianceMetadataPresent &&
  !geminiKey &&
  !(aiEnabled === "true" && geminiSelected)
) {
  markError(
    `Gemini compliance metadata (${configuredGeminiComplianceVariables.join(", ")}) is present without GEMINI_API_KEY or an enabled Gemini model. Remove the orphaned attestations or fully configure the provider.`,
  );
}
if (
  geminiKey ||
  (aiEnabled === "true" && geminiSelected) ||
  geminiComplianceMetadataPresent
) {
  requireAttestation("GEMINI_DPA_CONFIRMED_AT", "Google Gemini API");
  requireAttestation(
    "GEMINI_PAID_TIER_CONFIRMED_AT",
    "Google Gemini API paid tier",
  );
  const retentionDays = geminiRetention?.trim()
    ? Number(geminiRetention)
    : Number.NaN;
  if (
    !Number.isInteger(retentionDays) ||
    retentionDays < 0 ||
    retentionDays > 3650
  ) {
    markError(
      "Gemini is configured but GEMINI_RETENTION_DAYS is not an integer between 0 and 3650 matching the accepted paid-tier API contract.",
    );
  }
}
if (geminiKey && aiEnabled !== "true") {
  WARN(
    "GEMINI_API_KEY is present while AI_NATIVE_PRACTICE_ENABLED is not true. The key is configured but live AI practice remains disabled.",
  );
}

// Real terminal execution is a separate, off-by-default capability. Build
// validation covers the explicit feature contract; runtime readiness also
// requires VERCEL_OIDC_TOKEN, which is injected at runtime and never forwarded
// into provider-free verification child processes.
const terminalEnabled = process.env.COURSE_TERMINAL_ENABLED;
const terminalPolicyAttestation =
  process.env.COURSE_TERMINAL_POLICY_CONFIRMED_AT;
const terminalDailyBudget = process.env.COURSE_TERMINAL_DAILY_RUN_BUDGET;
const terminalSandboxImage = process.env.COURSE_TERMINAL_SANDBOX_IMAGE;
const immutableSandboxImagePattern =
  /^(?=.{1,200}$)[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*@sha256:[a-f0-9]{64}$/u;
if (
  terminalEnabled &&
  terminalEnabled !== "true" &&
  terminalEnabled !== "false"
) {
  markError("COURSE_TERMINAL_ENABLED must be exactly true or false when set.");
}
if (terminalEnabled === "true") {
  if (process.env.VERCEL !== "1") {
    markError(
      "COURSE_TERMINAL_ENABLED=true requires VERCEL=1; local or unknown runtimes fail closed.",
    );
  }
  if (!supabaseConfigured) {
    markError(
      "COURSE_TERMINAL_ENABLED=true requires the complete Supabase configuration for authenticated durable quotas.",
    );
  }
  requireAttestation(
    "COURSE_TERMINAL_POLICY_CONFIRMED_AT",
    "Course terminal synthetic-workspace policy",
  );
  if (!isBoundedPositiveInteger(terminalDailyBudget, 100_000)) {
    markError(
      "COURSE_TERMINAL_ENABLED=true requires COURSE_TERMINAL_DAILY_RUN_BUDGET as an integer between 1 and 100000.",
    );
  }
  if (
    !terminalSandboxImage ||
    terminalSandboxImage !== terminalSandboxImage.trim() ||
    !immutableSandboxImagePattern.test(terminalSandboxImage)
  ) {
    markError(
      "COURSE_TERMINAL_ENABLED=true requires COURSE_TERMINAL_SANDBOX_IMAGE as an immutable OCI digest reference such as repository@sha256:<64 lowercase hex characters>; tags and bare names are rejected.",
    );
  }
}
if (
  terminalEnabled !== "true" &&
  (terminalPolicyAttestation || terminalDailyBudget || terminalSandboxImage)
) {
  markError(
    "Course terminal policy, budget, or image metadata is present while COURSE_TERMINAL_ENABLED is not true. Remove the orphaned values or explicitly enable the terminal.",
  );
}

// Vercel hosting is independent from optional analytics. Telemetry requires an
// explicit opt-in plus a dated TDDDG assessment; being deployed on Vercel alone
// must never silently activate measurement.
const vercelConfigured = process.env.VERCEL === "1";
const vercelTelemetryEnabled = process.env.VERCEL_TELEMETRY_ENABLED === "true";
const vercelDpaAttestation = process.env.VERCEL_DPA_CONFIRMED_AT;
const vercelTelemetryAttestation =
  process.env.VERCEL_TDDDG_ASSESSMENT_AT;

if (
  process.env.VERCEL_TELEMETRY_ENABLED &&
  process.env.VERCEL_TELEMETRY_ENABLED !== "true" &&
  process.env.VERCEL_TELEMETRY_ENABLED !== "false"
) {
  markError(
    "VERCEL_TELEMETRY_ENABLED must be exactly true or false when set.",
  );
}
if (vercelDpaAttestation && !vercelConfigured) {
  markError(
    "VERCEL_DPA_CONFIRMED_AT is present while VERCEL=1 is absent. Remove the orphaned attestation outside a verified Vercel runtime.",
  );
}
if (vercelTelemetryAttestation && !vercelTelemetryEnabled) {
  markError(
    "VERCEL_TDDDG_ASSESSMENT_AT is present while VERCEL_TELEMETRY_ENABLED is not true. Remove the orphaned attestation or explicitly enable telemetry.",
  );
}

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
const presentSideEffectCredentials = SIDE_EFFECT_CREDENTIALS.filter(
  hasNonEmptyEnvironmentValue,
);
const isCredentialBearingBuild = presentSideEffectCredentials.length > 0;

if (hasError && isGatedBuild) {
  ERROR("Environment validation failed. Failing the gated build.");
} else if (hasError && isCredentialBearingBuild) {
  ERROR(
    "Environment validation failed. Failing the credential-bearing local build because these variables can authorize external side effects: " +
      presentSideEffectCredentials.join(", ") +
      ".",
  );
} else if (hasError) {
  ERROR(
    "Environment validation found critical mismatches. Build continues for local development only.",
  );
} else {
  INFO("Environment validation passed.");
}

process.exit(hasError && (isGatedBuild || isCredentialBearingBuild) ? 1 : 0);
