import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * W05 "Ordner und Register" on the v4 stage: the intro fits a small phone, the thirteen question cards are
 * tap-sized and three of them take a guess, the clock counts the days, two papers show their four
 * tests, the x-ray opens a question and compares it with the guess, the register counts what has
 * expired, what expires soon and what is missing on three dates (the numbers are read from the oracle's
 * expected.json, never typed here), the late edit leaves the old value visible, the own papers never
 * reach "covered", and the take-home builds a briefing without naming the weekday of the visit. No
 * scene paints a dark fill (the workshop's visual law, scanned by computed colour). Keys: ArrowLeft and
 * ArrowRight walk the path, r and Shift+R restart but keep the visitor's own papers.
 */
const EXPECTED = JSON.parse(readFileSync(path.resolve(process.cwd(), "../../scripts/workshop05/oracle/expected.json"), "utf8")) as {
  register: { byDate: Record<string, { rows: number; expired: number; expiring: number; missing: number }> };
};
const REGISTER_DATES = Object.keys(EXPECTED.register.byDate);
const SLUG = "audit-vorbereitung-mit-ki";
const PHONE = { width: 390, height: 664 };

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/reduced motion/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const beat = (page: Page) => page.locator("[data-demo-clock]");
/** Leave a form field, so the next key is the page's: the shell never takes a key typed into a field. */
const leaveField = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
const next = (page: Page) => page.locator("[data-demo-next]").first();

/** Next until the clock shows the beat: a press during a beat's opening motion only finishes the motion. */
async function advanceTo(page: Page, id: string) {
  await expect(async () => {
    await next(page).click();
    await expect(beat(page)).toHaveAttribute("data-beat", id, { timeout: 700 });
  }).toPass({ timeout: 10_000 });
}

/**
 * The visual law, scanned on the computed colours of the stage content and of the chips the visitor picks:
 * no element of 10 x 4 px or more has a background with alpha 0.3 or more and a relative luminance below
 * 0.15. The shared glass buttons of the dock (the accent button) are outside the scanned scope.
 */
async function darkFills(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const channels = (value: string): [number, number, number, number] | null => {
      const rgb = /^rgba?\(([^)]+)\)$/.exec(value);
      if (rgb) {
        const [r = 0, g = 0, b = 0, a = 1] = (rgb[1] as string).split(/[\s,/]+/).filter(Boolean).map(Number);
        return [r, g, b, a];
      }
      const srgb = /^color\(srgb ([^)]+)\)$/.exec(value);
      if (srgb) {
        const [r = 0, g = 0, b = 0, a = 1] = (srgb[1] as string).split(/[\s/]+/).filter(Boolean).map(Number);
        return [r * 255, g * 255, b * 255, a];
      }
      return null;
    };
    const linear = (c: number) => ((c / 255) <= 0.04045 ? c / 255 / 12.92 : (((c / 255) + 0.055) / 1.055) ** 2.4);
    const hits: string[] = [];
    for (const element of document.querySelectorAll("[data-w05-data], [data-w05-data] *, .w05-focus *")) {
      const box = element.getBoundingClientRect();
      if (box.width < 10 || box.height < 4) continue;
      const parsed = channels(getComputedStyle(element).backgroundColor);
      if (!parsed || parsed[3] < 0.3) continue;
      const luminance = 0.2126 * linear(parsed[0]) + 0.7152 * linear(parsed[1]) + 0.0722 * linear(parsed[2]);
      if (luminance < 0.15) hits.push(`${element.tagName.toLowerCase()}.${String((element as HTMLElement).className).replace(/\s+/g, ".")} ${getComputedStyle(element).backgroundColor}`);
    }
    return hits;
  });
}

/** The three cards that take a guess: one chip each (the first chip of every group). */
async function guessAll(page: Page) {
  for (const id of ["L01", "L05", "L11"]) await page.locator(`[data-w05-card="${id}"] .glas-chip`).first().click();
}

/** From the intro through the first beats to the named beat, doing what each gate asks. */
async function walkTo(page: Page, target: string) {
  await page.locator("[data-demo-start]").click();
  const order = ["ordner", "uhr", "pruefungen", "roentgen", "register", "nachtrag", "ordner-eigen", "mitnehmen"];
  for (const id of order) {
    if (id === target) return;
    if (id === "ordner") {
      await guessAll(page);
      await page.locator('[data-w05-commit="keep"]').click();
    }
    if (id === "roentgen") await page.locator('[data-w05-row="L05"]').click({ timeout: 10_000 });
    await advanceTo(page, order[order.indexOf(id) + 1] as string);
  }
}

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    test(`${locale}: the guided path at 390 x 664`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize(PHONE);
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-demo-intro-news]")).toContainText(locale === "de" ? "26.484" : "26,484");
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      // Scene 1: thirteen cards, three of them take a guess; "keep" appears after the third.
      await page.locator("[data-demo-start]").click();
      await expect(page.locator(".w05-card")).toHaveCount(13);
      await expect(page.locator("[data-w05-card][data-guess]")).toHaveCount(3);
      await expect(page.locator('[data-w05-commit="skip"]')).toBeVisible();
      await guessAll(page);
      // A picked chip is light with an outline, never a dark pill.
      expect(await darkFills(page)).toEqual([]);
      await page.locator('[data-w05-commit="keep"]').click();
      await advanceTo(page, "uhr");

      // Scene 2: the real visit is four calendar days and three working days away.
      await expect(page.locator("[data-w05-calendar]")).toHaveAttribute("data-w05-calendar", "4");
      await expect(page.locator("[data-w05-working]")).toHaveAttribute("data-w05-working", "3");
      await expect(page.locator("[data-w05-verdict]")).toHaveAttribute("data-w05-verdict", "fits");
      // The deck's rule: 25 is short, 26 is unclear (does the notice day count?), 27 fits. No weekend date is printed.
      await page.getByRole("radio").first().click();
      await expect(page.locator("[data-w05-verdict]")).toHaveAttribute("data-w05-verdict", "short");
      await page.getByRole("radio").nth(1).click();
      await expect(page.locator("[data-w05-verdict]")).toHaveAttribute("data-w05-verdict", "unclear");
      await expect(page.locator("[data-w05-data]")).not.toContainText(/\b2[89]\.? (Nov|November)\b/);
      await advanceTo(page, "pruefungen");

      // Scene 3: the attendance sheet is a gap, the safety statement is weak.
      await expect(page.locator('[data-w05-paper="L04"] [data-w05-status="gap"]')).toHaveCount(1);
      await expect(page.locator('[data-w05-paper="L11"] [data-w05-status="weak"]')).toHaveCount(1);
      await page.locator(".w05-focus .glas-chip").first().click();
      expect(await darkFills(page)).toEqual([]);
      await advanceTo(page, "roentgen");

      // Scene 4: a question opens in the x-ray and is compared with the guess.
      await expect(page.locator('[data-w05-xray="done"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("[data-w05-rows]")).toHaveAttribute("data-w05-rows", "693");
      await page.locator('[data-w05-row="L05"]').click();
      await expect(page.locator('[data-w05-lens="L05"]')).toContainText("E-07");
      expect(await darkFills(page)).toEqual([]);
      await advanceTo(page, "register");

      // Scene 5: the register counts the three dates; the numbers are the oracle's own.
      await expect(page.locator('[data-w05-register-state="done"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("radio")).toHaveCount(3);
      for (const [index, date] of REGISTER_DATES.entries()) {
        await page.getByRole("radio").nth(index).click();
        const expected = EXPECTED.register.byDate[date] as { rows: number; expired: number; expiring: number; missing: number };
        await expect(page.locator("[data-w05-register]")).toHaveAttribute("data-w05-register", date);
        for (const count of ["rows", "expired", "expiring", "missing"] as const) {
          await expect(page.locator(`[data-w05-register-count="${count}"] dd`)).toHaveText(String(expected[count]));
        }
        await expect(page.locator("[data-w05-register-result]")).toContainText(String(expected.rows));
      }
      await expect(page.locator("[data-w05-register-note]")).toBeVisible();
      // The lists name an id and a paper, never a person.
      await expect(page.locator(".w05-reg-entry").first()).toContainText(/^E-\d\d /);
      expect(await darkFills(page)).toEqual([]);
      await advanceTo(page, "nachtrag");

      // Scene 6: the changed date keeps its old value on the page, then the new paper is written.
      await page.locator("[data-w05-late-edit]").click();
      await expect(page.locator("[data-w05-ghost]")).toBeVisible();
      await page.locator("[data-w05-late-write]").click();
      await expect(page.locator("[data-w05-note]")).toContainText(locale === "de" ? "Titel:" : "Title:");
      expect(await darkFills(page)).toEqual([]);
      await advanceTo(page, "ordner-eigen");

      // Scene 7: the own paper never reaches the covered status, even with all four tests ticked.
      await page.locator("[data-w05-own-text]").fill("Vertragsregister");
      const paper = page.locator("[data-w05-own-paper]").first();
      for (const chip of await paper.locator(".glas-chip").all()) await chip.click();
      await expect(paper).toHaveAttribute("data-status", "open");
      await expect(paper).not.toHaveAttribute("data-status", "covered");
      expect(await darkFills(page)).toEqual([]);
      await advanceTo(page, "mitnehmen");

      // Scene 8: the briefing names the visit day without its weekday; the kit link is there.
      const briefing = page.locator("[data-w05-briefing]");
      await expect(briefing).toContainText("27");
      expect(await briefing.textContent()).not.toMatch(/\b(Friday|Freitag|Fri|Fr)\b/);
      await expect(page.locator("#mitnehmen a[download]")).toHaveCount(2);

      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("de: arrows walk the path, r and Shift+R restart but keep the own papers", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize(PHONE);
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await walkTo(page, "ordner-eigen");
    await page.locator("[data-w05-own-text]").fill("Vertragsregister");
    await leaveField(page);
    await page.keyboard.press("ArrowLeft");
    await expect(beat(page)).toHaveAttribute("data-beat", "nachtrag");

    // A key typed into a form field never restarts.
    await advanceTo(page, "ordner-eigen");
    await page.locator("[data-w05-own-text]").press("r");
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner-eigen");

    await leaveField(page);
    await page.keyboard.press("r");
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner", { timeout: 10_000 });
    await expect(page.locator('[data-w05-commit="skip"]')).toBeVisible();
    // The guesses are gone after the restart.
    await expect(page.locator("[data-w05-card][data-guess] .glas-chip[aria-pressed='true']")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("de: free play opens the x-ray with every row drawn", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator("[data-demo-explore]").click();
    await expect(page.locator('[data-w05-xray="done"]')).toBeVisible();
    await page.locator('[data-w05-row="L11"]').click();
    await expect(page.locator('[data-w05-lens="L11"]')).toContainText(/schwach/i);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});
