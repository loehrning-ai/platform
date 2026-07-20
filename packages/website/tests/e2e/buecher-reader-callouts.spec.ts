import { test, expect, type Page } from "@playwright/test";

/**
 * Book reader callout rendering (regression coverage).
 *
 * The reader feeds every Markdown blockquote through CalloutRenderer
 * (src/components/book-reader/callout-renderer.tsx): a recognised German label
 * (Tipp, Achtung, Hinweis, Rechtlicher Hinweis, Prompt-Vorlage, ...) becomes a
 * styled `<div role="note" aria-label={label}>`, while an unlabelled / plain
 * blockquote falls back to a bare `<blockquote>`. Assertions target that
 * structural contract - accessible role, exact label, div-vs-blockquote - so
 * a prose refresh stays green while a genuine regression (callout not
 * recognised, label lost, fallback misfire) fails.
 *
 * Only ki-landschaft is in the published catalog (src/lib/books.ts). Its real
 * content only exercises TWO of CalloutRenderer's paths: a "Hinweis" callout
 * (01_eisberg.md) and several unlabelled fallback blockquotes
 * (07_schnellstart.md, five distinct "> ..." quotes under ### sub-headings,
 * none with a bold label). It does NOT contain Tipp, Achtung, Rechtlicher
 * Hinweis, or Prompt-Vorlage callouts, so this file can no longer exercise
 * per-type style differentiation or the monospace Prompt-Vorlage styling at
 * the e2e/real-content level — that logic is still fully covered at the
 * component level with synthetic fixtures in callout-renderer.test.tsx
 * (Tipp/Achtung/Rechtlicher-Hinweis/Prompt-Vorlage cases), just not
 * end-to-end against real book prose anymore.
 */

const SHOWCASE = "/buecher/ki-landschaft/01_eisberg";
const SHOWCASE_H1 = "Das Eisberg-Problem";
// Five unlabelled example-prompt blockquotes under ### sub-headings.
const FALLBACK = "/buecher/ki-landschaft/07_schnellstart";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

test.describe("book reader callouts", () => {
  test("chapter loads open, shows the manifest title, logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(SHOWCASE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${SHOWCASE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveCount(1);
    await expect(title).toHaveAccessibleName(SHOWCASE_H1);
    await expect(title).toBeVisible();

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${SHOWCASE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("a Hinweis callout renders as a distinctly labelled, styled note", async ({
    page,
  }) => {
    await page.goto(SHOWCASE, { waitUntil: "domcontentloaded" });

    const note = page.getByRole("note", { name: "Hinweis", exact: true }).first();
    await expect(note).toBeVisible();
    const className = await note.getAttribute("class");
    expect(className, "Hinweis callout must be styled").toBeTruthy();
  });

  test("unlabelled example-prompt blockquotes fall back to bare rendering, not a note", async ({
    page,
  }) => {
    const response = await page.goto(FALLBACK, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `status for ${FALLBACK}`).toBe(200);

    // Five distinct unlabelled quotes, none carry a bold label, so none
    // should ever receive the note role. Scoped to the article to skip the
    // page-level ResourceContextBanner note.
    const fallbacks = page.locator("article blockquote");
    await expect(fallbacks).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(fallbacks.nth(i)).not.toHaveAttribute("role", "note");
    }
  });
});

test.describe("book reader callouts mobile", () => {
  test("callouts stay readable at 390px with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SHOWCASE, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("note", { name: "Hinweis", exact: true }).first(),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
