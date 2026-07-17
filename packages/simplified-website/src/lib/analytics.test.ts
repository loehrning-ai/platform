/**
 * @vitest-environment jsdom
 *
 * Analytics dispatcher tests (runtime-monitoring policy).
 *
 * The analytics module uses Vercel Web Analytics + Speed Insights only
 * (integrated at the Next.js layout level). The track() helper is a lightweight
 * custom-event dispatcher that logs to console.debug in dev. Plausible and
 * PostHog are no longer supported providers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to console.debug when no provider is available", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    track("test_event", { foo: "bar" });
    expect(debug).toHaveBeenCalledWith("[analytics]", "test_event", {
      foo: "bar",
    });
  });

  it("falls back to console.debug without props", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    track("bare_event");
    expect(debug).toHaveBeenCalledWith("[analytics]", "bare_event", undefined);
  });

  it("no-ops on the server (typeof window === undefined)", () => {
    // Simulate SSR by temporarily making window undefined.
    const original = global.window;
    try {
      // @ts-expect-error — intentional undefined for SSR simulation
      delete global.window;
      const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
      expect(() => track("ssr_event")).not.toThrow();
      expect(debug).not.toHaveBeenCalled();
    } finally {
      global.window = original;
    }
  });

  it("does not reference window.plausible (removed provider)", () => {
    // Vercel Analytics is the only provider. Plausible was removed in privacy hardening.
    const src = track.toString();
    expect(src).not.toContain("plausible");
  });

  it("does not reference window.posthog (removed provider)", () => {
    // Vercel Analytics is the only provider. PostHog was removed in privacy hardening.
    const src = track.toString();
    expect(src).not.toContain("posthog");
  });
});
