import { test, expect } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

import { calloutLabels, chapterPath, chapters } from "./fixtures/book";

/**
 * Book reader callout rendering (regression coverage).
 *
 * The reader feeds every Markdown blockquote through the callout transform
 * (src/components/book-reader/chapter-markdown.tsx): a recognised German label
 * (Was du tun kannst, Tipp, Hinweis, ...) becomes a styled
 * `<div role="note" aria-label={label}>`, an unlabelled blockquote falls back to
 * a bare `<blockquote>`. The expectations are read from the chapter sources on
 * disk, so the spec follows the content: every bold-labelled callout of a
 * chapter must be a note with exactly that label, and the closing "Was du tun
 * kannst" box of an insight chapter is always visible (nothing collapses).
 */

const END_BOX = "Was du tun kannst";
const FIRST = chapters()[0] as { slug: string; title: string };
const WITH_END_BOX = chapters().filter((c) => calloutLabels(c.slug).includes(END_BOX));

test.describe("book reader callouts", () => {
  test("a chapter loads open, shows the manifest title as its one h1, logs no console error", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const path = chapterPath(FIRST.slug);
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${path}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveCount(1);
    await expect(title).toHaveAccessibleName(FIRST.title);
    await expect(title).toBeVisible();

    const noise = meaningfulBrowserErrors(errors);
    expect(noise, `console errors on ${path}\n${formatBrowserErrors(noise)}`).toEqual([]);
  });

  test("every labelled callout of every chapter renders as a note with its label, visible", async ({ page }) => {
    test.setTimeout(120_000);
    for (const chapter of chapters()) {
      const labels = calloutLabels(chapter.slug);
      if (labels.length === 0) continue;
      await page.goto(chapterPath(chapter.slug), { waitUntil: "domcontentloaded" });
      for (const label of new Set(labels)) {
        const notes = page.getByRole("note", { name: label, exact: true });
        expect(await notes.count(), `${chapter.slug}: note "${label}"`).toBeGreaterThanOrEqual(1);
        await expect(notes.first()).toBeVisible();
      }
    }
  });

  test("the closing end box is styled, marked and never collapsed", async ({ page }) => {
    test.skip(WITH_END_BOX.length === 0, "no chapter of the manifest closes with the end box yet");
    const chapter = WITH_END_BOX[0] as { slug: string };
    await page.goto(chapterPath(chapter.slug), { waitUntil: "domcontentloaded" });
    const note = page.getByRole("note", { name: END_BOX, exact: true }).first();
    await expect(note).toBeVisible();
    await expect(note).toHaveAttribute("data-endbox", "true");
    expect(await note.getAttribute("class"), "end box must be styled").toBeTruthy();
    await expect(page.locator("main details, main summary")).toHaveCount(0);
  });
});

test.describe("book reader callouts mobile", () => {
  test("callouts stay readable at 390px with no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const chapter = (WITH_END_BOX[0] ?? FIRST) as { slug: string };
    await page.goto(chapterPath(chapter.slug), { waitUntil: "domcontentloaded" });
    if (WITH_END_BOX.length > 0) {
      await expect(page.getByRole("note", { name: END_BOX, exact: true }).first()).toBeVisible();
    }
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth, `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`).toBeLessThanOrEqual(innerWidth + 1);
  });
});
