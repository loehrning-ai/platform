import { expect, test } from "@playwright/test";
import { expectGlassBudget } from "./fixtures/glass";

/**
 * Werkglas on a phone: the fixed top bar stays opaque paper (a backdrop blur on
 * a fixed bar flickers in iOS WebKit), and the demo chrome stays within its
 * glass budget wherever the page is scrolled. The navigation itself is out of
 * scope here: it keeps its own look.
 */

const PHONE = { width: 390, height: 844 };

test.describe("Werkglas on a phone", () => {
  test.use({ viewport: PHONE });

  test("keeps the fixed top bar opaque and the demo chrome within its glass budget", async ({ page }) => {
    for (const path of ["/demos", "/demos/audit-vorbereitung-mit-ki?beat=alle-acht", "/demos/geschaeftsberichte-mit-ki-lesen?beat=deine-kennzahl"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      const row = await page.locator("[data-nav-header-row]").evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, filter: style.backdropFilter };
      });
      expect(row.background, path).toBe("rgb(247, 241, 231)");
      expect(row.filter === "none" || row.filter === "", path).toBe(true);
      for (const y of [0, 700, 1400]) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await expectGlassBudget(page, `${path} at y=${y}`);
      }
    }
  });
});
