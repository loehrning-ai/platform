import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anthropicRetentionDays,
  courseTerminalDailyRunBudget,
  courseTerminalSandboxImage,
  geminiRetentionDays,
  hasCompleteSupabaseRuntimeConfig,
  isAccountAbuseProtectionReady,
  isAccountRuntimeReady,
  isAnthropicRuntimeReady,
  isCourseTerminalRuntimeReady,
  isGeminiRuntimeReady,
  isGoogleOAuthRuntimeReady,
  isMagicLinkRuntimeReady,
  isPracticeModelRuntimeReady,
  practiceAllowedModels,
  practiceModelAllowlistDecision,
  turnstileSiteKey,
} from "./provider-readiness";

function configureCompleteRuntime(): void {
  vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
  vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
  vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
  vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
  vi.stubEnv("AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET", "100000");
  vi.stubEnv("AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET", "1000000");
  vi.stubEnv(
    "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
    "anthropic/claude-haiku-4.5",
  );
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

  it("enforces an exact deployment model allowlist and daily token budgets", () => {
    configureCompleteRuntime();
    expect(practiceAllowedModels()).toEqual([
      "anthropic/claude-haiku-4.5",
    ]);
    expect(
      isPracticeModelRuntimeReady("anthropic/claude-haiku-4.5"),
    ).toBe(true);
    expect(
      isPracticeModelRuntimeReady("google/gemini-2.5-flash-lite"),
    ).toBe(false);

    for (const malformed of [
      "anthropic/claude-haiku-4.5, anthropic/claude-haiku-4.5",
      "anthropic/claude-haiku-4.5,anthropic/claude-haiku-4.5",
      "google/gemini-latest",
      ",",
    ]) {
      vi.stubEnv("AI_NATIVE_PRACTICE_ALLOWED_MODELS", malformed);
      expect(practiceAllowedModels(), malformed).toEqual([]);
      expect(
        isPracticeModelRuntimeReady("anthropic/claude-haiku-4.5"),
        malformed,
      ).toBe(false);
    }

    configureCompleteRuntime();
    vi.stubEnv("AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET", "0");
    expect(
      isPracticeModelRuntimeReady("anthropic/claude-haiku-4.5"),
    ).toBe(false);
  });

  it("fails closed when the model allowlist is absent and distinguishes explicit denial", () => {
    configureCompleteRuntime();
    vi.stubEnv("AI_NATIVE_PRACTICE_ALLOWED_MODELS", "");
    expect(practiceAllowedModels()).toEqual([]);
    expect(
      practiceModelAllowlistDecision("anthropic/claude-haiku-4.5"),
    ).toBe("invalid");
    expect(
      isPracticeModelRuntimeReady("anthropic/claude-haiku-4.5"),
    ).toBe(false);

    vi.stubEnv(
      "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
      "google/gemini-2.5-flash-lite",
    );
    expect(
      practiceModelAllowlistDecision("anthropic/claude-haiku-4.5"),
    ).toBe("denied");
  });

  it("activates Gemini only with paid-tier, DPA, retention, allowlist, quota, and Supabase gates", () => {
    configureCompleteRuntime();
    vi.stubEnv(
      "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
      "google/gemini-2.5-flash-lite",
    );
    vi.stubEnv("GEMINI_API_KEY", "obviously-fake-gemini-key");
    vi.stubEnv("GEMINI_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("GEMINI_PAID_TIER_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("GEMINI_RETENTION_DAYS", "0");

    expect(geminiRetentionDays()).toBe(0);
    expect(isGeminiRuntimeReady()).toBe(true);
    expect(
      isPracticeModelRuntimeReady("google/gemini-2.5-flash-lite"),
    ).toBe(true);

    for (const missing of [
      "GEMINI_API_KEY",
      "GEMINI_DPA_CONFIRMED_AT",
      "GEMINI_PAID_TIER_CONFIRMED_AT",
      "GEMINI_RETENTION_DAYS",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]) {
      vi.stubEnv(missing, "");
      expect(isGeminiRuntimeReady(), missing).toBe(false);
      configureCompleteRuntime();
      vi.stubEnv(
        "AI_NATIVE_PRACTICE_ALLOWED_MODELS",
        "google/gemini-2.5-flash-lite",
      );
      vi.stubEnv("GEMINI_API_KEY", "obviously-fake-gemini-key");
      vi.stubEnv("GEMINI_DPA_CONFIRMED_AT", "2026-07-01");
      vi.stubEnv("GEMINI_PAID_TIER_CONFIRMED_AT", "2026-07-01");
      vi.stubEnv("GEMINI_RETENTION_DAYS", "0");
    }
  });

  it("keeps the real terminal off until every Vercel, policy, quota, and auth gate is ready", () => {
    configureCompleteRuntime();
    vi.stubEnv("COURSE_TERMINAL_ENABLED", "true");
    vi.stubEnv("COURSE_TERMINAL_DAILY_RUN_BUDGET", "100");
    vi.stubEnv("COURSE_TERMINAL_POLICY_CONFIRMED_AT", "2026-08-13");
    vi.stubEnv(
      "COURSE_TERMINAL_SANDBOX_IMAGE",
      `vercel/sandbox/node@sha256:${"a".repeat(64)}`,
    );
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "fake-runtime-oidc");

    expect(courseTerminalDailyRunBudget()).toBe(100);
    expect(courseTerminalSandboxImage()).toBe(
      `vercel/sandbox/node@sha256:${"a".repeat(64)}`,
    );
    expect(isCourseTerminalRuntimeReady()).toBe(true);

    for (const missing of [
      "COURSE_TERMINAL_ENABLED",
      "COURSE_TERMINAL_DAILY_RUN_BUDGET",
      "COURSE_TERMINAL_POLICY_CONFIRMED_AT",
      "COURSE_TERMINAL_SANDBOX_IMAGE",
      "VERCEL",
      "VERCEL_DPA_CONFIRMED_AT",
      "VERCEL_OIDC_TOKEN",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]) {
      vi.stubEnv(missing, "");
      expect(isCourseTerminalRuntimeReady(), missing).toBe(false);
      configureCompleteRuntime();
      vi.stubEnv("COURSE_TERMINAL_ENABLED", "true");
      vi.stubEnv("COURSE_TERMINAL_DAILY_RUN_BUDGET", "100");
      vi.stubEnv("COURSE_TERMINAL_POLICY_CONFIRMED_AT", "2026-08-13");
      vi.stubEnv(
        "COURSE_TERMINAL_SANDBOX_IMAGE",
        `vercel/sandbox/node@sha256:${"a".repeat(64)}`,
      );
      vi.stubEnv("VERCEL", "1");
      vi.stubEnv("VERCEL_DPA_CONFIRMED_AT", "2026-07-01");
      vi.stubEnv("VERCEL_OIDC_TOKEN", "fake-runtime-oidc");
    }

    for (const invalid of [
      "vercel/sandbox/node:24",
      "vercel/sandbox/node:24@sha256:abc",
      `vercel/sandbox/node@sha256:${"A".repeat(64)}`,
      ` vercel/sandbox/node@sha256:${"a".repeat(64)}`,
    ]) {
      vi.stubEnv("COURSE_TERMINAL_SANDBOX_IMAGE", invalid);
      expect(courseTerminalSandboxImage(), invalid).toBeNull();
      expect(isCourseTerminalRuntimeReady(), invalid).toBe(false);
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
