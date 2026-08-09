import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anthropicRetentionDays,
  hasCompleteSupabaseRuntimeConfig,
  isAccountAbuseProtectionReady,
  isAccountRuntimeReady,
  isAnthropicRuntimeReady,
  isGoogleOAuthRuntimeReady,
  isMagicLinkRuntimeReady,
  turnstileSiteKey,
} from "./provider-readiness";

function configureCompleteRuntime(): void {
  vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
  vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
  vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
  vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
}

function configureAccountRuntime(): void {
  configureCompleteRuntime();
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
}

describe("provider runtime readiness", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed until every Anthropic compliance and quota input exists", () => {
    configureCompleteRuntime();
    expect(hasCompleteSupabaseRuntimeConfig()).toBe(true);
    expect(anthropicRetentionDays()).toBe(30);
    expect(isAnthropicRuntimeReady()).toBe(true);

    for (const missing of [
      "ANTHROPIC_DPA_CONFIRMED_AT",
      "ANTHROPIC_RETENTION_DAYS",
      "SUPABASE_SERVICE_ROLE_KEY",
      "RATE_LIMIT_HMAC_SECRET",
    ]) {
      vi.stubEnv(missing, "");
      expect(isAnthropicRuntimeReady(), missing).toBe(false);
      configureCompleteRuntime();
    }
  });

  it("rejects future attestations and invalid retention values", () => {
    configureCompleteRuntime();
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2999-01-01");
    expect(isAnthropicRuntimeReady()).toBe(false);

    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    for (const retention of ["", "-1", "1.5", "3651", "unknown"]) {
      vi.stubEnv("ANTHROPIC_RETENTION_DAYS", retention);
      expect(isAnthropicRuntimeReady(), retention).toBe(false);
    }
  });

  it("activates account abuse protection only for a valid site key and both attestations", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "0x4AAAAAAAFakeProductionKey",
    );
    vi.stubEnv("SUPABASE_CAPTCHA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("TURNSTILE_CONFIGURATION_CONFIRMED_AT", "2026-07-01");
    expect(turnstileSiteKey()).toBe("0x4AAAAAAAFakeProductionKey");
    expect(isAccountAbuseProtectionReady()).toBe(true);

    vi.stubEnv("SUPABASE_CAPTCHA_CONFIRMED_AT", "");
    expect(isAccountAbuseProtectionReady()).toBe(false);
    vi.stubEnv("SUPABASE_CAPTCHA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("TURNSTILE_CONFIGURATION_CONFIRMED_AT", "2999-01-01");
    expect(isAccountAbuseProtectionReady()).toBe(false);
  });

  it("keeps core account, magic-link, and Google OAuth readiness independent", () => {
    configureAccountRuntime();

    expect(isAccountRuntimeReady()).toBe(true);
    expect(isMagicLinkRuntimeReady()).toBe(false);
    expect(isGoogleOAuthRuntimeReady()).toBe(false);

    vi.stubEnv(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "0x4AAAAAAAFakeProductionKey",
    );
    vi.stubEnv("SUPABASE_CAPTCHA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("TURNSTILE_CONFIGURATION_CONFIRMED_AT", "2026-07-01");
    expect(isMagicLinkRuntimeReady()).toBe(true);
    expect(isGoogleOAuthRuntimeReady()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT", "2026-08-08");
    expect(isMagicLinkRuntimeReady()).toBe(false);
    expect(isGoogleOAuthRuntimeReady()).toBe(true);
  });

  it("fails every account sign-in method closed without the core EU account boundary", () => {
    configureAccountRuntime();
    vi.stubEnv(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "0x4AAAAAAAFakeProductionKey",
    );
    vi.stubEnv("SUPABASE_CAPTCHA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("TURNSTILE_CONFIGURATION_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT", "2026-08-08");

    vi.stubEnv("SUPABASE_REGION", "us-east-1");
    expect(isAccountRuntimeReady()).toBe(false);
    expect(isMagicLinkRuntimeReady()).toBe(false);
    expect(isGoogleOAuthRuntimeReady()).toBe(false);

    vi.stubEnv("SUPABASE_REGION", "eu-central-1");
    vi.stubEnv("SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT", "2999-01-01");
    expect(isAccountRuntimeReady()).toBe(true);
    expect(isMagicLinkRuntimeReady()).toBe(true);
    expect(isGoogleOAuthRuntimeReady()).toBe(false);
  });

  it("rejects Cloudflare test keys in a production runtime", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "1x00000000000000000000AA",
    );
    expect(turnstileSiteKey()).toBeNull();
  });
});
