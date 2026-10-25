import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * W03 "Die Fragekarte": the vote, the reveal, the five boxes, the own card
 * with a local download, and the reset that keeps the own card. German and
 * English, phone first, with console errors and off-page requests captured.
 */
const SLUG = "datenbereitschaft-fuer-ki";

function watch(page: Page) {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol === "blob:" || url.protocol === "data:") return;
    if (url.hostname !== "localhost" || request.method() !== "GET" || url.pathname.startsWith("/api/")) {
      requests.push(`${request.method()} ${request.url()}`);
    }
  });
  return { errors, requests };
}

const beat = (page: Page) => page.locator("[data-demo-clock]");
const next = (page: Page) => page.locator("[data-demo-next]").click();

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.locator("[data-demo-stage]")).toBeVisible();
}

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    const n = (value: string) => (locale === "de" ? value : value.replace(/\./g, ","));

    test(`${locale}: vote, reveal, five boxes, own card, reset keeps it`, async ({ page }) => {
      const seen = watch(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, `${prefix}/demos/${SLUG}`);

      // Beat 1: Claude's answer, then a vote moves on to the reveal.
      await expect(page.locator("[data-fk-answer]")).toContainText(n("75.890"));
      await page.locator('[data-fk-vote="ask"]').click();
      await expect(beat(page)).toHaveAttribute("data-beat", "lesarten");
      await expect(page.locator("[data-fk-feedback]")).toContainText(locale === "de" ? "nachgefragt" : "asked");

      // The reveal ends on reading 4, the levels; the slider walks the other readings.
      const slider = page.locator("[data-fk-slider]");
      await expect(slider).toBeEnabled({ timeout: 6000 });
      await expect(page.locator(".fk-chart")).toHaveAttribute("data-fk-reading", "3");
      await expect(page.locator(".fk-chart-figures")).toContainText(n("334.675"));
      await slider.focus();
      await page.keyboard.press("Home");
      await expect(page.locator(".fk-chart")).toHaveAttribute("data-fk-reading", "0");
      await page.keyboard.press("End");
      await expect(page.locator(".fk-chart")).toHaveAttribute("data-fk-reading", "3");

      // Box 2: seven export tables fold into the approved view.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "sicht");
      await expect(page.locator("[data-fk-tiles] .fk-tile")).toHaveCount(7);
      await page.locator('[data-fk-seg="fk-view"] input[value="view"]').check({ force: true });
      await expect(page.locator("[data-fk-view]")).toContainText(n("334.675"));

      // Box 3: who counts, on 144 accounts.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "wer-zaehlt");
      await page.locator('[data-fk-seg="fk-who"] input[value="active"]').check({ force: true });
      await expect(page.locator("[data-fk-count]")).toHaveAttribute("data-fk-count", "0");
      await page.locator('[data-fk-seg="fk-who"] input[value="AN"]').check({ force: true });
      await expect(page.locator("[data-fk-count]")).toHaveText(locale === "de" ? "132 von 144" : "132 of 144");

      // Box 4: only a grant locks.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "grenze");
      await expect(page.locator("[data-fk-outcome]")).toHaveAttribute("data-fk-outcome", "guidedOnly");
      await page.locator('[data-fk-seg="fk-boundary"] input[value="grant"]').check({ force: true });
      await expect(page.locator("[data-fk-outcome]")).toHaveAttribute("data-fk-outcome", "denied42501");

      // Box 5: the test grades the four readings; only the levels pass.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "test");
      await page.locator("[data-fk-run]").click();
      await expect(page.locator('.fk-grades .fk-grade[data-pass="true"]')).toHaveCount(1, { timeout: 4000 });
      await expect(page.locator('.fk-grades .fk-grade[data-pass="false"]')).toHaveCount(3);
      await expect(page.locator("[data-fk-feedback]")).toContainText(locale === "de" ? "Nachfragen" : "Ask back");

      // The own card: a preset fills it, the skill zip is made on the device.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "deine-karte");
      await expect(page.locator("[data-fk-download='skill']")).toBeDisabled();
      await page.locator("[data-fk-preset]").selectOption("foldline");
      await expect(page.locator("[data-fk-own-preview]")).toHaveAttribute("data-fk-own-preview", "ready");
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-fk-download='skill']").click()]);
      expect(download.suggestedFilename()).toBe("kennzahl-fragekarte.zip");
      const path = await download.path();
      expect(readFileSync(path).subarray(0, 2).toString("latin1")).toBe("PK");

      // r resets the bets and the clock, never the own card.
      await page.locator("body").press("r");
      await expect(beat(page)).toHaveAttribute("data-beat", "antwort", { timeout: 4000 });
      await page.locator('[data-beat-rail]:visible [data-beat-mark="deine-karte"]').click();
      await expect(page.locator("[data-fk-own-preview]")).toHaveAttribute("data-fk-own-preview", "ready");
      await page.locator("[data-fk-clear]").click();
      await expect(page.locator("[data-fk-own-preview]")).toHaveAttribute("data-fk-own-preview", "open");

      expect(seen.errors).toEqual([]);
      expect(seen.requests).toEqual([]);
    });
  }

  test("Shift+R resets, a key typed in the card does not", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=deine-karte`);
    await expect(beat(page)).toHaveAttribute("data-beat", "deine-karte");
    const metric = page.locator(".fk-own-form input[name='metric']");
    // The card is a controlled input: type until the value holds (a busy runner can hydrate late).
    await expect(async () => {
      await metric.fill("Offene Tickets");
      await expect(metric).toHaveValue("Offene Tickets", { timeout: 500 });
    }).toPass({ timeout: 8000 });
    await metric.press("r");
    await expect(metric).toHaveValue("Offene Ticketsr");
    await expect(beat(page)).toHaveAttribute("data-beat", "deine-karte");
    await metric.blur();
    await page.keyboard.press("Shift+R");
    await expect(beat(page)).toHaveAttribute("data-beat", "antwort", { timeout: 4000 });
    await page.locator('[data-beat-rail]:visible [data-beat-mark="deine-karte"]').click();
    await expect(page.locator(".fk-own-form input[name='metric']")).toHaveValue("Offene Ticketsr");
  });

  test("reduced motion shows the levels at once, and ?beat=test lands on box 5", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, `/demos/${SLUG}`);
    await page.locator('[data-fk-vote="take"]').click();
    await expect(page.locator("[data-fk-slider]")).toBeEnabled();
    await expect(page.locator(".fk-chart-figures")).toContainText("334.675");
    await open(page, `/demos/${SLUG}?beat=test`);
    await expect(beat(page)).toHaveAttribute("data-beat", "test");
    await expect(page.locator("[data-fk-run]")).toBeVisible();
  });

  test("the first screen holds the stage and the vote at 390 x 664", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await open(page, `/demos/${SLUG}`);
    const votes = await page.locator(".fk-vote-row").boundingBox();
    expect((votes?.y ?? 9999) + (votes?.height ?? 0)).toBeLessThanOrEqual(664);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
