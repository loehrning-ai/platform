import { expect, test } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";

/**
 * /buecher and /workshops paint their h1 accent as a marker-pen background
 * band (HighlightedText) instead of the inline span's own content-area
 * background specifically because the latter tracks font ascent+descent
 * (~1.21em) independent of leading-[0.9], producing 12.9-27.3px of overlap
 * between wrapped lines. A unit test can prove the band's height/offset stay
 * within one line-height stride symbolically, but only a real browser can
 * prove wrapped lines' painted rects actually stop touching -- that is what
 * this spec verifies.
 */

const ROUTES = ["/buecher", "/en/buecher", "/workshops", "/en/workshops"] as const;
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`${route} heading band has no line-to-line overlap at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await settleFontsAndFrame(page);

      const span = page.locator("h1 span.box-decoration-clone").first();
      await expect(span).toBeVisible();

      const rectsJson = await span.evaluate((element) =>
        JSON.stringify(
          Array.from(element.getClientRects()).map((rect) => ({
            top: rect.top,
            bottom: rect.bottom,
          })),
        ),
      );
      const rects = JSON.parse(rectsJson) as Array<{
        top: number;
        bottom: number;
      }>;

      expect(rects.length, "band must wrap onto at least one line").toBeGreaterThan(0);
      for (let i = 1; i < rects.length; i += 1) {
        expect(
          rects[i].top,
          `line ${i} of the band overlaps line ${i - 1} at ${viewport.name}`,
        ).toBeGreaterThanOrEqual(rects[i - 1].bottom);
      }
    });
  }
}
