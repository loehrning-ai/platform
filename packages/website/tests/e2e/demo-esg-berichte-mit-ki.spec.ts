import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ESG_COPY } from "../../src/lib/demo-cases/esg-berichte-mit-ki/copy";
import { TAKEAWAYS } from "../../src/lib/demo-cases/esg-berichte-mit-ki/takeaways";

/*
 * W04 demo "Zehn Fakten, 14 Antworten": the core loop end to end, the
 * Monday, the takeaways, deep links, the fit-aware sticky sheet, phone
 * overflow and axe.
 */

const PATH = "/demos/esg-berichte-mit-ki";
const DE = ESG_COPY.de;

type Plan = readonly [id: string, status: string, detail: string, action?: "yes" | "no"];

const RUN: readonly Plan[] = [
  ["bussgeld", "ok", "z13-14", "no"],
  ["wasser", "check", "conflict"],
  ["kopf", "ok", "z3-5", "no"],
  ["unfall", "ok", "z4-7", "no"],
  ["ghg", "notFound", "diesel"],
  ["mix", "notFound", "supplier"],
  ["zert", "check", "expired"],
  ["pv", "check", "estimate"],
  ["glas", "ok", "z3-5", "yes"],
  ["strom", "notFound", "sept"],
];

async function stamp(page: Page, [id, status, detail, action]: Plan, check = DE.card.check) {
  const card = page.locator(`section[data-slot="${id}"]`);
  await card.locator(`fieldset[data-decision="status"] input[value="${status}"]`).check();
  await card.locator(`fieldset[data-decision="detail"] input[value="${detail}"]`).check();
  if (action) await card.locator(`fieldset[data-decision="action"] input[value="${action}"]`).check();
  await card.getByRole("button", { name: check }).click();
  await expect(card.locator(".eb-fb")).toBeVisible();
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".eb[data-ready]")).toBeAttached();
}

/**
 * Page errors and console errors, hydration warnings included (React reports
 * a hydration mismatch through console.error, not as a page error).
 */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("W04 demo: Zehn Fakten, 14 Antworten", () => {
  test("plays ten facts, the following Monday and the takeaways on a phone", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = watchErrors(page);
    await open(page, PATH);

    // On load: card 1, all 14 rows open, the Monday locked, the takeaways there.
    await expect(page.getByRole("heading", { level: 2, name: /Fakt 1 von 10/ })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(14);
    await expect(page.getByText(DE.monday.locked)).toBeVisible();
    await expect(page.locator("#mitnehmen .eb-take-card")).toHaveCount(3);
    await noHorizontalOverflow(page);

    // The first card by keyboard: the feedback takes focus.
    await stamp(page, RUN[0] as Plan);
    await expect(page.getByRole("heading", { level: 3, name: DE.feedback.grades.right })).toBeFocused();
    await expect(page.locator('tr[data-row="Q5"] .eb-cell-status')).toHaveText("OK");
    await page.getByRole("button", { name: DE.feedback.next(2) }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Fakt 2 von 10/ })).toBeFocused();

    for (const plan of RUN.slice(1)) {
      await page.locator(".eb-index-btn").nth(RUN.indexOf(plan)).click();
      await stamp(page, plan);
      if (plan[0] === "glas") {
        // The longest line (questionnaire 21) wraps inside its figure at 390.
        const wide = await page
          .locator('section[data-slot="glas"] figure')
          .evaluateAll((figures) => figures.filter((figure) => figure.scrollWidth > figure.clientWidth).length);
        expect(wide).toBe(0);
      }
    }

    const summary = page.getByTestId("eb-summary");
    await expect(summary).toContainText(DE.sheet.differ(1));
    await expect(summary.getByRole("link", { name: "Q8" })).toHaveAttribute("href", "#eb-row-Q8");
    await expect(page.locator('tr[data-row="Q8"] .eb-yours')).toHaveText("deins: NEEDS CHECK");

    // The following Monday.
    await page.getByRole("button", { name: DE.monday.start }).click();
    await expect(page.getByTestId("eb-date")).toHaveText(DE.date.monday);
    await page.locator("#montag .eb-pick").filter({ hasText: "F2" }).click();
    await page.locator("#montag .eb-pick").filter({ hasText: "Q1" }).click();
    await page.getByRole("button", { name: DE.monday.openInvoice }).click();
    await page.locator('input[name="eb-invoice"][value="41200"]').check();
    await page.locator("#montag").getByRole("button", { name: DE.card.check }).click();
    await expect(page.getByText(DE.monday.invoiceMath)).toBeVisible();
    await stamp(page, ["monday", "ok", "b3-13+inv", "no"]);
    await expect(page.getByTestId("eb-reveal")).toBeVisible();
    // Motion plays only in view: below the fold the strip holds its first frame.
    const strip = page.locator('[data-testid="eb-reveal"] .eb-strip');
    const box = await strip.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport && box.y > viewport.height) {
      await page.waitForTimeout(1000);
      await expect(strip).toHaveAttribute("data-t", "start");
    }
    await strip.scrollIntoViewIfNeeded();
    await expect(strip).toHaveAttribute("data-t", "end");
    await expect(page.getByTestId("eb-score")).toHaveText(
      "Du hast 1 von 2 Änderungen getroffen. Zu viel markiert: Q1. Übersehen: F3.",
    );
    await expect(page.locator('#antworten table[data-request="bank"] caption')).toContainText(
      DE.sheet.tally(3, 3, 0),
    );

    // Takeaways: today's misses are marked on screen; the copied text is exact.
    await expect(page.locator(".eb-check-list li[data-marked]")).toHaveCount(2);
    const copyButton = page.locator(".eb-copy").nth(2);
    await copyButton.click();
    await expect(copyButton).toHaveText(DE.takeaways.copied);
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    if (clip !== null) expect(clip).toBe(TAKEAWAYS.de[2].text);

    await noHorizontalOverflow(page);
    expect(await page.locator(".eb details, .eb summary, .eb [aria-expanded]").count()).toBe(0);
    expect(errors).toEqual([]);
  });

  test("the #zert deep link opens card 7", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, `${PATH}#zert`);
    await expect(page.getByRole("heading", { level: 2, name: /Fakt 7 von 10/ })).toBeVisible();
    await expect(page.locator('.eb-index-btn[aria-current="step"]')).toContainText("07");
    expect(errors).toEqual([]);
  });

  test("a malformed hash is no deep link and no crash, on load and on hashchange", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, `${PATH}#%E0%A4%A`);
    await expect(page.getByRole("heading", { level: 2, name: /Fakt 1 von 10/ })).toBeVisible();
    await page.evaluate(() => {
      window.location.hash = "%";
    });
    await expect(page.getByRole("heading", { level: 2, name: /Fakt 1 von 10/ })).toBeVisible();
    await page.evaluate(() => {
      window.location.hash = "pv";
    });
    await expect(page.getByRole("heading", { level: 2, name: /Fakt 8 von 10/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("the English page runs in English", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, `/en${PATH}`);
    await expect(page.getByText(ESG_COPY.en.date.friday)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Fact 1 of 10/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Answer sheet" })).toBeVisible();
    await stamp(page, ["bussgeld", "ok", "z13-14", "no"], ESG_COPY.en.card.check);
    await expect(page.getByRole("heading", { level: 3, name: ESG_COPY.en.feedback.grades.right })).toBeFocused();
    expect(errors).toEqual([]);
  });

  test("the sheet sticks only when it fits", async ({ page }) => {
    const errors = watchErrors(page);
    for (const height of [900, 700]) {
      await page.setViewportSize({ width: 1440, height });
      await open(page, PATH);
      const sheet = page.locator("#antworten");
      await expect(sheet).toBeVisible();
      await page.waitForTimeout(150);
      const [fits, position] = await sheet.evaluate((element) => [
        element.getAttribute("data-fits"),
        getComputedStyle(element).position,
      ]);
      if (height === 700) expect(position).toBe("static");
      if (position === "sticky") {
        expect(fits).toBe("true");
        // Scroll so the sheet's top has passed the nav, then wait for it to pin.
        const top = await sheet.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
        await expect
          .poll(async () => {
            const box = await sheet.boundingBox();
            return box ? box.y + box.height <= height && box.y >= 0 : false;
          })
          .toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });

  test("passes axe on load and with feedback open", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, PATH);
    await expect(page.locator(".eb")).toBeVisible();
    const scan = () =>
      new AxeBuilder({ page }).include("[data-demo-mount]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect((await scan()).violations).toEqual([]);
    await stamp(page, ["bussgeld", "notFound", "decl"]);
    expect((await scan()).violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});
