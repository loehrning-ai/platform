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

describe("recent authentication with an explicit maximum age", () => {
  const DAY = 24 * 60 * 60;

  it("keeps the 15-minute default when no maximum age is passed", () => {
    expect(
      hasRecentSessionAuthentication(claims("oauth", NOW - 16 * 60), "user-1", NOW),
    ).toBe(false);
  });

  it("accepts an authentication inside a longer window up to its exact boundary", () => {
    expect(
      hasRecentSessionAuthentication(claims("oauth", NOW - 16 * 60), "user-1", NOW, DAY),
    ).toBe(true);
    expect(
      hasRecentSessionAuthentication(claims("magiclink", NOW - DAY), "user-1", NOW, DAY),
    ).toBe(true);
    expect(
      hasRecentSessionAuthentication(claims("oauth", NOW - DAY - 1), "user-1", NOW, DAY),
    ).toBe(false);
  });

  it("still rejects refresh-only, foreign-subject and future claims in a longer window", () => {
    expect(
      hasRecentSessionAuthentication(claims("token_refresh"), "user-1", NOW, DAY),
    ).toBe(false);
    expect(
      hasRecentSessionAuthentication(
        claims("oauth", NOW, { sub: "user-2" }),
        "user-1",
        NOW,
        DAY,
      ),
    ).toBe(false);
    expect(
      hasRecentSessionAuthentication(claims("oauth", NOW + 61), "user-1", NOW, DAY),
    ).toBe(false);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    "fails closed for the invalid maximum age %s",
    (maxAge) => {
      expect(
        hasRecentSessionAuthentication(claims("oauth"), "user-1", NOW, maxAge),
      ).toBe(false);
    },
  );
});
