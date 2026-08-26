import { expect, test } from "@playwright/test";

/**
 * Opt-in visual QA: scroll through the homepage section-by-section so Framer
 * Motion's whileInView animations settle before each reviewed capture.
 * Screenshots are Playwright attachments, not shared filesystem output. The
 * Playwright config excludes this file from mandatory projects unless
 * PLAYWRIGHT_CAPTURE_VISUALS=1, so skipped review cases do not consume shard
 * capacity or distort the public release inventory.
 */

test.describe("QA visuals — homepage scroll capture", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
    "manual visual review runs once in desktop Chromium",
  );

  test("capture sections while scrolling", async ({ page }, testInfo) => {
    test.skip(
      process.env.PLAYWRIGHT_CAPTURE_VISUALS !== "1",
      "visual-capture aid; set PLAYWRIGHT_CAPTURE_VISUALS=1 for manual review",
    );
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL("/");
    await expect(
      page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]'),
    ).toBeAttached();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Section list matches the compact homepage composition: globe-led hero,
    // course route, resource ledger, and public operating principles.
    const sections: Array<[string, string]> = [
      ["hero", "[data-section='hero']"],
      ["courses", "[data-testid='kurse-section']"],
      ["resources", "[data-testid='ressourcen-section']"],
      ["principles", "[data-testid='platform-principles']"],
    ];

    for (const [name, selector] of sections) {
      const el = page.locator(selector).first();
      await expect(el, `${name} section exists`).toBeAttached();
      await el.scrollIntoViewIfNeeded();
      await expect(el, `${name} section is visible`).toBeVisible();
      // This is a human-review aid; wait for in-view motion to reach its
      // authored resting state before capturing the bounded section.
      await page.waitForTimeout(1200);
      const screenshot = await el.screenshot({
        animations: "disabled",
        caret: "hide",
      });
      await testInfo.attach(`homepage-${testInfo.project.name}-${name}.png`, {
        body: screenshot,
        contentType: "image/png",
      });
    }
  });
});

const REVIEW_VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const REVIEW_ROUTES = [
  ["home-de", "/"],
  ["home-en", "/en"],
  ["atlas-de", "/kurse"],
  ["atlas-en", "/en/kurse"],
  ["entry", "/einstieg"],
  ["explain", "/wie-ki-funktioniert"],
  ["self-check", "/ki-check"],
  ["foundation-ai-native", "/ai-native"],
  ["foundation-eu-ai-act", "/eu-ai-act-kurs"],
  ["foundation-reader", "/ki-fuehrerschein/kurs/block_1"],
  ["technical-codex", "/kurse/open-source/codex"],
  ["technical-codex-reader", "/en/kurse/open-source/codex/kurs/L01"],
  ["technical-data-science", "/kurse/open-source/data-science"],
  ["technical-data-science-reader", "/en/kurse/open-source/data-science/fund"],
  [
    "technical-data-engineering",
    "/kurse/open-source/data-engineering-fundamentals",
  ],
  [
    "technical-data-engineering-reader",
    "/en/kurse/open-source/data-engineering-fundamentals/home",
  ],
  ["technical-ai-native-operator", "/kurse/open-source/ai-native-operator"],
  ["workshops", "/workshops"],
  ["demos", "/demos"],
  ["books", "/buecher"],
  ["blog", "/blog"],
  ["open-source", "/open-source"],
  ["platform", "/ueber-die-plattform"],
  ["account", "/konto"],
] as const;

test.describe("QA visuals — representative route matrix", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
    "manual route-family review runs once in desktop Chromium",
  );

  for (const [name, route] of REVIEW_ROUTES) {
    test(`${route} across review widths`, async ({ page }, testInfo) => {
      test.skip(
        process.env.PLAYWRIGHT_CAPTURE_VISUALS !== "1",
        "visual-capture aid; set PLAYWRIGHT_CAPTURE_VISUALS=1 for manual review",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });

      for (const viewport of REVIEW_VIEWPORTS) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status(), `${route} returns 200`).toBe(200);
        await expect(
          page.locator(
            '[data-app-hydration-marker="true"][data-hydrated="true"]',
          ),
        ).toBeAttached();
        await expect(
          page.getByRole("heading", { level: 1 }).first(),
        ).toBeVisible();
        if (route === "/" || route === "/en") {
          await expect(
            page.locator("[data-hero-network-motion]").first(),
          ).toBeAttached();
        }
        await page.evaluate(async () => document.fonts.ready);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(
          overflow,
          `${route} overflows at ${viewport.name}`,
        ).toBeLessThanOrEqual(1);

        const screenshot = await page.screenshot({
          animations: "disabled",
          caret: "hide",
          fullPage: false,
        });
        await testInfo.attach(`${name}-${viewport.name}.png`, {
          body: screenshot,
          contentType: "image/png",
        });
      }
    });
  }
});
