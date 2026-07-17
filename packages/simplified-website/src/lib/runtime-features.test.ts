import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRuntimeFeatures } from "./runtime-features";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_REGION",
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

const original = new Map<string, string | undefined>();

describe("getRuntimeFeatures", () => {
  beforeEach(() => {
    for (const key of KEYS) {
      original.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
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

  it("requires both public and service Supabase boundaries for an account", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    expect(getRuntimeFeatures().account).toBe(false);

    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[KEYS[4]] = "fake-service-key";
    process.env.SUPABASE_REGION = "eu-central-1";
    const features = getRuntimeFeatures();
    expect(features.account).toBe(true);
    expect(features.feedback).toBe(false);
    expect(features.supabaseRegion).toBe("eu-central-1");

    process.env.FEEDBACK_ENABLED = "true";
    process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT = "2026-07-14";
    expect(getRuntimeFeatures().feedback).toBe(true);
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
    process.env[KEYS[12]] = "fake-anthropic-key";
    process.env.ANTHROPIC_RETENTION_DAYS = "30";
    process.env.ANTHROPIC_DPA_CONFIRMED_AT = "2026-07-01";
    expect(getRuntimeFeatures().anthropic).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
    process.env.SUPABASE_URL = "https://fake-project.supabase.co";
    process.env[KEYS[4]] = "fake-service-key";
    const features = getRuntimeFeatures();
    expect(features.anthropic).toBe(true);
    expect(features.anthropicRetentionDays).toBe(30);
  });
});
