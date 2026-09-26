import { expect, test } from "@playwright/test";

/**
 * The phone home hero's horizon globe (docs/experience-system.md, "Phone
 * globe: narrow continuous-motion exception"). Chromium only: the checks read
 * computed animations and dispatch touch input through the page.
 */

test.describe("phone home globe", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "animation and touch checks are Chromium-specific",
  );

  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("server-renders the first frame inside the band, above the tab bar", async ({
    page,
    request,
  }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("data-home-globe-ssr");
    expect(html).toContain('data-home-globe-motion="static"');
    expect(html).not.toContain("data-home-globe-toggle");

    await page.goto("/");
    const hero = page.locator('[data-section="hero"]');
    const box = await hero.boundingBox();
    const tabBarTop = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Schnellnavigation"]');
      return bar ? bar.getBoundingClientRect().top : window.innerHeight;
    });
    expect(box).not.toBeNull();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBeLessThanOrEqual(
      Math.ceil(tabBarTop),
    );
    await expect(page.locator("[data-home-globe]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("stays a static frame under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(4000);

    const slot = page.locator("[data-home-globe]");
    await expect(slot).toHaveAttribute("data-home-globe-motion", "static");
    await expect(slot).not.toHaveAttribute("data-home-globe-live", "");
    await expect(page.locator("[data-home-globe-toggle]")).toHaveCount(0);
    const running = await page.evaluate(() =>
      document
        .querySelector("[data-home-globe]")
        ?.getAnimations({ subtree: true }).length ?? 0,
    );
    expect(running).toBe(0);
  });

  test("goes live after the opening, pauses, and never captures vertical scroll", async ({
    page,
  }) => {
    await page.goto("/");
    const slot = page.locator("[data-home-globe]");
    await expect(slot).toHaveAttribute("data-home-globe-live", "", {
      timeout: 20_000,
    });
    await expect(slot).toHaveAttribute("data-home-globe-motion", "running");

    const toggle = page.locator("[data-home-globe-toggle]");
    const size = await toggle.boundingBox();
    expect(size?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(size?.height ?? 0).toBeGreaterThanOrEqual(44);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(slot).toHaveAttribute("data-home-globe-motion", "paused", {
      timeout: 5000,
    });

    const cdp = await page.context().newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      x: number,
      y: number,
    ) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });
    const globe = await slot.boundingBox();
    const y = Math.round((globe?.y ?? 400) + 120);

    await touch("touchStart", 320, y);
    for (let i = 1; i <= 10; i++) await touch("touchMove", 320 - i * 24, y);
    await touch("touchEnd", 0, 0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await touch("touchStart", 200, y + 80);
    for (let i = 1; i <= 10; i++) await touch("touchMove", 200, y + 80 - i * 30);
    await touch("touchEnd", 0, 0);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
  });
});
