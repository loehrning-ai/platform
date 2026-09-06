import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetJwksCache } from "./jwks";
import {
  verifyOAuthAccessToken,
  type JwtVerification,
} from "./oauth-jwt";

/**
 * Every test here signs a real token with a real key and publishes a real key
 * set, so the assertions are about verification and not about a stub agreeing
 * with itself. The shadow paths (expired, wrong audience, wrong issuer,
 * tampered, unknown key, symmetric algorithm) all start from a token that is
 * otherwise perfectly valid, which is the only way to prove that the single
 * changed property is what caused the rejection.
 */

const ISSUER = "https://project.supabase.co/auth/v1";
const JWKS_URL = "https://project.supabase.co/auth/v1/.well-known/jwks.json";
const AUDIENCE = "https://loehrning.ai/api/mcp";
const SUBJECT = "3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const KEY_ID = "signing-key-1";
const NOW_MS = Date.UTC(2026, 8, 5, 12, 0, 0);
const NOW_SECONDS = Math.floor(NOW_MS / 1000);

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function encodeSegment(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

/** A published key carries a `kid`, which the platform JsonWebKey omits. */
type PublishedJwk = JsonWebKey & { readonly kid?: string };

interface SigningMaterial {
  readonly privateKey: CryptoKey;
  readonly jwk: PublishedJwk;
  readonly header: Record<string, unknown>;
  readonly signParams: AlgorithmIdentifier | EcdsaParams;
}

async function ellipticMaterial(): Promise<SigningMaterial> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const exported = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return {
    privateKey: pair.privateKey,
    jwk: { ...exported, kid: KEY_ID, alg: "ES256", use: "sig" },
    header: { alg: "ES256", typ: "JWT", kid: KEY_ID },
    signParams: { name: "ECDSA", hash: "SHA-256" },
  };
}

async function rsaMaterial(): Promise<SigningMaterial> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const exported = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return {
    privateKey: pair.privateKey,
    jwk: { ...exported, kid: KEY_ID, use: "sig" },
    header: { alg: "RS256", typ: "JWT", kid: KEY_ID },
    signParams: { name: "RSASSA-PKCS1-v1_5" },
  };
}

function claims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: SUBJECT,
    exp: NOW_SECONDS + 3600,
    iat: NOW_SECONDS - 60,
    client_id: "claude-desktop",
    scope: "openid email",
    ...overrides,
  };
}

async function sign(
  material: SigningMaterial,
  payload: Record<string, unknown>,
  header: Record<string, unknown> = material.header,
): Promise<string> {
  const signingInput = `${encodeSegment(header)}.${encodeSegment(payload)}`;
  const signature = await crypto.subtle.sign(
    material.signParams,
    material.privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

function publishKeys(keys: readonly JsonWebKey[]) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ keys }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
}

function verify(token: string, now = NOW_MS): Promise<JwtVerification> {
  return verifyOAuthAccessToken(token, {
    issuer: ISSUER,
    audience: AUDIENCE,
    jwksUrl: JWKS_URL,
    now,
  });
}

let material: SigningMaterial;

beforeEach(async () => {
  resetJwksCache();
  material = await ellipticMaterial();
  vi.stubGlobal("fetch", publishKeys([material.jwk]));
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetJwksCache();
});

describe("verifyOAuthAccessToken", () => {
  it("accepts a token signed by a published key and issued for this resource", async () => {
    const result = await verify(await sign(material, claims()));

    expect(result).toEqual({
      ok: true,
      token: {
        subject: SUBJECT,
        clientId: "claude-desktop",
        scopes: ["openid", "email"],
        expiresAt: NOW_SECONDS + 3600,
      },
    });
  });

  it("accepts an RS256 token against an RSA key", async () => {
    const rsa = await rsaMaterial();
    vi.stubGlobal("fetch", publishKeys([rsa.jwk]));

    const result = await verify(await sign(rsa, claims()));

    expect(result.ok).toBe(true);
  });

  it("accepts an audience array that contains this resource", async () => {
    const token = await sign(
      material,
      claims({ aud: ["https://example.invalid", AUDIENCE] }),
    );

    expect((await verify(token)).ok).toBe(true);
  });

  it("reads an array scope claim and drops duplicates and junk", async () => {
    const token = await sign(
      material,
      claims({ scope: undefined, scopes: ["openid", "openid", "a b", 7] }),
    );
    const result = await verify(token);

    expect(result.ok && result.token.scopes).toEqual(["openid"]);
  });

  it.each([
    ["an empty string", ""],
    ["a single segment", "not-a-token"],
    ["two segments", "aaaa.bbbb"],
    ["four segments", "aaaa.bbbb.cccc.dddd"],
    ["a segment outside base64url", "aa$a.bbbb.cccc"],
  ])("rejects %s as malformed", async (_label, token) => {
    expect(await verify(token)).toEqual({
      ok: false,
      reason: "malformed_token",
    });
  });

  it("rejects a token whose header claims a symmetric algorithm", async () => {
    const token = await sign(material, claims(), {
      alg: "HS256",
      typ: "JWT",
      kid: KEY_ID,
    });

    expect(await verify(token)).toEqual({
      ok: false,
      reason: "unsupported_algorithm",
    });
  });

  it("rejects an unsigned token", async () => {
    const token = await sign(material, claims(), {
      alg: "none",
      typ: "JWT",
      kid: KEY_ID,
    });

    expect(await verify(token)).toEqual({
      ok: false,
      reason: "unsupported_algorithm",
    });
  });

  it("rejects a token signed by a key that is not published", async () => {
    const other = await ellipticMaterial();
    const token = await sign(other, claims(), {
      alg: "ES256",
      typ: "JWT",
      kid: "rotated-away",
    });

    expect(await verify(token)).toEqual({ ok: false, reason: "unknown_key" });
  });

  it("rejects a signature made by a different key with the published key id", async () => {
    const attacker = await ellipticMaterial();
    const token = await sign(attacker, claims());

    expect(await verify(token)).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects a tampered signature", async () => {
    const token = await sign(material, claims());
    const [header, payload, signature] = token.split(".");
    // The leading character carries whole bits of the first signature byte.
    // The trailing one carries padding, so flipping it can decode unchanged.
    const flipped = `${signature?.startsWith("A") ? "B" : "A"}${
      signature?.slice(1) ?? ""
    }`;

    expect(await verify(`${header}.${payload}.${flipped}`)).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects claims swapped under a valid signature", async () => {
    const token = await sign(material, claims());
    const [header, , signature] = token.split(".");
    const forged = encodeSegment(
      claims({ sub: "11111111-2222-4333-8444-555555555555" }),
    );

    expect(await verify(`${header}.${forged}.${signature}`)).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects an expired token", async () => {
    const token = await sign(material, claims({ exp: NOW_SECONDS - 1 }));

    expect(await verify(token)).toEqual({ ok: false, reason: "expired_token" });
  });

  it("rejects a token without an expiry", async () => {
    const token = await sign(material, claims({ exp: undefined }));

    expect(await verify(token)).toEqual({ ok: false, reason: "expired_token" });
  });

  it("rejects a token that is not valid yet", async () => {
    const token = await sign(material, claims({ nbf: NOW_SECONDS + 600 }));

    expect(await verify(token)).toEqual({ ok: false, reason: "not_yet_valid" });
  });

  it("rejects a token issued for another audience", async () => {
    const token = await sign(
      material,
      claims({ aud: "https://example.invalid/api/mcp" }),
    );

    expect(await verify(token)).toEqual({
      ok: false,
      reason: "invalid_audience",
    });
  });

  it("rejects a token from another issuer", async () => {
    const token = await sign(
      material,
      claims({ iss: "https://evil.supabase.co/auth/v1" }),
    );

    expect(await verify(token)).toEqual({
      ok: false,
      reason: "invalid_issuer",
    });
  });

  it("rejects a token whose subject is not an account id", async () => {
    const token = await sign(material, claims({ sub: "service-account" }));

    expect(await verify(token)).toEqual({
      ok: false,
      reason: "invalid_subject",
    });
  });

  it("reports the verifier as unavailable when the key set cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );

    expect(await verify(await sign(material, claims()))).toEqual({
      ok: false,
      reason: "verifier_unavailable",
    });
  });

  it("reports the verifier as unavailable when discovery rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    expect(await verify(await sign(material, claims()))).toEqual({
      ok: false,
      reason: "verifier_unavailable",
    });
  });

  it("ignores a published key that is not a signing key", async () => {
    vi.stubGlobal(
      "fetch",
      publishKeys([{ ...material.jwk, use: "enc" }]),
    );

    expect(await verify(await sign(material, claims()))).toEqual({
      ok: false,
      reason: "unknown_key",
    });
  });

  it("caches the key set instead of fetching it per verification", async () => {
    const fetchKeys = publishKeys([material.jwk]);
    vi.stubGlobal("fetch", fetchKeys);
    const token = await sign(material, claims());

    expect((await verify(token)).ok).toBe(true);
    expect((await verify(token)).ok).toBe(true);

    expect(fetchKeys).toHaveBeenCalledTimes(1);
  });

  it("does not refetch for an unknown key id within the refresh floor", async () => {
    const fetchKeys = publishKeys([material.jwk]);
    vi.stubGlobal("fetch", fetchKeys);
    const token = await sign(material, claims(), {
      alg: "ES256",
      typ: "JWT",
      kid: "never-published",
    });

    expect(await verify(token)).toEqual({ ok: false, reason: "unknown_key" });
    expect(await verify(token, NOW_MS + 30_000)).toEqual({
      ok: false,
      reason: "unknown_key",
    });

    expect(fetchKeys).toHaveBeenCalledTimes(1);
  });

  it("refetches once the refresh floor has passed so key rotation is picked up", async () => {
    const rotated = await ellipticMaterial();
    const fetchKeys = vi
      .fn(
        async () =>
          new Response(JSON.stringify({ keys: [material.jwk] }), {
            status: 200,
          }),
      )
      .mockImplementationOnce(
        async () =>
          new Response(JSON.stringify({ keys: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchKeys);
    const token = await sign(rotated, claims(), {
      alg: "ES256",
      typ: "JWT",
      kid: KEY_ID,
    });

    expect(await verify(token)).toEqual({ ok: false, reason: "unknown_key" });
    const later = await verify(token, NOW_MS + 61_000);

    expect(fetchKeys).toHaveBeenCalledTimes(2);
    expect(later).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("refetches once the freshness ceiling has passed", async () => {
    const fetchKeys = publishKeys([material.jwk]);
    vi.stubGlobal("fetch", fetchKeys);
    const token = await sign(material, claims({ exp: NOW_SECONDS + 86_400 }));

    expect((await verify(token)).ok).toBe(true);
    expect((await verify(token, NOW_MS + 11 * 60_000)).ok).toBe(true);

    expect(fetchKeys).toHaveBeenCalledTimes(2);
  });

  it("keeps serving a known key when a refresh fails", async () => {
    const token = await sign(material, claims({ exp: NOW_SECONDS + 86_400 }));
    expect((await verify(token)).ok).toBe(true);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("discovery down");
      }),
    );

    expect((await verify(token, NOW_MS + 11 * 60_000)).ok).toBe(true);
  });

  it("refuses a key set that is not a key set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ keys: "all of them" })),
      ),
    );

    expect(await verify(await sign(material, claims()))).toEqual({
      ok: false,
      reason: "verifier_unavailable",
    });
  });
});
