import { test, expect, type Page } from "@playwright/test";

/**
 * /vorlagen governance-template library smoke + interaction (regression coverage).
 * The public resource library groups eight kursbegleitende Vorlagen into three
 * governance categories; each card links to a /vorlagen/[slug] detail page.
 * Assertions target ROLES and a real slug/title pair discovered from
 * content/vorlagen + TEMPLATE_ORDER in src/lib/vorlagen.ts, so a copy refresh
 * stays green while a real regression (empty grid, dead card, unresolved
 * detail, mobile overflow) fails.
 */

// Scroll top-to-bottom so every whileInView IntersectionObserver reveal fires
// (below-fold cards start out of the a11y tree under reduced-motion until seen).
async function fireReveals(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    window.scrollTo(0, 0);
  });
}

const ROUTE = "/vorlagen";
// A real template. The slug + title stay paired so the card click and the
// resolved detail page assert the same artefact.
const SAMPLE_SLUG = "ki-nutzungsrichtlinie";
const SAMPLE_TITLE = /KI-Nutzungsrichtlinie/;

// Console-error filter mirrors route-einstieg.spec.ts / qa-sweep.spec.ts: drop
// framework noise and keep only errors that signal a genuine page fault.
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

test.describe("/vorlagen library", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/Nutzbare Vorlagen/);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  test("renders the categorised template cards", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // The template cards below the fold use whileInView reveals; under
    // reduced-motion their initial state keeps them out of the a11y tree until
    // they scroll into view (verified: 0 at page-top -> full after scroll,
    // while the SSR HTML already contains every card). Fire every reveal by
    // scrolling top-to-bottom before counting, then let the poll settle.
    await fireReveals(page);

    // Every card is a Link wrapping an h3 title; the page's other h3 headings
    // (CTA strip) live outside any link, so this isolates the template grid.
    const cards = page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 3 }) });
    await expect
      .poll(() => cards.count(), {
        message: "template grid should render multiple cards",
        timeout: 10_000,
      })
      .toBeGreaterThanOrEqual(3);

    // A known template proves the cards fill with content, not just chrome.
    await expect(
      page.getByRole("heading", { level: 3, name: SAMPLE_TITLE }),
    ).toBeVisible();

    // The governance categories are the page's structural spine.
    await expect(
      page.getByRole("heading", { level: 2, name: "Compliance-Pflicht" }),
    ).toBeVisible();
  });

  test("a template card opens its /vorlagen/[slug] detail page", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const card = page.getByRole("link").filter({
      has: page.getByRole("heading", { level: 3, name: SAMPLE_TITLE }),
    });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", `/vorlagen/${SAMPLE_SLUG}`);

    await card.click();
    await expect(page).toHaveURL(new RegExp(`/vorlagen/${SAMPLE_SLUG}$`));

    const detailH1 = page.getByRole("heading", { level: 1 });
    await expect(detailH1).toBeVisible();
    await expect(detailH1).toContainText(SAMPLE_TITLE);

    // Detail chrome: the back-link returns to the library.
    await expect(
      page.getByRole("link", { name: "Zurück zu allen Vorlagen" }),
    ).toHaveAttribute("href", "/vorlagen");
  });
});

test.describe("/vorlagen mobile", () => {
  test("has no horizontal overflow at 390px and keeps content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: SAMPLE_TITLE }),
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
