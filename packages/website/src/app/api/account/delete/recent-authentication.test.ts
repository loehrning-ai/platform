import { describe, expect, it } from "vitest";
import { hasRecentSessionAuthentication } from "./recent-authentication";

const NOW = 1_800_000_000;
const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function claims(
  method: string,
  timestamp = NOW,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    sub: "user-1",
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: false,
    session_id: SESSION_ID,
    amr: [{ method, timestamp }],
    ...overrides,
  };
}

describe("recent account-deletion authentication", () => {
  it.each(["magiclink", "otp", "email/signup", "oauth"])(
    "accepts a recent %s AMR entry",
    (method) => {
      expect(hasRecentSessionAuthentication(claims(method), "user-1", NOW))
        .toBe(true);
    },
  );

  it("accepts OAuth at the exact 15-minute boundary and rejects it one second later", () => {
    expect(
      hasRecentSessionAuthentication(
        claims("oauth", NOW - 15 * 60),
        "user-1",
        NOW,
      ),
    ).toBe(true);
    expect(
      hasRecentSessionAuthentication(
        claims("oauth", NOW - 15 * 60 - 1),
        "user-1",
        NOW,
      ),
    ).toBe(false);
  });

  it.each([
    ["refresh", claims("token_refresh")],
    ["different subject", claims("oauth", NOW, { sub: "user-2" })],
    ["anonymous", claims("oauth", NOW, { is_anonymous: true })],
    ["invalid session", claims("oauth", NOW, { session_id: "not-a-uuid" })],
    ["future timestamp", claims("oauth", NOW + 61)],
    ["string AMR", claims("oauth", NOW, { amr: ["oauth"] })],
  ])("rejects %s claims", (_label, value) => {
    expect(hasRecentSessionAuthentication(value, "user-1", NOW)).toBe(false);
  });
});
