import { test, expect, type Page } from "@playwright/test";

/**
 * /neuigkeiten smoke + structure (regression coverage). A small static changelog
 * page: it reads content/changelog.md and renders it through the shared
 * MarkdownRenderer under a fixed "Was ist neu" heading. The page has no
 * interactive control, so the "key interaction" here is proving the changelog
 * markdown actually rendered. Regressions worth catching: the page fails to
 * load, the markdown renders empty (missing entry heading or update list), or
 * the layout overflows on mobile. Assertions target ROLES and stable structure
 * (heading levels, list items), not the changelog copy, which grows over time.
 */

const ROUTE = "/neuigkeiten";

// Console-error filter mirrors route-einstieg.spec.ts / qa-sweep.spec.ts: drop
// framework noise (hydration, prefetch, chunk 404s, Vercel Analytics) and keep
// only errors that signal a genuine page fault.
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

test.describe("/neuigkeiten changelog", () => {
  test("loads with 200, shows the heading, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    // The page renders its own <h1> plus the markdown's leading "# Was ist neu",
    // so two level-1 headings share this text; assert the first is visible.
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Was ist neu");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders changelog entries from the markdown source", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Scope to <main> so header/nav/footer headings and lists can never satisfy
    // these assertions. The changelog is the only content region inside it.
    const main = page.getByRole("main");

    // Each changelog entry is an <h2> date-stamped section heading. A visible
    // first entry catches a failed or empty markdown render.
    const entryHeadings = main.getByRole("heading", { level: 2 });
    await expect(entryHeadings.first()).toBeVisible();
    expect(
      await entryHeadings.count(),
      "changelog must render at least one entry heading",
    ).toBeGreaterThan(0);

    // The update bullets render as list items; a non-empty count proves the
    // changelog body rendered, not just its heading.
    expect(
      await main.getByRole("listitem").count(),
      "changelog must render its update list items",
    ).toBeGreaterThan(0);
  });

  test("mobile: no horizontal overflow at 390px and content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("heading", { level: 2 }).first(),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: (document.scrollingElement ?? document.documentElement)
        .scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
