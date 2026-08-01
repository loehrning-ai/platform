const RATE_LIMIT_HMAC_SECRET_PREFIX = "rlh1_";
const RATE_LIMIT_HMAC_SECRET_HEX_LENGTH = 64;
const RATE_LIMIT_HMAC_SECRET_PATTERN = new RegExp(
  `^${RATE_LIMIT_HMAC_SECRET_PREFIX}[0-9a-f]{${RATE_LIMIT_HMAC_SECRET_HEX_LENGTH}}$`,
);

/**
 * Accept only the documented, versioned representation of a 256-bit HMAC key.
 * This validates structure and prevents accidental use of a short password;
 * operators must still generate the bytes with a cryptographic RNG.
 */
export function isValidRateLimitHmacSecret(value) {
  return (
    typeof value === "string" &&
    RATE_LIMIT_HMAC_SECRET_PATTERN.test(value)
  );
}

export function decodeRateLimitHmacSecret(value) {
  if (!isValidRateLimitHmacSecret(value)) return null;

  const hex = value.slice(RATE_LIMIT_HMAC_SECRET_PREFIX.length);
  const bytes = new Uint8Array(RATE_LIMIT_HMAC_SECRET_HEX_LENGTH / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
