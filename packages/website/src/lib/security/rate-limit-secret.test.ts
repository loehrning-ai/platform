import { describe, expect, it } from "vitest";
import {
  decodeRateLimitHmacSecret,
  isValidRateLimitHmacSecret,
} from "./rate-limit-secret.mjs";

const VALID_SECRET = `rlh1_${"a".repeat(64)}`;

describe("rate-limit HMAC secret representation", () => {
  it("accepts and decodes exactly one versioned 256-bit lowercase-hex key", () => {
    expect(isValidRateLimitHmacSecret(VALID_SECRET)).toBe(true);
    const decoded = decodeRateLimitHmacSecret(VALID_SECRET);
    expect(decoded).toBeInstanceOf(Uint8Array);
    expect(decoded).toHaveLength(32);
    expect(Array.from(decoded ?? [])).toEqual(Array(32).fill(0xaa));
  });

  it.each([
    undefined,
    null,
    42,
    "",
    "rlh1_deadbeef",
    `rlh1_${"A".repeat(64)}`,
    `rlh2_${"a".repeat(64)}`,
    "a".repeat(64),
    `${VALID_SECRET} `,
  ])("rejects malformed or unversioned input %#", (value) => {
    expect(isValidRateLimitHmacSecret(value)).toBe(false);
    expect(decodeRateLimitHmacSecret(value)).toBeNull();
  });

  it("returns independent key material that callers can erase", () => {
    const first = decodeRateLimitHmacSecret(VALID_SECRET);
    const second = decodeRateLimitHmacSecret(VALID_SECRET);
    expect(first).not.toBe(second);
    first?.fill(0);
    expect(Array.from(second ?? [])).toEqual(Array(32).fill(0xaa));
  });
});
