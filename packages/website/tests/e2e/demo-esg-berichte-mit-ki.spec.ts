import { expect, test, type Page } from "@playwright/test";
import { expectGlasBudget } from "./fixtures/glas-budget";

/**
 * W04 "Nachweisprobe" on the v4 shell (Glas): the intro card, the five
 * scenes with their levers, the folder's counts and threads, and the keys.
 * The Claude scene under the stage has its own spec (claude-scene.spec.ts).
 */
const SLUG = "esg-berichte-mit-ki";
const PATH = `/demos/${SLUG}`;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const clock = (page: Page) => page.locator("[data-demo-clock]");
const caption = (page: Page) => page.locator("[data-w4-caption]");
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const radio = (page: Page, name: string) => page.locator(`[data-w4-levers] [role="radio"]:has-text("${name}")`);

/** A press before hydration is lost (the buttons are server-rendered), so the first press repeats until it lands. */
async function firstPress(page: Page, selector: string, landed: () => Promise<void>) {
  await expect(async () => {
    await page.locator(selector).first().click();
    await landed();
  }).toPass({ timeout: 15_000 });
}

async function openBeat(page: Page, beat: string) {
  await page.goto(`${PATH}?beat=${beat}`, { waitUntil: "networkidle" });
  await expect(clock(page)).toHaveAttribute("data-beat", beat);
}

/** Where the visitor's view ends: the phone's tab bar, or the window's bottom when there is none. */
async function tabBarTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const bar = document.querySelector("[data-mobile-tab-bar]");
    const top = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect().top : window.innerHeight;
    return Math.min(top, window.innerHeight);
  });
}
const bottomOf = (page: Page, selector: string) => page.locator(selector).first().evaluate((element) => element.getBoundingClientRect().bottom);
const dockTop = (page: Page) => page.locator(".w4-dock").evaluate((element) => element.getBoundingClientRect().top);

/** The scene's key object sits on the stage, above the dock, without scrolling. */
async function expectOnStage(page: Page, selector: string, what: string) {
  const target = page.locator(selector).first();
  await expect(target, what).toBeVisible();
  const box = await target.evaluate((element) => element.getBoundingClientRect().toJSON() as DOMRect);
  const stage = await page.locator("[data-demo-stage]").evaluate((element) => element.getBoundingClientRect().top);
  expect(box.top, `${what}: below the stage top`).toBeGreaterThanOrEqual(stage - 1);
  expect(box.bottom, `${what}: above the dock`).toBeLessThanOrEqual((await dockTop(page)) + 1);
}

/** A real finger: touchStart on the part, twelve moves, touchEnd on the line (Chrome DevTools touch events). */
async function touchDrag(page: Page, from: string, to: string) {
  const cdp = await page.context().newCDPSession(page);
  const a = await page.locator(from).boundingBox();
  const b = await page.locator(to).boundingBox();
  if (!a || !b) throw new Error(`touchDrag: ${from} or ${to} has no box`);
  const p0 = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const p1 = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p0] });
  for (let i = 1; i <= 12; i += 1) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x + ((p1.x - p0.x) * i) / 12, y: p0.y + ((p1.y - p0.y) * i) / 12 }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

/** Tap a part of the claim, then the certificate line that carries it. */
async function connect(page: Page, part: string, line: number) {
  await page.locator(`[data-w4-handle="${part}"]`).click();
  await page.locator(`button[data-w4-line="${line}"]`).click();
}

test.describe(PATH, () => {
  test("intro: what it is, and the whole card with both buttons above the tab bar at 390 x 664", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(PATH, { waitUntil: "networkidle" });
    await expect(page.locator("[data-demo-intro]")).toBeVisible();
    await expect(page.locator("[data-demo-intro-body]")).toContainText("erfundenes Weingut");
    const start = page.locator("[data-demo-start]");
    await expect(start).toBeVisible();
    const fold = await tabBarTop(page);
    for (const selector of ["[data-demo-intro]", "[data-demo-start]", "[data-demo-explore]"]) {
      await expect(page.locator(selector)).toBeVisible();
      expect(await bottomOf(page, selector), `${selector} above the tab bar`).toBeLessThanOrEqual(fold);
    }
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await expectGlasBudget(page, "intro");
    expect(errors).toEqual([]);
  });

  test("S1: the guess, then three quotes give the verdict Lücke", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await expect(clock(page)).toHaveAttribute("data-beat", "regalkarte");
    await page.getByRole("button", { name: "Nicht so drucken" }).click();
    await expect(clock(page)).toHaveAttribute("data-beat", "zitate");
    await connect(page, "zertifiziert", 4);
    await connect(page, "flaeche", 6);
    await connect(page, "stichtag", 8);
    await expect(page.locator("[data-w4-card-status]")).toHaveAttribute("data-w4-card-status", "luecke");
    await expect(caption(page)).toContainText("Der schwächste Teil zählt");
    await expectGlasBudget(page, "S1 verdict");
  });

  test("S1: Escape cancels a picked part and stays on the beat", async ({ page }) => {
    await openBeat(page, "zitate");
    const handle = page.locator('[data-w4-handle="zertifiziert"]');
    await expect(async () => {
      await handle.click();
      await expect(handle).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await page.keyboard.press("Escape");
    await expect(handle).toHaveAttribute("aria-pressed", "false");
    await expect(clock(page)).toHaveAttribute("data-beat", "zitate");
  });

  test("S2: Website, 12 von 40 Hektar and 01.07.2026 are covered; all vineyards on that day are not", async ({ page }) => {
    await openBeat(page, "umschreiben");
    const scene = page.locator('[data-w4-scene="umschreiben"]');
    await firstPress(page, '[data-w4-levers] [role="radio"]:has-text("12 von 40 Hektar")', () =>
      expect(radio(page, "12 von 40 Hektar")).toHaveAttribute("aria-checked", "true", { timeout: 1000 }),
    );
    await radio(page, "Website").click();
    const slider = scene.locator('[role="slider"]');
    await slider.focus();
    await page.keyboard.press("Home");
    for (let i = 0; i < 10; i += 1) await page.keyboard.press("PageUp");
    for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuetext", /1\. Juli 2026/);
    await expect(scene).toHaveAttribute("data-status", "belegt");
    await expect(scene.locator("[data-w4-may]")).toHaveAttribute("data-w4-may", "yes");

    await radio(page, "Alle Weinberge").click();
    await expect(scene).toHaveAttribute("data-status", "luecke");
    await expect(caption(page)).toContainText("Ab dem 27. September 2026");
  });

  test("S3: the electricity file sorted by month shows eleven months and the September slot", async ({ page }) => {
    await openBeat(page, "strom");
    await firstPress(page, '[data-w4-handle="f2"]', async () => {
      await page.locator('button[data-w4-line="5"]').click({ timeout: 1000 });
      await expect(page.locator('[data-w4-scene="strom"]')).toHaveAttribute("data-linked", "", { timeout: 1000 });
    });
    await page.locator("[data-w4-grabber]").click();
    await expect(page.locator("[data-w4-grabber]")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator('[data-w4-scene="strom"] .w4-months')).toHaveAttribute("data-end", "months");
    await expect(page.locator('[data-w4-scene="strom"] [data-w4-slot]')).toContainText("EL-25-09");
    await expect(page.locator("[data-w4-f2-status]")).toHaveAttribute("data-w4-f2-status", "luecke");
  });

  test("S4: the September invoice fills the gap, 320,9 MWh and F2 Belegt", async ({ page }) => {
    await openBeat(page, "rechnung");
    await firstPress(page, "[data-w4-invoice-toggle]", () =>
      expect(page.locator("[data-w4-f2-status]")).toHaveAttribute("data-w4-f2-status", "belegt", { timeout: 1000 }),
    );
    await expect(page.locator("[data-w4-f2]")).toContainText("320,9");
    await expect(page.locator("[data-w4-f2]")).toContainText("Belegt");
  });

  test("S5: the folder counts with and without the invoice, and the threads from strom_2025.csv", async ({ page }) => {
    await openBeat(page, "ordner");
    // Out: the counts before the invoice turned up.
    await firstPress(page, "[data-w4-folder-invoice]", () =>
      expect(caption(page)).toContainText("9 der 21 Antworten sind belegt und 3 schwach belegt", { timeout: 1000 }),
    );
    await expect(caption(page)).toContainText("9 sind Lücken: Für 5 davon fehlt ein Dokument, 3 stehen auf der Verbotsliste, und für eine gibt es heute keine Datei");
    // In again: one more answer is covered and one more is weak.
    await page.locator("[data-w4-folder-invoice]").click();
    await expect(caption(page)).toContainText("10 der 21 Antworten sind belegt und 4 schwach belegt");
    await expect(caption(page)).toContainText("7 sind Lücken: Für 3 davon fehlt ein Dokument, 3 stehen auf der Verbotsliste, und für eine gibt es heute keine Datei");

    await page.locator('[data-w4-file="strom"]').click();
    await expect(page.locator('[data-w4-link="quoted"]')).toHaveCount(4);
    await expect(page.locator('[data-w4-link="depends"]')).toHaveCount(2);
    await expectGlasBudget(page, "S5 with threads");
  });

  test("own file: the kit's example gives 11 of 12 months and names September, in the browser only", async ({ page }) => {
    await openBeat(page, "deine-datei");
    await expect(page.locator("[data-w4-privacy]")).toBeVisible();
    await firstPress(page, "[data-w4-example]", () => expect(page.locator("[data-w4-own-result]").first()).toBeVisible({ timeout: 1000 }));
    const readout = page.locator("[data-w4-own] [data-w4-readout]");
    await expect(readout).toContainText("Deine Datei deckt 11 von 12 Monaten 2025.");
    await expect(readout).toContainText("Es fehlt September.");
  });

  test("r starts over from the shelf card and clears the quotes, Escape leaves free play", async ({ page }) => {
    await openBeat(page, "zitate");
    await expect(async () => {
      await connect(page, "zertifiziert", 4);
      await expect(page.locator('[data-w4-handle="zertifiziert"]')).toHaveAttribute("data-state", "linked", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    // The shell ignores keys while a control has the focus; give it back to the page.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("r");
    await expect(clock(page)).toHaveAttribute("data-beat", "regalkarte");
    // The rewind plays back first; a key during it is ignored, so press until the beat moves on.
    await expect(async () => {
      await page.keyboard.press("ArrowRight");
      await expect(clock(page)).toHaveAttribute("data-beat", "zitate", { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await expect(page.locator('[data-w4-handle][data-state="linked"]')).toHaveCount(0);

    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-explore]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "free", { timeout: 1000 }));
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Escape");
    await expect(clock(page)).toHaveAttribute("data-demo-phase", "guided");
  });

  test("English: the intro and the take-home links", async ({ page }) => {
    await page.goto(`/en${PATH}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-demo-intro-body]")).toContainText("invented winery");
    await page.goto(`/en${PATH}?beat=mitnehmen`, { waitUntil: "networkidle" });
    await expect(clock(page)).toHaveAttribute("data-beat", "mitnehmen");
    await expect(page.locator('[data-w4-take="skill"] a[download]')).toHaveAttribute("href", /esg-nachweise\.zip$/);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe(`${PATH} on a 390 x 664 phone`, () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test("S1: lines 3 to 11 sit above the dock while connecting, and a finger drag lands on line 4", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "touch is dispatched through the Chrome DevTools Protocol");
    await openBeat(page, "zitate");
    await expect(page.locator('[data-w4-scene="karte"]')).toHaveAttribute("data-step", "connect");
    for (let line = 3; line <= 11; line += 1) await expectOnStage(page, `[data-w4-line="${line}"]`, `line ${line}`);
    const handle = page.locator('[data-w4-handle="zertifiziert"]');
    await expect(async () => {
      await touchDrag(page, '[data-w4-handle="zertifiziert"]', '[data-w4-line="4"]');
      await expect(handle).toHaveAttribute("data-state", "linked", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
  });

  test("every scene shows its key object without scrolling", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await expectOnStage(page, "[data-w4-card]", "S1 the shelf card");
    expect(await bottomOf(page, ".w4-guess"), "S1 the two answers above the tab bar").toBeLessThanOrEqual(await tabBarTop(page));

    await openBeat(page, "zitate");
    await expect(async () => {
      await connect(page, "zertifiziert", 4);
      await expect(page.locator('[data-w4-handle="zertifiziert"]')).toHaveAttribute("data-state", "linked", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await connect(page, "flaeche", 6);
    await connect(page, "stichtag", 8);
    await expect(page.locator('[data-w4-scene="karte"]')).toHaveAttribute("data-step", "verdict");
    await expectOnStage(page, "[data-w4-card-status]", "S1 the verdict on the card");
    await expectOnStage(page, '.w4-s1-slots [data-w4-slot="restCertificate"]', "S1 the first missing document");
    await expectOnStage(page, '.w4-s1-slots [data-w4-slot="renewedCertificate"]', "S1 the second missing document");

    await openBeat(page, "umschreiben");
    await expectOnStage(page, "[data-w4-levers]", "S2 the levers");
    await expectOnStage(page, '[data-w4-scene="umschreiben"] [role="slider"]', "S2 the Stichtag");
    await expectOnStage(page, "[data-w4-checks]", "S2 the four checks");

    await openBeat(page, "strom");
    await firstPress(page, '[data-w4-handle="f2"]', async () => {
      await page.locator('button[data-w4-line="5"]').click({ timeout: 1000 });
      await expect(page.locator('[data-w4-scene="strom"]')).toHaveAttribute("data-linked", "", { timeout: 1000 });
    });
    await page.locator("[data-w4-grabber]").click();
    await expect(page.locator("[data-w4-grabber]")).toHaveAttribute("aria-valuenow", "100");
    await expectOnStage(page, "[data-w4-f2]", "S3 the bank field");
    await expectOnStage(page, '[data-w4-scene="strom"] .w4-months', "S3 the months");
    await expectOnStage(page, '[data-w4-scene="strom"] [data-w4-slot]', "S3 the missing invoice");

    await openBeat(page, "rechnung");
    await expectOnStage(page, "[data-w4-photo]", "S4 the invoice photo");
    await expectOnStage(page, ".w4-s4-chart", "S4 the chart it drops into");

    await openBeat(page, "ordner");
    await expectOnStage(page, '[data-w4-file="strom"]', "S5 the folder");
    await expectOnStage(page, '[data-w4-tile="Q1"]', "S5 the first answer");

    await openBeat(page, "deine-datei");
    await expectOnStage(page, ".w4-drop", "S6 the drop zone");
    await expectGlasBudget(page, "S6 on a phone");
  });
});
