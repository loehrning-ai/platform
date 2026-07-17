export type BoundedJsonResult =
  | { readonly ok: true; readonly value: unknown }
  | {
      readonly ok: false;
      readonly error: "body_too_large" | "invalid_json";
    };

/**
 * Parse a JSON request without ever accumulating more than `maxBytes` in
 * application memory. Content-Length is only a fast rejection path; the
 * streamed byte count remains authoritative because clients can omit or lie
 * about that header.
 */
export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<BoundedJsonResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError("maxBytes must be a positive safe integer");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > maxBytes) {
      return { ok: false, error: "body_too_large" };
    }
  }

  if (!request.body) return { ok: false, error: "invalid_json" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let raw = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, error: "body_too_large" };
      }

      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return { ok: false, error: "invalid_json" };
  } finally {
    reader.releaseLock();
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}
