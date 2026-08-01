import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { exposeAllAuditedContent } from "./fixtures/a11y-visibility";

/**
 * Books reader accessibility (regression coverage). Axe + structural a11y for the
 * open, login-free HTML reader: library index, one book overview, one
 * content-rich chapter. Complements rather than repeats the suite - a11y.spec.ts
 * axe-scans /buecher but never the overview or chapter routes, and no
 * buecher-*.spec.ts runs axe - so these scans are new coverage. Assertions
 * target ROLES, landmark structure, and the stable manifest title, never exact
 * prose, so a content refresh stays green while a real regression (landmark
 * nesting, skipped heading level, lost accessible name) fails.
 *
 * Reader chrome owns the single document h1. loadBookChapter strips the
 * opening Markdown h1 before rendering the chapter body.
 */

const LIBRARY = "/buecher";
const BOOK = "ki-landschaft";
const OVERVIEW = `/buecher/${BOOK}`;
const CHAPTER = "03_reifegrad_ueberblick";
const CHAPTER_URL = `/buecher/${BOOK}/${CHAPTER}`;
const CHAPTER_TITLE = "Evidenzbasierte Selbstprüfung"; // manifest.json (stable)

/**
 * Every WCAG-tagged violation blocks. Callers poll this to a settled verdict so a
 * transient hydration sample cannot flake. The reader routes carry no opacity
 * tweens (ResourceContextBanner is role="note", chapter-reader animates
 * nothing), so a short poll suffices without the heavy settleMotion helper.
 */
async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // All WCAG serious/critical rules are ENABLED on the reader. The four
    // defects found are fixed at source in (chapter-reader.tsx):
    //  - color-contrast: prose colours are now bound to the theme CSS vars
    //    (AAA-tuned muted-foreground on the light page) instead of the fixed
    //    `prose-invert` that produced 1.3:1 light-on-light body text.
    //  - label: the GFM task-list checkboxes are aria-hidden (decorative).
    //  - target-size: the TOC anchor links are min-h-[24px] flex rows.
    //  - scrollable-region-focusable: the wide-table wrapper is tabindex=0 with
    //    role="group" + an accessible name.
    .analyze();
  return results.violations;
}

// Reader-depth routes a11y.spec.ts never scans (it covers /buecher only).
const AXE_ROUTES = [OVERVIEW, CHAPTER_URL] as const;

for (const route of AXE_ROUTES) {
  test(`a11y-reader: ${route} has no WCAG axe violations`, async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "load" });
    await exposeAllAuditedContent(page);

    let blocking = await blockingViolations(page);
    const deadline = Date.now() + 10_000;
    while (blocking.length > 0 && Date.now() < deadline) {
      await page.waitForTimeout(1_000);
      blocking = await blockingViolations(page);
    }

    if (blocking.length > 0) {
      for (const v of blocking) {
        console.log(`A11Y ${route}: [${v.impact}] ${v.id}: ${v.description}`);
      }
    }
    expect(
      blocking,
      `axe found ${blocking.length} WCAG violations on ${route}`,
    ).toEqual([]);
  });
}

test.describe("books reader structural a11y", () => {
  // Exactly one <main> landmark per reader route: the root layout owns the
  // single landmark and no reader page adds its own, so nested/ambiguous
  // landmark navigation cannot occur. Additive to a11y.spec.ts, which covers
  // /buecher's axe scan but no landmark structure on any reader route.
  for (const route of [LIBRARY, OVERVIEW, CHAPTER_URL]) {
    test(`${route} exposes exactly one main landmark and no nested main`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("main")).toHaveCount(1);
      const nested = await page.evaluate(
        () => document.querySelectorAll("main main").length,
      );
      expect(nested, `${route} must not nest a <main> inside a <main>`).toBe(0);
    });
  }

  test("book overview settles at exactly one h1", async ({ page }) => {
    await page.goto(OVERVIEW, { waitUntil: "domcontentloaded" });
    // The overview is a pure server page: one h1 (the book title). Assert the
    // structural count, distinct from buecher-overview.spec.ts's text check.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("chapter exposes one h1 and a named article", async ({
    page,
  }) => {
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });

    const article = page.getByRole("article", { name: CHAPTER_TITLE });
    await expect(article).toBeVisible();
    await expect(article).toHaveAttribute("aria-label", CHAPTER_TITLE);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(CHAPTER_TITLE);
  });

  test("chapter body headings do not skip from the title straight to an h3", async ({
    page,
  }) => {
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });
    const article = page.getByRole("article", { name: CHAPTER_TITLE });
    await expect(article).toBeVisible();

    // Body heading levels in DOM order. A healthy outline opens on h2 and never
    // reaches an h3 before an h2 has appeared.
    const levels = await article.evaluate((el) =>
      Array.from(el.querySelectorAll("h2, h3, h4, h5, h6")).map((h) =>
        Number(h.tagName[1]),
      ),
    );
    expect(
      levels.length,
      "chapter article should render a real heading outline",
    ).toBeGreaterThan(0);
    expect(levels[0], "first body heading should be h2, not a skipped level").toBe(2);

    const firstH3 = levels.indexOf(3);
    if (firstH3 !== -1) {
      const firstH2 = levels.indexOf(2);
      expect(firstH2, "an h2 must exist before the first h3").toBeGreaterThanOrEqual(0);
      expect(firstH2, "h2 must precede h3 (no skipped heading level)").toBeLessThan(
        firstH3,
      );
    }
  });
});
