import { expect, test } from "@playwright/test";

/**
 * The phone home hero's globe: a window onto the paper hero's line globe
 * (home/hero-globe-frame.tsx server frame, home/phone-globe.tsx loader,
 * home/hero-network.tsx in compact mode). Chromium only: the checks read
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
    const slot = page.locator("[data-home-globe]");
    await expect(slot).toHaveAttribute("aria-hidden", "true");
    // The window starts below the actions: no text sits on the globe.
    const actions = await page.locator("[data-hero-actions]").boundingBox();
    const globe = await slot.boundingBox();
    expect(globe?.y ?? 0).toBeGreaterThanOrEqual(
      (actions?.y ?? 0) + (actions?.height ?? 0),
    );
    // Paper, never a dark band.
    const ground = await hero.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    const [r, g, b] = (ground.match(/\d+/g) ?? []).map(Number);
    expect(Math.min(r, g, b)).toBeGreaterThan(200);
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
    await expect(slot.locator("[data-hero-network-motion]")).toHaveCount(0);
    // The signal from Berlin never plays and its layer is not drawn.
    await expect(slot).not.toHaveAttribute("data-home-intro", /.*/);
    await expect(slot.locator("[data-home-signals]")).toBeHidden();
    const running = await page.evaluate(
      () =>
        document
          .querySelector("[data-home-globe]")
          ?.getAnimations({ subtree: true }).length ?? 0,
    );
    expect(running).toBe(0);
  });

  test("goes live after the opening, tours and pauses, and never captures vertical scroll", async ({
    page,
  }) => {
    await page.goto("/");
    const slot = page.locator("[data-home-globe]");
    // The signal from Berlin plays once over the window, then settles and
    // its layer is gone; nothing of it repeats.
    await expect(slot).toHaveAttribute("data-home-intro", "done", {
      timeout: 20_000,
    });
    await expect(slot.locator("[data-home-signals]")).toBeHidden();
    await expect(slot).toHaveAttribute("data-home-globe-live", "", {
      timeout: 20_000,
    });
    await expect(slot).toHaveAttribute("data-home-globe-motion", "running");
    // The live globe replaced the server frame and types its first word.
    await expect(slot.locator("[data-home-globe-ssr]")).toBeHidden();
    await expect
      .poll(() => slot.locator("[data-hero-network-word]").textContent(), {
        timeout: 15_000,
      })
      .toMatch(/\S/);

    const toggle = page.locator("[data-home-globe-toggle]");
    const size = await toggle.boundingBox();
    expect(size?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(size?.height ?? 0).toBeGreaterThanOrEqual(44);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(slot).toHaveAttribute("data-home-globe-motion", "paused", {
      timeout: 5000,
    });
    const livePath = slot
      .locator('[data-hero-network-live="grid-front"] path')
      .first();
    const pausedPath = await livePath.getAttribute("d");
    await page.waitForTimeout(400);
    expect(await livePath.getAttribute("d")).toBe(pausedPath);

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

    await touch("touchStart", 200, y + 80);
    for (let i = 1; i <= 10; i++) await touch("touchMove", 200, y + 80 - i * 30);
    await touch("touchEnd", 0, 0);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
  });
});
