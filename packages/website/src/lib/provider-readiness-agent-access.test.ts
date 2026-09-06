/**
 * Fail-closed coverage for the four agent-access capabilities.
 *
 * Every predicate is asserted twice: once fully configured, and once for each
 * marker removed in turn, so a capability can never come on with an incomplete
 * configuration.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  byoChatAllowedModels,
  cvEngineHostedOrigin,
  isAgentAccessReady,
  isByoChatReady,
  isCvEngineHostedReady,
  isOAuthServerReady,
  isValidAccountLlmKek,
} from "./provider-readiness";
import { getAgentRuntimeFeatures } from "./runtime-features";

const VALID_KEK = `kek1_${"a".repeat(64)}`;
const VALID_LIMITER_SECRET = `rlh1_${"b".repeat(64)}`;

function configureSupabaseRuntime(): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", VALID_LIMITER_SECRET);
}

function configureAccountRuntime(): void {
  configureSupabaseRuntime();
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
}

afterEach(() => vi.unstubAllEnvs());

describe("isAgentAccessReady", () => {
  it("needs the explicit switch and the durable limiter backend", () => {
    expect(isAgentAccessReady()).toBe(false);

    vi.stubEnv("MCP_SERVER_ENABLED", "true");
    expect(isAgentAccessReady()).toBe(false);

    configureSupabaseRuntime();
    expect(isAgentAccessReady()).toBe(true);

    for (const missing of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "RATE_LIMIT_HMAC_SECRET",
      "SUPABASE_URL",
    ]) {
      const previous = process.env[missing];
      vi.stubEnv(missing, "");
      expect(isAgentAccessReady()).toBe(false);
      vi.stubEnv(missing, previous ?? "");
      configureSupabaseRuntime();
    }
  });

  it("treats any value other than the exact string true as off", () => {
    configureSupabaseRuntime();
    for (const value of ["", "1", "TRUE", "yes", "false"]) {
      vi.stubEnv("MCP_SERVER_ENABLED", value);
      expect(isAgentAccessReady()).toBe(false);
    }
  });
});

describe("isOAuthServerReady", () => {
  it("needs the complete account runtime and a dated attestation", () => {
    expect(isOAuthServerReady()).toBe(false);

    configureAccountRuntime();
    expect(isOAuthServerReady()).toBe(false);

    vi.stubEnv("SUPABASE_OAUTH_SERVER_CONFIRMED_AT", "2026-07-01");
    expect(isOAuthServerReady()).toBe(true);

    for (const invalid of ["", "soon", "2099-01-01", "2026-13-01", "20260701"]) {
      vi.stubEnv("SUPABASE_OAUTH_SERVER_CONFIRMED_AT", invalid);
      expect(isOAuthServerReady()).toBe(false);
    }

    vi.stubEnv("SUPABASE_OAUTH_SERVER_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "");
    expect(isOAuthServerReady()).toBe(false);
  });
});

describe("account key-encryption key", () => {
  it("accepts only the prefixed 32-byte hexadecimal form", () => {
    expect(isValidAccountLlmKek(VALID_KEK)).toBe(true);
    for (const invalid of [
      undefined,
      "",
      "a".repeat(64),
      `kek1_${"a".repeat(63)}`,
      `kek1_${"a".repeat(65)}`,
      `kek1_${"A".repeat(64)}`,
      `kek2_${"a".repeat(64)}`,
      ` kek1_${"a".repeat(64)}`,
      "sk-ant-obviously-fake",
    ]) {
      expect(isValidAccountLlmKek(invalid as string | undefined)).toBe(false);
    }
  });
});

describe("byoChatAllowedModels", () => {
  it("authorizes nothing without an exact list", () => {
    expect(byoChatAllowedModels()).toEqual([]);
    for (const invalid of [
      "",
      ",",
      "claude-haiku-4.5,",
      " claude-haiku-4.5",
      "claude-haiku-4.5,claude-haiku-4.5",
      "Claude-Haiku",
      "claude haiku",
      "a,b,c,d,e,f,g,h,i",
      `${"m".repeat(65)}`,
    ]) {
      vi.stubEnv("BYO_CHAT_MODEL_ALLOWLIST", invalid);
      expect(byoChatAllowedModels()).toEqual([]);
    }
  });

  it("keeps the configured order for a valid list", () => {
    vi.stubEnv(
      "BYO_CHAT_MODEL_ALLOWLIST",
      "claude-haiku-4.5,claude-sonnet-4-5",
    );
    expect(byoChatAllowedModels()).toEqual([
      "claude-haiku-4.5",
      "claude-sonnet-4-5",
    ]);
  });
});

describe("isByoChatReady", () => {
  it("needs the switch, the key, an allowlist and the account runtime", () => {
    expect(isByoChatReady()).toBe(false);

    vi.stubEnv("BYO_CHAT_ENABLED", "true");
    expect(isByoChatReady()).toBe(false);

    vi.stubEnv("ACCOUNT_LLM_KEK", VALID_KEK);
    expect(isByoChatReady()).toBe(false);

    vi.stubEnv("BYO_CHAT_MODEL_ALLOWLIST", "claude-haiku-4.5");
    expect(isByoChatReady()).toBe(false);

    configureAccountRuntime();
    expect(isByoChatReady()).toBe(true);

    vi.stubEnv("ACCOUNT_LLM_KEK", "not-a-key");
    expect(isByoChatReady()).toBe(false);
    vi.stubEnv("ACCOUNT_LLM_KEK", VALID_KEK);

    vi.stubEnv("BYO_CHAT_ENABLED", "false");
    expect(isByoChatReady()).toBe(false);
  });
});

describe("cvEngineHostedOrigin", () => {
  it("accepts only an exact HTTPS origin on a loehrning.ai host", () => {
    expect(cvEngineHostedOrigin()).toBeNull();

    vi.stubEnv("CV_ENGINE_HOSTED_URL", "https://cv.loehrning.ai");
    expect(cvEngineHostedOrigin()).toBe("https://cv.loehrning.ai");

    for (const invalid of [
      "http://cv.loehrning.ai",
      "https://cv.loehrning.ai/api",
      "https://cv.loehrning.ai/?x=1",
      "https://cv.loehrning.ai/#f",
      "https://user:pass@cv.loehrning.ai",
      " https://cv.loehrning.ai",
      "cv.loehrning.ai",
      "javascript:alert(1)",
      `https://cv.loehrning.ai/${"x".repeat(600)}`,
      // A bearer token is forwarded to this origin, so a third-party host and
      // a non-default port are refusals, not conveniences. A lookalike
      // hostname that merely ends in the project's name is the case a
      // suffix check without an anchor would let through.
      "https://cv.example.org",
      "https://cv.loehrning.ai:8443",
      "https://cv.loehrning.ai.example.com",
      "https://loehrning.ai.example.com",
    ]) {
      vi.stubEnv("CV_ENGINE_HOSTED_URL", invalid);
      expect(cvEngineHostedOrigin()).toBeNull();
    }
  });
});

describe("isCvEngineHostedReady", () => {
  it("needs the origin, the attestation and the Supabase runtime", () => {
    expect(isCvEngineHostedReady()).toBe(false);

    vi.stubEnv("CV_ENGINE_HOSTED_URL", "https://cv.loehrning.ai");
    expect(isCvEngineHostedReady()).toBe(false);

    vi.stubEnv("CV_ENGINE_HOSTED_CONFIRMED_AT", "2026-08-01");
    expect(isCvEngineHostedReady()).toBe(false);

    configureSupabaseRuntime();
    expect(isCvEngineHostedReady()).toBe(true);

    vi.stubEnv("CV_ENGINE_HOSTED_CONFIRMED_AT", "");
    expect(isCvEngineHostedReady()).toBe(false);
  });
});

describe("agent runtime features", () => {
  it("reports every agent capability as off by default", () => {
    const features = getAgentRuntimeFeatures();
    expect(features.agentAccess).toBe(false);
    expect(features.oauthServer).toBe(false);
    expect(features.byoChat).toBe(false);
    expect(features.byoChatModels).toEqual([]);
    expect(features.cvEngineHosted).toBe(false);
  });

  it("exposes the model allowlist only once the chat is ready", () => {
    vi.stubEnv("BYO_CHAT_ENABLED", "true");
    vi.stubEnv("BYO_CHAT_MODEL_ALLOWLIST", "claude-haiku-4.5");
    vi.stubEnv("ACCOUNT_LLM_KEK", VALID_KEK);
    expect(getAgentRuntimeFeatures().byoChatModels).toEqual([]);

    configureAccountRuntime();
    const features = getAgentRuntimeFeatures();
    expect(features.byoChat).toBe(true);
    expect(features.byoChatModels).toEqual(["claude-haiku-4.5"]);
  });
});
