import { expect, test } from "@playwright/test";
import { demos } from "../../src/lib/demos";
import { expectGlassBudget } from "./fixtures/glass";

/**
 * The v3 shell contract all five demos share:
 * the stage and the lever own the first screen at 390 x 664 without the page
 * scrolling itself, a restart is visible, and at most two glass surfaces show.
 */
const V3 = demos;

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

    test("on every beat the lever and each of its controls end above the tab bar at 390 x 664", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(`/demos/${demo.slug}`, { waitUntil: "networkidle" });
      const beats = await page.locator("[data-beat-mark]").evaluateAll((marks) => marks.map((mark) => mark.getAttribute("data-beat-mark") ?? ""));
      expect(beats.length).toBeGreaterThan(3);
      for (const beat of beats) {
        await page.goto(`/demos/${demo.slug}?beat=${beat}`, { waitUntil: "networkidle" });
        await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", beat);
        const bottoms = await page.evaluate(() => {
          const bar = document.querySelector("[data-mobile-tab-bar]");
          const fold = Math.min(bar ? bar.getBoundingClientRect().top : window.innerHeight, window.innerHeight);
          const lever = document.querySelector("[data-demo-lever]");
          const controls = [lever, ...(lever?.querySelectorAll("button, input:not(.sr-only), select, label, a") ?? [])]
            .filter((element): element is Element => element !== null)
            .map((element) => element.getBoundingClientRect())
            .filter((box) => box.height > 0)
            .map((box) => box.bottom);
          return { fold, lowest: Math.max(0, ...controls) };
        });
        expect(bottoms.lowest, `${demo.slug} ${beat}`).toBeLessThanOrEqual(bottoms.fold + 0.5);
        expect(await page.evaluate(() => window.scrollY), `${demo.slug} ${beat}`).toBe(0);
      }
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
