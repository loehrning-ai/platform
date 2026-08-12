import { test, expect, type Page } from "@playwright/test";

/**
 * Book chapter reader navigation (regression coverage). Drives the real
 * ChapterReader (src/components/book-reader/chapter-reader.tsx): prev/next
 * neighbour links, boundary fallbacks (first has no "Vorheriges Kapitel", last
 * no "Nächstes Kapitel"), the "Kapitel X / Y" position indicator, and the
 * ArrowLeft/ArrowRight window key bindings. Locators use ARIA roles/labels +
 * the stable chapter slugs from content/books/ki-landschaft/manifest.json (the
 * only book in the published catalog, src/lib/books.ts — 10 chapters, enough
 * to exercise first/mid/last boundary behaviour), so a prose refresh stays
 * green while a broken neighbour link or missing boundary fails. The chapter
 * is exposed through one h1 and a named article.
 */

const SLUG = "ki-landschaft";

// Real chapters (order is load-bearing for prev/next neighbour computation).
const FIRST = { slug: "01_eisberg" } as const;
const MID = { slug: "03_reifegrad_ueberblick", title: "Evidenzbasierte Selbstprüfung" } as const;
const MID_PREV = { slug: "02_methodik" } as const;
const MID_NEXT = { slug: "04_bundesland", title: "Regionale Rahmenbedingungen" } as const;
const LAST = { slug: "10_anhang" } as const;
const LAST_PREV = { slug: "09_ausblick" } as const;

const chapterPath = (slug: string) => `/buecher/${SLUG}/${slug}`;
const chapterUrl = (slug: string) => new RegExp(`/buecher/${SLUG}/${slug}$`);

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

test.describe("book chapter reader navigation", () => {
  test("a mid-book chapter loads with its heading, position indicator and no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });

    expect(res?.status(), `status for ${chapterPath(MID.slug)}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("article", { name: MID.title })).toBeVisible();
    // Third chapter -> "Kapitel 3 / <total>"; anchored so only the header <p> matches.
    await expect(page.getByText(/^Kapitel\s+3\s*\/\s*\d+$/)).toBeVisible();

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors\n${noise.join("\n")}`).toEqual([]);
  });

  test("prev / next carry the correct neighbour hrefs and the next link navigates", async ({
    page,
  }) => {
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });

    await expect(nav.getByRole("link", { name: /Vorheriges Kapitel/ })).toHaveAttribute(
      "href",
      chapterPath(MID_PREV.slug),
    );
    const next = nav.getByRole("link", { name: /Nächstes Kapitel/ });
    await expect(next).toHaveAttribute("href", chapterPath(MID_NEXT.slug));

    await next.click();
    await expect(page).toHaveURL(chapterUrl(MID_NEXT.slug));
    await expect(page.getByRole("article", { name: MID_NEXT.title })).toBeVisible();
  });

  test("the first chapter has no previous link, only a table-of-contents fallback", async ({
    page,
  }) => {
    await page.goto(chapterPath(FIRST.slug), { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });

    await expect(nav.getByRole("link", { name: /Vorheriges Kapitel/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Inhaltsverzeichnis" })).toHaveAttribute(
      "href",
      `/buecher/${SLUG}`,
    );
    await expect(nav.getByRole("link", { name: /Nächstes Kapitel/ })).toBeVisible();
    await expect(page.getByText(/^Kapitel\s+1\s*\/\s*\d+$/)).toBeVisible();
  });

  test("the last chapter has no next link, only a chapter-overview fallback", async ({ page }) => {
    await page.goto(chapterPath(LAST.slug), { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Kapitelnavigation" });

    await expect(nav.getByRole("link", { name: /Nächstes Kapitel/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Kapitelübersicht" })).toHaveAttribute(
      "href",
      `/buecher/${SLUG}`,
    );
    await expect(nav.getByRole("link", { name: /Vorheriges Kapitel/ })).toHaveAttribute(
      "href",
      chapterPath(LAST_PREV.slug),
    );
  });

  test("ArrowRight and ArrowLeft move to the next / previous chapter", async ({ page }) => {
    // ArrowRight -> next chapter.
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });
    await expect(page.getByRole("article", { name: MID.title })).toBeVisible();
    // Click the plain header heading so the document body
    // holds focus and the window keydown listener receives the key.
    await page.getByRole("heading", { level: 1, name: MID.title }).click();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(chapterUrl(MID_NEXT.slug));

    // ArrowLeft -> previous chapter (fresh load to reset focus to the body).
    await page.goto(chapterPath(MID.slug), { waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });
    await expect(page.getByRole("article", { name: MID.title })).toBeVisible();
    await page.getByRole("heading", { level: 1, name: MID.title }).click();
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(chapterUrl(MID_PREV.slug));
  });
});
