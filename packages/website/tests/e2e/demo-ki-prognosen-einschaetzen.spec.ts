import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { FORECAST_COPY } from "../../src/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { MORNINGS } from "../../src/lib/demo-cases/ki-prognosen-einschaetzen/data";
import { rightOption } from "../../src/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import { buildTakeaways } from "../../src/lib/demo-cases/ki-prognosen-einschaetzen/takeaways";

const PATH = "/demos/ki-prognosen-einschaetzen";
const ROOT = '[data-demo="ki-prognosen-einschaetzen"]';

async function open(page: Page, prefix = "", hash = "") {
  const response = await page.goto(`${prefix}${PATH}${hash}`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  // Hydrated once the run has read this browser's saved state.
  await expect(page.locator(".fr[data-ready]")).toBeAttached({ timeout: 30_000 });
}

async function split(page: Page, values: readonly [number, number, number]) {
  for (const [i, value] of values.entries()) await page.locator(`#fr-units-${i}`).fill(String(value));
}

async function playWeek(page: Page, locale: "de" | "en") {
  const copy = FORECAST_COPY[locale];
  await split(page, [500, 370, 180]);
  await page.getByRole("button", { name: copy.split.check, exact: true }).click();
  await expect(page.getByText(copy.split.headlineAll)).toBeVisible();
  await page.getByRole("button", { name: copy.split.continueOwn }).click();
  await expect(page.locator("#fr-h-mornings")).toBeFocused();

  await page.getByRole("button", { name: copy.mornings.ownerOptions.analytics }).click();
  await expect(page.getByRole("button", { name: copy.mornings.start })).toHaveCount(0);
  await page.getByRole("button", { name: copy.mornings.ownerOptions.plannerOnDuty }).click();
  await page.getByRole("button", { name: copy.mornings.start }).click();

  for (const [day, morning] of MORNINGS.entries()) {
    const options = page.locator(".fr-options button");
    await expect(options).toHaveCount(3);
    await options.nth(morning.options.indexOf(rightOption(morning))).click();
    await expect(options).toHaveCount(0);
    await expect(page.locator(".fr-stamp-line")).toBeFocused();
    await page.getByRole("button", { name: day === 6 ? copy.mornings.toResult : copy.mornings.next }).click();
  }
  await expect(page.locator(".fr-score")).toHaveText(copy.result.score(7));
  await expect(page.locator(".fr-week [data-slot]")).toHaveCount(7);
}

test.describe("Workshop 01 demo: 1.050 Stück, sieben Morgen", () => {
  // Any uncaught error or console.error (hydration warnings included) fails the test.
  // The one exception: WebKit reports a request that a reload cancels (an RSC
  // prefetch, the dev overlay's stack frames) as an access-control error, and
  // Next then logs its fallback to a browser navigation. Neither is the page.
  const CANCELLED_REQUEST = /(_rsc=|__nextjs_original-stack-frames).* due to access control checks|^console\.error: Failed to fetch RSC payload .* Falling back to browser navigation/;
  let problems: string[] = [];
  test.beforeEach(({ page }) => {
    problems = [];
    const report = (text: string) => {
      if (!CANCELLED_REQUEST.test(text)) problems.push(text);
    };
    page.on("pageerror", (error) => report(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") report(`console.error: ${message.text()}`);
    });
  });
  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test("the final material is on the page before any play", async ({ page }) => {
    await open(page);
    const de = FORECAST_COPY.de;
    for (const id of ["verteilen", "morgen", "ergebnis", "mitnehmen", "quellen"]) {
      await expect(page.locator(`${ROOT} #${id}`)).toBeAttached();
    }
    await expect(page.getByText(de.takeaways.rule)).toBeVisible();
    await expect(page.getByTestId("fr-check-text")).toHaveText(
      buildTakeaways({ owner: null, blanks: [], copy: FORECAST_COPY.de }).check,
    );
  });

  test("plays the core loop in German: split, owner, seven mornings, result, copy, resume", async ({ page, context, browserName }) => {
    // Only Chromium lets a test read the clipboard back; elsewhere the visible confirmation is checked.
    const readsClipboard = browserName === "chromium";
    if (readsClipboard) await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    const de = FORECAST_COPY.de;

    // Too many first: the check stays off until exactly 1.050.
    await split(page, [700, 300, 100]);
    await expect(page.getByRole("button", { name: de.split.check, exact: true })).toBeDisabled();
    await playWeek(page, "de");

    await page.getByRole("link", { name: de.result.toTakeaways }).click();
    await expect(page.locator("#fr-blank-7")).toHaveValue(/Planer/);
    const checkArticle = page.getByRole("article", { name: de.takeaways.titles[1] });
    await checkArticle.getByRole("button").click();
    await expect(checkArticle.getByRole("button")).toHaveText(de.takeaways.copied);
    if (readsClipboard) {
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      expect(clip).toBe(await page.getByTestId("fr-check-text").textContent());
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".fr[data-ready]")).toHaveAttribute("data-step", "result");
    await expect(page.locator(".fr-resumed:not(.fr-undo)")).toContainText(de.thread.resumed);
    await page.getByRole("button", { name: de.result.restart, exact: true }).click();
    await expect(page.locator(".fr")).toHaveAttribute("data-step", "split");
    await expect(page.locator("#fr-units-0")).toHaveValue("0");
    await expect(page.locator(".fr-resumed:not(.fr-undo)")).toHaveCount(0);
  });

  test("a week left mid-way says so on return and starts over from either restart", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "", "#morgen");
    const de = FORECAST_COPY.de;
    await expect(page.getByRole("button", { name: de.result.restart, exact: true })).toBeVisible();
    await page.getByRole("button", { name: de.mornings.ownerOptions.plannerOnDuty }).click();
    await page.getByRole("button", { name: de.mornings.start }).click();
    await page.locator(".fr-options button").first().click();
    await expect(page.locator(".fr-resumed:not(.fr-undo)")).toHaveCount(0);

    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".fr[data-ready]")).toHaveAttribute("data-step", "mornings");
    await expect(page.locator(".fr-resumed:not(.fr-undo)")).toBeVisible();
    await page.getByRole("button", { name: de.thread.resumedRestart, exact: true }).click();
    await expect(page.locator(".fr")).toHaveAttribute("data-step", "split");
    await expect(page.locator("#fr-h-split")).toBeFocused();
    await expect(page.locator(".fr-resumed:not(.fr-undo)")).toHaveCount(0);

    // Back into the mornings: the in-step restart works the same way.
    await page.getByRole("button", { name: de.mornings.directEntry }).click();
    await page.getByRole("button", { name: de.result.restart, exact: true }).click();
    await expect(page.locator(".fr")).toHaveAttribute("data-step", "split");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".fr[data-ready]")).toHaveAttribute("data-step", "split");
    await expect(page.locator(".fr-resumed:not(.fr-undo)")).toHaveCount(0);
  });

  test("after a restart with an own role, sentence 5 and the Morgen-Check name the same owner", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const de = FORECAST_COPY.de;
    const role = "die Teamleitung Disposition";
    const toMornings = async () => {
      await split(page, [500, 370, 180]);
      await page.getByRole("button", { name: de.split.check, exact: true }).click();
      await page.getByRole("button", { name: de.split.continueOwn }).click();
    };

    await toMornings();
    await page.getByRole("button", { name: de.mornings.ownerOptions.plannerOnDuty }).click();
    await page.getByRole("button", { name: de.mornings.start }).click();
    await expect(page.locator("#fr-blank-7")).toHaveValue(de.takeaways.ownerDefault);
    await page.getByRole("button", { name: de.result.restart, exact: true }).click();
    await expect(page.locator(".fr")).toHaveAttribute("data-step", "split");

    await toMornings();
    await page.getByRole("button", { name: de.mornings.ownerOptions.custom }).click();
    await page.locator("#fr-custom-role").fill(role);
    await page.getByRole("button", { name: de.mornings.customUse }).click();
    await page.getByRole("button", { name: de.mornings.start }).click();
    await expect(page.getByTestId("fr-check-text")).toContainText(`Ein Nein: ${role} entscheidet`);
    await expect(page.locator("#fr-blank-7")).toHaveValue(role);
    await expect(page.locator(".fr-sentence-text").nth(4)).toHaveText(`Bei einem Nein entscheidet ${role}, bevor etwas rausgeht.`);

    // Survives a reload: the stored marker still tells an untouched prefill from an edit.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".fr[data-ready]")).toHaveAttribute("data-step", "mornings");
    await expect(page.locator("#fr-blank-7")).toHaveValue(role);
  });

  test("the English page plays the same week", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await playWeek(page, "en");
  });

  test("#morgen opens the seven mornings directly with the median plan", async ({ page }) => {
    await open(page, "", "#morgen");
    const de = FORECAST_COPY.de;
    await expect(page.locator(".fr")).toHaveAttribute("data-step", "mornings");
    await expect(page.getByText(de.mornings.fallback, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: de.mornings.ownerOptions.plannerOnDuty }).click();
    await page.getByRole("button", { name: de.mornings.start }).click();
    await page.locator(".fr-options button").first().click();
    await expect(page.locator(".fr-stamp-line")).toContainText(de.mornings.stamps.rightRelease);
  });

  for (const [locale, prefix] of [
    ["de", ""],
    ["en", "/en"],
  ] as const) {
    test(`fits a 390px phone and passes axe (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, prefix);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const axe = await new AxeBuilder({ page }).include(ROOT).analyze();
      expect(axe.violations.map((violation) => violation.id)).toEqual([]);

      // And once more on a morning, where the board and the options are.
      await page.getByRole("button", { name: FORECAST_COPY[locale].mornings.directEntry }).click();
      await page.getByRole("button", { name: FORECAST_COPY[locale].mornings.ownerOptions.plannerOnDuty }).click();
      await page.getByRole("button", { name: FORECAST_COPY[locale].mornings.start }).click();
      await page.locator(".fr-options button").first().click();
      const later = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(later).toBeLessThanOrEqual(0);
      const axeMorning = await new AxeBuilder({ page }).include(ROOT).analyze();
      expect(axeMorning.violations.map((violation) => violation.id)).toEqual([]);
    });
  }
});
