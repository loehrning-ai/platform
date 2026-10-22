import { test, expect, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";
import { chapters } from "./fixtures/book";

/**
 * /buecher library index deep-dive (regression coverage). The existing
 * buecher.spec.ts is a light gate (login-free access, auth-gated PDF route,
 * API shape). This spec covers the SHELF rendered by
 * src/app/buecher/buecher-content.tsx from the src/lib/books.ts catalog: the
 * Lemons band with the H1, one hub-style row per published book (cover tile,
 * meta line, title, hook), the two cards that open chapter 1 and the book in
 * one tap, the visible chapter list, no collapsible UI, and no horizontal
 * overflow on a phone. Assertions target roles, test IDs and stable catalog
 * strings, so a prose refresh stays green while a real regression (a dropped
 * row, a dead card, a hidden chapter list) fails.
 *
 * Only ki-landschaft is in the published catalog (src/lib/books.ts); the
 * other two books are pending re-review and don't render a row.
 */

const ROUTE = "/buecher";

const BOOKS = [
  {
    slug: "ki-landschaft",
    title: "Von außen gesehen",
    meta: "Ausgabe Oktober 2026 · 9 Kapitel · 24 Min.",
  },
] as const;

const HERO_HEADLINE = "Bücher zum Nachrechnen";

// Scope to one row via its testid + the unique book heading it contains.
function cardFor(page: Page, title: string) {
  return page
    .getByTestId("book-card")
    .filter({ has: page.getByRole("heading", { level: 2, name: title }) });
}

test.describe("/buecher library index", () => {
  test(`loads without login, shows the h1 in the band and exactly ${BOOKS.length} book row(s)`, async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const band = page.locator('[data-cover-band][data-plakat="lemons"]');
    const h1 = band.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(HERO_HEADLINE);

    await expect(page.getByTestId("book-card")).toHaveCount(BOOKS.length);
    await expect(page.locator("main details, main summary, main dialog")).toHaveCount(0);

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on ${ROUTE}\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
  });

  for (const book of BOOKS) {
    test(`row "${book.title}" shows meta, hook, tile, both cards and every chapter`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const card = cardFor(page, book.title);
      await expect(card).toBeVisible();

      await expect(card.locator("[data-book-meta]")).toHaveText(book.meta);
      await expect(card.locator("[data-book-hook]")).toBeVisible();
      await expect(card.locator("[data-book-cover-tile]")).toBeVisible();

      await expect(
        card.getByRole("link", { name: `Kapitel 1 lesen: ${book.title}` }),
      ).toHaveAttribute("href", `/buecher/${book.slug}/${chapters("de")[0]!.slug}`);
      await expect(
        card.getByRole("link", { name: `Zum Buch: ${book.title}` }),
      ).toHaveAttribute("href", `/buecher/${book.slug}`);
      await expect(
        card
          .getByRole("navigation", { name: "Alle Kapitel des Buchs" })
          .getByRole("link"),
      ).toHaveCount(chapters("de").length);
    });

    test(`"Kapitel 1 lesen" on "${book.title}" opens the first chapter`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const link = cardFor(page, book.title).getByRole("link", {
        name: `Kapitel 1 lesen: ${book.title}`,
      });
      await link.scrollIntoViewIfNeeded();
      await link.click();

      const first = chapters("de")[0]!;
      await expect(page).toHaveURL(
        new RegExp(`/buecher/${book.slug}/${first.slug}$`),
        { timeout: 10_000 },
      );
    });

    test(`"Zum Buch" on "${book.title}" opens /buecher/${book.slug}`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const link = cardFor(page, book.title).getByRole("link", {
        name: `Zum Buch: ${book.title}`,
      });
      await link.scrollIntoViewIfNeeded();
      await link.click();

      await expect(page).toHaveURL(new RegExp(`/buecher/${book.slug}$`), {
        timeout: 10_000,
      });
      await expect(
        page.getByRole("heading", { level: 1, name: book.title }),
      ).toBeVisible();
    });
  }
});

test.describe("/buecher mobile", () => {
  test(`no horizontal overflow at 390px, all ${BOOKS.length} row(s) present, chapter 1 on the first screen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("book-card")).toHaveCount(BOOKS.length);

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);

    // The way in sits above the tab bar without scrolling.
    const start = await page
      .getByRole("link", { name: /^Kapitel 1 lesen: / })
      .first()
      .boundingBox();
    expect(start, "Kapitel 1 lesen has a layout box").not.toBeNull();
    expect((start?.y ?? 0) + (start?.height ?? 0)).toBeLessThanOrEqual(780);
  });
});
