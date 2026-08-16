import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRuntimeFeatures } from "./runtime-features";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SUPABASE_REGION",
  "SUPABASE_DPA_CONFIRMED_AT",
  "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
  "SUPABASE_CAPTCHA_CONFIRMED_AT",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_RETENTION_DAYS",
  "FEEDBACK_ENABLED",
  "FEEDBACK_RETENTION_CRON_CONFIRMED_AT",
  "AI_NATIVE_PRACTICE_ENABLED",
  "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
  "AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET",
  "AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_RETENTION_DAYS",
  "GEMINI_API_KEY",
  "GEMINI_DPA_CONFIRMED_AT",
  "GEMINI_PAID_TIER_CONFIRMED_AT",
  "GEMINI_RETENTION_DAYS",
  "COURSE_TERMINAL_ENABLED",
  "COURSE_TERMINAL_DAILY_RUN_BUDGET",
  "COURSE_TERMINAL_POLICY_CONFIRMED_AT",
  "COURSE_TERMINAL_SANDBOX_IMAGE",
  "VERCEL",
  "VERCEL_DPA_CONFIRMED_AT",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_TELEMETRY_ENABLED",
  "ANTHROPIC_DPA_CONFIRMED_AT",
] as const;

const SERVICE_CREDENTIAL_ENV_KEY = "SUPABASE_SERVICE_ROLE_KEY";
const AI_PROVIDER_CREDENTIAL_ENV_KEY = "ANTHROPIC_API_KEY";
const GEMINI_PROVIDER_CREDENTIAL_ENV_KEY = "GEMINI_API_KEY";
const VALID_LIMITER_SECRET = `rlh1_${"a".repeat(64)}`;
const original = new Map<string, string | undefined>();

describe("getRuntimeFeatures", () => {
  beforeEach(() => {
    for (const key of KEYS) {
      original.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const key of KEYS) {
      const value = original.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    original.clear();
  });

  it("reports the credential-free default without optional providers", () => {
    expect(getRuntimeFeatures()).toEqual({
      account: false,
      magicLink: false,
      google: false,
      turnstileSiteKey: null,
      feedback: false,
      supabase: false,
      supabaseRegion: null,
      sentry: false,
      sentryRetentionDays: null,
      anthropic: false,
      anthropicRetentionDays: null,
      gemini: false,
      geminiRetentionDays: null,
      practiceModels: [],
      courseTerminal: false,
      vercelHosting: false,
      vercelTelemetry: false,
    });
  });

  it("keeps account readiness independent from optional sign-in methods", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    expect(getRuntimeFeatures().account).toBe(false);

    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[SERVICE_CREDENTIAL_ENV_KEY] = "fake-service-key";
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);
    process.env.SUPABASE_REGION = "eu-central-1";
    expect(getRuntimeFeatures().account).toBe(false);
    process.env.SUPABASE_DPA_CONFIRMED_AT = "2026-07-01";
    expect(getRuntimeFeatures().account).toBe(true);
    expect(getRuntimeFeatures().magicLink).toBe(false);
    expect(getRuntimeFeatures().google).toBe(false);
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY =
      "0x4AAAAAAAFakeProductionKey";
    process.env.SUPABASE_CAPTCHA_CONFIRMED_AT = "2026-07-01";
    process.env.TURNSTILE_CONFIGURATION_CONFIRMED_AT = "2026-07-01";
    const features = getRuntimeFeatures();
    expect(features.account).toBe(true);
    expect(features.magicLink).toBe(true);
    expect(features.google).toBe(false);
    expect(features.turnstileSiteKey).toBe(
      "0x4AAAAAAAFakeProductionKey",
    );
    expect(features.feedback).toBe(false);
    expect(features.supabaseRegion).toBe("eu-central-1");

    process.env.FEEDBACK_ENABLED = "true";
    process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT = "2026-07-14";
    expect(getRuntimeFeatures().feedback).toBe(true);

    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "";
    process.env.SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT = "2026-08-08";
    const googleOnlyFeatures = getRuntimeFeatures();
    expect(googleOnlyFeatures.account).toBe(true);
    expect(googleOnlyFeatures.magicLink).toBe(false);
    expect(googleOnlyFeatures.google).toBe(true);
    expect(googleOnlyFeatures.turnstileSiteKey).toBeNull();
  });

  it("fails the account closed for missing, future, malformed, or production-test CAPTCHA configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[SERVICE_CREDENTIAL_ENV_KEY] = "fake-service-key";
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);
    process.env.SUPABASE_REGION = "eu-central-1";
    process.env.SUPABASE_DPA_CONFIRMED_AT = "2026-07-01";
    process.env.SUPABASE_CAPTCHA_CONFIRMED_AT = "2026-07-01";
    process.env.TURNSTILE_CONFIGURATION_CONFIRMED_AT = "2026-07-01";

    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "bad";
    expect(getRuntimeFeatures().account).toBe(true);
    expect(getRuntimeFeatures().magicLink).toBe(false);

    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY =
      "0x4AAAAAAAFakeProductionKey";
    process.env.SUPABASE_CAPTCHA_CONFIRMED_AT = "2999-01-01";
    expect(getRuntimeFeatures().account).toBe(true);
    expect(getRuntimeFeatures().magicLink).toBe(false);
    expect(getRuntimeFeatures().turnstileSiteKey).toBeNull();
  });

  it("does not activate telemetry merely because Vercel hosts the build", () => {
    process.env.VERCEL = "1";
    expect(getRuntimeFeatures().vercelHosting).toBe(true);
    expect(getRuntimeFeatures().vercelTelemetry).toBe(false);

    process.env.VERCEL_TELEMETRY_ENABLED = "true";
    expect(getRuntimeFeatures().vercelTelemetry).toBe(true);
  });

  it("reports Anthropic active only with the complete quota backend", () => {
    process.env.AI_NATIVE_PRACTICE_ENABLED = "true";
    process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS =
      "anthropic/claude-haiku-4.5";
    process.env.AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET = "10000";
    process.env.AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET = "100000";
    process.env[AI_PROVIDER_CREDENTIAL_ENV_KEY] = "fake-anthropic-key";
    process.env.ANTHROPIC_RETENTION_DAYS = "30";
    process.env.ANTHROPIC_DPA_CONFIRMED_AT = "2026-07-01";
    expect(getRuntimeFeatures().anthropic).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[SERVICE_CREDENTIAL_ENV_KEY] = "fake-service-key";
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);
    const features = getRuntimeFeatures();
    expect(features.anthropic).toBe(true);
    expect(features.anthropicRetentionDays).toBe(30);
    expect(features.practiceModels).toEqual([
      "anthropic/claude-haiku-4.5",
    ]);

    process.env.AI_NATIVE_PRACTICE_ENABLED = "false";
    expect(getRuntimeFeatures().anthropic).toBe(false);
    process.env.AI_NATIVE_PRACTICE_ENABLED = "true";
    process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS =
      "google/gemini-2.5-flash-lite";
    expect(getRuntimeFeatures().anthropic).toBe(false);
  });

  it("reports only the exact provider models that pass the complete practice gate", () => {
    process.env.AI_NATIVE_PRACTICE_ENABLED = "true";
    process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS =
      "anthropic/claude-haiku-4.5,google/gemini-2.5-flash-lite";
    process.env.AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET = "10000";
    process.env.AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET = "100000";
    process.env[AI_PROVIDER_CREDENTIAL_ENV_KEY] = "fake-anthropic-key";
    process.env.ANTHROPIC_DPA_CONFIRMED_AT = "2026-07-01";
    process.env.ANTHROPIC_RETENTION_DAYS = "30";
    process.env[GEMINI_PROVIDER_CREDENTIAL_ENV_KEY] = "fake-gemini-key";
    process.env.GEMINI_DPA_CONFIRMED_AT = "2026-07-01";
    process.env.GEMINI_PAID_TIER_CONFIRMED_AT = "2026-07-01";
    process.env.GEMINI_RETENTION_DAYS = "0";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[SERVICE_CREDENTIAL_ENV_KEY] = "fake-service-key";
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);

    expect(getRuntimeFeatures()).toMatchObject({
      anthropic: true,
      gemini: true,
      anthropicRetentionDays: 30,
      geminiRetentionDays: 0,
      practiceModels: [
        "anthropic/claude-haiku-4.5",
        "google/gemini-2.5-flash-lite",
      ],
    });

    process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS =
      "google/gemini-2.5-flash-lite";
    expect(getRuntimeFeatures().practiceModels).toEqual([
      "google/gemini-2.5-flash-lite",
    ]);
  });

  it("reports the isolated terminal only when every runtime gate is ready", () => {
    process.env.COURSE_TERMINAL_ENABLED = "true";
    process.env.COURSE_TERMINAL_DAILY_RUN_BUDGET = "100";
    process.env.COURSE_TERMINAL_POLICY_CONFIRMED_AT = "2026-08-13";
    process.env.COURSE_TERMINAL_SANDBOX_IMAGE =
      `vercel/sandbox/node@sha256:${"a".repeat(64)}`;
    process.env.VERCEL = "1";
    process.env.VERCEL_DPA_CONFIRMED_AT = "2026-07-01";
    process.env.VERCEL_OIDC_TOKEN = "fake-runtime-oidc";
    expect(getRuntimeFeatures().courseTerminal).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[SERVICE_CREDENTIAL_ENV_KEY] = "fake-service-key";
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);
    expect(getRuntimeFeatures().courseTerminal).toBe(true);

    process.env.VERCEL_OIDC_TOKEN = "";
    expect(getRuntimeFeatures().courseTerminal).toBe(false);
  });
});
