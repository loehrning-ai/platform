import { test, expect } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";
import { BOOK_PATH, chapterPath, chapters } from "./fixtures/book";

/**
 * Book chapter reader navigation (regression coverage). Drives the real
 * ChapterReader (src/components/book-reader/chapter-reader.tsx): prev/next
 * neighbour links, boundary fallbacks (the first chapter has no "Vorheriges
 * Kapitel", the last no "Nächstes Kapitel"), the position in the band ("Kapitel
 * X von Y"), the visible chapter list, and the ArrowLeft/ArrowRight window key
 * bindings. Locators use ARIA roles and labels plus the chapter slugs and titles
 * of content/books/ki-landschaft/manifest.json, read from disk, so a prose or
 * chapter refresh stays green while a broken neighbour link or missing boundary
 * fails. The chapter is exposed through one h1 and a named article.
 */

const ALL = chapters();
const TOTAL = ALL.length;
// Order is load-bearing for the neighbour computation: the second chapter has a neighbour on both sides.
const FIRST = ALL[0]!;
const MID = ALL[1]!;
const MID_PREV = FIRST;
const MID_NEXT = ALL[2]!;
const LAST = ALL[TOTAL - 1]!;
const LAST_PREV = ALL[TOTAL - 2]!;

const chapterUrl = (slug: string) => new RegExp(`${chapterPath(slug)}$`);

test.describe("book chapter reader navigation", () => {
  test("a mid-book chapter loads with its heading, position in the band and no console error", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const res = await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });

    expect(res?.status(), `status for ${chapterPath(MID.slug)}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("article", { name: MID.title })).toBeVisible();
    // Second chapter -> "Kapitel 2 von <total>" in the band's caps line.
    await expect(page.locator("[data-cover-band]")).toContainText(new RegExp(`Kapitel\\s+2\\s+von\\s+${TOTAL}`));

    const noise = meaningfulBrowserErrors(errors);
    expect(noise, `console errors\n${formatBrowserErrors(noise)}`).toEqual([]);
  });

  test("prev / next carry the correct neighbour hrefs and the next link navigates", async ({ page }) => {
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });

    await expect(nav.getByRole("link", { name: /Vorheriges Kapitel/ })).toHaveAttribute("href", chapterPath(MID_PREV.slug));
    const next = nav.getByRole("link", { name: /Nächstes Kapitel/ });
    await expect(next).toHaveAttribute("href", chapterPath(MID_NEXT.slug));

    await next.click();
    await expect(page).toHaveURL(chapterUrl(MID_NEXT.slug));
    await expect(page.getByRole("article", { name: MID_NEXT.title })).toBeVisible();
  });

  test("the first chapter has no previous link, only a table-of-contents fallback", async ({ page }) => {
    await page.goto(chapterPath(FIRST.slug), { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });

    await expect(nav.getByRole("link", { name: /Vorheriges Kapitel/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Inhaltsverzeichnis" })).toHaveAttribute("href", BOOK_PATH);
    await expect(nav.getByRole("link", { name: /Nächstes Kapitel/ })).toBeVisible();
    await expect(page.locator("[data-cover-band]")).toContainText(new RegExp(`Kapitel\\s+1\\s+von\\s+${TOTAL}`));
  });

  test("the last chapter has no next link, only a chapter-overview fallback", async ({ page }) => {
    await page.goto(chapterPath(LAST.slug), { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });

    await expect(nav.getByRole("link", { name: /Nächstes Kapitel/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Kapitelübersicht" })).toHaveAttribute("href", BOOK_PATH);
    await expect(nav.getByRole("link", { name: /Vorheriges Kapitel/ })).toHaveAttribute("href", chapterPath(LAST_PREV.slug));
  });

  test("the visible chapter list names every chapter, marks the current one and links to the others", async ({ page }) => {
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    const list = page.getByRole("navigation", { name: "Alle Kapitel des Buchs" });
    await expect(list).toBeVisible();
    await expect(list.getByRole("link")).toHaveCount(TOTAL);
    await expect(list.locator('a[aria-current="page"]')).toHaveAttribute("href", chapterPath(MID.slug));
    for (const chapter of ALL) {
      await expect(list.locator(`a[href="${chapterPath(chapter.slug)}"]`)).toContainText(chapter.title);
    }
  });

  test("ArrowRight and ArrowLeft move to the next / previous chapter", async ({ page }) => {
    // ArrowRight -> next chapter.
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
    await expect(page.getByRole("article", { name: MID.title })).toBeVisible();
    // Click the plain band heading so the document body holds focus and the window keydown listener receives the key.
    await page.getByRole("heading", { level: 1, name: MID.title }).click();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(chapterUrl(MID_NEXT.slug));

    // ArrowLeft -> previous chapter (fresh load to reset focus to the body).
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
    await expect(page.getByRole("article", { name: MID.title })).toBeVisible();
    await page.getByRole("heading", { level: 1, name: MID.title }).click();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(chapterUrl(MID_PREV.slug));
  });
});
