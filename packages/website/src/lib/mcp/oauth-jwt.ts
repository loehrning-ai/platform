import "server-only";

import {
  ALGORITHMS,
  resolveSigningKey,
  signatureIsValid,
} from "./jwks";

/**
 * Verification of an OAuth access token issued for the agent endpoint.
 *
 * The token is checked against the authorization server's published signing
 * keys, then against every claim that binds it to this resource: issuer,
 * audience, expiry, and a real account subject. Key material and the key set
 * cache live next door in `./jwks`.
 *
 * Three rules keep this safe.
 *
 * 1. The verification algorithm is derived from the published key, never from
 *    the token header. A key is imported as ECDSA or RSASSA only, and the
 *    header algorithm then has to match what that key can do. A token that
 *    claims a symmetric algorithm therefore has no path to a key at all,
 *    which is the classic confusion attack this shape rules out.
 * 2. The signature is checked before any claim is read. Claims from an
 *    unverified token are attacker input and never decide anything.
 * 3. Nothing here logs, returns, or stores the token, a segment of it, or a
 *    claim value. A rejection is a fixed enum member.
 */

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const BASE64URL_SHAPE = /^[A-Za-z0-9_-]+$/;

/** Ceilings on everything read from the wire. */
const MAX_TOKEN_LENGTH = 8192;
const MAX_SEGMENT_BYTES = 8192;
const MAX_KEY_ID_LENGTH = 128;
const MAX_CLIENT_ID_LENGTH = 128;
const MAX_SCOPES = 16;
const MAX_SCOPE_LENGTH = 64;

/** Tolerance for a client clock running ahead of ours on `nbf` and `iat`. */
const CLOCK_SKEW_SECONDS = 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** RFC 6749 client identifiers and scope tokens: printable ASCII, no quotes. */
const OAUTH_TOKEN_CHARSET = /^[\x21\x23-\x5B\x5D-\x7E]+$/;

export const JWT_REJECTIONS = [
  "malformed_token",
  "unsupported_algorithm",
  "unknown_key",
  "invalid_signature",
  "invalid_issuer",
  "invalid_audience",
  "expired_token",
  "not_yet_valid",
  "invalid_subject",
  "verifier_unavailable",
] as const;

export type JwtRejection = (typeof JWT_REJECTIONS)[number];

export interface VerifiedAccessToken {
  /** Account id the token was issued for. */
  readonly subject: string;
  /** Registered client that holds the grant, when the token names one. */
  readonly clientId: string | null;
  readonly scopes: readonly string[];
  /** Expiry in seconds since the epoch, as verified. */
  readonly expiresAt: number;
}

export type JwtVerification =
  | { readonly ok: true; readonly token: VerifiedAccessToken }
  | { readonly ok: false; readonly reason: JwtRejection };

export interface JwtVerificationOptions {
  readonly issuer: string;
  readonly audience: string;
  readonly jwksUrl: string;
  /** Milliseconds since the epoch. Injected by tests; defaults to now. */
  readonly now?: number;
}

function reject(reason: JwtRejection): JwtVerification {
  return { ok: false, reason };
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  if (value.length === 0 || !BASE64URL_SHAPE.test(value)) return null;
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    // Backed by a plain ArrayBuffer so the bytes can be handed to Web Crypto
    // without a shared-memory widening.
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
  const bytes = base64UrlToBytes(segment);
  if (!bytes || bytes.byteLength > MAX_SEGMENT_BYTES) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function boundedAsciiToken(value: unknown, maxLength: number): string | null {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    OAUTH_TOKEN_CHARSET.test(value)
    ? value
    : null;
}

/**
 * Scope claim in either shipped form: the RFC 6749 space separated string or
 * a JSON array. Values outside the scope character set are dropped rather
 * than passed on, so nothing downstream has to re-validate them.
 */
function parseScopeClaim(claims: Record<string, unknown>): readonly string[] {
  const raw = claims.scope ?? claims.scp ?? claims.scopes;
  const candidates = typeof raw === "string"
    ? raw.split(" ")
    : Array.isArray(raw)
      ? raw
      : [];
  const accepted: string[] = [];
  for (const candidate of candidates) {
    const scope = boundedAsciiToken(candidate, MAX_SCOPE_LENGTH);
    if (scope && !accepted.includes(scope)) accepted.push(scope);
    if (accepted.length >= MAX_SCOPES) break;
  }
  return accepted;
}

function audienceMatches(value: unknown, expected: string): boolean {
  if (typeof value === "string") return value === expected;
  return Array.isArray(value) && value.includes(expected);
}

function secondsClaim(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function verifyOAuthAccessToken(
  token: string,
  options: JwtVerificationOptions,
): Promise<JwtVerification> {
  if (token.length > MAX_TOKEN_LENGTH || !JWT_SHAPE.test(token)) {
    return reject("malformed_token");
  }
  const [headerSegment, payloadSegment, signatureSegment] = token.split(".");
  if (!headerSegment || !payloadSegment || !signatureSegment) {
    return reject("malformed_token");
  }

  const header = decodeJsonSegment(headerSegment);
  if (!header) return reject("malformed_token");
  const type = header.typ;
  if (
    type !== undefined &&
    type !== "JWT" &&
    type !== "at+jwt" &&
    type !== "application/at+jwt"
  ) {
    return reject("malformed_token");
  }
  const algorithm = typeof header.alg === "string" ? header.alg : "";
  const profile = Object.hasOwn(ALGORITHMS, algorithm)
    ? ALGORITHMS[algorithm]
    : undefined;
  if (!profile) return reject("unsupported_algorithm");
  const keyId = boundedAsciiToken(header.kid, MAX_KEY_ID_LENGTH);
  if (header.kid !== undefined && keyId === null) {
    return reject("malformed_token");
  }

  const signature = base64UrlToBytes(signatureSegment);
  if (!signature) return reject("malformed_token");

  const now = options.now ?? Date.now();
  const resolved = await resolveSigningKey(
    options.jwksUrl,
    keyId,
    profile,
    now,
  );
  if (!resolved.ok) return reject(resolved.reason);

  const verified = await signatureIsValid(
    resolved.key,
    profile,
    signature,
    `${headerSegment}.${payloadSegment}`,
  );
  if (!verified) return reject("invalid_signature");

  // Everything below reads a claim, which is only meaningful now that the
  // signature over those exact bytes has been checked.
  const claims = decodeJsonSegment(payloadSegment);
  if (!claims) return reject("malformed_token");

  if (claims.iss !== options.issuer) return reject("invalid_issuer");
  if (!audienceMatches(claims.aud, options.audience)) {
    return reject("invalid_audience");
  }

  const nowSeconds = Math.floor(now / 1000);
  const expiresAt = secondsClaim(claims.exp);
  if (expiresAt === null || expiresAt <= nowSeconds) {
    return reject("expired_token");
  }
  const notBefore = secondsClaim(claims.nbf);
  if (notBefore !== null && notBefore > nowSeconds + CLOCK_SKEW_SECONDS) {
    return reject("not_yet_valid");
  }

  const subject = typeof claims.sub === "string" ? claims.sub.trim() : "";
  if (!UUID_PATTERN.test(subject)) return reject("invalid_subject");

  return {
    ok: true,
    token: {
      subject,
      clientId:
        boundedAsciiToken(claims.client_id, MAX_CLIENT_ID_LENGTH) ??
        boundedAsciiToken(claims.azp, MAX_CLIENT_ID_LENGTH),
      scopes: parseScopeClaim(claims),
      expiresAt,
    },
  };
}
