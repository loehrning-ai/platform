import { test, expect, type Locator } from "@playwright/test";
import { BOOK, calloutLabels, chapterPath, chapters, chapterSource } from "./fixtures/book";

/**
 * Books reader on mobile (regression coverage). Pins the 390x844 layout of every
 * chapter of the manifest: no horizontal overflow, the poster band with the
 * title as the one h1, readable prose, reachable and tappable previous and next
 * links, no heading sidebar (the chapter list is visible instead), and tables
 * and callouts that stay inside the viewport. Assertions target roles and the
 * manifest, never prose, so a content refresh stays green while a real layout
 * regression fails. The chapters come from the manifest on disk.
 */

const MOBILE = { width: 390, height: 844 } as const;

const CHAPTERS = chapters().map((chapter, index, all) => ({
  book: BOOK,
  slug: chapter.slug,
  title: chapter.title,
  prev: index > 0 ? (all[index - 1]?.slug ?? null) : null,
  next: index < all.length - 1 ? (all[index + 1]?.slug ?? null) : null,
  hasCallouts: calloutLabels(chapter.slug).length > 0,
  hasTable: /^\|.+\|\s*$/m.test(chapterSource(chapter.slug)),
}));

// overflow-x:clip hides a page-level x-scrollbar, so element geometry (not
// scrollWidth alone) is the honest signal that a block leaks past the column.
async function expectInsideViewport(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label}: expected a layout box`).not.toBeNull();
  if (!box) return;
  expect(box.x, `${label}: left edge off-screen`).toBeGreaterThanOrEqual(-1);
  expect(
    box.x + box.width,
    `${label}: right edge ${Math.round(box.x + box.width)}px past ${MOBILE.width}px viewport`,
  ).toBeLessThanOrEqual(MOBILE.width + 1);
}

test.use({ viewport: MOBILE });

for (const ch of CHAPTERS) {
  const url = chapterPath(ch.slug);

  test.describe(`reader mobile · ${ch.book}/${ch.slug}`, () => {
    test("loads with readable prose, no horizontal overflow, no console error", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));

      const res = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `status for ${url}`).toBe(200);
      await expect(page).not.toHaveURL(/\/login/);

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(ch.title);
      await expect(page.locator("[data-cover-band]")).toBeVisible();
      await expect(page.locator("main details, main summary")).toHaveCount(0);

      const article = page.getByRole("article", { name: ch.title });
      await expect(article).toBeVisible();

      // Body copy: first top-level prose paragraph ("> p" excludes callout text,
      // which can be smaller mono). Must render at a legible size.
      const paragraph = article.locator("p").first();
      await expect(paragraph).toBeAttached();
      const fontPx = await paragraph.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      );
      expect(fontPx, "prose paragraph font-size").toBeGreaterThanOrEqual(14);

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
        innerWidth: window.innerWidth,
      }));
      expect(
        scrollWidth,
        `horizontal overflow: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
      ).toBeLessThanOrEqual(innerWidth + 1);

      const noise = errors;
      expect(noise, `console errors on ${url}\n${noise.join("\n")}`).toEqual([]);
    });

    test("keeps tables + callouts inside the viewport and offers tappable prev/next", async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const article = page.getByRole("article", { name: ch.title });
      await expect(article).toBeVisible();

      // Wide GFM tables are allowed to exceed the viewport ONLY inside a
      // horizontal scroll container (the reader wraps each table in an
      // overflow-x-auto div, regression coverage fix). The user-facing contract:
      // the scroll container itself stays inside the viewport, so the PAGE
      // never scrolls horizontally while the table scrolls in place.
      const tables = article.getByRole("table");
      const tableCount = await tables.count();
      if (ch.hasTable) expect(tableCount, "expected at least one GFM table").toBeGreaterThan(0);
      for (let i = 0; i < tableCount; i++) {
        const t = tables.nth(i);
        // The plotted numbers of a figure sit in a visually hidden table for assistive technology; it has no layout to check.
        if (await t.evaluate((el) => el.closest(".bf-sr, .bf-visually-hidden") !== null)) continue;
        const inScroller = await t.evaluate((el) => {
          let node = el.parentElement;
          while (node && node !== document.body) {
            const ox = getComputedStyle(node).overflowX;
            if (ox === "auto" || ox === "scroll") return true;
            node = node.parentElement;
          }
          return false;
        });
        if (inScroller) {
          // The nearest scrolling ancestor: the reader's own wrapper or the explorer's table box.
          const scroller = await t.evaluate((el) => {
            let node = el.parentElement;
            while (node && node !== document.body) {
              const ox = getComputedStyle(node).overflowX;
              if (ox === "auto" || ox === "scroll") {
                const r = node.getBoundingClientRect();
                return { x: r.x, width: r.width };
              }
              node = node.parentElement;
            }
            return null;
          });
          expect(scroller, `table[${i}] scroll container`).not.toBeNull();
          expect(scroller!.x, `table[${i}] scroll container: left edge off-screen`).toBeGreaterThanOrEqual(-1);
          expect(
            scroller!.x + scroller!.width,
            `table[${i}] scroll container: right edge past ${MOBILE.width}px viewport`,
          ).toBeLessThanOrEqual(MOBILE.width + 1);
        } else {
          await expectInsideViewport(t, `table[${i}]`);
        }
      }

      // Callouts render role="note"; scope to the article so the page-level
      // ResourceContextBanner note is excluded.
      const notes = article.getByRole("note");
      const noteCount = await notes.count();
      if (ch.hasCallouts) {
        expect(noteCount, "expected at least one callout").toBeGreaterThan(0);
      } else {
        expect(noteCount, "a chapter without a labelled callout renders no note").toBe(0);
      }
      for (let i = 0; i < noteCount; i++) {
        await expectInsideViewport(notes.nth(i), `callout[${i}]`);
      }

      // The first chapter has no previous chapter (its left link goes to the cover); the last has no next.
      const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });
      const prev = nav.getByRole("link", { name: /^Zurück:/ });
      const next = nav.getByRole("link", { name: /^Weiter:/ });
      if (ch.prev) {
        await expect(prev).toBeVisible();
        await expect(prev).toHaveAttribute("href", chapterPath(ch.prev));
      } else {
        await expect(prev).toHaveCount(0);
      }
      if (ch.next) {
        await expect(next).toBeVisible();
        await expect(next).toHaveAttribute("href", chapterPath(ch.next));
      } else {
        await expect(next).toHaveCount(0);
      }

      const links = [
        ...(ch.prev ? ([[prev, "prev"]] as const) : []),
        ...(ch.next ? ([[next, "next"]] as const) : []),
      ];
      for (const [link, label] of links) {
        const box = await link.boundingBox();
        expect(box, `${label} nav box`).not.toBeNull();
        if (box) {
          expect(
            Math.max(box.width, box.height),
            `${label} tap target too small`,
          ).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
}

test.describe("reader mobile · shared chrome", () => {
  test("has no heading sidebar, offers a 44px Weiter in the reader bar and follows 'next' to the next chapter", async ({ page }) => {
    const first = CHAPTERS[0] as (typeof CHAPTERS)[0] & { next: string };
    await page.goto(chapterPath(first.slug), { waitUntil: "domcontentloaded" });
    await page
      .locator(`[data-book-reader-ready="${BOOK}:${first.slug}"]`)
      .waitFor({ state: "attached" });
    // Register user scrolling before a late learning-owner resolution can restore the reading position.
    await page.keyboard.press("End");

    // The insight reader has no sidebar of headings; the desktop one of the plain reader is hidden below lg.
    await expect(page.getByRole("complementary", { name: "Kapitelinhalt" })).toBeHidden();

    const bar = page.locator("[data-reader-focus-bar]");
    await expect(bar).toBeVisible();
    await expect(bar.locator("details, summary, [data-chapter-toc-sheet]")).toHaveCount(0);
    // A stage in view makes the bar the step control (Zurück, Weiter); past the last stage it is the chapter bar.
    // The stage script starts when the browser is idle; the bar answers to it, so scroll only after it has taken over.
    await expect(page.locator("[data-chapter-stage]").first()).toHaveAttribute("data-mode", "scrub", { timeout: 15_000 });
    await expect(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(bar).toHaveAttribute("data-bar-mode", "chapter", { timeout: 1_000 });
      await expect(bar.getByRole("link")).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    const action = bar.locator("[data-reader-focus-action]");
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box, "reader bar action box").not.toBeNull();
    expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
    await expect(action).toHaveAttribute("href", chapterPath(first.next));

    await action.click();
    await expect(page).toHaveURL(new RegExp(`${chapterPath(first.next)}$`));
    const nextTitle = page.getByRole("heading", { level: 1 });
    await expect(nextTitle).toHaveCount(1);
    await expect(nextTitle).toBeVisible();
  });
});
