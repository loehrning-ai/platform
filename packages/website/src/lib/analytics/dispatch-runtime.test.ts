/**
 * @vitest-environment jsdom
 *
 * Runs the real dispatcher and the real SDK in production mode without the
 * analytics runtime ever having been injected: nothing may throw and nothing
 * may be logged.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { track, trackDemoCta, trackDemoEngagedSeconds } from "@/lib/analytics";

describe("production dispatch without the analytics runtime", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("neither throws nor logs", () => {
    vi.stubEnv("NODE_ENV", "production");
    const spies = (["debug", "info", "log", "warn", "error"] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => {}),
    );
    expect(() => {
      track("demo_cta_clicked", { subject: "excel", facet: "kurs" });
      track("unregistered_event", { subject: "excel" });
      trackDemoCta("excel", "kurs");
      trackDemoEngagedSeconds("excel", 10);
    }).not.toThrow();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
