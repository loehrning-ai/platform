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

  test("keeps rotating and uses the globe surface as its motion control", async ({
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
    const surfaceControl = page.getByRole("button", {
      name: "Pause globe motion",
    });
    await expect(surfaceControl).toHaveAttribute(
      "data-hero-globe-surface-control",
      "true",
    );
    await expect(surfaceControl).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );

    const livePath = page
      .locator('[data-hero-network-live="grid-back"] path')
      .first();
    await expect(livePath).toBeAttached();
    await page.waitForTimeout(4_800);
    const afterFormerDeadline = await livePath.getAttribute("d");
    await expect
      .poll(() => livePath.getAttribute("d"), { timeout: 1_500 })
      .not.toBe(afterFormerDeadline);
    await expect(network).toBeVisible();

    const word = page.locator("[data-hero-network-word]");
    await expect
      .poll(() => word.textContent(), { timeout: 5_000 })
      .toMatch(/\S/);

    await surfaceControl.click();
    await expect(network).toHaveAttribute("data-hero-globe-motion", "paused");
    const pausedPath = await livePath.getAttribute("d");
    await page.waitForTimeout(300);
    expect(await livePath.getAttribute("d")).toBe(pausedPath);

    await page.getByRole("button", { name: "Resume globe motion" }).click();
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

    await expect(
      page.locator('[data-hero-globe-motion="static"]'),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /globe motion/i })).toHaveCount(
      0,
    );
    expect(runtimeErrors).toEqual([]);
  });

  test("removes the projection tree after a mobile resize", async ({
    page,
  }) => {
    await page.goto("/en");

    const liveGrid = page.locator('[data-hero-network-live="grid-back"]');
    await expect
      .poll(() => liveGrid.evaluate((layer) => layer.childElementCount))
      .toBeGreaterThan(0);

    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.locator("[data-hero-globe-motion]")).toHaveCount(0);
    await expect(page.locator("[data-hero-network-motion]")).toHaveCount(0);
  });
});
