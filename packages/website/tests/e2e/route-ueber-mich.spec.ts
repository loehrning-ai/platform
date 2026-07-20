import { test, expect, type Page } from "@playwright/test";

/**
 * /ueber-mich smoke + structured-data (regression coverage, wave 2). Canonical
 * ProfilePage: h1, career/academic biography, and a ProfilePage + Person JSON-LD
 * graph. Assertions target roles and stable heading labels (not exact copy), so
 * a reword stays green while a real regression (missing h1, dropped bio
 * sections, absent structured data, mobile overflow) fails.
 *
 * The JSON-LD is a plain inline <script> in the page body (React 19 does not
 * hoist non-src inline scripts to <head>), so we query the whole document for
 * script[type="application/ld+json"] and assert the page-unique "ProfilePage"
 * token alongside "Person".
 */

const ROUTE = "/ueber-mich";

// Console-error filter mirrors route-einstieg.spec.ts: drop framework noise
// (hydration, prefetch, chunk 404s, Vercel Analytics) and keep only errors that
// signal a genuine page fault.
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

test.describe("/ueber-mich profile page", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    // Copy-resilient: assert the h1 carries content, not a specific phrasing.
    await expect(h1).not.toBeEmpty();

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders the career and academic biography sections", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Stable section labels (role-based) are the biography payload: a silently
    // dropped timeline or credentials block fails here, a reword does not.
    await expect(
      page.getByRole("heading", { name: "Karriere" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Akademischer Hintergrund" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "M.Sc. Informatik" }),
    ).toBeVisible();
  });

  test("embeds ProfilePage and Person structured data", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const ldScripts = page.locator('script[type="application/ld+json"]');
    await expect(ldScripts.first()).toBeAttached();

    const combined = (await ldScripts.allTextContents()).join("\n");
    expect(
      combined,
      "page must emit a ProfilePage JSON-LD node",
    ).toContain("ProfilePage");
    expect(combined, "page must emit a Person JSON-LD node").toContain(
      "Person",
    );
  });
});

test.describe("/ueber-mich mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Karriere" }),
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
