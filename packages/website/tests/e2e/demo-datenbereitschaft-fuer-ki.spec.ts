import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_TEXT } from "../../src/lib/demo-cases/datenbereitschaft-fuer-ki/copy";

const PATH = "/demos/datenbereitschaft-fuer-ki";
const ROOT = '[data-demo="datenbereitschaft-fuer-ki"]';

async function open(page: Page, prefix = "", hash = "") {
  const response = await page.goto(`${prefix}${PATH}${hash}`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator(`${ROOT}[data-ready]`)).toBeAttached({ timeout: 30_000 });
}

async function define(page: Page, request: string, definition: Record<string, string>) {
  for (const [blank, value] of Object.entries(definition)) {
    await page.locator(`#anfrage-${request} fieldset[data-blank="${blank}"] input[value="${value}"]`).check();
  }
  await page.locator(`button[data-check="${request}"]`).click();
}

async function triage(page: Page, id: string, picks: readonly string[]) {
  const card = page.locator(`[data-card="${id}"]`);
  for (const value of picks) await card.locator(`input[value="${value}"]`).check();
  await card.locator(`button[data-check-card="${id}"]`).click();
}

const receipt = (page: Page, id: string) => page.locator(`[data-receipt="${id}"]`);

/**
 * Uncaught errors and console.error (React reports hydration mismatches
 * there, not as page errors). Dev-server chatter that is not the page's
 * fault (HMR socket, Fast Refresh) is left out.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/webpack-hmr|_next\/webpack|\[HMR\]|\[Fast Refresh\]/.test(text)) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

/** Elements inside the demo whose content is wider than their box (clipped or scrolling). */
async function clippedInside(page: Page): Promise<string[]> {
  return page.locator(ROOT).evaluate((root) => {
    const out: string[] = [];
    for (const el of root.querySelectorAll<HTMLElement>("*")) {
      // Visually hidden text (1px, clipped) is meant to be clipped.
      if (el.closest(".dr3-sr, svg") || el.clientWidth <= 1 || getComputedStyle(el).clip.startsWith("rect")) continue;
      if (el.scrollWidth > el.clientWidth + 1) out.push(`${el.tagName}.${el.className} ${el.scrollWidth}>${el.clientWidth}`);
    }
    for (const box of root.querySelectorAll<HTMLElement>("[data-receipt]")) {
      const style = getComputedStyle(box);
      const right = box.getBoundingClientRect().right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
      for (const el of box.querySelectorAll<HTMLElement>("table, th, td")) {
        if (el.getBoundingClientRect().right > right + 1) out.push(`past receipt: ${el.tagName} "${(el.textContent ?? "").slice(0, 30)}"`);
      }
    }
    return out;
  });
}

test.describe("Demo 03: Mach die Zahl richtig", () => {
  test("plays the whole loop in German: wrong, out of date, right, five cards, copy", async ({ page, context, browserName }) => {
    const text = DEMO_TEXT.de;
    const errors = collectErrors(page);
    await open(page);

    // Everything is in the first HTML: all five requests and the take-aways.
    for (const id of ["01", "02", "03", "04", "05"]) await expect(page.locator(`#anfrage-${id}`)).toBeAttached();
    await expect(page.locator("#mitnehmen")).toBeAttached();

    // 01: levels added across months, twice; run 2 names the blank to change.
    await define(page, "01", { kind: "level", grain: "single", period: "sumMonths", table: "analytics.mrr_summary_monthly" });
    await expect(receipt(page, "01")).toHaveAttribute("data-verdict", "wrong");
    await expect(page.locator("#anfrage-01-receipt")).toBeFocused();
    await define(page, "01", {});
    const change = receipt(page, "01").locator("button[data-change-blank]");
    await expect(change).toHaveAttribute("data-change-blank", "period");
    await change.click();
    await expect(page.locator('#anfrage-01 fieldset[data-blank="period"] input').first()).toBeFocused();
    await page.locator('#anfrage-01 fieldset[data-blank="grain"] input[value="perMonth"]').check();
    await expect(receipt(page, "01")).toHaveAttribute("data-stale", "true");
    await expect(receipt(page, "01")).toContainText(text.stale);
    await define(page, "01", { period: "eachMonth" });
    await expect(receipt(page, "01")).toHaveAttribute("data-verdict", "correct");
    await expect(receipt(page, "01")).toContainText(text.verdicts.correct);
    await expect(page.locator('[data-rail="01"]')).toHaveAttribute("data-status", "solved");

    // 02: the export sum is the right number for the wrong reason.
    await define(page, "02", { kind: "change", period: "sumMonths", table: "public.monthly_revenue" });
    await expect(receipt(page, "02")).toHaveAttribute("data-verdict", "rightNumberWrongDef");
    await define(page, "02", { table: "analytics.mrr_summary_monthly" });
    await expect(receipt(page, "02")).toHaveAttribute("data-verdict", "correct");

    // 03: joiners in the base, then the start of the quarter.
    await define(page, "03", { kind: "rate", grain: "perSegment", table: "analytics.logo_churn_by_segment_quarter", base: "startPlusJoiners" });
    await expect(receipt(page, "03")).toHaveAttribute("data-verdict", "wrong");
    await define(page, "03", { base: "startOfQuarter" });
    await expect(receipt(page, "03")).toHaveAttribute("data-verdict", "correct");

    // 04: five cards; R02 needs the lock that really holds.
    await triage(page, "G01", ["answer"]);
    await triage(page, "C01", ["askBack", "kind", "period"]);
    await triage(page, "R01", ["refuse"]);
    await triage(page, "R02", ["refuse", "sqlGuard"]);
    await expect(receipt(page, "R02")).toHaveAttribute("data-verdict", "wrong");
    await triage(page, "R02", ["postgresRole"]);
    await triage(page, "F01", ["answerWarn", "loadedAt", "age", "warnAfter", "definition"]);
    for (const id of ["G01", "C01", "R01", "R02", "F01"]) await expect(receipt(page, id)).toHaveAttribute("data-verdict", "correct");

    // 05: averaged rates are wrong, pooled counts are right.
    await define(page, "05", { kind: "rate", table: "analytics.attrition_by_department_quarter", combine: "averageRates", base: "startOfQuarter" });
    await expect(receipt(page, "05")).toHaveAttribute("data-verdict", "wrong");
    await define(page, "05", { combine: "pool" });
    await expect(receipt(page, "05")).toHaveAttribute("data-verdict", "correct");

    for (const id of ["01", "02", "03", "04", "05"]) await expect(page.locator(`[data-rail="${id}"]`)).toHaveAttribute("data-status", "solved");
    await expect(page.locator("[data-closing]")).toHaveText(text.closing);

    // Copy: the visible confirmation always; the exact text where the clipboard can be read.
    const copy = page.locator('button[data-copy="definition"]');
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await copy.click();
    await expect(copy).toContainText(text.copied);
    if (browserName === "chromium") {
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      expect(clip).toBe(text.takeaways.find((card) => card.id === "definition")?.text);
    }

    const axe = await new AxeBuilder({ page }).include(ROOT).analyze();
    expect(axe.violations.map((violation) => violation.id)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("English: the direct link lands on its request and the loop answers in English", async ({ page }) => {
    const text = DEMO_TEXT.en;
    const errors = collectErrors(page);
    await open(page, "/en", "#anfrage-05");
    await expect(page.locator('[data-rail="05"]')).toHaveAttribute("aria-current", "step");
    await define(page, "05", { kind: "rate", table: "analytics.attrition_by_department_quarter", combine: "pool", base: "startOfQuarter" });
    await expect(receipt(page, "05")).toHaveAttribute("data-verdict", "correct");
    await expect(receipt(page, "05")).toContainText(text.verdicts.correct);
    await expect(page.locator(ROOT)).not.toContainText("Prüfen");
    expect(errors).toEqual([]);
  });

  for (const width of [320, 390]) {
    test(`nothing overflows or is clipped on a ${width}px phone`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width, height: 844 });
      await open(page);
      await define(page, "01", { kind: "level", grain: "single", period: "sumMonths", table: "analytics.mrr_summary_monthly" });
      // The widest receipt rows: an empty base per segment, and the average base in 05.
      await define(page, "03", { kind: "rate", grain: "perSegment", table: "public.acct_history", base: "startOfQuarter" });
      await define(page, "05", { kind: "rate", table: "analytics.attrition_by_department_quarter", combine: "pool", base: "averageHeadcount" });
      for (const id of ["01", "03", "05"]) await expect(receipt(page, id).locator("table[data-rows]")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(await clippedInside(page)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
});
