import { describe, expect, it } from "vitest";
import { ACCOUNT_CHAT_ERROR_CODES } from "@/lib/anthropic-chat/errors";
import { agentErrorMessage, type ErrorRegion } from "./error-messages";

const FALLBACK = "generic fallback";
const REGIONS: readonly ErrorRegion[] = ["key", "token", "grant", "chat"];

describe("named API failures", () => {
  it("covers every error code the chat route can answer with", () => {
    for (const code of ACCOUNT_CHAT_ERROR_CODES) {
      for (const locale of ["de", "en"] as const) {
        const message = agentErrorMessage("chat", code, locale, FALLBACK);
        expect(message, `missing chat message for ${code}`).not.toBe(FALLBACK);
        expect(message.length).toBeGreaterThan(10);
      }
    }
  });

  it.each([
    ["key", "llm_key_rejected"],
    ["key", "provider_timeout"],
    ["key", "llm_key_validation_failed"],
    ["key", "byo_chat_not_ready"],
    ["token", "token_limit"],
    ["token", "token_not_found"],
    ["token", "agent_access_disabled"],
    ["grant", "grant_revoke_failed"],
    ["grant", "oauth_server_unavailable"],
  ] as const)("names the %s failure %s", (region, code) => {
    expect(agentErrorMessage(region, code, "de", FALLBACK)).not.toBe(FALLBACK);
    expect(agentErrorMessage(region, code, "en", FALLBACK)).not.toBe(FALLBACK);
  });

  it.each(REGIONS)(
    "answers the shared transport failures in region %s",
    (region) => {
      for (const code of [
        "unauthorized",
        "auth_unavailable",
        "auth_not_configured",
        "rate_limit_exceeded",
        "rate_limit_unavailable",
        "payload_too_large",
        "account_owner_mismatch",
        "unsupported_media_type",
      ]) {
        expect(agentErrorMessage(region, code, "de", FALLBACK)).not.toBe(
          FALLBACK,
        );
      }
    },
  );

  it("falls back rather than showing a raw code", () => {
    expect(agentErrorMessage("chat", "brand_new_code", "de", FALLBACK)).toBe(
      FALLBACK,
    );
    expect(agentErrorMessage("chat", undefined, "en", FALLBACK)).toBe(FALLBACK);
    expect(agentErrorMessage("chat", 42, "en", FALLBACK)).toBe(FALLBACK);
  });

  it("keeps a rejected credential distinct from an outage", () => {
    const rejected = agentErrorMessage("key", "llm_key_rejected", "de", FALLBACK);
    const outage = agentErrorMessage(
      "key",
      "llm_key_validation_failed",
      "de",
      FALLBACK,
    );
    expect(rejected).not.toBe(outage);
    expect(outage).toContain("nicht erreichbar");
  });

  it("uses no em dash or en dash", () => {
    for (const region of REGIONS) {
      for (const code of ACCOUNT_CHAT_ERROR_CODES) {
        for (const locale of ["de", "en"] as const) {
          const message = agentErrorMessage(region, code, locale, FALLBACK);
          expect(message).not.toContain("—");
          expect(message).not.toContain("–");
        }
      }
    }
  });
});
