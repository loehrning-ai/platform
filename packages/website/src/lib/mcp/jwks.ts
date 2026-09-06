import "server-only";

/**
 * The authorization server's published signing keys.
 *
 * This module owns everything about key material: which algorithms a key may
 * be used with, how a key set is fetched and cached, which key answers a given
 * key id, and how a signature is checked against one. The token itself never
 * reaches here, so nothing in this file can leak a credential.
 *
 * The important rule is the first one below: the verification algorithm comes
 * from the published key, never from the token that wants to be verified. A
 * key is imported as ECDSA or RSASSA only, so a token claiming a symmetric
 * algorithm has no path to a key at all.
 */

/** Ceilings on everything read from the discovery endpoint. */
const MAX_JWKS_BYTES = 64 * 1024;
const MAX_JWKS_KEYS = 16;
const JWKS_TIMEOUT_MS = 5_000;

/** Key set freshness, and the floor between two network fetches. */
const JWKS_TTL_MS = 10 * 60 * 1000;
const JWKS_MIN_REFRESH_MS = 60 * 1000;

export interface AlgorithmProfile {
  readonly alg: string;
  readonly keyType: "EC" | "RSA";
  readonly curve?: string;
  readonly importParams: EcKeyImportParams | RsaHashedImportParams;
  readonly verifyParams: AlgorithmIdentifier | EcdsaParams;
}

/**
 * The only two signature algorithms accepted. Supabase signs project JWTs
 * with ES256 (asymmetric signing keys) or RS256; neither profile can be
 * satisfied by a symmetric secret.
 */
export const ALGORITHMS: Readonly<Record<string, AlgorithmProfile>> = {
  ES256: {
    alg: "ES256",
    keyType: "EC",
    curve: "P-256",
    importParams: { name: "ECDSA", namedCurve: "P-256" },
    verifyParams: { name: "ECDSA", hash: "SHA-256" },
  },
  RS256: {
    alg: "RS256",
    keyType: "RSA",
    importParams: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    verifyParams: { name: "RSASSA-PKCS1-v1_5" },
  },
};

/**
 * A key as published by the discovery endpoint. `kid` is not part of the
 * platform JsonWebKey type, so it is declared here as unknown and only ever
 * compared for identity with an already validated key id.
 */
export interface PublishedJwk extends JsonWebKey {
  readonly kid?: unknown;
}

export type SigningKeyResolution =
  | { readonly ok: true; readonly key: PublishedJwk }
  | { readonly ok: false; readonly reason: "unknown_key" | "verifier_unavailable" };

interface JwksCacheEntry {
  /** null records a failed attempt so a broken discovery cannot be hammered. */
  readonly keys: readonly PublishedJwk[] | null;
  readonly attemptedAt: number;
}

const jwksCache = new Map<string, JwksCacheEntry>();

/** Test seam: drops every cached key set and every recorded failure. */
export function resetJwksCache(): void {
  jwksCache.clear();
}

function timeoutSignal(milliseconds: number): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(milliseconds);
  } catch {
    // An environment without AbortSignal.timeout still gets the byte ceiling
    // below; losing the deadline must not lose the whole verification.
    return undefined;
  }
}

async function readBoundedResponseText(
  response: Response,
): Promise<string | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_JWKS_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function parseKeySet(text: string): readonly PublishedJwk[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object") return null;
  const keys = (parsed as { keys?: unknown }).keys;
  if (!Array.isArray(keys)) return null;
  return keys
    .slice(0, MAX_JWKS_KEYS)
    .filter(
      (key): key is PublishedJwk =>
        key !== null && typeof key === "object" && !Array.isArray(key),
    );
}

async function fetchKeySet(
  url: string,
): Promise<readonly PublishedJwk[] | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: timeoutSignal(JWKS_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const text = await readBoundedResponseText(response);
    return text === null ? null : parseKeySet(text);
  } catch {
    return null;
  }
}

function matchingKey(
  keys: readonly PublishedJwk[],
  keyId: string | null,
  profile: AlgorithmProfile,
): PublishedJwk | null {
  const usable = keys.filter(
    (key) =>
      key.kty === profile.keyType &&
      (profile.curve === undefined || key.crv === profile.curve) &&
      (key.alg === undefined || key.alg === profile.alg) &&
      (key.use === undefined || key.use === "sig"),
  );
  if (keyId !== null) {
    return usable.find((key) => key.kid === keyId) ?? null;
  }
  // A key set with exactly one usable key needs no `kid` to be unambiguous.
  return usable.length === 1 ? (usable[0] ?? null) : null;
}

/**
 * Published keys for one discovery URL.
 *
 * A fresh set answers from memory. Freshness has a ceiling so a key the
 * authorization server has withdrawn stops verifying tokens here, and a `kid`
 * that is missing from an otherwise fresh set triggers at most one refetch per
 * minute, so key rotation is picked up without letting a crafted key id turn
 * this into a request amplifier.
 *
 * A failed refresh keeps the previous set rather than locking every client out
 * during a discovery outage; the recorded attempt still backs the next try
 * off, and the ceiling above still applies to the set that is kept.
 */
export async function resolveSigningKey(
  jwksUrl: string,
  keyId: string | null,
  profile: AlgorithmProfile,
  now: number,
): Promise<SigningKeyResolution> {
  const cached = jwksCache.get(jwksUrl);
  const fresh = cached !== undefined && now - cached.attemptedAt < JWKS_TTL_MS;
  if (fresh && cached.keys) {
    const key = matchingKey(cached.keys, keyId, profile);
    if (key) return { ok: true, key };
  }
  if (cached && now - cached.attemptedAt < JWKS_MIN_REFRESH_MS) {
    return {
      ok: false,
      reason: cached.keys ? "unknown_key" : "verifier_unavailable",
    };
  }

  const fetched = await fetchKeySet(jwksUrl);
  const keys = fetched ?? cached?.keys ?? null;
  jwksCache.set(jwksUrl, { keys, attemptedAt: now });
  if (!keys) return { ok: false, reason: "verifier_unavailable" };
  const key = matchingKey(keys, keyId, profile);
  return key ? { ok: true, key } : { ok: false, reason: "unknown_key" };
}

/**
 * Check a JWS signature against one published key. A key that cannot be
 * imported, or a curve the platform does not implement, is a failed
 * verification and never an accepted one.
 */
export async function signatureIsValid(
  key: PublishedJwk,
  profile: AlgorithmProfile,
  signature: Uint8Array<ArrayBuffer>,
  signedInput: string,
): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      key,
      profile.importParams,
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      profile.verifyParams,
      publicKey,
      signature,
      new TextEncoder().encode(signedInput),
    );
  } catch {
    return false;
  }
}
