import { expect, test } from "@playwright/test";

test.describe("landing globe motion", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("ships the projection-derived globe shell in the initial HTML", async ({
    request,
  }) => {
    const response = await request.get("/en");
    expect(response.ok()).toBe(true);
    const html = await response.text();

    expect(html).toContain("data-hero-network-shell");
    expect(html).toContain("data-hero-globe-motion");
    expect(html).not.toContain("data-hero-globe-poster");
  });

  test("runs one finite desktop intro without a globe control", async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto("/en");

    const network = page.locator('[data-hero-globe-motion="running"]');
    await expect(network).toBeVisible();
    await expect(
      page.getByRole("button", { name: /globe motion/i }),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-hero-globe-motion="settled"]'),
    ).toBeVisible({ timeout: 6_000 });
    await expect(
      page.locator('[data-hero-network-motion="paused"]'),
    ).toBeVisible();
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
    await expect(
      page.getByRole("button", { name: /globe motion/i }),
    ).toBeHidden();
    expect(runtimeErrors).toEqual([]);
  });

  test("replaces live SVG layers with one static composition after a mobile resize", async ({
    page,
  }) => {
    await page.goto("/en");

    const liveGrid = page.locator('[data-hero-network-live="grid-back"]');
    await expect
      .poll(() => liveGrid.evaluate((layer) => layer.childElementCount))
      .toBeGreaterThan(0);

    await page.setViewportSize({ width: 390, height: 844 });

    await expect(
      page.locator('[data-hero-globe-motion="static"]'),
    ).toBeVisible();
    await expect(liveGrid).toHaveAttribute("display", "none");
    await expect
      .poll(() => liveGrid.evaluate((layer) => layer.childElementCount))
      .toBe(0);
  });
});
