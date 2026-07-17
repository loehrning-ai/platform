import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anthropicRetentionDays,
  hasCompleteSupabaseRuntimeConfig,
  isAnthropicRuntimeReady,
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
});
