import { test, expect, type Locator } from "@playwright/test";

/**
 * Books reader on mobile (regression coverage). Pins the 390x844 layout: no
 * horizontal overflow, readable prose, reachable + tappable prev/next, a
 * collapsed desktop TOC, and tables that stay inside the viewport. Assertions
 * target roles + stable manifest titles, never prose, so a content refresh on
 * another branch stays green while a real layout regression fails. (No
 * chapter ships images, so an image-constraint check is intentionally
 * omitted.)
 *
 * Only ki-landschaft is in the published catalog (src/lib/books.ts), so both
 * rows below come from it — two real middle chapters (each has both a prev
 * and a next neighbour, required by the per-row prev/next assertions below)
 * that contain GFM tables. Neither has a labelled callout: ki-landschaft's
 * only callout ("Hinweis", 01_eisberg.md) is the book's very first chapter,
 * which structurally can't be used here (chapter 1 has no "Vorheriges
 * Kapitel" link, and every row below asserts both prev and next are
 * visible/tappable). That callout is still covered end-to-end in
 * buecher-reader-callouts.spec.ts against 01_eisberg directly.
 */

const MOBILE = { width: 390, height: 844 } as const;

// Real middle chapters read from content/books/ki-landschaft/manifest.json:
// each has both a previous and next neighbour and contains a GFM table.
const CHAPTERS = [
  {
    book: "ki-landschaft",
    slug: "03_reifegrad_ueberblick",
    title: "Evidenzbasierte Selbstprüfung",
    next: "04_bundesland",
    hasCallouts: false,
  },
  {
    book: "ki-landschaft",
    slug: "06_eu_ki_verordnung",
    title: "EU-KI-Verordnung und Artikel 4",
    next: "07_schnellstart",
    hasCallouts: false,
  },
] as const;

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
  const url = `/buecher/${ch.book}/${ch.slug}`;

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

      const article = page.getByRole("article", { name: ch.title });
      await expect(article).toBeVisible();

      // Body copy: first top-level prose paragraph ("> p" excludes callout text,
      // which can be smaller mono). Must render at a legible size.
      const paragraph = article.locator("> p").first();
      await expect(paragraph).toBeVisible();
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
      expect(tableCount, "expected at least one GFM table").toBeGreaterThan(0);
      for (let i = 0; i < tableCount; i++) {
        const t = tables.nth(i);
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
          const scroller = t.locator(
            "xpath=ancestor::*[contains(@class,'overflow-x-auto')][1]",
          );
          await expectInsideViewport(scroller, `table[${i}] scroll container`);
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
        expect(noteCount, "chapter manifest fixture should remain callout-free").toBe(0);
      }
      for (let i = 0; i < noteCount; i++) {
        await expectInsideViewport(notes.nth(i), `callout[${i}]`);
      }

      const prev = page.getByRole("link", { name: /Vorheriges Kapitel/ });
      const next = page.getByRole("link", { name: /Nächstes Kapitel/ });
      await expect(prev).toBeVisible();
      await expect(next).toBeVisible();
      await expect(next).toHaveAttribute("href", `/buecher/${ch.book}/${ch.next}`);

      for (const [link, label] of [
        [prev, "prev"],
        [next, "next"],
      ] as const) {
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
  test("collapses the desktop TOC and follows 'next' to the next chapter", async ({
    page,
  }) => {
    const first = CHAPTERS[0];
    await page.goto(`/buecher/${first.book}/${first.slug}`, {
      waitUntil: "domcontentloaded",
    });

    // The sticky in-chapter TOC sidebar is hidden below lg; it must not occupy
    // the mobile viewport (a visible one would fail this).
    await expect(
      page.getByRole("complementary", { name: "Kapitelinhalt" }),
    ).toBeHidden();

    await page.getByRole("link", { name: /Nächstes Kapitel/ }).click();
    await expect(page).toHaveURL(
      new RegExp(`/buecher/${first.book}/${first.next}$`),
    );
    const nextTitle = page.getByRole("heading", { level: 1 });
    await expect(nextTitle).toHaveCount(1);
    await expect(nextTitle).toBeVisible();
  });
});
