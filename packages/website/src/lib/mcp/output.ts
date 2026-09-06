/**
 * Output capping for MCP tool and resource payloads.
 *
 * A public agent surface must never be able to pull an unbounded response out
 * of the platform. Every payload is serialized once, measured in bytes, and
 * either returned whole or replaced by a truncation notice that still carries
 * the canonical URL, so the agent keeps a way to read the full material.
 */

import { MCP_MAX_OUTPUT_BYTES } from "./config";

export interface CappedPayload {
  readonly text: string;
  readonly bytes: number;
  readonly truncated: boolean;
}

const encoder = new TextEncoder();

export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

/**
 * Serialize a payload and enforce the byte ceiling.
 *
 * `fallback` is used when the full payload is too large. It is expected to be
 * a small object naming the canonical URL, so the caller receives a usable
 * pointer instead of a silently cut JSON document.
 */
export function capJsonPayload(
  value: unknown,
  fallback: Record<string, unknown>,
): CappedPayload {
  const text = JSON.stringify(value, null, 2);
  const bytes = byteLength(text);
  if (bytes <= MCP_MAX_OUTPUT_BYTES) {
    return { text, bytes, truncated: false };
  }
  const replacement = JSON.stringify(
    { ...fallback, truncated: true, full_payload_bytes: bytes },
    null,
    2,
  );
  return {
    text: replacement,
    bytes: byteLength(replacement),
    truncated: true,
  };
}

/**
 * Cap a plain-text body (a lesson section, a chapter's Markdown) on a UTF-8
 * boundary. `TextEncoder` plus `TextDecoder` with a byte slice would split a
 * multi-byte character, so the cut walks back to a whole code point.
 */
export function capText(value: string, maxBytes: number): CappedPayload {
  const bytes = byteLength(value);
  if (bytes <= maxBytes) return { text: value, bytes, truncated: false };

  let low = 0;
  let high = value.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (byteLength(value.slice(0, middle)) <= maxBytes) low = middle;
    else high = middle - 1;
  }
  const cut = value.slice(0, low);
  return { text: cut, bytes: byteLength(cut), truncated: true };
}
