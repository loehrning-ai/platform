export type BoundedFormResult =
  | { readonly ok: true; readonly value: URLSearchParams }
  | { readonly ok: false; readonly error: "body_too_large" | "invalid_form" };

export function hasFormContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  if (!contentType) return false;
  return (
    contentType.split(";", 1)[0]?.trim().toLowerCase() ===
    "application/x-www-form-urlencoded"
  );
}

/**
 * Parse a URL-encoded form without ever accumulating more than `maxBytes` in
 * application memory. Content-Length is only a fast rejection path; the
 * streamed byte count stays authoritative because a client can omit or lie
 * about that header.
 *
 * Mirrors readBoundedJson in src/lib/http/read-json-body.ts; the consent form
 * is the only URL-encoded POST on the platform, so the reader lives with it.
 */
export async function readBoundedForm(
  request: Request,
  maxBytes: number,
): Promise<BoundedFormResult> {
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

  if (!request.body) return { ok: false, error: "invalid_form" };

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
    return { ok: false, error: "invalid_form" };
  } finally {
    reader.releaseLock();
  }

  try {
    return { ok: true, value: new URLSearchParams(raw) };
  } catch {
    return { ok: false, error: "invalid_form" };
  }
}
