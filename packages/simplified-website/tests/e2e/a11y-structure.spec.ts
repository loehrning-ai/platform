import { test, expect, type Page } from "@playwright/test";

/**
 * Landmark / document-structure sweep (regression coverage).
 *
 * Complements a11y.spec.ts, which runs axe but FILTERS to serious/critical and
 * so drops the moderate-impact structural rules (landmark-one-main,
 * landmark-unique, region, page-has-heading-one). This spec asserts that
 * cross-page skeleton contract directly with role locators, so a regression
 * that strips a landmark, doubles the <main>, or drops the h1 fails loudly.
 *
 * Assertions target ROLES and the html lang attribute, never copy, so a
 * content refresh stays green. Routes span the public surface and include
 * two (/hilfe, /einstieg) that a11y.spec.ts does not scan.
 */

const ROUTES = [
  "/",
  "/kurse",
  "/buecher",
  "/hilfe",
  "/ueber-mich",
  "/vorlagen",
  "/einstieg",
] as const;

/**
 * One evaluate pass over the settled DOM. An <img> without an alt attribute is
 * a WCAG 1.1.1 failure; alt="" is allowed for decorative images, so we test
 * attribute PRESENCE, not truthiness. A positive tabindex breaks the natural
 * tab order (WCAG 2.4.3) and is not flagged by axe's WCAG rule set.
 */
async function structuralOffenders(page: Page) {
  return page.evaluate(() => {
    const imgsMissingAlt = Array.from(document.querySelectorAll("img"))
      .filter((el) => !el.hasAttribute("alt"))
      .map((el) => el.getAttribute("src") ?? el.outerHTML.slice(0, 80));
    const positiveTabindex = Array.from(
      document.querySelectorAll<HTMLElement>("[tabindex]"),
    )
      .filter((el) => Number(el.getAttribute("tabindex")) > 0)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}[tabindex=${el.getAttribute("tabindex")}]`,
      );
    return { imgsMissingAlt, positiveTabindex };
  });
}

test.describe("landmark + structure sweep", () => {
  for (const route of ROUTES) {
    test(`${route} exposes one main, one h1, a nav, a footer and lang="de"`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      // Document language: assistive-tech pronunciation depends on it.
      await expect(page.locator("html")).toHaveAttribute("lang", "de");

      // Exactly one main landmark. The layout renders a single <main>; a page
      // that nests its own would double it (a real, shipped-before bug class).
      await expect(page.getByRole("main")).toHaveCount(1);

      // Exactly one h1. Poll to the settled count: a Suspense fallback can
      // briefly add a heading during hydration, and AT reads the settled DOM.
      await expect
        .poll(() => page.getByRole("heading", { level: 1 }).count(), {
          message: `${route} should settle at exactly one h1`,
          timeout: 10_000,
        })
        .toBe(1);

      // Navigation landmark present. Some routes (e.g. /kurse) add an in-page
      // nav, so assert PRESENCE of the primary one, not a unique count. The
      // layout nav is first in DOM order, so .first() is the site nav.
      await expect(page.getByRole("navigation").first()).toBeVisible();

      // Footer contentinfo present. A <footer> scoped inside article/section is
      // not a contentinfo landmark, so getByRole isolates the top-level one.
      await expect(page.getByRole("contentinfo").first()).toBeVisible();

      // Every img carries an alt attribute; no positive tabindex anywhere.
      const { imgsMissingAlt, positiveTabindex } =
        await structuralOffenders(page);
      expect(
        imgsMissingAlt,
        `${route}: <img> missing alt attribute -> ${imgsMissingAlt.join(", ")}`,
      ).toEqual([]);
      expect(
        positiveTabindex,
        `${route}: positive tabindex breaks tab order -> ${positiveTabindex.join(", ")}`,
      ).toEqual([]);
    });
  }
});
