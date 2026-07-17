import { test, expect, type Page } from "@playwright/test";

/**
 * Book reader callout rendering (regression coverage).
 *
 * The reader feeds every Markdown blockquote through CalloutRenderer
 * (src/components/book-reader/callout-renderer.tsx): a recognised German label
 * (Tipp, Achtung, Hinweis, Rechtlicher Hinweis, Prompt-Vorlage, ...) becomes a
 * styled `<div role="note" aria-label={label}>`, while an unlabelled / plain
 * blockquote falls back to a bare `<blockquote>`. Assertions target that
 * structural contract - accessible role, exact label, per-type styling,
 * div-vs-blockquote - so a prose refresh stays green while a genuine
 * regression (callout not recognised, label lost, fallback misfire, monospace
 * dropped) fails. Slugs and titles come from the manifests, not from prose.
 *
 * Note: ResourceContextBanner also renders role="note" (aria-label starts with
 * "Lernkontext:"), so callout lookups use exact accessible names and the
 * fallback lookup is scoped to `article` (the banner sits outside it).
 */

// 00_intro is the reader's own callout showcase: exactly one each of Hinweis,
// Rechtlicher Hinweis, Tipp and Achtung.
const SHOWCASE = "/buecher/ki-arbeitsalltag/00_intro";
const SHOWCASE_H1 = "Wie du dieses Buch nutzt";
// 04_vier_stufen mixes matched callouts with plain example quotes (`> „..."`),
// so both render paths appear on a single page.
const MIXED = "/buecher/ki-arbeitsalltag/04_vier_stufen";
// 08_prompting_kraft renders the monospace Prompt-Vorlage callout.
const PROMPT = "/buecher/ki-arbeitsalltag/08_prompting_kraft";

const CALLOUT_TYPES = ["Tipp", "Achtung", "Hinweis", "Rechtlicher Hinweis"] as const;

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

  test("each recognised callout type renders as a distinctly labelled note", async ({
    page,
  }) => {
    await page.goto(SHOWCASE, { waitUntil: "domcontentloaded" });

    // aria-label equals the strong label with its trailing colon stripped.
    // exact:true keeps "Hinweis" from also matching "Rechtlicher Hinweis".
    for (const label of CALLOUT_TYPES) {
      await expect(
        page.getByRole("note", { name: label, exact: true }).first(),
        `callout "${label}" should render as role=note`,
      ).toBeVisible();
    }
  });

  test("different callout types carry different styling", async ({ page }) => {
    await page.goto(SHOWCASE, { waitUntil: "domcontentloaded" });

    const tippClass = await page
      .getByRole("note", { name: "Tipp", exact: true })
      .first()
      .getAttribute("class");
    const achtungClass = await page
      .getByRole("note", { name: "Achtung", exact: true })
      .first()
      .getAttribute("class");

    expect(tippClass, "Tipp callout must be styled").toBeTruthy();
    expect(achtungClass, "Achtung callout must be styled").toBeTruthy();
    // Same primitive, different colour tokens: the class strings must differ.
    expect(tippClass).not.toBe(achtungClass);
  });

  test("Prompt-Vorlage renders as a monospace note", async ({ page }) => {
    await page.goto(PROMPT, { waitUntil: "domcontentloaded" });

    const prompt = page
      .getByRole("note", { name: "Prompt-Vorlage", exact: true })
      .first();
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveClass(/font-mono/);
  });

  test("an unlabelled blockquote falls back to bare rendering, not a note", async ({
    page,
  }) => {
    await page.goto(MIXED, { waitUntil: "domcontentloaded" });

    // A labelled callout on this page renders as role=note...
    await expect(
      page.getByRole("note", { name: "Achtung", exact: true }).first(),
    ).toBeVisible();

    // ...while a plain example quote (no label) stays a real <blockquote> that
    // never receives the note role. Scoped to the article to skip the banner.
    const fallback = page.locator("article blockquote").first();
    await expect(fallback).toBeVisible();
    await expect(fallback).not.toHaveAttribute("role", "note");
  });
});

test.describe("book reader callouts mobile", () => {
  test("callouts stay readable at 390px with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SHOWCASE, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("note", { name: "Tipp", exact: true }).first(),
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
