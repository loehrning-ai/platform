import { test, expect, type Page } from "@playwright/test";

/**
 * /ki-fuehrerschein course track smoke + interaction (regression coverage).
 * Landing (indexable) -> CTA into the /kurs hub -> one public-access block
 * reader. Real block ids come from KI_FUEHRERSCHEIN_CONFIG.blockIds
 * (src/lib/course/config.ts): block_1..block_5. The reader is `public-access`
 * in the crawl contract, so it carries NO X-Robots-Tag header; the /kurs
 * layout's Next.js `robots` metadata is the ONLY noindex signal, which is why
 * the reader test asserts the emitted <meta name="robots"> in the fetched HTML
 * rather than a header. Assertions target roles + stable structure, not copy.
 */

const ROUTE = "/ki-fuehrerschein";
const COURSE_PATH = "/ki-fuehrerschein/kurs";
const BLOCK_ROUTE = "/ki-fuehrerschein/kurs/block_1";

// Console-error filter mirrors route-einstieg.spec.ts: drop framework noise,
// keep only errors that signal a genuine page fault.
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

test.describe("/ki-fuehrerschein landing", () => {
  test("loads, shows the h1, and logs no console error", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("KI im Alltag");

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  test("renders the getBlocks-driven curriculum list", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /Was du lernst/i }),
    ).toBeVisible();
    // Block titles come from the course-data single source; assert the first
    // one renders so a broken getBlocks() (empty list) is caught.
    await expect(page.getByText("KI ist schon da").first()).toBeVisible();
  });

  test("primary CTA starts the course hub", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    const startCta = page
      .getByRole("link", { name: /Kurs starten/i })
      .first();
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute("href", COURSE_PATH);

    await startCta.click();
    await expect(page).toHaveURL(/\/ki-fuehrerschein\/kurs$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /KI-Führerschein/i }),
    ).toBeVisible();
  });
});

test.describe("/ki-fuehrerschein course reader", () => {
  test("hub links into a block reader that resolves", async ({ page }) => {
    await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /KI-Führerschein/i }),
    ).toBeVisible();

    // Fresh context = no saved progress, so the first block card links out via
    // "Block starten"; tolerate "Weitermachen" too in case state ever leaks.
    const blockLink = page
      .getByRole("link", { name: /Block starten|Weitermachen/i })
      .first();
    await expect(blockLink).toBeVisible();
    await expect(blockLink).toHaveAttribute("href", BLOCK_ROUTE);

    await blockLink.click();
    await expect(page).toHaveURL(/\/ki-fuehrerschein\/kurs\/block_1$/);

    // The reader shell always renders a back-link to the block hub plus a
    // lesson heading, so an emptied reader is caught.
    await expect(
      page.getByRole("link", { name: /Alle Blöcke/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  });

  test("block reader is served with a robots noindex meta", async ({
    request,
  }) => {
    const response = await request.get(BLOCK_ROUTE);
    expect(response.status(), `status for ${BLOCK_ROUTE}`).toBe(200);

    const body = await response.text();
    // Extract the emitted robots meta tag (attribute order-independent) and
    // assert it carries noindex, the sole thing keeping this public-access
    // reader out of the search index.
    const robotsMeta = body.match(/<meta[^>]*name=["']robots["'][^>]*>/i);
    expect(
      robotsMeta,
      `${BLOCK_ROUTE} must emit a robots meta tag`,
    ).not.toBeNull();
    expect(
      robotsMeta?.[0] ?? "",
      `${BLOCK_ROUTE} robots meta must be noindex`,
    ).toMatch(/noindex/i);
  });
});

test.describe("/ki-fuehrerschein mobile", () => {
  test("has no horizontal overflow at 390px and keeps the hero visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Kurs starten/i }).first(),
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
