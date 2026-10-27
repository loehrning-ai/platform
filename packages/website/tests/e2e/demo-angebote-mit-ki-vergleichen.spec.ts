import { expect, test, type Page } from "@playwright/test";
import { expectGlassBudget } from "./fixtures/glass";

/**
 * W06 "Die Vergleichsbasis" on the v4 shell: the intro and its start fit the first phone screen, the
 * guess commits on the printed prices, the five fields turn the order from B, C, A to C, A, B with the
 * kit's totals, the method sheet hides the dock, the paper slider flips first place to A and a cap
 * brings C back, the kit's second case loads, a restart keeps the visitor's own offers, and the Claude
 * step checks the recorded takes against the same sums.
 */
const SLUG = "angebote-mit-ki-vergleichen";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/reduced motion/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The offers in reading order as the Rangliste shows them (top to bottom, or left to right in a row), by their first letter. */
const order = (page: Page) =>
  page.locator("[data-av4-row]").evaluateAll((rows) =>
    rows
      .map((row) => {
        const box = row.getBoundingClientRect();
        return { name: (row.getAttribute("data-av4-row") ?? "").slice(0, 1), top: Math.round(box.top), left: box.left };
      })
      .sort((a, b) => a.top - b.top || a.left - b.left)
      .map((row) => row.name)
      .join(""),
  );

/** The dock's caption is never cut: it shows every line it has. */
async function expectCaptionWhole(page: Page) {
  const caption = page.locator("[data-av4-caption]");
  const fits = await caption.evaluate((element) => element.scrollHeight <= element.clientHeight + 1);
  expect(fits).toBe(true);
}

/** A key visual of the workbench sits fully above the dock, so the dock never covers it. */
async function expectAboveDock(page: Page, selector: string) {
  const target = await page.locator(selector).first().boundingBox();
  const dock = await page.locator("[data-av4-dock]").boundingBox();
  expect(target).not.toBeNull();
  expect(dock).not.toBeNull();
  expect((target?.y ?? 0) + (target?.height ?? 0)).toBeLessThanOrEqual((dock?.y ?? 0) + 1);
}

const total = (page: Page, option: string) => page.locator(`[data-av4-row="${option}"] [data-av4-total]`);
const beat = (page: Page) => page.locator("[data-demo-clock]");

/** "Weiter" through the keyboard, the way the dock's next button is bound. */
async function next(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("ArrowRight");
}

/** "Weiter" until the clock stands on the next beat (a beat's own motion may still be running). */
async function advanceTo(page: Page, id: string) {
  await expect(async () => {
    await next(page);
    await expect(beat(page)).toHaveAttribute("data-beat", id, { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

/** "Weiter" inside the basis beat: one field after the other. */
async function nextMove(page: Page, move: string) {
  await expect(async () => {
    await next(page);
    await expect(page.locator(`[data-av4-data][data-move="${move}"]`)).toHaveCount(1, { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

async function start(page: Page) {
  await expect(async () => {
    await page.locator("[data-demo-start]").click();
    await expect(page.locator("[data-av4-pick]").first()).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

/**
 * One letter after another: on a phone only the letter in view has its button. With `lens`, the
 * letter is pushed up under the resting lens until its one-off line crosses the lens's centre.
 */
async function readLetter(page: Page, key: "A" | "B" | "C", lens = false) {
  const radio = page.locator("[data-av4-letters] [role=radio]").filter({ hasText: new RegExp(`^${key}`) });
  if (await radio.first().isVisible()) await radio.first().click();
  if (lens) {
    await page.locator(`[data-av4-letter-text="${key}"]`).evaluate(async (text, letter) => {
      for (let y = 0; y <= text.scrollHeight; y += 8) {
        text.scrollTop = y;
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (!document.querySelector(`[data-av4-read="${letter}"]`)) return;
      }
    }, key);
  } else {
    await page.locator(`[data-av4-read="${key}"]`).click();
  }
  // Found: the button gives way to the amount (after the third find the letters collapse).
  await expect(page.locator(`[data-av4-read="${key}"]`)).toHaveCount(0);
}

test.describe(`/demos/${SLUG}`, () => {
  test("de: intro fold, guess, five fields, method, paper price and cap at 390 x 664", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });

    // The first screen holds the intro and its start; behind it only the printed prices, no bars.
    const startBox = await page.locator("[data-demo-start]").boundingBox();
    expect((startBox?.y ?? 0) + (startBox?.height ?? 0)).toBeLessThanOrEqual(664);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("[data-av4-seg]")).toHaveCount(0);
    await expect(page.locator("[data-av4-printed]")).toHaveCount(3);

    await start(page);
    await expect(beat(page)).toHaveAttribute("data-beat", "tipp");
    await page.locator('[data-av4-pick="B Poznań"]').click();
    await expect(page.locator('[data-av4-row="B Poznań"] [data-av4-guess]')).toHaveCount(1);
    await advanceTo(page, "kipp");

    // 2a Menge: tap the quantity onto the strip.
    await expect(page.locator('[data-av4-data][data-move="menge"]')).toHaveCount(1);
    await expectCaptionWhole(page);
    await page.locator("[data-av4-qty]").click();
    // 2b Einheit: per box, the bars show the goods price and B leads.
    await nextMove(page, "einheit");
    await page.getByRole("radio", { name: "Je Stück" }).click();
    await expect.poll(() => order(page)).toBe("BCA");
    // 2c Lieferort: one term for each pocket.
    await nextMove(page, "lieferort");
    for (const [key, payer] of [["A", "supplier"], ["B", "buyer"], ["C", "buyer"]] as const) {
      await page.locator(`[data-av4-term="${key}"]`).click();
      await page.locator(`[data-av4-pocket="${payer}"]`).click();
      if (key === "B") {
        // B's trucks drive above the dock while the caption says what the trips cost.
        await expectAboveDock(page, "[data-av4-routes]");
        await expectCaptionWhole(page);
      }
    }
    await expect(total(page, "B Poznań")).toHaveText("25.520 €", { timeout: 8000 });
    // 2d Einmalig: the rows reorder only after the third find.
    await nextMove(page, "einmalig");
    await expectAboveDock(page, "[data-av4-lens]");
    await readLetter(page, "A", true);
    await readLetter(page, "B");
    await expect.poll(() => order(page)).toBe("BCA");
    await readLetter(page, "C");
    await expect.poll(() => order(page)).toBe("CAB");
    // 2e Zahlung: Skonto is on, the kit's totals stand once the payment arrives.
    await nextMove(page, "zahlung");
    await next(page);
    await expect(total(page, "C Brno")).toHaveText("24.910 €");
    await expect(total(page, "A Nürnberg")).toHaveText("25.872 €");
    await expect(total(page, "B Poznań")).toHaveText("26.554 €");
    await expect.poll(() => order(page)).toBe("CAB");
    await expectCaptionWhole(page);

    // The method sheet takes the dock's place.
    await next(page);
    await expect(page.locator("[data-av4-method]")).toBeVisible();
    await expect(page.locator("[data-av4-dock]")).toBeHidden();
    await page.locator("[data-av4-method-next]").click();
    await expect(beat(page)).toHaveAttribute("data-beat", "papier", { timeout: 10_000 });
    await expect(page.locator("[data-av4-dock]")).toBeVisible();

    // Paper price: past the turning point A leads; a cap of 5 % brings C back at 25.600 €.
    await expectAboveDock(page, "[data-av4-flip]");
    await page.locator("[data-av4-flip]").click();
    await expect.poll(() => order(page)).toBe("ACB");
    await expect(page.locator("[data-av4-readout]")).toHaveAttribute("data-ahead", "A");
    await page.locator("[data-av4-paper] [role=slider]").first().focus();
    await page.keyboard.press("End");
    await expect(page.locator("[data-av4-caption]")).toContainText("10 Prozent");
    await expectCaptionWhole(page);
    const cap = page.locator("[data-av4-cap] [role=slider]");
    await expect(cap).toHaveCount(1);
    await cap.focus();
    for (let step = 0; step < 5; step += 1) await page.keyboard.press("PageDown");
    await expect(total(page, "C Brno")).toHaveText("25.600 €");
    await expect.poll(() => order(page)).toBe("CAB");

    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await expectGlassBudget(page, `/demos/${SLUG} paper price`);
    expect(errors).toEqual([]);
  });

  test("de: the second case, a restart keeps own offers, and the Claude step checks the takes", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(`/demos/${SLUG}?beat=deins`, { waitUntil: "networkidle" });
    await expect(beat(page)).toHaveAttribute("data-beat", "deins");

    await page.locator("[data-av4-second]").click();
    await expect(page.locator("[data-av4-row]")).toHaveCount(2);
    await expect(total(page, "X Kassel")).toHaveText("9.408 €");
    await expect(total(page, "Y Leipzig")).toHaveText("9.740 €");
    await expect(page.locator("[data-av4-caption]")).toContainText("332 €");

    // r restarts at the first beat; the own offers stay in this tab.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("r");
    await expect(beat(page)).toHaveAttribute("data-beat", "tipp", { timeout: 10_000 });
    await expect(page.locator("[data-av4-pick]").first()).toBeVisible();
    await page.getByRole("button", { name: /: Deine Angebote$/ }).click();
    await expect(beat(page)).toHaveAttribute("data-beat", "deins");
    await expect(total(page, "X Kassel")).toHaveText("9.408 €");
    await page.locator("[data-av4-clear]").click();
    await expect(page.locator("[data-av4-row]")).toHaveCount(3);

    await advanceTo(page, "mitnehmen");
    // The Claude window sits in the stage; the old block below the stage is gone, and nothing scrolls by itself.
    await expect(page.locator("[data-av4-window] [data-claude-scene]")).toHaveCount(1);
    await expect(page.locator("[data-claude-scene]")).toHaveCount(1);
    await expect(page.locator('[data-av4-check-item="found"]')).toHaveCount(0);
    // Attach Brandtwerk's rates (a tap; dragging into the window does the same), then send.
    const rates = page.locator("[data-av4-rates]");
    await expect(rates).toHaveAttribute("aria-checked", "false");
    await rates.click();
    await expect(rates).toHaveAttribute("aria-checked", "true");
    await page.locator("[data-av4-window] [data-scene-send]").click();
    await expect(page.locator("[data-av4-window] [data-scene-pause]")).toBeVisible({ timeout: 3000 });
    const scrolled = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(1500);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrolled)).toBeLessThan(2);
    // Our check: every recorded take with Brandtwerk's rates names the three sums.
    expect(await page.locator('[data-av4-check-item="found"]').count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('[data-av4-check-item="missing"]')).toHaveCount(0);

    // The filled table carries the stage's totals.
    const download = page.waitForEvent("download");
    await page.locator('[data-av4-take="table"]').click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("vergleichsbasis-mit-zahlen.md");
    const body = Buffer.concat((await (await file.createReadStream()).toArray()) as Buffer[]).toString("utf8");
    expect(body).toContain("24.910 €");
    expect(body).not.toMatch(/\{\{\w+\}\}/);

    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test("en: the old method link opens the sheet, Escape closes it, totals in English", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/en/demos/${SLUG}?beat=methode`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-av4-method]")).toBeVisible();
    await expect(page.locator("[data-av4-dock]")).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-av4-method]")).toBeHidden();
    await expect(page.locator("[data-av4-dock]")).toBeVisible();
    await expect(total(page, "C Brno")).toHaveText("€24,910");
    await expect(total(page, "A Nürnberg")).toHaveText("€25,872");
    await expect(total(page, "B Poznań")).toHaveText("€26,554");
    await expect.poll(() => order(page)).toBe("CAB");

    // Shift+R restarts too, at the first beat.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Shift+R");
    await expect(beat(page)).toHaveAttribute("data-beat", "tipp", { timeout: 10_000 });
    await expect(page.locator("[data-av4-seg]")).toHaveCount(0);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test("de: free play opens the basis sheet as printed", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await expect(async () => {
      await page.locator("[data-demo-explore]").click();
      await expect(page.locator("[data-av4-free]")).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
    await expect(page.locator("[data-av4-seg]")).toHaveCount(0);
    await page.locator("[data-av4-free]").getByRole("radio", { name: "Je Stück" }).click();
    await expect(page.locator("[data-av4-seg]").first()).toBeVisible();
    await page.locator("[data-av4-to-guide]").click();
    await expect(page.locator("[data-av4-free]")).toBeHidden();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
});
