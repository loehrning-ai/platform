import { test, expect } from "@playwright/test";
import { GITHUB_ORG, TIM_ENTITY } from "../../src/lib/seo/entity";

/**
 * Site chrome contract: the GitHub icon in the primary navigation belongs to
 * the organisation that publishes this platform, not to the maintainer's
 * personal account.
 *
 * The nav renders the link three times (desktop icon, no-script static list,
 * mobile drawer), so this asserts the invariant over EVERY github.com link
 * inside the nav landmark rather than a single locator. A future variant that
 * reintroduces the personal URL fails here too.
 *
 * Tim's personal profile is not banned from the site: it stays on /ueber-mich
 * and in the Person entity's sameAs, which is where it is semantically right.
 * This spec only constrains the site-wide header.
 */

const NAV = 'nav[aria-label="Hauptnavigation"]';

test.describe("primary navigation GitHub target", () => {
  test("every GitHub link in the header points at the organisation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const hrefs = await page
      .locator(`${NAV} a[href*="github.com"]`)
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLAnchorElement).href),
      );

    // Guard against the assertion passing vacuously if the icon is dropped.
    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      expect(href.replace(/\/$/, "")).toBe(GITHUB_ORG.url);
    }
    expect(hrefs).not.toContain(TIM_ENTITY.personalGithubUrl);
  });

  test("the header GitHub icon is labelled for the organisation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const labelled = page.locator(
      `${NAV} a[aria-label="${GITHUB_ORG.displayName} auf GitHub"]`,
    );
    await expect(labelled).toHaveAttribute("href", GITHUB_ORG.url);
  });
});
