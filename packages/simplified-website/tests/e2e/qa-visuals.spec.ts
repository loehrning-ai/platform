import { test } from "@playwright/test";

/**
 * Visual QA — scroll through the homepage section-by-section so Framer
 * Motion's whileInView animations fire before we screenshot. The regular
 * qa-sweep.spec does fullPage captures which show animations in their
 * pre-animate state (opacity:0). This spec solves that.
 */

test.describe.configure({ mode: "serial" });

test.describe("QA visuals — homepage scroll capture", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("capture sections while scrolling", async ({ page }) => {
    // This visual-capture aid writes /tmp/qa-section-*.png for human review.
    // It has no functional assertions, so it is opt-in to keep the regression
    // suite deterministic.
    test.skip(
      process.env.PLAYWRIGHT_CAPTURE_VISUALS !== "1",
      "visual-capture aid; set PLAYWRIGHT_CAPTURE_VISUALS=1 for manual review",
    );
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

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
      await el.scrollIntoViewIfNeeded();
      // Wait for in-view animations to complete
      await page.waitForTimeout(1200);
      await el.screenshot({ path: `/tmp/qa-section-${name}.png` });
    }
  });
});
