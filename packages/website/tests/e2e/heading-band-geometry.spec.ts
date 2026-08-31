import { expect, test } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";
import {
  HIGHLIGHT_BAND_HEIGHT_EM,
  HIGHLIGHT_BAND_OFFSET_EM,
} from "@/components/ui/highlighted-text";

/**
 * /buecher and /workshops paint their h1 accent as a marker-pen background
 * band (HighlightedText) instead of the inline span's own content-area
 * background specifically because the latter tracks font ascent+descent
 * (~1.21em) independent of leading-[0.9], producing 12.9-27.3px of overlap
 * between wrapped lines.
 *
 * What that means for measurement: the span's INLINE BOX still overlaps
 * between lines, and always will -- getClientRects() reports the content-area
 * boxes, whose height is a function of the font's ascent+descent, not of any
 * background the element paints. The fix was never able to change those rects.
 * What it changes is the PAINTED band, which is an explicitly sized and
 * positioned background-image stripe inside each of those boxes.
 *
 * So this spec derives each line's painted band from its client rect plus the
 * primitive's own two em constants (imported, so the assertion cannot drift
 * from the implementation) and asserts the BANDS do not touch. That is the
 * property the primitive actually guarantees -- offset + height staying inside
 * the line-height stride -- verified against real font metrics and real
 * wrapping, which is the part a unit test cannot reach.
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

      const measuredJson = await span.evaluate((element) =>
        JSON.stringify({
          fontSizePx: Number.parseFloat(
            window.getComputedStyle(element).fontSize,
          ),
          rects: Array.from(element.getClientRects()).map((rect) => ({
            top: rect.top,
            bottom: rect.bottom,
          })),
        }),
      );
      const measured = JSON.parse(measuredJson) as {
        fontSizePx: number;
        rects: Array<{ top: number; bottom: number }>;
      };

      expect(
        Number.isFinite(measured.fontSizePx) && measured.fontSizePx > 0,
        "font-size must resolve before the band can be derived",
      ).toBe(true);
      expect(
        measured.rects.length,
        "band must wrap onto at least one line",
      ).toBeGreaterThan(0);

      // The painted stripe: backgroundPosition 0 <offset>em, backgroundSize
      // 100% <height>em, measured from the top of each line's content area.
      const bands = measured.rects.map((rect) => {
        const top = rect.top + HIGHLIGHT_BAND_OFFSET_EM * measured.fontSizePx;
        return {
          top,
          bottom: top + HIGHLIGHT_BAND_HEIGHT_EM * measured.fontSizePx,
        };
      });

      for (let i = 1; i < bands.length; i += 1) {
        expect(
          bands[i].top,
          `painted band on line ${i} overlaps line ${i - 1} at ${viewport.name}`,
        ).toBeGreaterThanOrEqual(bands[i - 1].bottom);
      }
    });
  }
}
