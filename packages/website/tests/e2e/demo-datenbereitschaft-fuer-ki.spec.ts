import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { expectGlasBudget } from "./fixtures/glas-budget";

/**
 * W03 "Die Fragekarte" on the v4 shell: the intro, Claude's table sent on,
 * the tub (water line, then the file edge), the question and the approved
 * view, who counts, the Project sort and the test, the own card from a kit
 * example with a local download, and the reset that keeps the own card.
 * German and English, phone first, with console errors and off-page
 * requests captured. One old kit link (?beat=test) and one new one.
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
const caption = (page: Page) => page.locator("[data-w03-caption]").first();
const next = (page: Page) => page.locator("[data-demo-next]").click();

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.locator("[data-demo-stage]")).toBeVisible();
}

/** The first press after hydration: retried until the shell takes it (a busy runner hydrates late). */
async function start(page: Page) {
  await expect(async () => {
    await page.locator("[data-demo-start]").click({ timeout: 1000 });
    await expect(page.locator("[data-demo-intro]")).toHaveCount(0, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    const n = (value: string) => (locale === "de" ? value : value.replace(/\./g, ","));
    const de = locale === "de";

    test(`${locale}: the guided path fills the five boxes, the own card stays after r`, async ({ page }) => {
      // Nine moves on one page: a dev server compiles each scene on first use.
      test.setTimeout(120_000);
      const seen = watch(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, `${prefix}/demos/${SLUG}`);

      // The intro names what the demo does, then the start.
      await expect(page.locator("[data-demo-intro-body]")).toContainText(de ? "erfundenen Abo-Firma" : "invented subscription company");
      await start(page);
      await expectGlasBudget(page, "scene 1");

      // Scene 1: Claude's table, run 2 with the quoted caveat; it goes back to Claude.
      await expect(page.locator("[data-w03-answer-card]")).toContainText(n("75.890"));
      await expect(page.locator("[data-w03-answer-card] blockquote")).toContainText("MRR added since 1 Jan 2026, not total MRR");
      await page.locator('[data-w03-send="ask"]').click();
      await expect(page.locator('[data-w03-stamp="ask"]')).toBeVisible();
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "wanne");

      // Scene 2 move 1: the water line by keyboard; Claude's table is the empty tub.
      const water = page.getByRole("slider", { name: de ? "Anfangsstand Ende Dezember 2025" : "Opening level at end of December 2025" });
      await water.focus();
      await water.press("PageUp");
      await water.press("PageUp");
      await expect(water).toHaveAttribute("aria-valuenow", "100000");
      await expect(caption(page)).toContainText(n("100.000"));
      await water.press("Home");
      await expect(caption(page)).toContainText(n("75.890"));
      await water.press("PageUp");
      await next(page);
      // Move 2: the file edge back to January 2025 gives the opening of the approved view.
      const edge = page.getByRole("slider", { name: de ? "Anfang der Datei" : "Start of the file" });
      await edge.focus();
      await edge.press("End");
      await expect(caption(page)).toContainText(n("258.785"));
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "sicht");

      // Scene 3: the four right chips by tap, then the approved view into box 2.
      for (const chip of ["kindRight", "periodRight", "unit", "dateRight"]) await page.locator(`[data-w03-chip="${chip}"]`).click();
      await expect(page.locator(".w03-ring[data-fill='full']")).toHaveCount(4);
      await next(page);
      await page.locator('[data-w03-tile="billing_events"]').click();
      await expect(page.locator('[data-w03-bounce="billing_events"]')).toBeVisible();
      await page.locator('[data-w03-tile="view"]').click();
      await expect(page.locator("[data-w03-view-card]")).toContainText(n("334.675"));
      await expect(page.locator("[data-w03-answer]")).toContainText(n("334.675"));
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "wer-zaehlt");

      // Scene 4: stacking levels overflows the tub, June alone is the quarter's level.
      await page.locator('[data-w03-pour="levels"]').click();
      await expect(caption(page)).toContainText(n("1.066.140"));
      await page.locator('[data-w03-pour="june"]').click();
      await expect(caption(page)).toContainText(n("387.015"));
      await next(page);
      await page.locator("[data-w03-search]").click();
      await expect(page.locator("[data-w03-counter]")).toContainText(de ? "0 von 144" : "0 of 144");
      await page.locator('[data-w03-rule="A"]').click();
      await page.locator('[data-w03-rule="N"]').click();
      await expect(page.locator("[data-w03-counter]")).toHaveText(de ? "132 von 144 Konten" : "132 of 144 accounts");
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "projekt");

      // Scene 5: sort by tap (file, then side); the contacts land in the Project first and glide out.
      const place = async (file: string, side: "in" | "out") => {
        await page.locator(`[data-w03-file="${file}"]`).click();
        await page.locator(`[data-w03-place="${side}"]`).click();
      };
      await place("contacts", "in");
      await expect(page.locator('[data-w03-zone="out"] [data-w03-file="contacts"]')).toBeVisible({ timeout: 4000 });
      await place("view", "in");
      await place("definitions", "in");
      await place("instructions", "in");
      await place("export", "out");
      await place("testlist", "out");
      await next(page);
      await page.locator("[data-w03-test]").click();
      await expect(page.locator("[data-w03-test-card]")).toContainText(n("334.675"));
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.locator("[data-w03-sheet-next]").click();
      await expect(beat(page)).toHaveAttribute("data-beat", "deine-karte");

      // The own card: a kit example fills it, the skill zip is made on the device.
      await expect(page.locator("[data-w03-privacy]")).toBeVisible();
      await page.locator('[data-w03-example="foldline"]').click();
      await expect(page.locator("[data-w03-own-read]")).toContainText("monthly_revenue.csv");
      await expect(page.locator("[data-w03-own-tub]")).toBeVisible();
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-w03-download='skill']").click()]);
      expect(download.suggestedFilename()).toBe("kennzahl-fragekarte.zip");
      expect(readFileSync(await download.path()).subarray(0, 2).toString("latin1")).toBe("PK");
      await next(page);
      await expect(beat(page)).toHaveAttribute("data-beat", "mitnehmen");
      await expect(page.locator("[data-w03-objective]")).toContainText(de ? "fünf Kästchen" : "five boxes");

      // r resets the moves and the clock, never the own card.
      await page.locator("body").press("r");
      await expect(beat(page)).toHaveAttribute("data-beat", "antwort", { timeout: 4000 });
      await expect(page.locator("[data-w03-answer-card]")).toBeVisible();
      await page.locator("[data-weg] .glas-weg-dot").nth(5).click();
      await expect(page.locator("[data-w03-own-read]")).toContainText("monthly_revenue.csv");
      await page.locator("[data-w03-clear]").click();
      await expect(page.locator("[data-w03-own-read]")).toHaveCount(0);

      expect(seen.errors).toEqual([]);
      expect(seen.requests).toEqual([]);
    });
  }

  test("the old link ?beat=test opens the test with the files sorted", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, `/demos/${SLUG}?beat=test`);
    await expect(beat(page)).toHaveAttribute("data-beat", "projekt", { timeout: 6000 });
    await expect(page.locator("[data-w03-test]")).toBeVisible();
    await expect(page.locator("[data-w03-answer]")).toContainText("334.675");
  });

  test("a new link ?beat=wer-zaehlt opens who counts with the earlier boxes filled", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, `/en/demos/${SLUG}?beat=wer-zaehlt`);
    await expect(beat(page)).toHaveAttribute("data-beat", "wer-zaehlt");
    await expect(page.locator("[data-w03-side-panel]")).toBeVisible();
    await expect(page.locator("[data-w03-answer]")).toContainText("334,675");
    await expectGlasBudget(page, "desktop, scene 4");
  });

  test("Shift+R resets, a key typed in the card does not", async ({ page }) => {
    await open(page, `/demos/${SLUG}?beat=deine-karte`);
    await expect(beat(page)).toHaveAttribute("data-beat", "deine-karte");
    const metric = page.locator("[data-w03-own-form] input[name='metric']");
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
    await page.locator("[data-weg] .glas-weg-dot").nth(5).click();
    await expect(page.locator("[data-w03-own-form] input[name='metric']")).toHaveValue("Offene Ticketsr");
  });

  test("the own card writes what people type exactly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, `/demos/${SLUG}?beat=deine-karte`);
    const form = page.locator("[data-w03-own-form]");
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
    await fill("column", "offen");
    await form.locator("input[type='radio'][value='level']").check({ force: true });
    await fill("who", "Alle offenen Rechnungen am Monatsende, Gutschriften abgezogen.");
    await fill("never", "Kundennamen, Bankverbindungen");
    await form.locator("input[type='radio'][value='file']").check({ force: true });
    await fill("expected", "1.234.567,89 / 1.198.000 / 1.305.442,10");
    await fill("unit", "EUR");
    await fill("source", "Saldenliste Buchhaltung");
    await expect(page.locator("[data-w03-blocked]")).toHaveCount(0);
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-w03-download='checklist']").click()]);
    expect(download.suggestedFilename()).toBe("pruefliste.md");
    const text = readFileSync(await download.path(), "utf8");
    expect(text).toContain("1.234.567,89 / 1.198.000 / 1.305.442,10 EUR");
    expect(text).toContain("Stichtag: 2026-10-01.");
  });

  test("the first screen holds the intro and its start at 390 x 664", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await open(page, `/demos/${SLUG}`);
    const button = await page.locator("[data-demo-start]").boundingBox();
    expect((button?.y ?? 9999) + (button?.height ?? 0)).toBeLessThanOrEqual(664);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
