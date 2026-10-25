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

      // Beat 1: the question leads on a phone, then Claude's answer; a vote moves on to the reveal.
      await expect(page.locator("[data-fk-ask]")).toBeVisible();
      await expect(page.locator("[data-fk-answer]")).toContainText(n("75.890"));
      await page.locator('[data-fk-vote="ask"]').click();
      await expect(beat(page)).toHaveAttribute("data-beat", "lesarten");
      await expect(page.locator("[data-fk-feedback]")).toContainText(locale === "de" ? "nachgefragt" : "asked");

      // The reveal ends on reading 4, the levels; the slider walks the other readings.
      const slider = page.locator("[data-fk-slider]");
      await expect(slider).toBeEnabled({ timeout: 6000 });
      await expect(page.locator(".fk-chart")).toHaveAttribute("data-fk-reading", "3");
      await expect(page.locator(".fk-chart-figures")).toContainText(n("334.675"));
      // The opening level is printed inside the hollow block, and the caption says the table is right now.
      await expect(page.locator(".fk-chart-open").first()).toHaveText(n("258.785"));
      await expect(page.locator("[data-demo-caption]")).toContainText(locale === "de" ? "Monatsabschluss stimmt die Tabelle" : "month-end close, the table is right");
      await slider.focus();
      await page.keyboard.press("Home");
      await expect(page.locator(".fk-chart")).toHaveAttribute("data-fk-reading", "0");
      await page.keyboard.press("End");
      await expect(page.locator(".fk-chart")).toHaveAttribute("data-fk-reading", "3");

      // Box 1: the vague question expects a question back; only the exact one fills square 1.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "sicht");
      await expect(page.locator("[data-fk-question]")).toHaveAttribute("data-fk-question", "vague");
      await expect(page.locator("[data-fk-question]")).toContainText("C01");
      await expect(page.locator(".fk-box-sq").first()).not.toHaveAttribute("data-done", "");
      await page.locator('[data-fk-seg="fk-question"] input[value="exact"]').check({ force: true });
      await expect(page.locator(".fk-box-sq").first()).toHaveAttribute("data-done", "");

      // Box 2: seven export tables fold into the approved view.
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

      // Box 5: the behaviour cases say they are rehearsal runs before any click; the test grades the four readings.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "test");
      await expect(page.locator("[data-fk-rehearsed]")).toHaveCount(3);
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

      // The last screen states the objective the kit opens with.
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "mitnehmen");
      await expect(page.locator("[data-fk-objective]")).toContainText(locale === "de" ? "fünf Kästchen" : "five boxes");

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

  test("the own card takes what people type first and writes it exactly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, `/demos/${SLUG}?beat=deine-karte`);
    const form = page.locator(".fk-own-form");
    const fill = async (name: string, value: string) => {
      const field = form.locator(`[name='${name}']`);
      await expect(async () => {
        await field.fill(value);
        await expect(field).toHaveValue(value, { timeout: 500 });
      }).toPass({ timeout: 8000 });
    };
    await fill("metric", "Offene Posten Debitoren");
    await fill("question", "Offene Posten Debitoren je Monatsende, Juli bis September 2026, in EUR.");
    await fill("clock", "01.10.2026");
    await fill("view", "OP-Liste (Export).xlsx");
    await fill("column", "Betrag#offen");
    await form.locator("fieldset.fk-choice").first().locator("input[value='level']").check({ force: true });
    await fill("who", "Alle offenen Rechnungen am Monatsende, Gutschriften abgezogen.");
    await fill("never", "Kundennamen, Bankverbindungen");
    await form.locator("fieldset.fk-choice").nth(1).locator("input[value='file']").check({ force: true });
    await fill("expected", "1.234.567,89 / 1.198.000 / 1.305.442,10");
    await fill("unit", "EUR");
    await fill("source", "Saldenliste Buchhaltung");
    // A bad optional column is a hint, never a block.
    await expect(form.locator("[name='column'] ~ .fk-error")).toBeVisible();
    await expect(page.locator("[data-fk-blocked]")).toHaveCount(0);
    await expect(page.locator("[data-fk-own-preview]")).toHaveAttribute("data-fk-own-preview", "ready");
    await expect(page.locator(".fk-downloads")).not.toContainText(" · nicht hoch");
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-fk-download='checklist']").click()]);
    expect(download.suggestedFilename()).toBe("pruefliste.md");
    const text = readFileSync(await download.path(), "utf8");
    expect(text).toContain("1.234.567,89 / 1.198.000 / 1.305.442,10 EUR");
    expect(text).toContain("Stichtag: 2026-10-01.");
    expect(text).toContain("| T2 | Zeig mir Offene Posten Debitoren. |");
    const [definitions] = await Promise.all([page.waitForEvent("download"), page.locator("[data-fk-download='definitions']").click()]);
    expect(definitions.suggestedFilename()).toBe("kennzahlen.md");
    expect(readFileSync(await definitions.path(), "utf8")).toContain("- Quelle: OP-Liste (Export).xlsx\n");
  });

  test("a key reset brings a scrolled-away stage back into view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await open(page, `/demos/${SLUG}?beat=deine-karte`);
    await page.locator("[data-fk-downloads]").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
    await page.locator("body").press("r");
    await expect(beat(page)).toHaveAttribute("data-beat", "antwort", { timeout: 4000 });
    await expect(page.locator("[data-demo-stage]")).toBeInViewport({ timeout: 4000 });
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
