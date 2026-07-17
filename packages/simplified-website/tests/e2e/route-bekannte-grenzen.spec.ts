import { test, expect, type Page } from "@playwright/test";

/**
 * /bekannte-grenzen trust page (regression coverage). This "Known limitations"
 * page is a radical-transparency surface: it documents what the platform does
 * NOT do (self-signed certificate, simulated demos, delayed content freshness,
 * local-only progress, books as learning material, in-development course).
 * The regressions worth catching: the page fails to render, the LIMITATIONS
 * cards stop rendering, the "report an issue" CTA breaks, or mobile overflows.
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

const ROUTE = "/bekannte-grenzen";

// Mirrors the qa-sweep helper: fail on real console/page errors while
// tolerating benign React/hydration/prefetch noise that is not a regression.
async function gotoAndAssertOk(page: Page, url: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `status for ${url}`).toBe(200);
  await expect(page.locator("text=Application error").first()).toHaveCount(0);

  const meaningful = errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/Cannot update a component/i.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
  expect(
    meaningful,
    `console errors on ${url}\n${meaningful.join("\n")}`,
  ).toEqual([]);
}

test.describe("/bekannte-grenzen", () => {
  test("smoke: loads with 200, h1 and no console error", async ({ page }) => {
    await gotoAndAssertOk(page, ROUTE);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Bekannte Grenzen",
    );
  });

  test("renders the limitation cards with mitigation guidance", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Below-fold limitation cards use whileInView reveals; under reduced-motion
    // their initial state keeps them out of the a11y tree until scrolled into
    // view (verified: 3 h2 at page-top -> 9 after scroll; DOM always has all 9).
    // Fire every reveal first, then poll the count.
    await fireReveals(page);

    // Each limitation is an <h2> card. Assert on the role + a resilient
    // minimum count (currently 6) rather than exact copy, which is being
    // refreshed on another branch.
    const cards = page.getByRole("heading", { level: 2 });
    await expect(cards.first()).toBeVisible();
    await expect
      .poll(() => cards.count(), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(5);

    // The "Was du tun kannst:" label is unique to the mitigation block that
    // every rendered card carries, so its count proves the cards actually
    // rendered (not just header/footer headings).
    expect(
      await page.getByText(/Was du tun kannst/).count(),
      "each limitation card must render a mitigation block",
    ).toBeGreaterThanOrEqual(5);
  });

  test("shows the provider-free feedback channel", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // The public standalone build intentionally keeps server-backed feedback
    // disabled until its provider contract is configured. The limitations page
    // must therefore expose the documented email fallback instead of claiming
    // that the inactive form is available.
    await expect(
      page.getByText(/Bitte melde sie per E-Mail an tim@loehrning\.ai/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Feedback-Formular" }),
    ).toHaveCount(0);
  });

  test("mobile: no horizontal overflow at 390px and content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Web-first wait for the primary content instead of a fixed sleep.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: (document.scrollingElement ?? document.documentElement)
        .scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 2);
  });
});
