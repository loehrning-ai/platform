import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * AI-Native sub-page smoke + interaction coverage (regression coverage, wave 2).
 *
 * The /ai-native/* leaf courses.spec.ts never touches: the glossary. It sits
 * in PUBLIC_ACCESS_PATHS (src/lib/crawl/contract.ts): public-noindex,
 * reachable without login. The fluency test, simulation gallery and capstone
 * rules page were retired with the tool-neutral rebuild and now redirect
 * (route-ai-native-locales.spec.ts covers the 301s).
 * Assertions target ROLES, aria-labels, or state-derived counters rather than
 * marketing copy, so a wording refresh stays green while a real regression
 * (dead page, unwired search, broken funnel link, mobile overflow) fails.
 */

// Each leaf ships a distinct, stable, above-the-fold anchor beyond its <h1>.
const SUBPAGES: ReadonlyArray<{
  readonly path: string;
  readonly anchor: (page: Page) => Locator;
}> = [
  {
    path: "/ai-native/glossar",
    anchor: (page) =>
      page.getByRole("searchbox", { name: "Glossar durchsuchen" }),
  },
];

test.describe("ai-native sub-pages smoke", () => {
  for (const { path, anchor } of SUBPAGES) {
    test(`${path} loads public with an h1 and no console error`, async ({
      page,
    }) => {
      const errors = collectBrowserErrors(page);
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `status for ${path}`).toBe(200);
      await expect(page, `${path} must not gate behind login`).not.toHaveURL(
        /\/login/,
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(anchor(page)).toBeVisible();

      const noise = meaningfulBrowserErrors(errors);
      expect(
        noise,
        `console errors on ${path}\n${formatBrowserErrors(noise)}`,
      ).toEqual([]);
    });
  }
});

test.describe("ai-native sub-pages mobile (390px)", () => {
  for (const { path } of SUBPAGES) {
    test(`${path} keeps content visible with no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
        innerWidth: window.innerWidth,
      }));
      expect(
        scrollWidth,
        `horizontal overflow at 390px on ${path}: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
      ).toBeLessThanOrEqual(innerWidth + 1);
    });
  }
});

test.describe("ai-native sub-page interactions", () => {
  test("glossar search filters to its empty state and clears", async ({
    page,
  }) => {
    // "load" so the client island hydrates before the search input reacts to fill().
    await page.goto("/ai-native/glossar", { waitUntil: "load" });
    const search = page.getByRole("searchbox", {
      name: "Glossar durchsuchen",
    });
    await expect(search).not.toHaveAttribute("readonly", "");

    await search.fill("qxzkwvzznope");
    // A no-match query drives the term list to the explicit empty message.
    await expect(page.getByText(/Keine Treffer/i)).toBeVisible();

    await page.getByRole("button", { name: /^(?:Leeren|Clear)$/ }).click();
    await expect(search).toHaveValue("");
  });
});
