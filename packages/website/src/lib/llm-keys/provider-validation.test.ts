/**
 * The one provider call the vault makes.
 *
 * It has to separate "this key is refused" from "the provider did not answer",
 * because only the first is the student's problem. It also has to be silent:
 * no provider text is read, and the credential appears in exactly one place,
 * a request header.
 */

import { describe, expect, it, vi } from "vitest";
import { validateAccountLlmKey } from "./provider-validation";

const API_KEY = `${["sk", "ant", "api03"].join("-")}-${"m".repeat(40)}wxyz`;

interface RecordedCall {
  readonly url: string;
  readonly headers: Headers;
  readonly signal: AbortSignal | null;
}

function recordingFetch(
  respond: (call: RecordedCall) => Promise<Response> | Response,
): { readonly impl: typeof fetch; readonly calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: RecordedCall = {
      url: String(input),
      headers: new Headers(init?.headers),
      signal: init?.signal ?? null,
    };
    calls.push(call);
    return respond(call);
  }) as unknown as typeof fetch;
  return { impl, calls };
}

function jsonResponse(status: number): Response {
  return new Response(status === 204 ? null : JSON.stringify({ data: [] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("validateAccountLlmKey", () => {
  it("confirms a working key and timestamps the check", async () => {
    const { impl, calls } = recordingFetch(() => jsonResponse(200));
    const outcome = await validateAccountLlmKey({
      provider: "anthropic",
      apiKey: API_KEY,
      fetchImpl: impl,
    });

    expect(outcome).toEqual({
      ok: true,
      validatedAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.anthropic.com/v1/models?limit=1");
  });

  it("sends the credential only as a request header", async () => {
    const { impl, calls } = recordingFetch(() => jsonResponse(200));
    await validateAccountLlmKey({
      provider: "anthropic",
      apiKey: API_KEY,
      fetchImpl: impl,
    });

    const [call] = calls;
    expect(call.headers.get("x-api-key")).toBe(API_KEY);
    expect(call.headers.get("anthropic-version")).toBe("2023-06-01");
    expect(call.url).not.toContain(API_KEY);
    expect(call.url).not.toContain("wxyz");
    expect(call.signal).not.toBeNull();
  });

  it("reports a refused credential as rejected", async () => {
    for (const status of [401, 403]) {
      const { impl } = recordingFetch(() => jsonResponse(status));
      await expect(
        validateAccountLlmKey({
          provider: "anthropic",
          apiKey: API_KEY,
          fetchImpl: impl,
        }),
      ).resolves.toEqual({ ok: false, reason: "rejected" });
    }
  });

  it("never blames the key for a provider outage", async () => {
    for (const status of [429, 500, 502, 503, 400, 404]) {
      const { impl } = recordingFetch(() => jsonResponse(status));
      await expect(
        validateAccountLlmKey({
          provider: "anthropic",
          apiKey: API_KEY,
          fetchImpl: impl,
        }),
      ).resolves.toEqual({ ok: false, reason: "unavailable" });
    }
  });

  it("reports a transport failure as unavailable", async () => {
    const { impl } = recordingFetch(() => {
      throw new TypeError("fetch failed");
    });
    await expect(
      validateAccountLlmKey({
        provider: "anthropic",
        apiKey: API_KEY,
        fetchImpl: impl,
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it("aborts a provider that does not answer and reports a timeout", async () => {
    const { impl, calls } = recordingFetch(
      (call) =>
        new Promise<Response>((_resolve, reject) => {
          call.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );

    await expect(
      validateAccountLlmKey({
        provider: "anthropic",
        apiKey: API_KEY,
        timeoutMs: 10,
        fetchImpl: impl,
      }),
    ).resolves.toEqual({ ok: false, reason: "timeout" });
    expect(calls[0].signal?.aborted).toBe(true);
  });

  it("clears its timer once the provider answers", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { impl } = recordingFetch(() => jsonResponse(200));
    await validateAccountLlmKey({
      provider: "anthropic",
      apiKey: API_KEY,
      fetchImpl: impl,
    });
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("never decodes provider text and never returns the key", async () => {
    const body = "provider says something quotable about your account";
    const response = new Response(body, { status: 200 });
    const textSpy = vi.spyOn(response, "text");
    const jsonSpy = vi.spyOn(response, "json");
    const { impl } = recordingFetch(() => response);

    const outcome = await validateAccountLlmKey({
      provider: "anthropic",
      apiKey: API_KEY,
      fetchImpl: impl,
    });

    expect(textSpy).not.toHaveBeenCalled();
    expect(jsonSpy).not.toHaveBeenCalled();
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toContain(API_KEY);
    expect(serialized).not.toContain("wxyz");
    expect(serialized).not.toContain(body);
  });
});
