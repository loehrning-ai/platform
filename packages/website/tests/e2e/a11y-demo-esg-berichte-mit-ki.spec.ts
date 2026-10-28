import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility of W04 in the depicted Claude app: axe WCAG 2.2 AA on the
 * stage in each kind of state (a prompt waiting, an answer with the check
 * beside it, our card over the window, the install walkthrough), and the
 * keyboard path through one step without a pointer. The chrome of the app
 * that does nothing in the demo is hidden from assistive technology, and
 * Start moves the keyboard to the send arrow.
 */
const PATH = "/demos/esg-berichte-mit-ki";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const clock = (page: Page) => page.locator("[data-demo-clock]");

async function scanStage(page: Page, where: string) {
  // Let the window's entrance motion settle so axe samples final colours.
  await page.waitForTimeout(700);
  // The step dots belong to the shared demo shell (the same 22 px dots in every
  // compact dock); this spec owns what W04 draws, not the shell's dock.
  const result = await new AxeBuilder({ page }).include("[data-demo-stage]").exclude(".glas-weg-dots").withTags(TAGS).analyze();
  expect(
    result.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`),
    where,
  ).toEqual([]);
}

async function openBeat(page: Page, beat: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${PATH}?beat=${beat}`, { waitUntil: "networkidle" });
  await expect(clock(page)).toHaveAttribute("data-beat", beat);
}

test.describe(`${PATH} accessibility`, () => {
  test("a prompt waiting, then the answer with its check, pass axe", async ({ page }) => {
    await openBeat(page, "schritt-1");
    await expect(page.locator("[data-w4a-send]")).toBeEnabled();
    await scanStage(page, "step 1 before sending");
    await expect(async () => {
      await page.locator("[data-w4a-send]").click();
      await expect(page.locator('[data-w4a-turn="schritt-1"]')).toHaveAttribute("data-phase", "done", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await scanStage(page, "step 1 answered");
  });

  test("the register, the measurement, the install walkthrough and the take-home pass axe", async ({ page }) => {
    await openBeat(page, "schritt-4");
    await expect(async () => {
      await page.locator("[data-w4a-send]").click();
      await expect(page.locator('[data-w4a-turn="schritt-4"]')).toHaveAttribute("data-phase", "done", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await scanStage(page, "step 4 with the register");
    await openBeat(page, "gemessen");
    await scanStage(page, "the measurement");
    await openBeat(page, "dein-claude");
    await scanStage(page, "install step 1");
    await openBeat(page, "mitnehmen");
    await scanStage(page, "the take-home on the light card");
  });

  test("Start hands the keyboard to the send arrow; Customize is the sidebar's one live control", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await expect(async () => {
      await page.locator("[data-demo-start]").click();
      await expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.locator("[data-w4a-send]")).toBeFocused();
    const customize = page.locator("[data-w4a-customize]");
    if (await customize.isVisible()) {
      await customize.focus();
      await page.keyboard.press("Enter");
      await expect(clock(page)).toHaveAttribute("data-beat", "dein-claude");
    }
  });

  test("one step by keyboard alone: send, show the whole answer, open a cited file", async ({ page }) => {
    await openBeat(page, "schritt-2");
    const send = page.locator("[data-w4a-send]");
    await expect(async () => {
      await send.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator('[data-w4a-turn="schritt-2"]')).toHaveAttribute("data-phase", "done", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    const cite = page.locator('[data-w4a-turn="schritt-2"] [data-w4a-cite]').first();
    await cite.focus();
    await expect(cite).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-w4a-fileview]")).toBeVisible();
    // The decorative chrome of the depicted app is not announced.
    for (const selector of [".w4a-lights", ".w4a-side-nav span.w4a-nav", ".w4a-side-scroll", ".w4a-composer-row .w4a-tool"]) {
      // On the phone the sidebar is not drawn at all; every copy that is drawn is hidden.
      const hidden = await page.locator(selector).evaluateAll((elements) => elements.every((element) => element.closest("[aria-hidden='true']") !== null));
      expect(hidden, `${selector} is aria-hidden`).toBe(true);
    }
  });
});

test.describe(`${PATH} accessibility on a 390 x 664 phone`, () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test("the answer as row cards, then the check sheet with a part being connected, pass axe", async ({ page }) => {
    await openBeat(page, "schritt-1");
    await expect(async () => {
      await page.locator("[data-w4a-send]").click();
      await expect(page.locator('[data-w4a-turn="schritt-1"]')).toHaveAttribute("data-phase", "done", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.locator('[data-w4a-turn="schritt-1"] [data-w4a-table][data-layout="cards"]').first()).toBeVisible();
    await scanStage(page, "phone: step 1 answer as cards");
    await openBeat(page, "schritt-2");
    await expect(async () => {
      await page.locator("[data-w4a-send]").click();
      await expect(page.locator('[data-w4a-turn="schritt-2"]')).toHaveAttribute("data-phase", "done", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await page.locator("[data-w4a-capline]").click();
    await page.locator('[data-w4-handle="zertifiziert"]').click();
    await page.waitForTimeout(700);
    // The sheet lives in the Glas portal, outside the stage.
    const result = await new AxeBuilder({ page }).include("[data-glas-portal]").withTags(TAGS).analyze();
    expect(
      result.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`),
      "phone: the step 2 sheet while picking a line",
    ).toEqual([]);
  });
});
