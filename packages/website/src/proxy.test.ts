/**
 * Proxy tests (accessibility hardening).
 *
 * Asserts that the proxy does NOT inject any ff_journey_v3 feature flag
 * header or cookie. The ff_journey_v3 flag was a commercial-era scan engine
 * toggle deleted by public-content transition. Its removal is verified here permanently.
 */

import { describe, it, expect } from "vitest";

describe("proxy: ff_journey_v3 feature flag removal (accessibility hardening)", () => {
  it("src/proxy.ts does not reference ff_journey_v3", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");

    const proxyPath = resolve(process.cwd(), "src/proxy.ts");
    const content = readFileSync(proxyPath, "utf-8");

    expect(
      content.includes("ff_journey_v3"),
      "src/proxy.ts must not reference ff_journey_v3 (deleted by public-content transition)",
    ).toBe(false);

    expect(
      content.includes("x-ff-journey"),
      "src/proxy.ts must not set x-ff-journey response header",
    ).toBe(false);
  });

  it("src/app/datenschutz/page.tsx does not disclose ff_journey_v3", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");

    const datenschutzPath = resolve(
      process.cwd(),
      "src/app/datenschutz/page.tsx",
    );
    const content = readFileSync(datenschutzPath, "utf-8");

    expect(
      content.includes("ff_journey_v3"),
      "Datenschutz must not mention the deleted ff_journey_v3 cookie",
    ).toBe(false);
  });

  it("src/app/datenschutz/page.tsx does NOT disclose DigifyDE (runtime-monitoring policy — scan routes removed by public-content transition)", async () => {
    // After public-content transition removed the commercial scan routes and privacy hardening rewrote the
    // Datenschutz to match actual platform behaviour, DigifyDE is no longer an
    // active processor. Art. 5(1)(a) DSGVO requires current-state accuracy.
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");

    const datenschutzPath = resolve(
      process.cwd(),
      "src/app/datenschutz/page.tsx",
    );
    const content = readFileSync(datenschutzPath, "utf-8");

    expect(
      content.includes("DIGIFYDE_API_URL") || content.includes("DigifyDE"),
      "Datenschutz must NOT disclose DigifyDE after public-content transition removed the scan routes",
    ).toBe(false);
  });
});
