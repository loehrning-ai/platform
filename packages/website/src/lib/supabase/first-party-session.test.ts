import { describe, expect, it, vi } from "vitest";
import {
  discardNonFirstPartySession,
  isFirstPartySessionClaims,
  verifyFirstPartySession,
} from "./first-party-session";

const USER_ID = "4c1f6f0e-2b8a-4d3e-9a51-7b2c8e0d1f36";

function firstParty(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    sub: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    session_id: "11111111-1111-4111-8111-111111111111",
    amr: [{ method: "oauth", timestamp: 1_800_000_000 }],
    ...overrides,
  };
}

function clientWith(getClaims: () => Promise<unknown>) {
  const signOut = vi.fn(async () => ({ error: null }));
  const client = {
    auth: { getClaims: vi.fn(getClaims), signOut },
  } as unknown as Parameters<typeof verifyFirstPartySession>[0];
  return { client, getClaims: client.auth.getClaims, signOut };
}

describe("isFirstPartySessionClaims", () => {
  it("accepts the claims of a session this site created", () => {
    expect(isFirstPartySessionClaims(firstParty(), USER_ID)).toBe(true);
    // Google sign-in records the `oauth` AMR method; that is first-party too.
    expect(
      isFirstPartySessionClaims(
        firstParty({ amr: [{ method: "oauth", timestamp: 1 }] }),
        USER_ID,
      ),
    ).toBe(true);
    expect(
      isFirstPartySessionClaims(firstParty({ aud: ["authenticated"] }), USER_ID),
    ).toBe(true);
  });

  it.each([
    ["an OAuth client_id", { client_id: "b7f0c2d4-client" }],
    ["an empty client_id", { client_id: "" }],
    ["a null client_id", { client_id: null }],
    ["an undefined client_id", { client_id: undefined }],
    ["the MCP audience", { aud: "https://loehrning.ai/api/mcp" }],
    ["a widened audience", { aud: ["authenticated", "https://loehrning.ai/api/mcp"] }],
    ["an empty audience list", { aud: [] }],
    ["no audience", { aud: undefined }],
    ["the anon role", { role: "anon" }],
    ["the service role", { role: "service_role" }],
    ["another subject", { sub: "5d2f7a1e-3c9b-4e4f-8b62-8c3d9f1e2a47" }],
  ])("rejects claims with %s", (_label, overrides) => {
    expect(isFirstPartySessionClaims(firstParty(overrides), USER_ID)).toBe(
      false,
    );
  });

  it.each([null, undefined, "claims", 7, [firstParty()]])(
    "rejects a non-object claims value %#",
    (value) => {
      expect(isFirstPartySessionClaims(value, USER_ID)).toBe(false);
    },
  );

  it("rejects an empty expected user id", () => {
    expect(isFirstPartySessionClaims(firstParty({ sub: "" }), "")).toBe(false);
  });
});

describe("verifyFirstPartySession", () => {
  it("reads the claims of the stored session by default", async () => {
    const { client, getClaims } = clientWith(async () => ({
      data: { claims: firstParty() },
      error: null,
    }));

    await expect(verifyFirstPartySession(client, USER_ID)).resolves.toEqual({
      status: "first-party",
    });
    expect(getClaims).toHaveBeenCalledWith();
  });

  it("verifies an explicit access token when one is passed", async () => {
    const { client, getClaims } = clientWith(async () => ({
      data: { claims: firstParty() },
      error: null,
    }));

    await verifyFirstPartySession(client, USER_ID, "exchanged-token");

    expect(getClaims).toHaveBeenCalledWith("exchanged-token");
  });

  it("classifies an OAuth client token as not first-party", async () => {
    const { client } = clientWith(async () => ({
      data: { claims: firstParty({ client_id: "b7f0c2d4-client" }) },
      error: null,
    }));

    await expect(verifyFirstPartySession(client, USER_ID)).resolves.toEqual({
      status: "not-first-party",
    });
  });

  it("classifies a missing session as not first-party", async () => {
    const { client } = clientWith(async () => ({ data: null, error: null }));

    await expect(verifyFirstPartySession(client, USER_ID)).resolves.toEqual({
      status: "not-first-party",
    });
  });

  it.each([
    ["an invalid JWT", { name: "AuthInvalidJwtError", status: 400 }],
    ["a missing session", { name: "AuthSessionMissingError", status: 400 }],
    ["a 401 answer", { name: "AuthApiError", status: 401 }],
    ["a 403 answer", { name: "AuthApiError", status: 403 }],
  ])("treats %s as a definitive refusal", async (_label, shape) => {
    const { client } = clientWith(async () => ({
      data: null,
      error: Object.assign(new Error("refused"), shape),
    }));

    await expect(verifyFirstPartySession(client, USER_ID)).resolves.toEqual({
      status: "not-first-party",
    });
  });

  it.each([
    ["a network failure", { name: "AuthRetryableFetchError", status: 0 }],
    ["a server error", { name: "AuthApiError", status: 500 }],
    ["a rate limit", { name: "AuthApiError", status: 429 }],
    ["an unknown error", { name: "Error" }],
  ])("keeps %s an outage, never a sign-out", async (_label, shape) => {
    const error = Object.assign(new Error("transient"), shape);
    const { client } = clientWith(async () => ({ data: null, error }));

    await expect(verifyFirstPartySession(client, USER_ID)).resolves.toEqual({
      status: "unavailable",
      error,
    });
  });

  it("reports a thrown getClaims as an outage", async () => {
    const error = new Error("thrown");
    const { client } = clientWith(async () => {
      throw error;
    });

    await expect(verifyFirstPartySession(client, USER_ID)).resolves.toEqual({
      status: "unavailable",
      error,
    });
  });
});

describe("discardNonFirstPartySession", () => {
  it("signs out the presented session only", async () => {
    const { client, signOut } = clientWith(async () => null);

    await discardNonFirstPartySession(client);

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("never throws when the sign-out fails", async () => {
    const { client, signOut } = clientWith(async () => null);
    signOut.mockRejectedValueOnce(new Error("logout unreachable"));

    await expect(discardNonFirstPartySession(client)).resolves.toBeUndefined();
  });
});
