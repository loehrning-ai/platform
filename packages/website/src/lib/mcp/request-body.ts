/**
 * Bounded body reader for the MCP endpoint.
 *
 * The Streamable HTTP transport owns the JSON-RPC envelope, so the route
 * cannot hand it a parsed object. It reads the raw text under a hard byte
 * ceiling instead and rebuilds a fresh Request from it. A declared
 * Content-Length is only a fast rejection path; the streamed byte count stays
 * authoritative because a client can omit or misstate that header.
 */

export type BoundedTextResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: "body_too_large" | "unreadable" };

export async function readBoundedText(
  request: Request,
  maxBytes: number,
): Promise<BoundedTextResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError("maxBytes must be a positive safe integer");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const declared = Number(declaredLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      return { ok: false, error: "body_too_large" };
    }
  }

  if (!request.body) return { ok: false, error: "unreadable" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, error: "body_too_large" };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return { ok: false, error: "unreadable" };
  } finally {
    reader.releaseLock();
  }

  return { ok: true, text };
}

/**
 * Rebuild a POST request around an already-read body. Header identity is
 * preserved so the transport still sees the client's Accept, protocol version,
 * and session headers.
 */
export function withReplayedBody(request: Request, body: string): Request {
  return new Request(request.url, {
    method: request.method,
    headers: new Headers(request.headers),
    body,
  });
}
