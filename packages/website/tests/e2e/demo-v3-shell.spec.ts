import { expect, test } from "@playwright/test";
import { demos } from "../../src/lib/demos";
import { expectGlassBudget } from "./fixtures/glass";

/**
 * The v3 shell contract every opted-in demo shares (registry `shell: "v3"`):
 * the stage and the lever own the first screen at 390 x 664 without the page
 * scrolling itself, a restart is visible, and at most two glass surfaces show.
 * Runs for each demo as it opts in; with none on v3 yet it checks nothing.
 */
const V3 = demos.filter((demo) => demo.shell === "v3");

for (const demo of V3) {
  test.describe(`${demo.slug} on the v3 shell`, () => {
    test("stage and lever sit above the fold at 390 x 664, and the page never scrolls itself", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(`/demos/${demo.slug}`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-demo-stage]")).toBeVisible();
      await expect(page.locator("[data-demo-restart]")).toBeVisible();
      const lever = await page.locator("[data-demo-lever]").boundingBox();
      const fold = await page.evaluate(() => {
        const bar = document.querySelector("[data-mobile-tab-bar]");
        return Math.min(bar ? bar.getBoundingClientRect().top : window.innerHeight, window.innerHeight);
      });
      expect(lever, "lever rendered").not.toBeNull();
      expect((lever?.y ?? 0) + (lever?.height ?? 0)).toBeLessThanOrEqual(fold + 0.5);
      await page.waitForTimeout(1200);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expectGlassBudget(page, `/demos/${demo.slug}`);
    });

    test("r resets to beat 1 and a rail mark jumps", async ({ page }) => {
      await page.goto(`/demos/${demo.slug}`, { waitUntil: "networkidle" });
      const clock = page.locator("[data-demo-clock]");
      const marks = page.locator("[data-beat-rail]:visible [data-beat-mark]");
      await marks.nth(2).click();
      await expect(marks.nth(2)).toHaveAttribute("aria-current", "step");
      await expect(clock).toHaveAttribute("data-beat", /\S/);
      await page.locator("body").press("r");
      await expect(marks.first()).toHaveAttribute("aria-current", "step");
    });
  });
}
