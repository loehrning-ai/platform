import { expect, test, type Page } from "@playwright/test";

/** W04 "Elf von zwölf": the core loop on a phone, German and English, with console errors captured. */
const SLUG = "esg-berichte-mit-ki";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    // the motion library warns once under reduced motion: harmless, not ours
    if (message.type() === "error" && !/reduced motion/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function dragSlot(page: Page, mwh: number) {
  const box = await page.locator(".esg-slot").boundingBox();
  if (!box) throw new Error("slot not found");
  const x = box.x + box.width / 2;
  // plot geometry of month-chart.tsx: baseline 144, top 8, view height 150, axis 0..45 MWh
  const yOf = (value: number) => box.y + box.height * ((144 - value * (136 / 45)) / 150);
  const y = yOf(mwh);
  await page.mouse.move(x, yOf(21)); // the idle handle: a press on it grabs it
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    test(`${locale}: guess, open the bill, take the lines away, at 390px`, async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
      const errors = collectErrors(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      const root = page.locator("[data-esg-root]");
      await root.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);

      const number = page.locator(".esg-field__num");
      await expect(number).toHaveText(locale === "de" ? "279,7" : "279.7");
      await expect(page.locator(".esg-pill")).toHaveText("NOT FOUND");

      await dragSlot(page, 30);
      const slot = page.locator(".esg-slot");
      const guessed = Number(await slot.getAttribute("aria-valuenow"));
      expect(guessed).toBeGreaterThan(25);
      expect(guessed).toBeLessThan(35);
      await expect(page.locator(".esg-pill")).toHaveText("NEEDS CHECK");
      // the coverage does not move with a guess
      await expect(page.locator(".esg-count")).toHaveText("11/12");

      // keyboard: arrows move the guess by 0.5
      await slot.focus();
      await page.keyboard.press("ArrowUp");
      expect(Number(await slot.getAttribute("aria-valuenow"))).toBeCloseTo(guessed + 0.5, 5);

      await expect(page.locator(".esg-verdict__text")).toHaveText(locale === "de" ? /nicht den Beleg/ : /not the evidence/);
      await page.locator(".esg-reveal .esg-btn").click();
      await expect(number).toHaveText(locale === "de" ? "320,9" : "320.9", { timeout: 4000 });
      await expect(page.locator(".esg-pill")).toHaveText("OK");
      // the stale line is gone, the button says what it does, the lines say what they describe
      await expect(page.locator(".esg-verdict__text")).toHaveCount(0);
      await expect(page.locator("#esg-locked")).toHaveCount(0);
      // the lines default to the folder as it was; the 12 of 12 variant is the second view
      await expect(page.locator("[data-take-tag]")).toContainText("11");
      await expect(page.locator("[data-take=answer]")).toContainText("NOT FOUND");
      await expect(page.locator('[data-take="mail"] .esg-btn')).toBeEnabled();
      await page.getByRole("radio", { name: locale === "de" ? "Mit Rechnung" : "With the bill" }).check({ force: true });
      await expect(page.locator("[data-take=answer]")).toContainText(locale === "de" ? "12 von 12" : "12 of 12");
      await page.getByRole("radio", { name: locale === "de" ? "Vor dem Öffnen" : "Before opening" }).check({ force: true });
      await expect(page.locator(".esg-ladder__row")).toHaveCount(5);
      // the ladder sits right under the stage, in view after the bill landed (phone) or beside the chart (desktop)
      const ladderBox = await page.locator(".esg-ladder").boundingBox();
      expect(ladderBox?.y ?? 9999).toBeLessThan(844);
      await expect(slot).toHaveAttribute("aria-readonly", "true");

      // scrub back with the slider: the guess unlocks
      await page.locator(".esg-reveal input[type=range]").fill("0");
      await expect(number).toHaveText(/^3[01]\d[.,]\d$/);
      await expect(slot).not.toHaveAttribute("aria-readonly", "true");

      // takeaways: shown in full, copy gives feedback; a guess changed none of them
      const answer = page.locator('[data-take="answer"]');
      await expect(answer).toContainText("NOT FOUND");
      await expect(answer).not.toContainText(/Gesamtjahr|full year/);
      await answer.getByRole("button").click();
      await expect(answer.locator(".esg-block__done")).not.toBeEmpty();
      await page.getByRole("radio", { name: /X ~ _/ }).check({ force: true });
      await expect(answer).toContainText("XXXXXXXX_XXX");

      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    test(`${locale}: water says yes, own numbers read a paste, nothing is sent`, async ({ page }) => {
      const errors = collectErrors(page);
      const requests: string[] = [];
      page.on("request", (request) => {
        if (request.method() !== "GET") requests.push(`${request.method()} ${request.url()}`);
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      await page.locator("[data-esg-root]").scrollIntoViewIfNeeded();

      await page.locator(".esg-seg__item", { hasText: locale === "de" ? "Wasser" : "Water" }).first().click();
      await expect(page.locator(".esg-pill")).toHaveText("OK");
      await expect(page.locator(".esg-field__num")).toHaveText(locale === "de" ? "4.630" : "4,630");
      await expect(page.locator('[data-take="mail"] .esg-btn')).toBeDisabled();

      await page.locator(".esg-seg__item", { hasText: locale === "de" ? "Meine" : "My" }).first().click();
      await page.locator(".esg-own__text").fill(locale === "de"
        ? "Jan 21.400\nFeb 19.800\nMär 20.600\nApr 19.200\nOkt 38.700\nquatsch"
        : "Jan 21,400\nFeb 19,800\nMar 20,600\nApr 19,200\nOct 38,700\nnonsense");
      await expect(page.locator(".esg-pill")).toHaveText("NOT FOUND");
      await expect(page.locator(".esg-count")).toHaveText("5/12");
      await expect(page.locator(".esg-issue--unread")).toHaveCount(1);
      await expect(page.locator('[data-take="answer"]')).toContainText(locale === "de" ? "Es fehlen:" : "Missing:");
      expect(await overflow(page)).toBeLessThanOrEqual(0);

      await page.locator(".esg-own__row--buttons .esg-btn").first().click();
      await expect(page.locator(".esg-count")).toHaveText("11/12");
      expect(requests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test("the reveal button is fully above the tab bar on the first screen at 360x740, and it waits for a guess", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const button = page.locator(".esg-reveal .esg-btn");
    const box = await button.boundingBox();
    expect((box?.y ?? 9999) + (box?.height ?? 0)).toBeLessThanOrEqual(740 - 56);
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await button.click({ force: true });
    await expect(page.locator(".esg-field__num")).toHaveText("279,7");
    await expect(page.locator(".esg-reveal input[type=range]")).toHaveCount(0);
  });

  test("own numbers: the example button and the result are on the first screens at 360x740", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".esg-seg__item", { hasText: "Meine" }).first().click();
    const example = await page.getByRole("button", { name: "Beispiel einsetzen" }).boundingBox();
    expect((example?.y ?? 9999) + (example?.height ?? 0)).toBeLessThanOrEqual(740 - 56);
    await page.getByRole("button", { name: "Beispiel einsetzen" }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const plot = await page.locator(".esg-plot").boundingBox();
    const area = await page.locator(".esg-own__text").boundingBox();
    expect((plot?.y ?? 9999) + (plot?.height ?? 0)).toBeLessThan(740 - 56);
    expect(plot?.y ?? 0).toBeLessThan(area?.y ?? 0);
    await expect(page.locator('[data-take="answer"]')).toContainText("Stromverbrauch 2025: mindestens");
  });

  test("the payoff plays where the visitor can see it, at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    const stage = page.locator(".esg-stage");
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await dragSlot(page, 30);
    // number, bars and the button are one unit that fits the screen
    const box = await stage.boundingBox();
    expect(box?.height ?? 9999).toBeLessThan(740 - 64);
    await page.evaluate(() => window.scrollBy(0, 300)); // chart now above the fold
    await page.locator(".esg-reveal .esg-btn").click();
    await page.waitForTimeout(900);
    const plot = await page.locator(".esg-plot").boundingBox();
    expect(plot).not.toBeNull();
    expect((plot?.y ?? -999) + (plot?.height ?? 0)).toBeGreaterThan(40);
    expect(plot?.y ?? 9999).toBeLessThan(740 - 150);
  });

  test("the first screen of a phone already shows the stamp and the slot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const stamp = await page.locator(".esg-stamp").boundingBox();
    const slot = await page.locator(".esg-slot").boundingBox();
    expect((stamp?.y ?? 9999) + (stamp?.height ?? 0)).toBeLessThan(844 - 64);
    expect(slot?.y ?? 9999).toBeLessThan(844 - 64 - 60);
  });

  test("reduced motion shows the end state and the bill still opens", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator("[data-esg-root]").scrollIntoViewIfNeeded();
    await expect(page.locator(".esg-field__num")).toHaveText("279,7");
    await page.locator(".esg-slot").focus();
    await page.keyboard.press("PageUp");
    await page.locator(".esg-reveal .esg-btn").click();
    await expect(page.locator(".esg-field__num")).toHaveText("320,9", { timeout: 500 });
    await context.close();
  });

  test("desktop 1440x900: the reveal button is on the first screen, the lesson waits behind the Leiter slot", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const button = await page.locator(".esg-reveal .esg-btn").boundingBox();
    expect(button && button.y + button.height <= 900).toBe(true);
    // the placeholder ladder holds the right column; the takeaways start below it
    await expect(page.locator(".esg-ladder--pending")).toBeVisible();
    const take = await page.locator(".esg-take").boundingBox();
    expect(take && take.y > 900).toBe(true);
  });

  test("the dataset switch takes a click on the label text, and the Leiter's bars are far apart after the reveal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".esg-seg__item span", { hasText: "Wasser 2025" }).click({ timeout: 3000 });
    await expect(page.locator(".esg-pill")).toHaveText("OK");
    await page.locator(".esg-seg__item span", { hasText: "Strom 2025" }).first().click({ timeout: 3000 });
    await dragSlot(page, 30);
    await page.locator(".esg-reveal .esg-btn").click();
    await page.waitForTimeout(2800);
    await expect(page.locator('[role="status"]', { hasText: /geöffnet/ }).first()).toBeAttached();
    const widths = await page.locator(".esg-ladder__row .esg-ladder__fill").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
    const track = (await page.locator(".esg-ladder__bar").first().boundingBox())?.width ?? 1;
    expect((Math.max(...widths) - Math.min(...widths)) / track).toBeGreaterThan(0.5);
  });

  test("own numbers: a unit slip is fixed from the hero line, not from the bottom of the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator(".esg-seg__item span", { hasText: "Meine Zahlen" }).click();
    await page.locator("textarea").fill("Jan 21.400\nFeb 19,8\nMär 20,6\nApr 19,2\nMai 22,5\nJun 26,8\nJul 30,4\nAug 32,1\nOkt 38,7\nNov 25,3\nDez 22,9");
    const chip = page.locator(".esg-field__flip");
    const box = await chip.boundingBox();
    expect(box && box.y + box.height < 844).toBe(true);
    await chip.click();
    await expect(page.locator(".esg-field__num")).toHaveText("279,7");
  });
});
