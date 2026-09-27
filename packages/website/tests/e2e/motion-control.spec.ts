import { expect, test } from "@playwright/test";

test.describe("landing globe motion", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("keeps the desktop projection module out of the mobile-first HTML", async ({
    request,
  }) => {
    const response = await request.get("/en");
    expect(response.ok()).toBe(true);
    const html = await response.text();

    expect(html).not.toContain("data-hero-network-shell");
    expect(html).not.toContain("data-hero-globe-motion");
    expect(html).not.toContain("data-hero-globe-poster");
  });

  test("keeps rotating and pauses from the visible control beside the action", async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto("/en");

    const network = page.locator("#home-hero-network");
    await expect(network).toBeVisible();
    await expect(network).toHaveAttribute("data-hero-globe-motion", "running");
    const toggle = page.getByRole("button", { name: "Pause the globe" });
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("data-hero-globe-toggle", "");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(
      page.locator("[data-hero-actions] [data-hero-globe-toggle]"),
    ).toHaveCount(1);
    await expect(page.locator("[data-hero-globe-surface-control]")).toHaveCount(
      0,
    );

    // Probe the front graticule: it is the one rAF-owned layer every home
    // scene redraws each frame. The flat poster disc hides the far side, so
    // its grid-back layer is empty by design and cannot show motion.
    const livePath = page
      .locator('[data-hero-network-live="grid-front"] path')
      .first();
    await expect(livePath).toBeAttached();

    // Two reasons a fixed wait followed by a short poll measured frame luck
    // rather than motion, and both bit the mobile-webkit shard.
    //
    // The projection module is deliberately absent from the mobile-first HTML,
    // so on a project with a mobile device profile it arrives only after
    // hydration reads the overridden desktop viewport. The path is attached
    // before it animates, and `data-hero-globe-motion` reports React state,
    // not whether the frame loop is actually running. So establish that a
    // frame has landed before timing anything.
    //
    // The loop is then gated on intersection, on the scroll-frozen scene, and
    // on `document.visibilityState`, so under runner contention a frame can
    // take far longer than a second and a half to arrive. That is slow, not
    // stopped, and this test asserts only that motion outlives the former
    // deadline. Both polls therefore get a generous window: a fast machine
    // still settles them in milliseconds.
    const firstFrame = await livePath.getAttribute("d");
    await expect
      .poll(() => livePath.getAttribute("d"), { timeout: 15_000 })
      .not.toBe(firstFrame);

    await page.waitForTimeout(4_800);
    const afterFormerDeadline = await livePath.getAttribute("d");
    await expect
      .poll(() => livePath.getAttribute("d"), { timeout: 15_000 })
      .not.toBe(afterFormerDeadline);
    await expect(network).toBeVisible();

    const word = page.locator("[data-hero-network-word]");
    await expect
      .poll(() => word.textContent(), { timeout: 5_000 })
      .toMatch(/\S/);

    await toggle.click();
    await expect(network).toHaveAttribute("data-hero-globe-motion", "paused");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    const pausedPath = await livePath.getAttribute("d");
    await page.waitForTimeout(300);
    expect(await livePath.getAttribute("d")).toBe(pausedPath);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(network).toHaveAttribute("data-hero-globe-motion", "running");
    await expect
      .poll(() => livePath.getAttribute("d"), { timeout: 1_500 })
      .not.toBe(pausedPath);
    expect(runtimeErrors).toEqual([]);
  });

  test("renders a static globe when reduced motion is requested", async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");

    const globe = page.locator('[data-hero-globe-motion="static"]');
    await expect(globe).toBeVisible();
    await expect(page.getByRole("button", { name: /globe/i })).toHaveCount(0);

    // Static is a fact about frames, not only a label: the projection module
    // mounts in its static branch, the frame loop never draws into any
    // rAF-owned layer, and the declarative composition holds still.
    await expect(
      globe.locator('[data-hero-network-motion="static"]'),
    ).toHaveCount(1);
    await expect(
      globe.locator('[data-hero-network-live="grid-front"]'),
    ).toHaveAttribute("display", "none");
    const frame = () =>
      globe
        .locator("svg path")
        .evaluateAll((paths) =>
          paths.map((path) => path.getAttribute("d")).join("|"),
        );
    const settled = await frame();
    expect(settled).not.toBe("");
    await page.waitForTimeout(1_000);
    expect(await frame()).toBe(settled);
    expect(
      await globe
        .locator("[data-hero-network-live]")
        .evaluateAll((layers) =>
          layers.reduce((drawn, layer) => drawn + layer.childElementCount, 0),
        ),
    ).toBe(0);
    expect(runtimeErrors).toEqual([]);
  });

  test("removes the projection tree after a mobile resize", async ({
    page,
  }) => {
    await page.goto("/en");

    const liveGrid = page.locator('[data-hero-network-live="grid-front"]');
    await expect
      .poll(() => liveGrid.evaluate((layer) => layer.childElementCount))
      .toBeGreaterThan(0);

    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.locator("[data-hero-globe-motion]")).toHaveCount(0);
    await expect(page.locator("[data-hero-network-motion]")).toHaveCount(0);
  });
});
