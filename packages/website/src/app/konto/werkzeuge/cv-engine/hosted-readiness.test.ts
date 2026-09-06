import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cvEngineHostedOrigin,
  isCvEngineHostedReady,
} from "@/lib/provider-readiness";
import { cvEngineHandoffOrigin } from "./hosted-readiness";

function configureAccountRuntime(): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
}

function configureHostedTool(): void {
  configureAccountRuntime();
  vi.stubEnv("CV_ENGINE_HOSTED_URL", "https://cv.loehrning.ai");
  vi.stubEnv("CV_ENGINE_HOSTED_CONFIRMED_AT", "2026-08-20");
}

afterEach(() => vi.unstubAllEnvs());

describe("hosted cv-engine readiness", () => {
  it("accepts only an exact loehrning.ai HTTPS origin", () => {
    configureAccountRuntime();
    for (const [value, origin] of [
      ["https://cv.loehrning.ai", "https://cv.loehrning.ai"],
      ["https://cv.loehrning.ai/", "https://cv.loehrning.ai"],
      ["https://CV.LOEHRNING.AI", "https://cv.loehrning.ai"],
      ["https://loehrning.ai", "https://loehrning.ai"],
    ] as const) {
      vi.stubEnv("CV_ENGINE_HOSTED_URL", value);
      expect(cvEngineHostedOrigin(), value).toBe(origin);
    }

    for (const rejected of [
      "",
      "http://cv.loehrning.ai",
      "https://cv.loehrning.ai:8443",
      "https://cv.loehrning.ai/app",
      "https://cv.loehrning.ai?document=1",
      "https://cv.loehrning.ai#top",
      "https://operator:secret@cv.loehrning.ai",
      "https://cv.example.com",
      "https://evil-loehrning.ai",
      "https://loehrning.ai.attacker.test",
      " https://cv.loehrning.ai",
      "cv.loehrning.ai",
      `https://${"a".repeat(2100)}.loehrning.ai`,
    ]) {
      vi.stubEnv("CV_ENGINE_HOSTED_URL", rejected);
      expect(cvEngineHostedOrigin(), rejected).toBeNull();
      expect(isCvEngineHostedReady(), rejected).toBe(false);
      expect(cvEngineHandoffOrigin(), rejected).toBeNull();
    }
  });

  it("stays off until the origin, the dated review, and the account boundary exist", () => {
    configureAccountRuntime();
    vi.stubEnv("CV_ENGINE_HOSTED_URL", "https://cv.loehrning.ai");
    expect(isCvEngineHostedReady()).toBe(false);

    vi.stubEnv("CV_ENGINE_HOSTED_CONFIRMED_AT", "2026-08-20");
    expect(isCvEngineHostedReady()).toBe(true);

    vi.stubEnv("CV_ENGINE_HOSTED_CONFIRMED_AT", "2999-01-01");
    expect(isCvEngineHostedReady()).toBe(false);

    for (const missing of [
      "CV_ENGINE_HOSTED_URL",
      "CV_ENGINE_HOSTED_CONFIRMED_AT",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_REGION",
      "SUPABASE_DPA_CONFIRMED_AT",
      "RATE_LIMIT_HMAC_SECRET",
    ]) {
      configureHostedTool();
      expect(isCvEngineHostedReady(), missing).toBe(true);
      vi.stubEnv(missing, "");
      expect(isCvEngineHostedReady(), missing).toBe(false);
      expect(cvEngineHandoffOrigin(), missing).toBeNull();
    }
  });

  it("refuses a non-EU account region even with a reviewed hosted origin", () => {
    configureHostedTool();
    vi.stubEnv("SUPABASE_REGION", "us-east-1");
    expect(cvEngineHostedOrigin()).toBe("https://cv.loehrning.ai");
    expect(isCvEngineHostedReady()).toBe(false);
    expect(cvEngineHandoffOrigin()).toBeNull();
  });

  it("hands out a destination only together with a passing gate", () => {
    configureHostedTool();
    expect(cvEngineHandoffOrigin()).toBe("https://cv.loehrning.ai");
  });
});
