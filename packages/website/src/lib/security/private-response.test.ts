import { describe, expect, it } from "vitest";
import { mergeVary, withPrivateNoStore } from "./private-response";

describe("withPrivateNoStore", () => {
  it("marks a response with no cache policy as private and uncacheable", () => {
    const response = withPrivateNoStore(
      new Response("{}", { headers: { "Content-Type": "application/json" } }),
    );

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toBe("application/json");
  });

  it("drops public caching directives instead of merging them", () => {
    const response = withPrivateNoStore(
      new Response("{}", {
        headers: { "Cache-Control": "public, max-age=600, s-maxage=600" },
      }),
    );

    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("keeps no-transform so an event stream is not buffered by a proxy", () => {
    const response = withPrivateNoStore(
      new Response("event: message\n\n", {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "Content-Type": "text/event-stream",
        },
      }),
    );

    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, no-transform",
    );
    expect(response.headers.get("content-type")).toBe("text/event-stream");
  });

  it("merges each named request header into Vary exactly once", () => {
    const response = withPrivateNoStore(
      new Response(null, { headers: { Vary: "Accept-Encoding, authorization" } }),
      { vary: ["Authorization", "Cookie"] },
    );

    expect(response.headers.get("vary")).toBe(
      "Accept-Encoding, authorization, Cookie",
    );
  });

  it("keeps status, status text and every unrelated header", async () => {
    const response = withPrivateNoStore(
      new Response("gone", {
        status: 410,
        statusText: "Gone",
        headers: { "X-Custom": "kept", "WWW-Authenticate": "Bearer" },
      }),
      { vary: ["Authorization"] },
    );

    expect(response.status).toBe(410);
    expect(response.statusText).toBe("Gone");
    expect(response.headers.get("x-custom")).toBe("kept");
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(await response.text()).toBe("gone");
  });

  it("streams the body through without waiting for it to finish", async () => {
    const encoder = new TextEncoder();
    let finish: (() => void) | undefined;
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("first\n"));
        finish = () => {
          controller.enqueue(encoder.encode("second\n"));
          controller.close();
        };
      },
    });

    const reader = withPrivateNoStore(new Response(source)).body?.getReader();
    const first = await reader?.read();
    expect(new TextDecoder().decode(first?.value)).toBe("first\n");

    finish?.();
    const second = await reader?.read();
    expect(new TextDecoder().decode(second?.value)).toBe("second\n");
    expect((await reader?.read())?.done).toBe(true);
  });
});

describe("mergeVary", () => {
  it("adds a field to an empty Vary", () => {
    const headers = new Headers();
    mergeVary(headers, "Authorization");
    expect(headers.get("vary")).toBe("Authorization");
  });

  it("never narrows Vary: *", () => {
    const headers = new Headers({ Vary: "*" });
    mergeVary(headers, "Authorization");
    expect(headers.get("vary")).toBe("*");
  });
});
