import { expect, test, type Page } from "@playwright/test";
import { DEMOS_PAGE_COPY } from "../../src/lib/demos-ui-copy";
import { expectGlasBudget } from "./fixtures/glas-budget";

/**
 * "Die Fehlerliste" (workshop 01) on the v4 shell: the intro fits a small
 * phone, the visitor builds the baseline by dragging the sales line one week
 * and lands on the kit's 92,6 %, the canteen switch moves the order quantity
 * to the kit's numbers, R starts over, and the Claude scene replays the
 * recorded runs with and without the skill, follow-up included. Reduced
 * motion shows each end frame at once, so no assertion waits for an animation.
 */
const PATH = "/demos/ki-prognosen-einschaetzen";
const SCENE = DEMOS_PAGE_COPY.de.claudeScene;

async function open(page: Page, query = "") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${PATH}${query}`, { waitUntil: "networkidle" });
  await expect(page.locator("[data-demo-stage]")).toBeVisible();
}

const clock = (page: Page) => page.locator("[data-demo-clock]");
const caption = (page: Page) => page.locator("[data-demo-caption]");

/** A press before hydration is lost (the button is server-rendered), so press until the guided phase runs. */
async function start(page: Page) {
  await expect(async () => {
    await page.locator("[data-demo-start]").click({ timeout: 1000 });
    await expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

test.describe("Die Fehlerliste", () => {
  test("the intro and its start button fit a 390 × 664 phone without scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await open(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const intro = page.locator("[data-demo-intro]");
    await expect(intro).toBeVisible();
    await expect(intro).toContainText("Ein erfundener Suppenhersteller");
    const box = await page.locator("[data-demo-start]").boundingBox();
    expect(box, "start button").not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(656);
    await expectGlasBudget(page, `${PATH} intro`);
  });

  test("on a 390 × 664 phone every caption shows all its words, without scrolling inside", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    for (const beat of ["", "?beat=fehlerliste", "?beat=spanne", "?beat=planzahl", "?beat=pruefregel"]) {
      await open(page, beat);
      if (!beat) await start(page);
      const text = caption(page).locator("[data-w01-caption]");
      await expect(text).toBeVisible();
      const fit = await text.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { inside: element.scrollHeight <= element.clientHeight + 1, top: box.top, bottom: box.bottom, words: element.textContent?.length ?? 0 };
      });
      expect(fit.words, `${beat || "messlatte"}: caption has words`).toBeGreaterThan(40);
      expect(fit.inside, `${beat || "messlatte"}: caption scrolls inside`).toBe(true);
      expect(fit.top, `${beat || "messlatte"}: caption top`).toBeGreaterThanOrEqual(0);
      expect(fit.bottom, `${beat || "messlatte"}: caption bottom`).toBeLessThanOrEqual(664);
    }
  });

  test("a tap on a lamp puts its question under the lamp row", async ({ page }) => {
    await open(page, "?beat=pruefregel");
    await expect(clock(page)).toHaveAttribute("data-beat", "pruefregel");
    const lamp = page.locator('[data-w01-lamp="bias"]');
    await expect(async () => {
      await lamp.click({ timeout: 1000 });
      await expect(lamp).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.locator("[data-w01-lamp-line]")).toContainText("Die Prognose lag in den letzten 13 Wochen");
    await lamp.click();
    await expect(lamp).toHaveAttribute("aria-pressed", "false");
  });

  test("dragging the sales line one week builds the rule and snaps to 92,6 %", async ({ page }) => {
    await open(page);
    await start(page);
    await expect(clock(page)).toHaveAttribute("data-beat", "messlatte");
    await expect(page.locator("[data-demo-data]")).toContainText("Erfundener Fall");
    await page.locator("[data-w01-lock]").click();

    const grip = page.getByRole("slider", { name: "Kopie der Absatzlinie, nach rechts verschieben" });
    await expect(grip).toBeVisible();
    // The plot grows once the dock gives up the guess controls, which moves the grip: drag again until it lands.
    await expect(async () => {
      const box = await grip.boundingBox();
      expect(box, "grip").not.toBeNull();
      const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
      const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 30, y, { steps: 4 });
      await page.mouse.move(x + 120, y, { steps: 4 });
      await page.mouse.up();
      await expect(page.locator("[data-demo-data]")).toContainText("Die Regel ‚wie letzte Woche‘ erreicht 92,6 %", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(caption(page)).toContainText("92,6 %");
    await expectGlasBudget(page, `${PATH} baseline done`);

    // ArrowRight on the page goes to the next scene; R starts over at the guess.
    await page.locator("body").press("ArrowRight");
    await expect(clock(page)).toHaveAttribute("data-beat", "fehlerliste");
    await page.locator("body").press("r");
    await expect(clock(page)).toHaveAttribute("data-beat", "messlatte");
    await expect(page.locator("[data-w01-lock]")).toBeVisible();
  });

  test("the canteen switch moves the order quantity to the kit's 729", async ({ page }) => {
    await open(page, "?beat=planzahl");
    await expect(clock(page)).toHaveAttribute("data-beat", "planzahl");
    const toggle = page.getByRole("switch", { name: "Die Kantine holt übrige Gläser ab" });
    await expect(async () => {
      await toggle.click({ timeout: 1000 });
      await expect(toggle).toHaveAttribute("aria-checked", "false", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(caption(page)).toContainText("728 Gläsern");
    await expect(caption(page)).toContainText("729");
    await toggle.click();
    await expect(caption(page)).toContainText("748 Gläsern");
    await expectGlasBudget(page, `${PATH} order quantity`);
  });

  test("the Claude scene plays a recorded run, switches to the run without the skill, and plays the follow-up", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    const section = page.locator("[data-claude-scene-section]");
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(SCENE.heading);
    await expect(section).toContainText("Darstellung");
    const answers = section.locator(".cds-chat .cds-answer");
    await expect(answers).toHaveCount(0);

    await expect(async () => {
      await section.locator("[data-scene-play]").click({ timeout: 1000 });
      await expect(answers.first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    const withSkill = (await answers.first().textContent()) ?? "";

    await section.getByRole("radio", { name: SCENE.withoutSkill }).click();
    await expect(answers).toHaveCount(0);
    await section.locator("[data-scene-play]").click();
    await expect(answers.first()).toBeVisible();
    expect((await answers.first().textContent()) ?? "").not.toBe(withSkill);

    await section.getByRole("radio", { name: SCENE.withSkill }).click();
    await section.locator("[data-scene-play]").click();
    await expect(answers.first()).toBeVisible();
    // On a wide window the rule file Claude wrote opens beside the chat.
    if ((page.viewportSize()?.width ?? 0) >= 900) {
      await expect(section.getByRole("complementary", { name: `${SCENE.file}: pruefregel-linsensuppe.md` })).toBeVisible();
    }
    await section.locator("[data-scene-follow-up]").click();
    await expect(section.locator(".cds-chat")).toContainText("Kantine");
    await expectGlasBudget(page, `${PATH} Claude scene`);
  });
});
