const MODERN_KEY_RANDOM_LENGTH = 22;
const MODERN_KEY_CHECKSUM_LENGTH = 8;
const MAX_LEGACY_JWT_LENGTH = 4096;
const MAX_JWT_HEADER_SEGMENT_LENGTH = 512;
const MAX_JWT_PAYLOAD_SEGMENT_LENGTH = 3072;
const HS256_SIGNATURE_LENGTH = 32;
const BASE64URL_SEGMENT = /^[A-Za-z0-9_-]+$/;

const MODERN_PUBLISHABLE_KEY = new RegExp(
  `^sb_publishable_[A-Za-z0-9_-]{${MODERN_KEY_RANDOM_LENGTH}}_[A-Za-z0-9_-]{${MODERN_KEY_CHECKSUM_LENGTH}}$`,
);
const MODERN_SECRET_KEY = new RegExp(
  `^sb_secret_[A-Za-z0-9_-]{${MODERN_KEY_RANDOM_LENGTH}}_[A-Za-z0-9_-]{${MODERN_KEY_CHECKSUM_LENGTH}}$`,
);

export const SUPABASE_KEY_KIND = Object.freeze({
  INVALID: "invalid",
  PUBLISHABLE: "publishable",
  SECRET: "secret",
  LEGACY_ANON: "legacy-anon",
  LEGACY_SERVICE_ROLE: "legacy-service-role",
});

function decodeCanonicalBase64Url(segment, maximumLength) {
  if (
    segment.length === 0 ||
    segment.length > maximumLength ||
    segment.length % 4 === 1 ||
    !BASE64URL_SEGMENT.test(segment)
  ) {
    return null;
  }

  try {
    const padded = segment
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(segment.length / 4) * 4, "=");
    const binary = globalThis.atob(padded);
    const canonical = globalThis.btoa(binary)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, "");
    if (canonical !== segment) return null;

    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function decodeCanonicalJsonObject(segment, maximumLength) {
  const bytes = decodeCanonicalBase64Url(segment, maximumLength);
  if (!bytes) return null;

  try {
    const parsed = JSON.parse(
      new globalThis.TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    return parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function classifyLegacyJwt(value) {
  if (value.length > MAX_LEGACY_JWT_LENGTH) return SUPABASE_KEY_KIND.INVALID;

  const segments = value.split(".");
  if (segments.length !== 3) return SUPABASE_KEY_KIND.INVALID;

  const header = decodeCanonicalJsonObject(
    segments[0],
    MAX_JWT_HEADER_SEGMENT_LENGTH,
  );
  const payload = decodeCanonicalJsonObject(
    segments[1],
    MAX_JWT_PAYLOAD_SEGMENT_LENGTH,
  );
  const signature = decodeCanonicalBase64Url(
    segments[2],
    MAX_JWT_HEADER_SEGMENT_LENGTH,
  );

  if (
    !header ||
    !payload ||
    !signature ||
    signature.byteLength !== HS256_SIGNATURE_LENGTH ||
    header.alg !== "HS256" ||
    header.typ !== "JWT"
  ) {
    return SUPABASE_KEY_KIND.INVALID;
  }

  if (payload.role === "anon") return SUPABASE_KEY_KIND.LEGACY_ANON;
  if (payload.role === "service_role") {
    return SUPABASE_KEY_KIND.LEGACY_SERVICE_ROLE;
  }
  return SUPABASE_KEY_KIND.INVALID;
}

/**
 * Classify only exact Supabase API-key representations.
 *
 * Modern keys follow Supabase's documented
 * `<prefix><22-char-random>_<8-char-checksum>` shape. Legacy keys must be a
 * canonical, unpadded base64url HS256 JWT with an exact `anon` or
 * `service_role` claim. This is structural classification, not cryptographic
 * verification; Supabase remains responsible for authenticating the key.
 */
export function classifySupabaseKey(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim()
  ) {
    return SUPABASE_KEY_KIND.INVALID;
  }
  if (MODERN_PUBLISHABLE_KEY.test(value)) {
    return SUPABASE_KEY_KIND.PUBLISHABLE;
  }
  if (MODERN_SECRET_KEY.test(value)) return SUPABASE_KEY_KIND.SECRET;
  return classifyLegacyJwt(value);
}

export function isSafePublicSupabaseKey(value) {
  const kind = classifySupabaseKey(value);
  return (
    kind === SUPABASE_KEY_KIND.PUBLISHABLE ||
    kind === SUPABASE_KEY_KIND.LEGACY_ANON
  );
}

export function isServiceSupabaseKey(value) {
  const kind = classifySupabaseKey(value);
  return (
    kind === SUPABASE_KEY_KIND.SECRET ||
    kind === SUPABASE_KEY_KIND.LEGACY_SERVICE_ROLE
  );
}
