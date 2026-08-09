import { expect, test } from "@playwright/test";

/**
 * Opt-in visual QA: scroll through the homepage section-by-section so Framer
 * Motion's whileInView animations settle before each reviewed capture.
 * Screenshots are Playwright attachments, not shared filesystem output.
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
    await expect(page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]')).toBeAttached();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Section list matches the current homepage composition (hero → urgency
    // incl. iceberg reveals → workflow → proof → offering). The old
    // differentiator / who-we-serve / free-resources sections were folded
    // into these during the homepage redesign (performance hardening selector sweep).
    const sections: Array<[string, string]> = [
      ["hero", "[data-section='hero']"],
      ["urgency", "section:has([data-testid='urgency-external-strip'])"],
      ["iceberg", "section:has([data-testid='reveal-iceberg-de'])"],
      ["workflow", "[data-testid='workflow-section']"],
      ["proof", "[data-testid='proof-section']"],
      ["offering", "[data-testid='offering-section']"],
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
      await testInfo.attach(
        `homepage-${testInfo.project.name}-${name}.png`,
        {
          body: screenshot,
          contentType: "image/png",
        },
      );
    }
  });
});
