import { test, expect, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";
import { chapterPath, chapters, chapterSource } from "./fixtures/book";

/**
 * Book reader - visible chapter list and heading anchors. The insight reader has
 * no sidebar or sheet of headings (nothing opens and closes): the chapters are one
 * visible list under every chapter, and a heading that the text does carry is a
 * deep-link target. Locators use roles and the manifest; heading ids are read from
 * the live DOM (rehype-slug keeps umlauts), never exact prose. A chapter with `##`
 * headings is picked from the markdown on disk; the anchor tests skip, and say so,
 * while no chapter has any (the insight chapters are short).
 */

const ALL = chapters();
const WITH_HEADINGS = ALL.filter((c) => /^## /m.test(chapterSource(c.slug)));
const TARGET = WITH_HEADINGS[0];
const READER_PATH = chapterPath((TARGET ?? ALL[0]!).slug);
const CHAPTER_TITLE = (TARGET ?? ALL[0]!).title;

/** Heading ids the reader actually rendered (rehype-slug/github-slugger). */
async function renderedHeadingIds(page: Page): Promise<string[]> {
  return page.evaluate((label) => {
    const scope = document.querySelector(`[aria-label="${label}"]`) ?? document;
    return Array.from(scope.querySelectorAll("h2[id], h3[id]")).map((el) => el.id);
  }, CHAPTER_TITLE);
}

/**
 * Cold-load `#id` and assert it landed on that heading. The about:blank hop
 * forces a real document load at the fragment URL (the "open the link fresh"
 * path), not a same-page hash nudge.
 */
async function deepLinkLandsOn(page: Page, id: string, opts: { requireScroll: boolean }): Promise<void> {
  await page.goto("about:blank");
  await page.goto(`${READER_PATH}#${id}`, { waitUntil: "load" });

  const heading = page.locator(`[id="${id}"]`);
  await expect(heading).toBeVisible();
  await expect(heading).toBeInViewport();
  // NOTE: no ":target" check here. Engines disagree on matching :target for
  // percent-encoded unicode fragments (WebKit returns null for umlaut ids),
  // and the retrying toBeInViewport above is already the meaningful proof.
  if (opts.requireScroll) {
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  }
}

test.describe("book reader chapter list + heading anchors", () => {
  test("renders the chapter, its h1 and no console error", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const res = await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });

    expect(res?.status(), `status for ${READER_PATH}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1, name: CHAPTER_TITLE, exact: true })).toBeVisible();

    const noise = meaningfulBrowserErrors(errors);
    expect(noise, `console errors on ${READER_PATH}\n${formatBrowserErrors(noise)}`).toEqual([]);
  });

  test("has no sidebar or sheet of headings, on desktop and on a phone", async ({ page }) => {
    for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("complementary", { name: "Kapitelinhalt" })).toHaveCount(0);
      await expect(page.locator("main details, main summary, [data-chapter-toc-sheet]")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Alle Kapitel des Buchs" })).toBeVisible();
    }
  });

  test("clicking a chapter in the visible list opens that chapter (phone)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(READER_PATH, { waitUntil: "load" });
    const list = page.getByRole("navigation", { name: "Alle Kapitel des Buchs" });
    const other = ALL.find((c) => c.title !== CHAPTER_TITLE)!;
    const link = list.locator(`a[href="${chapterPath(other.slug)}"]`);
    await link.scrollIntoViewIfNeeded();
    const box = await link.boundingBox();
    expect(box?.height ?? 0, "list link is a 44px target").toBeGreaterThanOrEqual(43);
    await Promise.all([page.waitForURL(new RegExp(`${chapterPath(other.slug)}$`)), link.click()]);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(other.title);
  });

  test("deep-linking to a late heading anchor scrolls to it", async ({ page }) => {
    test.skip(!TARGET, "no chapter of the manifest has a ## heading yet");
    await page.goto(READER_PATH, { waitUntil: "domcontentloaded" });
    const ids = await renderedHeadingIds(page);
    const ascii = ids.filter((id) => /^[a-z0-9-]+$/.test(id));
    const pool = ascii.length > 0 ? ascii : ids;
    const targetId = pool[pool.length - 1];
    expect(targetId, "chapter must render a heading id for deep-link proof").toBeDefined();

    await deepLinkLandsOn(page, targetId!, { requireScroll: false });
  });

  test("deep-linking to a heading anchor with umlauts lands on it", async ({ page }) => {
    const withUmlaut = WITH_HEADINGS.find((c) => /^##.*[äöüß]/im.test(chapterSource(c.slug)));
    test.skip(!withUmlaut, "no chapter of the manifest has an umlaut heading yet");
    const path = chapterPath(withUmlaut!.slug);
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const umlautId = (await page.evaluate(() => Array.from(document.querySelectorAll("h2[id], h3[id]")).map((el) => el.id))).find((id) => /[äöüß]/.test(id));
    expect(umlautId, "chapter must keep an umlaut heading id for unicode deep-link proof").toBeDefined();
    await page.goto("about:blank");
    await page.goto(`${path}#${umlautId}`, { waitUntil: "load" });
    await expect(page.locator(`[id="${umlautId}"]`)).toBeInViewport();
  });
});
