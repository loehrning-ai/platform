import { test, expect } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

import { BOOK, BOOK_PATH, chapters, chaptersMatching } from "./fixtures/book";

/**
 * Book reader content fidelity (regression coverage). The open, login-free HTML
 * reader renders chapter Markdown (remark-gfm + rehype-slug) into prose. Tests
 * assert STRUCTURE and stable strings (roles, manifest titles, encoding), never
 * exact prose, so a content refresh stays green while a real regression
 * (dropped table, broken umlaut encoding, a second h1) fails. The chapter under
 * test is the first one of the manifest whose source holds a GFM table (the
 * sources page of the insight spine), else the last chapter.
 */

const TABLE_CHAPTER = chaptersMatching(/^\|.+\|\s*$/m)[0];
const CHAPTER_META = (TABLE_CHAPTER ?? chapters()[chapters().length - 1]) as { slug: string; title: string };
const CHAPTER = CHAPTER_META.slug;
const CHAPTER_URL = `${BOOK_PATH}/${CHAPTER}`;
const CHAPTER_TITLE = CHAPTER_META.title; // manifest.json title

test.describe("book chapter reader content fidelity", () => {
  test("loads without login and shows its title as the one h1", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const res = await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });

    expect(res?.status(), `status for ${CHAPTER_URL}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    // Reader chrome owns the only h1; the opening Markdown title is stripped.
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(CHAPTER_TITLE);

    // The insight chapters are short: the band, one h1, and nothing that hides content.
    await expect(page.locator("[data-cover-band]")).toContainText(/Kapitel \d+ von \d+/);
    await expect(page.locator("main details, main summary")).toHaveCount(0);

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on ${CHAPTER_URL}\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
  });

  test("renders GFM tables as real, non-clipped <table> elements", async ({ page }) => {
    test.skip(!TABLE_CHAPTER, "no chapter of the manifest holds a GFM table yet");
    // The ArrowRight ownership check below exercises a client key handler.
    // Wait for the production client island instead of focusing server HTML
    // that hydration may replace between focus and keyup.
    await page.goto(CHAPTER_URL, { waitUntil: "load" });
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

    // remark-gfm must produce a real <table> with <th> column headers, not a
    // plaintext pipe blob.
    await expect(page.getByRole("table").first()).toBeVisible();
    expect(
      await page.getByRole("columnheader").count(),
      "GFM table should expose <th> column headers",
    ).toBeGreaterThanOrEqual(2);

    // Not clipped: at desktop the table must fit its container (the 70ch prose
    // article) or live in a scrollable ancestor. Desktop-only because the mobile
    // project can legitimately use the explicit overflow-x wrapper.
    const vw = page.viewportSize()?.width ?? 0;
    if (vw >= 1024) {
      const fit = await page.evaluate(() => {
        const t = document.querySelector("article table") as HTMLElement | null;
        if (!t) return null;
        const containerWidth = (t.parentElement as HTMLElement | null)?.clientWidth ?? 0;
        let scrollableAncestor = false;
        let el: HTMLElement | null = t.parentElement;
        while (el && el !== document.body) {
          const ox = getComputedStyle(el).overflowX;
          if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 1) {
            scrollableAncestor = true;
            break;
          }
          el = el.parentElement;
        }
        return { tableScroll: t.scrollWidth, containerWidth, scrollableAncestor };
      });
      expect(fit, "no <table> found inside the reader <article>").not.toBeNull();
      const contained = (fit?.tableScroll ?? 0) <= (fit?.containerWidth ?? 0) + 2;
      expect(
        contained || (fit?.scrollableAncestor ?? false),
        `table clipped: scrollWidth ${fit?.tableScroll} > container ${fit?.containerWidth} with no scroll wrapper`,
      ).toBe(true);
    }

    const tableRegion = page.getByRole("group", {
      name: "Tabelle, horizontal scrollbar",
    }).first();
    await tableRegion.focus();
    await expect(tableRegion).toBeFocused();
    const unexpectedNavigation = page
      .waitForURL((url) => url.pathname !== CHAPTER_URL, {
        waitUntil: "commit",
        timeout: 750,
      })
      .then(() => new URL(page.url()).pathname)
      .catch(() => null);
    await tableRegion.press("ArrowRight");
    expect(
      await unexpectedNavigation,
      "ArrowRight inside the table scroller must not trigger chapter navigation",
    ).toBeNull();
  });

  test("states the chapter number and the visible chapter list instead of a reading time", async ({ page }) => {
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Lesezeit/)).toHaveCount(0);
    const list = page.getByRole("navigation", { name: "Alle Kapitel des Buchs" });
    await expect(list).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(chapters().length);
    await expect(list.locator('a[aria-current="page"]')).toHaveCount(1);
  });

  test("renders German umlauts correctly in prose (no mojibake)", async ({ page }) => {
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });

    const article = page.getByRole("article", { name: CHAPTER_TITLE });
    await expect(article).toBeVisible();
    const prose = await article.innerText();

    // Real umlaut glyphs are present in the German prose ...
    expect(prose).toMatch(/[äöüÄÖÜß]/);
    // ... with no U+FFFD replacement char and no double-encoded UTF-8 mojibake
    // (Ã¤ / Ã¶ / Ã¼ / Ã + control byte).
    expect(prose).not.toContain("�");
    expect(prose).not.toMatch(/Ã[¤¶¼]/);

    // The manifest title renders as the one heading.
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveCount(1);
    await expect(title).toContainText(CHAPTER_TITLE);
  });
});

test.describe("book cover", () => {
  test("keeps the book title on the cover and lists every chapter without a reading time", async ({ page }) => {
    await page.goto(BOOK_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("außen");
    await expect(page.getByRole("navigation", { name: "Alle Kapitel des Buchs" }).getByRole("listitem")).toHaveCount(chapters().length);
  });
});
