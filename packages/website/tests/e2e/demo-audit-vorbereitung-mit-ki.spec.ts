import { expect, test, type Page } from "@playwright/test";
import { expectGlassBudget } from "./fixtures/glass";

/**
 * W05 "Nachweisprüfung" on a phone: the estimate commits before the reveal,
 * the four tests leave 2 · 4 · 2, a restart keeps the visitor's own list, the
 * Zitat-Probe checks a pasted table, and an old date caps an item at SCHWACH.
 */
const SLUG = "audit-vorbereitung-mit-ki";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/reduced motion/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    test(`${locale}: estimate, reveal 2 · 4 · 2, ribbon and gap list, at 390 x 664`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });

      // Fold: the estimate lever sits above the fold, and the page has not scrolled.
      const lever = await page.locator("[data-demo-lever]").boundingBox();
      expect((lever?.y ?? 0) + (lever?.height ?? 0)).toBeLessThanOrEqual(664 + 0.5);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      // Nothing is revealed before the commit.
      await expect(page.locator("[data-w05-ribbon] [data-status]")).toHaveCount(0);
      await expect(page.locator("[data-w05-gaps]")).not.toContainText(locale === "de" ? "LÜCKE" : "GAP");

      await page.locator('[data-w05-estimate="6"]').click();
      await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "pruefen");
      const tally = page.locator("[data-w05-tally]");
      const words = locale === "de" ? ["BELEGT 2", "SCHWACH 4", "LÜCKE 2"] : ["COVERED 2", "WEAK 4", "GAP 2"];
      for (const word of words) await expect(tally).toContainText(word, { timeout: 12_000 });
      await expect(tally).toContainText("6");
      await expect(page.locator("[data-w05-ribbon] [data-status]")).toHaveCount(8, { timeout: 12_000 });
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expectGlassBudget(page, `${prefix}/demos/${SLUG} after the reveal`);

      // The gap list renders one request per WEAK and GAP item.
      await expect(page.locator("[data-w05-gap]")).toHaveCount(6);
      await page.locator('[data-w05-gap="R7"]').click();
      await expect(page.locator("[data-w05-mail]").first()).toContainText("R7");
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("de: r and Shift+R restart the beats but keep the visitor's own list", async ({ page }) => {
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator('[data-w05-estimate="3"]').click();
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "pruefen");

    await page.locator("[data-w05-paste]").fill("Backup-Konzept.docx\t02.04.2023\nSchulung_Teilnahme_2026.xlsx\t03.03.2026");
    await page.locator("[data-w05-read-list]").click();
    await expect(page.locator("[data-w05-own-out]")).toBeVisible();

    // A key typed into a form field never restarts.
    await page.locator("[data-w05-paste]").press("r");
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "pruefen");

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("r");
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "schaetzen");
    await expect(page.locator('[data-w05-estimate][aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator("[data-w05-own-out]")).toBeVisible();

    await page.locator('[data-w05-estimate="4"]').click();
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "pruefen");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Shift+R");
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "schaetzen");
    await expect(page.locator("[data-w05-own-out]")).toBeVisible();
    // Only the explicit button clears the visitor's input.
    await page.locator("[data-w05-clear]").click();
    await expect(page.locator("[data-w05-own-out]")).toHaveCount(0);
  });

  test("de: an old date in the pasted list caps the backup item at SCHWACH once the audit date is set", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator("[data-w05-paste]").fill("Backup-Konzept.docx\t02.04.2023");
    await page.locator("[data-w05-read-list]").click();
    const r7 = page.locator('[data-w05-own-out] [data-item="R7"]');
    await expect(r7).toHaveAttribute("data-bound", "open");
    await page.locator("[data-w05-audit]").fill("2026-12-10");
    await expect(r7).toHaveAttribute("data-bound", "weak");
    await expect(r7).toContainText("höchstens SCHWACH");
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("en: the Zitat-Probe finds a quote and flags a policy offered for a record", async ({ page }) => {
    await page.goto(`/en/demos/${SLUG}`, { waitUntil: "networkidle" });
    const table = [
      "| Item | File | Quote | Status |",
      "|---|---|---|---|",
      '| R7 | backup-report_2026-10.txt | "Restore test: not done in 2026." | GAP |',
      '| R5 | training-records_2026.csv | "26 staff trained" | COVERED |',
    ].join("\n");
    await page.locator("[data-w05-probe] textarea").fill(table);
    await page.locator("[data-w05-probe-run]").click();
    const out = page.locator("[data-w05-probe-out]");
    await expect(out.locator('[data-item="R7"] [data-check="found"]')).toHaveCount(1);
    await expect(out.locator('[data-item="R5"] [data-flag]')).not.toHaveCount(0);
  });
});
