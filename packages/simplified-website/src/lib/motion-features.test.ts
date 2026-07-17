/**
 * motion-features.test.ts (regression coverage)
 *
 * `@/lib/motion-features` is the async-loaded Framer Motion feature bundle for
 * nested <LazyMotion features={loadDomMax}>. Its default export must be the
 * *max* bundle (`domMax`) - the heavier one that carries the projection engine
 * (layout / drag / pan) - and specifically NOT the lighter `domAnimation` that
 * the root MotionProvider ships to keep it out of the First Load JS. Swapping
 * it to `domAnimation` would silently break every nested layout animation, so
 * these tests lock the bundle identity and its distinguishing feature keys.
 *
 * The real framer-motion module is imported here (setup.ts only polyfills
 * IntersectionObserver + matchMedia and does not mock framer-motion globally),
 * so `domMax` / `domAnimation` are the genuine feature packages.
 */

import { describe, expect, it } from "vitest";
import { domMax, domAnimation } from "framer-motion";
import loadDomMax from "@/lib/motion-features";

const keysOf = (bundle: unknown) =>
  Object.keys(bundle as Record<string, unknown>);

describe("motion-features default export", () => {
  it("re-exports framer-motion's domMax feature bundle by reference", () => {
    expect(loadDomMax).toBe(domMax);
  });

  it("is a non-empty feature bundle object", () => {
    expect(loadDomMax).toBeTypeOf("object");
    expect(loadDomMax).not.toBeNull();
    expect(keysOf(loadDomMax).length).toBeGreaterThan(0);
  });

  it("is the max bundle, not the lighter domAnimation bundle", () => {
    expect(loadDomMax).not.toBe(domAnimation);
  });

  it("carries the projection features (layout / drag / pan) domAnimation omits", () => {
    // The reason this module exists: nested layout animations need these
    // features, which the root domAnimation provider deliberately drops.
    expect(keysOf(loadDomMax)).toEqual(
      expect.arrayContaining(["layout", "drag", "pan"]),
    );
    const animKeys = keysOf(domAnimation);
    expect(animKeys).not.toContain("layout");
    expect(animKeys).not.toContain("drag");
    expect(animKeys).not.toContain("pan");
  });

  it("is a strict superset of domAnimation's feature keys", () => {
    const maxKeys = new Set(keysOf(loadDomMax));
    for (const key of keysOf(domAnimation)) {
      expect(maxKeys.has(key)).toBe(true);
    }
    expect(maxKeys.size).toBeGreaterThan(keysOf(domAnimation).length);
  });
});
