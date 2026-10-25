import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { listZipEntries, readZipText } from "../../src/lib/zip/read";

const SLUG = "geschaeftsberichte-mit-ki-lesen";
const SKILL = readFileSync(join(process.cwd(), "content/skills/kennzahlen-steckbrief/SKILL.md"), "utf8");
/** A string that must never leave the browser: it goes into the visitor's own card. */
const MARKER = "MARKER-7f3a-Werk2";

/** Console errors and page errors of one run: the demo must be silent. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const clock = (page: Page) => page.locator("[data-demo-clock]");
const rail = (page: Page, counter: string) => page.locator(`[data-rail-value="${counter}"]`);

/**
 * ArrowRight until the clock shows `id`; next() first finishes a running motion, so it may take two presses.
 * Arrows inside a radio group move the choice, so focus leaves the chips first.
 */
async function advanceTo(page: Page, id: string) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect
    .poll(
      async () => {
        const now = await clock(page).getAttribute("data-beat");
        if (now !== id) await page.keyboard.press("ArrowRight");
        return now;
      },
      { timeout: 8000, intervals: [250] },
    )
    .toBe(id);
}

/** From beat 1 to the own beat: the commit beat needs the tap, then a rail mark jumps. */
async function pollThenOwn(page: Page) {
  await page.locator('[data-poll="same"]').click();
  await expect(clock(page)).toHaveAttribute("data-beat", "drei-zaehlweisen", { timeout: 4000 });
  await page.locator('[data-beat-rail]:visible [data-beat-mark="deine-kennzahl"]').click();
  await expect(clock(page)).toHaveAttribute("data-beat", "deine-kennzahl");
}

async function open(page: Page, path: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
}

test.describe(`/demos/${SLUG}`, () => {
  test("DE: the poll, three rails, the merge test, the period and the decision", async ({ page }) => {
    const errors = watch(page);
    await open(page, `/demos/${SLUG}`);
    await expect(page.locator("[data-nw-quote]")).toBeVisible();
    for (const value of ["better", "same", "worse"]) await expect(page.locator(`[data-poll="${value}"]`)).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    await page.locator('[data-poll="worse"]').click();
    await expect(clock(page)).toHaveAttribute("data-beat", "drei-zaehlweisen", { timeout: 4000 });
    await expect(rail(page, "records")).toHaveText("2,51", { timeout: 6000 });
    await expect(rail(page, "affected")).toHaveText("309");
    await expect(rail(page, "scrapped")).toHaveText("168");
    await expect(page.locator("[data-framed]")).toHaveCount(1);

    await advanceTo(page, "zaehler-waehlen");
    await page.locator("[data-merge-toggle]").click();
    await expect(rail(page, "records")).toHaveText("1,86", { timeout: 3000 });
    await expect(rail(page, "affected")).toHaveText("309");
    await expect(rail(page, "scrapped")).toHaveText("168");
    await page.locator('input[name="nw-counter"][value="scrapped"]').check({ force: true });

    await advanceTo(page, "zeitraum");
    await page.locator('input[name="nw-basis"][value="week"]').check({ force: true });
    await expect(page.locator("[data-period-delta]")).toContainText("−2,1", { timeout: 3000 });
    await expect(page.locator('[data-nw-notes="zeitraum"]')).toContainText("+0,8");

    await advanceTo(page, "entscheiden");
    await expect(page.locator("[data-decision-headline]")).toContainText("Erst Nacharbeit");
    await expect(page.locator('[data-trigger-checks] [data-check="fail"]')).toHaveCount(0);
    await expect(page.locator('[data-trigger-checks] [data-check="ok"]')).toHaveCount(3);
    expect(errors).toEqual([]);
  });

  test("DE: a records release condition fails check one at the merged 1,86", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=zaehler-waehlen`);
    await page.locator('input[name="nw-counter"][value="records"]').check({ force: true });
    await advanceTo(page, "entscheiden");
    const failed = page.locator('[data-trigger-checks] [data-check="fail"]');
    await expect(failed).toHaveCount(1);
    await expect(failed).toContainText("1,86");
  });

  test("DE: ArrowRight after a tapped rail moves on and keeps the tapped numerator", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=zaehler-waehlen`);
    await page.locator('[data-rail="scrapped"]').click();
    await expect(page.locator("[data-demo-next]")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(clock(page)).toHaveAttribute("data-beat", "zeitraum");
    await expect(page.locator("[data-nw-counter]")).toHaveAttribute("data-nw-counter", "scrapped");
  });

  test("DE: ?beat= opens a beat at its final state", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=drei-zaehlweisen`);
    // The reveal runs 3 s; a deep link must not replay it, so the end values are there at once.
    await expect(rail(page, "records")).toHaveText("2,51", { timeout: 800 });
    await expect(rail(page, "affected")).toHaveText("309", { timeout: 200 });
    await expect(rail(page, "scrapped")).toHaveText("168", { timeout: 200 });
  });

  test("DE: ?beat=5 traces 4.124.238 € to 95 rows", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=5`);
    await expect(clock(page)).toHaveAttribute("data-beat", "zahl-pruefen");
    await page.locator("[data-trace-figure]").click();
    const sum = page.locator("[data-trace-sum]");
    await expect(sum).toHaveAttribute("data-done", "", { timeout: 4000 });
    await expect(sum).toContainText("4.124.238");
    await expect(page.locator("[data-demo-stage]")).toContainText("95");
  });

  test("DE: r and Shift+R go to beat 1 and clear the poll; r inside a field is text", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=deine-kennzahl`);
    const name = page.locator('[data-own-field="name"]');
    await name.fill("Quote");
    await name.press("r");
    await expect(name).toHaveValue("Quoter");
    await expect(clock(page)).toHaveAttribute("data-beat", "deine-kennzahl");
    await name.blur();

    await page.locator("body").press("r");
    await expect(clock(page)).toHaveAttribute("data-beat", "frage");
    await expect(page.locator('[data-poll][aria-pressed="true"]')).toHaveCount(0);

    await pollThenOwn(page);
    await expect(page.locator('[data-own-field="name"]')).toHaveValue("Quoter");
    await page.locator("body").press("Shift+R");
    await expect(clock(page)).toHaveAttribute("data-beat", "frage");
    await expect(page.locator('[data-poll][aria-pressed="true"]')).toHaveCount(0);
  });

  for (const [prefix, de] of [["", true], ["/en", false]] as const) {
    test(`${de ? "DE" : "EN"}: the own card goes into references, survives a reset and never leaves the browser`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL ?? "http://localhost:3000").origin;
      const outbound: string[] = [];
      page.on("request", (request) => {
        const leaves = new URL(request.url()).origin !== origin;
        const carries = request.url().includes(MARKER) || (request.postData() ?? "").includes(MARKER);
        if (leaves || carries) outbound.push(request.url());
      });
      await open(page, `${prefix}/demos/${SLUG}?beat=deine-kennzahl`);
      await page.locator('input[name="nw-kind"][value="events"]').check({ force: true });
      await expect(page.locator('[data-finding="R1"]')).toBeVisible();
      await page.locator('input[name="nw-kind"][value="quantity"]').check({ force: true });

      await page.locator('[data-own-field="name"]').fill(`Quote ${MARKER}`);
      await page.locator('[data-own-field="decision"]').fill(de ? "Lieferant wechseln" : "Switch supplier");
      await page.locator('[data-own-field="numerator"]').fill(de ? "Reklamierte Stück" : "Units returned");
      await page.locator('[data-own-field="denominator"]').fill(de ? "Gelieferte Stück" : "Units delivered");
      await page.locator('input[name="nw-period"][value="week"]').check({ force: true });
      await page.locator("[data-add-card]").click();
      await expect(page.locator("[data-own-section]")).toContainText(MARKER);

      // A reset clears the poll and the levers, never the visitor's own cards.
      await page.locator("body").press("r");
      await expect(clock(page)).toHaveAttribute("data-beat", "frage");
      await pollThenOwn(page);
      await expect(page.locator("[data-own-section]")).toContainText(MARKER);

      await advanceTo(page, "mitnehmen");
      await expect(page.locator("[data-own-instructions]")).toContainText(MARKER);
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 5000 }),
        page.locator("[data-skill-zip]").click(),
      ]);
      expect(download.suggestedFilename()).toBe("kennzahlen-steckbrief.zip");
      const bytes = new Uint8Array(readFileSync((await download.path())!));
      expect(listZipEntries(bytes).map((entry) => entry.path)).toEqual([
        "kennzahlen-steckbrief/SKILL.md",
        "kennzahlen-steckbrief/references/steckbriefe.md",
      ]);
      expect(readZipText(bytes, "kennzahlen-steckbrief/SKILL.md")).toBe(SKILL);
      const references = readZipText(bytes, "kennzahlen-steckbrief/references/steckbriefe.md") ?? "";
      expect(references).toContain(de ? "# Unsere Steckbriefe" : "# Our metric cards");
      expect(references).toContain(`### Quote ${MARKER}`);
      expect(outbound).toEqual([]);
    });
  }

  test("reduced motion: the final rail values are there right after the tap", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator('[data-poll="better"]').click();
    await expect(rail(page, "records")).toHaveText("2,51", { timeout: 1500 });
    await expect(rail(page, "scrapped")).toHaveText("168", { timeout: 500 });
    await context.close();
  });

  test("room mode: ?room=1 marks the clock", async ({ page }) => {
    await open(page, `/demos/${SLUG}?room=1`);
    await expect(clock(page)).toHaveAttribute("data-room", "");
  });
});
