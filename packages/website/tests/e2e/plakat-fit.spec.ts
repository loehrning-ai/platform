/**
 * Poster titles fit their column (SPEC §4, the fit rule).
 *
 * `--fit` comes from measured glyph widths (src/lib/plakat/fit.ts); this reads
 * the real layout instead. A first visit can render on the Arial-metric
 * fallback face (`font-display: optional`), which is about 4.4% wider, so each
 * route loads in a fresh page at 320, 390 and 1440 and every visible poster
 * title must keep its scroll width inside its client width.
 *
 * Runs in Chromium only: layout widths do not depend on the engine here, and
 * WebKit keeps its own layout specs.
 */

import { expect, test } from "@playwright/test";
import { PLAKAT_ROUTES } from "./fixtures/plakat-pixels";

const WIDTHS = [320, 390, 1440] as const;
const TITLE_SELECTOR = ".poster-title, .blog-index__title";

test.describe("poster titles fit their column", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "layout check in Chromium",
  );

  for (const route of PLAKAT_ROUTES) {
    test(`${route}: every poster title fits at 320, 390 and 1440`, async ({
      browser,
    }) => {
      test.setTimeout(120_000);
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();
        const response = await page.goto(route, { waitUntil: "load" });
        expect(response?.status(), `${route} must answer 200`).toBe(200);
        await expect(page.locator("h1").first()).toBeVisible();
        const overflow = await page.evaluate((selector) => {
          return [...document.querySelectorAll<HTMLElement>(selector)]
            .filter((title) => title.getBoundingClientRect().width > 0)
            .map((title) => ({
              text: title.textContent?.trim() ?? "",
              scrollWidth: title.scrollWidth,
              clientWidth: title.clientWidth,
            }))
            .filter((title) => title.scrollWidth > title.clientWidth);
        }, TITLE_SELECTOR);
        expect(overflow, `${route} at ${width}px`).toEqual([]);
        await context.close();
      }
    });
  }
});
