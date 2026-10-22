import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { COPY } from "../../src/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
  type BrowserErrorLog,
} from "./fixtures/console";

const PATH = "/demos/geschaeftsberichte-mit-ki-lesen";

async function open(page: Page, prefix = "") {
  const response = await page.goto(`${prefix}${PATH}`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-demo-root]")).toBeVisible();
  // Wait for hydration: a choice must produce its consequence.
  await expect(async () => {
    await page.locator('[data-testid="compare-choices"] [data-option="line-week"]').click();
    await expect(page.locator('[data-testid="compare-result"] [data-verdict]')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
}

/**
 * Uncaught errors and console.error both fail a test, through the suite's one
 * browser-error gate: React reports hydration mismatches through
 * console.error, never as a pageerror.
 */
const logs = new WeakMap<Page, BrowserErrorLog>();

test.beforeEach(({ page }) => {
  logs.set(page, collectBrowserErrors(page));
});

test.afterEach(({ page }) => {
  const log = logs.get(page);
  if (!log) return;
  const noise = meaningfulBrowserErrors(log);
  expect(noise, `browser errors on ${PATH}\n${formatBrowserErrors(noise)}`).toEqual([]);
});

test.describe("Workshop 02 demo: Die Zahl, die trägt", () => {
  test("plays the core loop from the gut call to a sheet that holds", async ({ page }) => {
    const de = COPY.de;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);

    // Before any further choice, the final material is already on the page.
    await expect(page.getByTestId("workshop-answer")).toContainText(de.decide.workshopHeading);
    await expect(page.getByTestId("text-check")).toHaveText(de.takeaways.check.text);

    await page.locator('[data-testid="gut-vote"] [data-option="marketing"]').click();

    // 1 · Vergleichen (chosen while waiting for hydration).
    await expect(page.locator('[data-testid="compare-result"] [data-verdict="holds"]')).toBeVisible();
    await expect(page.locator('[data-testid="compare-bars"] [data-row="CRAFT"]')).toContainText("−2,1");

    // 2 · Mängel
    await page.locator('[data-testid="defect-choices"] [data-option="per1000"]').click();
    await expect(page.getByTestId("rate-ladder")).toHaveAttribute("data-scale", "per1000");
    await page.locator('[data-testid="flag-choices"] [data-option="chronic"]').click();
    await expect(page.getByTestId("flag-evidence")).toContainText("691 Tsd. €");
    await expect(page.getByTestId("bridge-text")).toContainText(
      "Das sind meine eigenen Antworten auf Blank 1, 4 und 5. Frag mich nur noch Blank 2, 3 und 6.",
    );

    // 3 · Prüfen
    const nest = page.locator('[data-claim="nest-ncr"]');
    await nest.locator('[data-option="match"]').click();
    await expect(nest.locator("[data-source-value]")).toHaveText("Quelle zeigt 19");
    await expect(nest.locator("[data-echo]")).toHaveText("Du hast gesagt: stimmt. Die Quelle zeigt: weicht ab.");
    await page.locator('[data-claim="craft-marketing"] [data-option="nowhere"]').click();
    await expect(page.getByTestId("check-counter")).toHaveText("Geprüft: 2 von 4");

    // 4 · Entscheide
    const picks: [string, string][] = [
      ["decision", "rework"],
      ["number", "rate-251"],
      ["cost", "both-ways"],
      ["open", "marketing"],
      ["counter", "rate-fell"],
      ["trigger", "rate-and-scrap"],
    ];
    for (const [field, option] of picks) {
      await page.locator(`[data-sheet-row="${field}"] [data-option="${option}"]`).click();
    }
    await expect(page.getByTestId("sheet-summary")).toHaveText(de.decide.sheetHolds);
    await expect(page.getByTestId("gut-line")).toContainText("Deine Regeln haben die Entscheidung gedreht.");
    await expect(page.getByTestId("text-sheet-example")).toContainText(
      "Freigabe: Oktober unter 2,51 je 1.000 und Ausschuss unter 8 % vom Umsatz.",
    );
    await expect(page.getByTestId("bridge-text")).toContainText("Frag mich nur noch Blank 2 und 3.");

    await page.getByTestId("reset").click();
    await expect(page.getByTestId("sheet-example")).toHaveCount(0);
    await expect(page.locator("[data-demo-root] input:checked")).toHaveCount(0);
  });

  for (const [prefix, decision, number] of [
    ["", "rework", "craft-mom"],
    ["", "marketing", "scrap-691"],
    ["/en", "rework", "rev-412"],
  ] as const) {
    test(`station 4: ${decision} with ${number}${prefix ? " (EN)" : ""} says why for that direction and keeps the number's own fact`, async ({
      page,
    }) => {
      const copy = prefix ? COPY.en : COPY.de;
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, prefix);
      const row = page.locator('[data-sheet-row="number"]');
      await page.locator(`[data-sheet-row="decision"] [data-option="${decision}"]`).click();
      await row.locator(`[data-option="${number}"]`).click();
      await expect(row).toHaveAttribute("data-verdict", "misleads");
      await expect(row.locator("[data-against]")).toHaveText(copy.decide.against[decision]);
      await expect(row.locator("[data-row-fact]")).toHaveText(
        `${copy.decide.dataLabel}: ${copy.decide.options.number[number].fact}`,
      );
      const other = decision === "rework" ? "marketing" : "rework";
      await expect(row).not.toContainText(copy.decide.against[other]);
    });
  }

  test("works by keyboard: arrow keys change a choice", async ({ page }) => {
    await open(page);
    const checked = page.locator('[data-testid="compare-choices"] input:checked');
    await expect(checked).toHaveValue("line-week");
    await checked.focus();
    await page.keyboard.press("ArrowUp");
    await expect(checked).toHaveValue("total-week");
    await expect(page.locator('[data-testid="compare-result"]')).toContainText("+0,8");
  });

  test("fits a 390px phone and passes axe inside the demo", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const sticky = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-demo-root] *")].filter((el) =>
          /sticky|fixed/.test(getComputedStyle(el).position),
        ).length,
    );
    expect(sticky).toBe(0);
    const axe = await new AxeBuilder({ page }).include("[data-demo-root]").analyze();
    expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  });

  for (const [prefix, width] of [
    ["", 390],
    ["", 1440],
    ["/en", 390],
  ] as const) {
    test(`passes axe fully played${prefix ? " (EN)" : ""} at ${width}px: every claim revealed, every row answered, every copy block`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, prefix);
      await page.locator('[data-testid="gut-vote"] [data-option="marketing"]').click();
      await page.locator('[data-testid="defect-choices"] [data-option="per1000"]').click();
      await page.locator('[data-testid="flag-choices"] [data-option="chronic"]').click();
      const claims: [string, string][] = [
        ["craft-units", "match"],
        ["nest-ncr", "match"],
        ["craft-revenue", "differs"],
        ["craft-marketing", "nowhere"],
      ];
      for (const [claim, option] of claims) {
        await page.locator(`[data-claim="${claim}"] [data-option="${option}"]`).click();
      }
      await expect(page.locator("[data-claim-rows]")).toHaveCount(4);
      for (const field of ["decision", "number", "cost", "open", "counter", "trigger"]) {
        await page.locator(`[data-sheet-row="${field}"] [data-option]`).first().click();
      }
      await expect(page.getByTestId("sheet-example")).toBeVisible();
      await expect(page.getByTestId("bridge-text")).toBeVisible();
      const axe = await new AxeBuilder({ page }).include("[data-demo-root]").analyze();
      expect(
        axe.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(", ")}`),
      ).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      // The 2.4 s "Kopiert" state: every copy button shows it inside the
      // button and keeps its name. WebKit knows no clipboard permissions; a
      // click there copies through the user gesture or the legacy fallback.
      const ui = prefix ? COPY.en.ui : COPY.de.ui;
      if (browserName === "chromium") {
        await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
      }
      // Hold only the 2.4 s "Kopiert" reset, so it cannot fire while axe runs
      // (pausing the whole clock would also stall axe's own timers).
      await page.evaluate(() => {
        const original = window.setTimeout.bind(window);
        window.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) =>
          original(handler, ms === 2400 ? 2_147_483_647 : ms, ...rest)) as typeof window.setTimeout;
      });
      const copyIds = ["copy-bridge", "copy-traps", "copy-check", "copy-sheet", "copy-sheet-example"];
      for (const id of copyIds) await page.getByTestId(id).click();
      for (const id of copyIds) {
        // Both labels sit in the button; only the visible one counts.
        await expect(page.getByTestId(id).locator('span[aria-hidden="true"]:visible')).toHaveText(ui.copied);
        await expect(page.getByTestId(id)).toHaveAccessibleName(ui.copy);
      }
      const copied = await new AxeBuilder({ page }).include("[data-demo-root]").analyze();
      expect(
        copied.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(", ")}`),
      ).toEqual([]);
    });
  }

  test("the English page carries the same exercise", async ({ page }) => {
    await open(page, "/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('[data-testid="compare-result"]')).toContainText("−2.1%");
    await expect(page.locator("[data-demo-root] input[type=radio]")).toHaveCount(42);
    await expect(page.getByTestId("workshop-answer")).toContainText(COPY.en.decide.workshopHeading);
  });

  test("the deep link #pruefen lands on station 3", async ({ page }) => {
    await page.goto(`${PATH}#pruefen`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#pruefen")).toBeInViewport();
  });
});
