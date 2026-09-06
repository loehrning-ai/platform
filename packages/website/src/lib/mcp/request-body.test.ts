import { describe, expect, it } from "vitest";
import { readBoundedText, withReplayedBody } from "./request-body";

function streamed(chunks: readonly string[], headers: HeadersInit = {}): Request {
  const encoder = new TextEncoder();
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    // @ts-expect-error duplex is required by Node for a streamed request body
    duplex: "half",
  });
}

describe("bounded request body", () => {
  it("rejects a non-positive ceiling", async () => {
    await expect(
      readBoundedText(streamed(["{}"]), 0),
    ).rejects.toThrow(TypeError);
  });

  it("reads a body that fits", async () => {
    const result = await readBoundedText(streamed(['{"a":', "1}"]), 1024);
    expect(result).toEqual({ ok: true, text: '{"a":1}' });
  });

  it("reassembles a multi-byte character split across chunks", async () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode("ü");
    const request = new Request("http://localhost/api/mcp", {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes.slice(0, 1));
          controller.enqueue(bytes.slice(1));
          controller.close();
        },
      }),
      // @ts-expect-error duplex is required by Node for a streamed request body
      duplex: "half",
    });
    const result = await readBoundedText(request, 1024);
    expect(result).toEqual({ ok: true, text: "ü" });
  });

  it("rejects a declared length above the ceiling before reading", async () => {
    const result = await readBoundedText(
      streamed(["{}"], { "Content-Length": "5000" }),
      100,
    );
    expect(result).toEqual({ ok: false, error: "body_too_large" });
  });

  it("rejects a body that exceeds the ceiling while streaming", async () => {
    const result = await readBoundedText(streamed(["x".repeat(200)]), 100);
    expect(result).toEqual({ ok: false, error: "body_too_large" });
  });

  it("reports an absent body as unreadable", async () => {
    const request = new Request("http://localhost/api/mcp", { method: "POST" });
    expect(await readBoundedText(request, 100)).toEqual({
      ok: false,
      error: "unreadable",
    });
  });

  it("replays the body while preserving header identity", async () => {
    const original = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "Mcp-Protocol-Version": "2025-06-18",
      },
      body: "{}",
    });
    const replayed = withReplayedBody(original, '{"jsonrpc":"2.0"}');
    expect(replayed.method).toBe("POST");
    expect(replayed.headers.get("accept")).toBe(
      "application/json, text/event-stream",
    );
    expect(replayed.headers.get("mcp-protocol-version")).toBe("2025-06-18");
    expect(await replayed.text()).toBe('{"jsonrpc":"2.0"}');
  });
});
