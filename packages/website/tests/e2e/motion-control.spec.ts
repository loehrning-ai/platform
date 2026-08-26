import { expect, test } from "@playwright/test";

test.describe("landing globe motion", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("offers a 44px pause/resume control that changes the running state", async ({
    page,
  }) => {
    await page.goto("/en");

    const control = page.getByRole("button", { name: "Pause globe motion" });
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute("aria-pressed", "false");
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    const network = page.locator('[data-hero-globe-motion="running"]');
    await expect(network).toBeVisible();

    await control.click();
    await expect(
      page.getByRole("button", { name: "Resume globe motion" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator('[data-hero-globe-motion="paused"]'),
    ).toBeVisible();
  });

  test("renders a static globe when reduced motion is requested", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");

    await expect(
      page.locator('[data-hero-globe-motion="static"]'),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /globe motion/i }),
    ).toBeHidden();
  });
});
