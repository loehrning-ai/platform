import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePracticeApi } from "./use-practice-api";

/**
 * use-practice-api.test.tsx (regression coverage)
 *
 * `usePracticeApi` is imported by all three Practice Room widgets, but only
 * through their own happy/unavailable paths (see practice.test.tsx) - the
 * widgets never exercise a thrown fetch, a malformed 200 body, the
 * near/why default-empty-string fallback, or the request contract directly.
 * This drives the hook itself with `renderHook` so those branches in
 * `postPractice` / `complete` / `place` get real assertions instead of
 * incidental coverage.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(
  impl: (...args: Parameters<typeof fetch>) => Promise<Response>,
) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("usePracticeApi", () => {
  it("starts with available=null and loading=false", () => {
    const { result } = renderHook(() => usePracticeApi());
    expect(result.current.available).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  describe("complete()", () => {
    it("resolves the live text and marks the API available on success", async () => {
      mockFetch(() => jsonResponse({ mode: "complete", text: "Hallo Welt" }));
      const { result } = renderHook(() => usePracticeApi());

      let outcome: string | null = null;
      await act(async () => {
        outcome = await result.current.complete("Schreibe eine kurze Mail.");
      });

      expect(outcome).toBe("Hallo Welt");
      expect(result.current.available).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it("falls back to null and marks unavailable on a non-ok response", async () => {
      mockFetch(() => jsonResponse({ error: "off" }, 503));
      const { result } = renderHook(() => usePracticeApi());

      let outcome: string | null = "not-yet-set";
      await act(async () => {
        outcome = await result.current.complete("Prompt");
      });

      expect(outcome).toBeNull();
      expect(result.current.available).toBe(false);
    });

    it("falls back to null and marks unavailable when fetch itself throws", async () => {
      mockFetch(() => Promise.reject(new Error("network down")));
      const { result } = renderHook(() => usePracticeApi());

      let outcome: string | null = "not-yet-set";
      await act(async () => {
        outcome = await result.current.complete("Prompt");
      });

      expect(outcome).toBeNull();
      expect(result.current.available).toBe(false);
    });

    it("falls back to null when a 200 body is missing the text field", async () => {
      // ok:true, but the shape usePracticeApi actually needs is absent -
      // this is the malformed-success branch, distinct from a hard failure.
      mockFetch(() => jsonResponse({ mode: "complete" }));
      const { result } = renderHook(() => usePracticeApi());

      let outcome: string | null = "not-yet-set";
      await act(async () => {
        outcome = await result.current.complete("Prompt");
      });

      expect(outcome).toBeNull();
      expect(result.current.available).toBe(false);
    });

    it("posts the mode=complete contract to /api/ai-native/practice", async () => {
      const fetchMock = mockFetch(() => jsonResponse({ text: "ok" }));
      const { result } = renderHook(() => usePracticeApi());

      await act(async () => {
        await result.current.complete("Fasse den Text zusammen.");
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("/api/ai-native/practice");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual({ "Content-Type": "application/json" });
      expect(JSON.parse(init?.body as string)).toEqual({
        mode: "complete",
        prompt: "Fasse den Text zusammen.",
      });
    });

    it("toggles loading true while the request is in flight, then false", async () => {
      let resolveFetch: (response: Response) => void = () => {};
      const pending = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch(() => pending);
      const { result } = renderHook(() => usePracticeApi());

      let completePromise!: Promise<string | null>;
      act(() => {
        completePromise = result.current.complete("Prompt");
      });
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveFetch(
          new Response(JSON.stringify({ text: "fertig" }), { status: 200 }),
        );
        await completePromise;
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.available).toBe(true);
    });
  });

  describe("place()", () => {
    const existing = [{ w: "Kunde", x: 0.2, y: 0.4 }];

    it("resolves coordinates + near/why on success", async () => {
      mockFetch(() =>
        jsonResponse({ x: 0.6, y: 0.3, near: "Rechnung", why: "Buchhaltung" }),
      );
      const { result } = renderHook(() => usePracticeApi());

      let outcome = null as Awaited<
        ReturnType<ReturnType<typeof usePracticeApi>["place"]>
      >;
      await act(async () => {
        outcome = await result.current.place("Beleg", existing);
      });

      expect(outcome).toEqual({
        x: 0.6,
        y: 0.3,
        near: "Rechnung",
        why: "Buchhaltung",
      });
      expect(result.current.available).toBe(true);
    });

    it("defaults near/why to empty strings when the server omits them", async () => {
      mockFetch(() => jsonResponse({ x: 0.5, y: 0.5 }));
      const { result } = renderHook(() => usePracticeApi());

      let outcome = null as Awaited<
        ReturnType<ReturnType<typeof usePracticeApi>["place"]>
      >;
      await act(async () => {
        outcome = await result.current.place("Beleg", existing);
      });

      expect(outcome).toEqual({ x: 0.5, y: 0.5, near: "", why: "" });
    });

    it("falls back to null and marks unavailable when x/y are not numbers", async () => {
      mockFetch(() => jsonResponse({ x: "0.5", y: 0.5 }));
      const { result } = renderHook(() => usePracticeApi());

      let outcome = "not-yet-set" as unknown;
      await act(async () => {
        outcome = await result.current.place("Beleg", existing);
      });

      expect(outcome).toBeNull();
      expect(result.current.available).toBe(false);
    });

    it("posts the mode=place-word contract with the mapped existing points", async () => {
      const fetchMock = mockFetch(() => jsonResponse({ x: 0.1, y: 0.1 }));
      const { result } = renderHook(() => usePracticeApi());

      await act(async () => {
        await result.current.place("Fräse", existing);
      });

      const [, init] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(init?.body as string)).toEqual({
        mode: "place-word",
        word: "Fräse",
        existing: [{ w: "Kunde", x: 0.2, y: 0.4 }],
      });
    });
  });
});
