export function isValidRateLimitHmacSecret(value: unknown): value is string;
export function decodeRateLimitHmacSecret(
  value: unknown,
): Uint8Array<ArrayBuffer> | null;
