/**
 * Visual smoke tests for the reputation/open-source program.
 *
 * The 040-047 implementation intentionally changes above-the-fold composition,
 * navigation labels, legal copy, and public resource framing. Pixel baselines
 * from the older commercial/auth model are not a useful gate here. These tests
 * keep browser rendering coverage without treating planned layout/copy changes
 * as regressions.
 */

import { test, expect, type Page } from "@playwright/test";

async function assertVisualSmoke(page: Page, route: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route, { waitUntil: "load" });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");

  const shot = await page.screenshot({ fullPage: false });
  expect(
    shot.byteLength,
    `${route} screenshot should not be blank`,
  ).toBeGreaterThan(10_000);
}

test.describe("visual smoke - public pages", () => {
  test("homepage / above the fold", async ({ page }) => {
    await assertVisualSmoke(page, "/");
  });

  test("/kurse", async ({ page }) => {
    await assertVisualSmoke(page, "/kurse");
  });

  test("/ki-fuehrerschein", async ({ page }) => {
    await assertVisualSmoke(page, "/ki-fuehrerschein");
  });

  test("/buecher", async ({ page }) => {
    await assertVisualSmoke(page, "/buecher");
  });

  test("/demos", async ({ page }) => {
    await assertVisualSmoke(page, "/demos");
  });

  test("/impressum", async ({ page }) => {
    await assertVisualSmoke(page, "/impressum");
  });

  test("/datenschutz", async ({ page }) => {
    await assertVisualSmoke(page, "/datenschutz");
  });
});

test.describe("visual smoke - mobile pages", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage / mobile", async ({ page }) => {
    await assertVisualSmoke(page, "/");
  });

  test("/kurse mobile", async ({ page }) => {
    await assertVisualSmoke(page, "/kurse");
  });
});
