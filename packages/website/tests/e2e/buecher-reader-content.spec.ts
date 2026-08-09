import { test, expect, type Page } from "@playwright/test";

/**
 * Book reader content fidelity (regression coverage). The open, login-free HTML
 * reader renders chapter Markdown (remark-gfm + rehype-slug) into prose. Tests
 * assert STRUCTURE and stable strings (roles, manifest titles, encoding), never
 * exact prose, so the in-flight content refresh stays green while a real
 * regression (dropped table, broken umlaut encoding, missing reading time) fails.
 * Deep-dive target ki-landschaft / 03_reifegrad_ueberblick ships a real GFM
 * table, `##` section headings, and an umlaut-bearing manifest title.
 */

const BOOK = "ki-landschaft";
const CHAPTER = "03_reifegrad_ueberblick";
const CHAPTER_URL = `/buecher/${BOOK}/${CHAPTER}`;
const CHAPTER_TITLE = "Evidenzbasierte Selbstprüfung"; // manifest.json title

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

test.describe("book chapter reader content fidelity", () => {
  test("loads without login and shows a real heading outline", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });

    expect(res?.status(), `status for ${CHAPTER_URL}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    // Reader chrome owns the only h1; the opening Markdown title is stripped.
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(CHAPTER_TITLE);

    // Body renders `##` section headings -> a real outline, not a wall of text.
    expect(
      await page.getByRole("heading", { level: 2 }).count(),
    ).toBeGreaterThanOrEqual(1);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${CHAPTER_URL}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders GFM tables as real, non-clipped <table> elements", async ({ page }) => {
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

  test("shows the lib-computed reading time on the chapter", async ({ page }) => {
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });

    // chapter-reader header: "Lesezeit: ca. <N> Minute(n)", N = computeReadingTime
    // (Math.floor(words/200), min 1) -> an integer.
    await expect(
      page.getByText(/Lesezeit:\s*ca\.\s*\d+\s*Minute(?:n)?/).first(),
    ).toBeVisible();
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

    // Stable umlaut string from the manifest title also renders as a heading.
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveCount(1);
    await expect(title).toContainText("Selbstprüfung");
  });
});

test.describe("book overview reading time", () => {
  test("lists the book reading time as a Min. value", async ({ page }) => {
    await page.goto(`/buecher/${BOOK}`, { waitUntil: "domcontentloaded" });

    // Overview h1 is the book title (books.ts, stable) ...
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Mittelstand");
    // ... and the header meta shows the reading time as "ca. <N> Min."
    await expect(page.getByText(/ca\.\s*\d+\s*Min\./).first()).toBeVisible();
  });
});
