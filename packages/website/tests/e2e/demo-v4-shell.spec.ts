import { expect, test, type Page } from "@playwright/test";
import { demoShell } from "../../src/lib/demo-intros";
import { demos } from "../../src/lib/demos";
import { expectGlasBudget } from "./fixtures/glas-budget";

/**
 * The v4 (Glas) shell contract all v4 demos share: at 390 x 664 the intro card
 * and its start button sit above the tab bar, the start opens the guided path
 * with the dock above the tab bar, the page never scrolls itself, the live
 * Glas budget holds, and the keys behave the same in every demo (ArrowRight
 * starts from the intro, r and Shift+R go back to the first step, Escape
 * closes an open layer first and then leaves free play).
 */
const V4 = demos.filter((demo) => demoShell(demo.slug) === "v4");

async function fold(page: Page): Promise<number> {
  return page.evaluate(() => {
    const bar = document.querySelector("[data-mobile-tab-bar]");
    return Math.min(bar ? bar.getBoundingClientRect().top : window.innerHeight, window.innerHeight);
  });
}

async function bottomOf(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${selector} rendered`).not.toBeNull();
  return (box?.y ?? 0) + (box?.height ?? 0);
}

for (const demo of V4) {
  test.describe(`${demo.slug} on the v4 shell`, () => {
    test("intro and start fit 390 x 664, the start opens the guided path with the dock in reach", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(`/demos/${demo.slug}`, { waitUntil: "networkidle" });
      const clock = page.locator("[data-demo-clock]");
      await expect(clock).toHaveAttribute("data-demo-phase", "intro");
      await expect(page.locator("[data-demo-intro]")).toBeVisible();
      expect(await bottomOf(page, "[data-demo-start]")).toBeLessThanOrEqual((await fold(page)) + 0.5);
      await expectGlasBudget(page, `${demo.slug} intro`);

      await expect(async () => {
        await page.locator("[data-demo-start]").click();
        await expect(clock).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 });
      }).toPass();
      await expect(page.locator("[data-demo-lever]")).toBeVisible();
      expect(await bottomOf(page, "[data-demo-lever]")).toBeLessThanOrEqual((await fold(page)) + 0.5);
      await page.waitForTimeout(1200);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expectGlasBudget(page, `${demo.slug} guided`);
    });

    test("ArrowRight starts, r and Shift+R go back to the first step, Escape leaves free play", async ({ page }) => {
      await page.goto(`/demos/${demo.slug}`, { waitUntil: "networkidle" });
      const clock = page.locator("[data-demo-clock]");
      await expect(async () => {
        await page.locator("body").press("ArrowRight");
        await expect(clock).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 });
      }).toPass();
      const first = await clock.getAttribute("data-beat");
      expect(first).toBeTruthy();

      for (const key of ["r", "Shift+R"]) {
        await page.goto(`/demos/${demo.slug}?beat=3`, { waitUntil: "networkidle" });
        await expect(clock).not.toHaveAttribute("data-beat", first ?? "");
        await page.locator("body").press(key);
        await expect(clock, key).toHaveAttribute("data-beat", first ?? "");
        await expect(clock).toHaveAttribute("data-demo-phase", "guided");
      }

      await page.goto(`/demos/${demo.slug}`, { waitUntil: "networkidle" });
      await expect(async () => {
        await page.locator("[data-demo-explore]").click();
        await expect(clock).toHaveAttribute("data-demo-phase", "free", { timeout: 1000 });
      }).toPass();
      // Escape closes an open layer first (W06 opens free play in its sheet
      // "Die Basis"); once nothing is open, the next Escape leaves free play.
      for (let press = 0; press < 3; press += 1) {
        await page.locator("body").press("Escape");
        await page.waitForTimeout(150);
        if ((await clock.getAttribute("data-demo-phase")) === "guided") break;
      }
      await expect(clock).toHaveAttribute("data-demo-phase", "guided");
    });
  });
}
