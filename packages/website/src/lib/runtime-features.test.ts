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
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_RETENTION_DAYS",
  "VERCEL",
  "VERCEL_TELEMETRY_ENABLED",
  "ANTHROPIC_DPA_CONFIRMED_AT",
] as const;

const SERVICE_CREDENTIAL_ENV_KEY = "SUPABASE_SERVICE_ROLE_KEY";
const AI_PROVIDER_CREDENTIAL_ENV_KEY = "ANTHROPIC_API_KEY";
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
  });
});
