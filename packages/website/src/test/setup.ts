import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

/* ------------------------------------------------------------------ */
/* jsdom polyfills for browser APIs used by framer-motion              */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
  // Progress tests share one deterministic Storage implementation instead of
  // installing file-local variants that can leak different backing maps across
  // imported modules.
  //
  // This is installed unconditionally, and that is load-bearing. jsdom can
  // expose localStorage as missing or unusable when a worker is created
  // without a stable origin, so whether its own Storage appears at all varies
  // by Node version. Worse, jsdom implements Storage as a Proxy whose
  // prototype methods cannot be shadowed by an own property, so
  // `vi.spyOn(window.localStorage, "setItem")` silently fails to intercept
  // against it while working normally against this plain object. Installing
  // conditionally therefore gave the suite two different storage semantics:
  // on Node 26 the polyfill won and denial mocks fired, on Node 24 (CI) real
  // jsdom won and eight tests asserted against mocks that never ran.
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });

  if (!("IntersectionObserver" in window)) {
    class MockIntersectionObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds: readonly number[] = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).IntersectionObserver = MockIntersectionObserver;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  }

  if (typeof window.matchMedia !== "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Canvas 2D context stub — jsdom does not implement */
  /* CanvasRenderingContext2D without the native `canvas` npm package, so  */
  /* HTMLCanvasElement.getContext('2d') returns null out of the box. The   */
  /* data-infrastructure course's 10 canvas widgets each need a *working*  */
  /* context by default so their tests can exercise real draw calls; the   */
  /* null-context-fallback tests override this per-test (assigning their   */
  /* own vi.fn().mockReturnValue(null) on HTMLCanvasElement.prototype),    */
  /* which takes precedence for that test only. A Proxy avoids hand-       */
  /* maintaining every CanvasRenderingContext2D method/property a widget   */
  /* might call: any method returns a no-op function, any other property   */
  /* is a plain writable value (fillStyle, lineWidth, font, ...).          */
  /* ------------------------------------------------------------------ */
  if (typeof HTMLCanvasElement !== "undefined") {
    const gradientStub = { addColorStop: () => {} };
    const createMockContext2D = (): CanvasRenderingContext2D => {
        const store: Record<string, unknown> = {};
        const handler: ProxyHandler<Record<string, unknown>> = {
          get(target, prop) {
            if (typeof prop !== "string") return undefined;
            if (prop === "measureText") return () => ({ width: 0 });
            if (
              prop === "createLinearGradient" ||
              prop === "createRadialGradient" ||
              prop === "createConicGradient" ||
              prop === "createPattern"
            ) {
              return () => gradientStub;
            }
            if (prop === "getTransform") {
              return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
            }
            if (prop in target) return target[prop];
            // Any unknown method call is a harmless no-op; unknown data
            // properties read back as undefined until explicitly set.
            return (..._args: unknown[]) => undefined;
          },
          set(target, prop, value) {
            if (typeof prop === "string") target[prop] = value;
            return true;
          },
        };
        return new Proxy(store, handler) as unknown as CanvasRenderingContext2D;
      };
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any {
      if (contextId === "2d") return createMockContext2D();
      return null;
    } as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toDataURL = () =>
      "data:image/png;base64,VEVTVA==";
  }
}
