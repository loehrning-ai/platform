import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

/* ------------------------------------------------------------------ */
/* jsdom polyfills for browser APIs used by framer-motion              */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
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
}
