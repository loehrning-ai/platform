import { expect, test, type Page } from "@playwright/test";
import { expectGlasBudget } from "./fixtures/glas-budget";

/**
 * W04 "Nachweisprobe" in the depicted Claude app (v4 shell, Glas): the intro
 * on the news, the kit's five prompts sent in the project with Claude's
 * recorded answers, the checks by hand beside the chat (a sheet on a phone),
 * the measurement, the skill in the visitor's own Claude and the take-home.
 * Runs on desktop and phone projects; the helpers handle both layouts.
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
const appWindow = (page: Page) => page.locator("[data-w4a-window]");
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const isPhone = (page: Page) => appWindow(page).evaluate((element) => element.hasAttribute("data-phone"));

/** A press before hydration is lost (the buttons are server-rendered), so the first press repeats until it lands. */
async function firstPress(page: Page, selector: string, landed: () => Promise<void>) {
  await expect(async () => {
    await page.locator(selector).first().click();
    await landed();
  }).toPass({ timeout: 15_000 });
}

async function openBeat(page: Page, beat: string, prefix = "") {
  await page.goto(`${prefix}${PATH}?beat=${beat}`, { waitUntil: "networkidle" });
  await expect(clock(page)).toHaveAttribute("data-beat", beat);
}

/** Sends the step's prompt with the composer's arrow, then shows the whole answer with "Weiter". */
async function sendAndFinish(page: Page, step: string) {
  const turn = page.locator(`[data-w4a-turn="${step}"]`);
  await firstPress(page, "[data-w4a-send]", () => expect(turn).toBeVisible({ timeout: 1000 }));
  await page.locator("[data-demo-next]").click();
  await expect(turn).toHaveAttribute("data-phase", "done");
}

/** The check beside the chat: open on a desktop by itself, a sheet on a phone that the caption line in the dock opens. */
async function openCheck(page: Page) {
  if (await isPhone(page)) await page.locator("[data-w4a-capline]").click();
  await expect(page.locator("[data-w4a-step]").first()).toBeVisible();
}

/** "Weiter" after an answer: on a phone the first press opens the check sheet (the caption pill says "Prüfen"), the next moves on. */
async function nextBeat(page: Page) {
  if (await isPhone(page)) {
    await page.locator("[data-demo-next]").click();
    await expect(page.locator("[data-w4a-step]").first()).toBeVisible();
    await page.locator("[data-sheet-close]").click();
  }
  await page.locator("[data-demo-next]").click();
}

/** Tap a part of the claim, then the certificate line that carries it. */
async function connect(page: Page, part: string, line: number) {
  await page.locator(`[data-w4-handle="${part}"]`).click();
  await page.locator(`button[data-w4-line="${line}"]`).click();
}

test.describe(PATH, () => {
  test("intro: the case, the news and the question, the whole card above the tab bar at 390 x 664", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(PATH, { waitUntil: "networkidle" });
    const news = page.locator("[data-demo-intro-news]");
    await expect(news).toContainText("27.09.2026");
    await expect(news).toContainText("EBRD");
    await expect(page.locator("[data-demo-intro-body]")).toContainText("erfundenes Weingut");
    await expect(page.locator("[data-demo-intro]")).toContainText("Auf dieser Seite läuft keine KI.");
    const fold = await page.evaluate(() => {
      const bar = document.querySelector("[data-mobile-tab-bar]");
      return bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect().top : window.innerHeight;
    });
    for (const selector of ["[data-demo-intro]", "[data-demo-start]", "[data-demo-explore]"]) {
      const bottom = await page.locator(selector).evaluate((element) => element.getBoundingClientRect().bottom);
      expect(bottom, `${selector} above the tab bar`).toBeLessThanOrEqual(fold);
    }
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await expectGlasBudget(page, "intro");
    expect(errors).toEqual([]);
  });

  test("step 1: the kit's prompt in the project, Claude's recorded answer, and the cited file at its line", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await expect(appWindow(page)).toContainText("Darstellung der Claude-App, Antworten aufgezeichnet am 26.10.2026");
    // The prompt types itself into the composer with the questionnaire attached.
    await expect(page.locator("[data-w4a-composer] [data-w4a-chip]")).toContainText("1-fragebogen-nordvik.md");
    await expect(page.locator("[data-w4a-composer]")).toContainText("Zähle vor jeder Jahressumme die eindeutigen Monate im Code.");
    await expect(caption(page)).toContainText("Schick den Prompt mit dem Pfeil ab");
    // Start hands the keyboard to the send arrow, and the sidebar is a picture apart from Customize.
    await expect(page.locator("[data-w4a-send]")).toBeFocused();
    await expect(page.locator("[data-w4a-send]")).toHaveAccessibleName("Aufzeichnung abspielen");
    await expect(appWindow(page).locator("[data-w4a-title]").first()).toContainText("New chat");

    await sendAndFinish(page, "schritt-1");
    const turn = page.locator('[data-w4a-turn="schritt-1"]');
    await expect(turn.locator("[data-w4a-answer]")).toContainText("September 2025");
    await expect(turn.locator(".w4a-meta")).toContainText("Claude Code 2.1.310");
    await expect(caption(page)).toContainText("5 der 8 Antworten");
    await expect(caption(page)).toContainText("nur 11 Monate");

    // The activity folds when the answer stands, and opens on a press: the skill, the files, the code.
    const toggle = turn.locator("[data-w4a-activity-toggle]");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(turn.locator('[data-w4a-act="skill"]')).toContainText("esg-nachweise");
    await expect(turn.locator('[data-w4a-act="thinking"]').first()).toBeVisible();

    // A citation opens the file at the cited lines, beside the chat or as a sheet.
    await turn.locator('[data-w4a-cite="strom_2025.csv"]').first().click();
    const file = page.locator('[data-w4a-fileview="ordner/strom_2025.csv"]');
    await expect(file).toBeVisible();
    await expect(file.locator("li[data-marked]").first()).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await expectGlasBudget(page, "step 1 with the cited file");
    expect(errors).toEqual([]);
  });

  test("step 1 by hand: twelve rows are eleven months, and September is missing", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await sendAndFinish(page, "schritt-1");
    await openCheck(page);
    await page.locator("[data-w4a-month-all]").click();
    await expect(page.locator("[data-w4a-month-count]")).toHaveAttribute("data-w4a-month-count", "11");
    await expect(page.locator("[data-w4a-month-missing]")).toContainText("September 2025");
  });

  test("step 2: three quotes on the certificate give the verdict Lücke beside Claude's answer", async ({ page }) => {
    await openBeat(page, "schritt-2");
    await sendAndFinish(page, "schritt-2");
    await expect(caption(page)).toContainText("Zertifizierte Bio-Weinberge");
    await openCheck(page);
    await expect(async () => {
      await connect(page, "zertifiziert", 4);
      await expect(page.locator('[data-w4-handle="zertifiziert"]')).toHaveAttribute("data-state", "linked", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await connect(page, "flaeche", 6);
    await connect(page, "stichtag", 8);
    await expect(page.locator("[data-w4-card-status]")).toHaveAttribute("data-w4-card-status", "luecke");
  });

  test("steps 4 and 5: the register's counts, then the late invoice fills September", async ({ page }) => {
    await openBeat(page, "schritt-4");
    await sendAndFinish(page, "schritt-4");
    await expect(caption(page)).toContainText("9 Antworten sind belegt, 3 schwach belegt und 9 haben eine Lücke");
    await nextBeat(page);
    await expect(clock(page)).toHaveAttribute("data-beat", "schritt-5");
    // Step 5 stays in the chat of step 4: its turn is still there.
    await expect(page.locator('[data-w4a-turn="schritt-4"]')).toHaveCount(1);
    await expect(page.locator("[data-w4a-composer] [data-w4a-chip]")).toContainText("rechnung-EL-25-09.png");
    await sendAndFinish(page, "schritt-5");
    await expect(caption(page)).toContainText("10 Antworten belegt, 4 schwach belegt und 7 haben eine Lücke");
    // The file Claude wrote sits under its answer as a plain file name.
    await expect(page.locator('[data-w4a-turn="schritt-5"] [data-w4a-produced]')).toContainText("nachweisregister.xlsx");
    await openCheck(page);
    await page.locator("[data-w4-invoice-toggle]").click();
    await expect(page.locator("[data-w4-f2-status]")).toHaveAttribute("data-w4-f2-status", "belegt");
    await expect(page.locator("[data-w4-f2]")).toContainText("320,9");
    await expect(page.locator("[data-w4a-register-sheet]")).toContainText("Status");
  });

  test("a prediction before Send is set beside Claude's answer and never scored", async ({ page }) => {
    await openBeat(page, "schritt-3");
    await expect(page.locator("[data-w4a-predict-value]")).toHaveText("offen");
    await page.locator("[data-w4a-predict-more]").click();
    await page.locator("[data-w4a-predict-less]").click();
    await page.locator("[data-w4a-predict-less]").click();
    await expect(page.locator("[data-w4a-predict-value]")).toHaveText("6,5 Jahre");
    await sendAndFinish(page, "schritt-3");
    await expect(caption(page)).toContainText("6,5 Jahre");
    await expect(caption(page)).toContainText("5,0 Jahre");
  });

  test("measured: the median with Claude, and by hand honestly not measured", async ({ page }) => {
    await openBeat(page, "gemessen");
    await expect(page.locator("[data-w4a-measured-median]")).toHaveText("8 Min. 32 s");
    await expect(page.locator("[data-w4a-measured]")).toContainText("nicht gemessen");
    await expect(caption(page)).toContainText("in 3 Läufen am 26.10.2026");
  });

  test("your Claude: four install steps on Weiter, and the skill zip to download", async ({ page }) => {
    await openBeat(page, "dein-claude");
    await expect(page.locator("[data-w4a-install]")).toHaveAttribute("data-w4a-install", "0");
    for (const step of ["1", "2", "3"]) {
      await page.locator("[data-demo-next]").click();
      await expect(page.locator("[data-w4a-install]")).toHaveAttribute("data-w4a-install", step);
    }
    await expect(page.locator("[data-w4a-skill-row]")).toContainText("esg-nachweise");
    await expect(page.locator("a[data-w4a-skill-download]")).toHaveAttribute("href", "/skills/esg-nachweise.zip");
    await page.locator("[data-demo-next]").click();
    await expect(clock(page)).toHaveAttribute("data-beat", "mitnehmen");
    await expect(page.locator('[data-w4-take="prompts"] .w4-prompt')).toHaveCount(5);
  });

  test("r starts over: the chat is empty and the first prompt waits again", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await sendAndFinish(page, "schritt-1");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("r");
    await expect(clock(page)).toHaveAttribute("data-beat", "schritt-1");
    await expect(page.locator("[data-w4a-turn]")).toHaveCount(0);
    await expect(page.locator("[data-w4a-composer]")).toContainText("Beantworte den angehängten Fragebogen");
  });

  test("reduced motion: the whole answer stands at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBeat(page, "schritt-3");
    await firstPress(page, "[data-w4a-send]", () => expect(page.locator('[data-w4a-turn="schritt-3"]')).toHaveAttribute("data-phase", "done", { timeout: 1000 }));
    await expect(page.locator('[data-w4a-turn="schritt-3"] [data-w4a-answer]')).toContainText("279,7 MWh");
  });

  test("English: the run's one different status is named, and the take-home links", async ({ page }) => {
    await page.goto(`/en${PATH}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-demo-intro-body]")).toContainText("invented North Macedonian winery");
    await openBeat(page, "schritt-1", "/en");
    await sendAndFinish(page, "schritt-1");
    await expect(caption(page)).toContainText("For Q6, Claude wrote");
    await openBeat(page, "mitnehmen", "/en");
    await expect(page.locator('[data-w4-take="skill"] a[download]')).toHaveAttribute("href", /esg-nachweise\.zip$/);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe(`${PATH} on a 390 x 664 phone`, () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test("the Claude phone app: chat full screen, the composer above the dock, the check as a sheet", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await expect(appWindow(page)).toHaveAttribute("data-phone", "");
    const send = await page.locator("[data-w4a-send]").boundingBox();
    const dock = await page.locator(".w4-dock").boundingBox();
    if (!send || !dock) throw new Error("no send button or dock");
    expect(send.y + send.height, "the send arrow above the dock").toBeLessThanOrEqual(dock.y);
    await sendAndFinish(page, "schritt-1");
    // After the answer the chat gets the room: the window is far taller than the dock, and the answer starts in view.
    const room = await page.evaluate(() => ({
      window: document.querySelector("[data-w4a-window]")?.getBoundingClientRect().height ?? 0,
      dock: document.querySelector(".w4-dock")?.getBoundingClientRect().height ?? 0,
    }));
    expect(room.window, "the chat window").toBeGreaterThanOrEqual(340);
    expect(room.dock, "the dock").toBeLessThanOrEqual(130);
    await expect(page.locator('[data-w4a-turn="schritt-1"] [data-w4a-activity]')).toBeInViewport();
    // Von vorn sits in the dock row, inside the dock.
    const restart = await page.locator(".w4-dock [data-demo-restart]").boundingBox();
    const dockNow = await page.locator(".w4-dock").boundingBox();
    if (!restart || !dockNow) throw new Error("no restart in the dock");
    expect(restart.x + restart.width).toBeLessThanOrEqual(dockNow.x + dockNow.width);
    // The check never opens by itself on a phone; the caption line in the dock opens it with the whole caption.
    await expect(page.locator("[data-w4a-step]")).toHaveCount(0);
    await page.locator("[data-w4a-capline]").click();
    await expect(page.locator('[data-w4a-step="schritt-1"]')).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await expectGlasBudget(page, "phone with the sheet open");
  });

  test("Weiter on a phone opens the check before it moves on, and wide answer tables become cards", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    await firstPress(page, "[data-demo-start]", () => expect(clock(page)).toHaveAttribute("data-demo-phase", "guided", { timeout: 1000 }));
    await sendAndFinish(page, "schritt-1");
    // A table with four or more columns reads as one card per row, never a sideways scroll.
    const table = page.locator('[data-w4a-turn="schritt-1"] [data-w4a-table]').first();
    await expect(table).toHaveAttribute("data-layout", "cards");
    const wide = await table.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(wide, "the answer table fits the phone").toBeLessThanOrEqual(1);
    // The caption pill asks to check first; Weiter opens the sheet, the next Weiter moves on.
    await expect(page.locator("[data-w4a-capline] [data-attention]")).toHaveCount(1);
    await page.locator("[data-demo-next]").click();
    await expect(page.locator('[data-w4a-step="schritt-1"]')).toBeVisible();
    await expect(clock(page)).toHaveAttribute("data-beat", "schritt-1");
    // Once checked, the pill rests, and Weiter after closing the sheet moves on.
    await page.locator("[data-sheet-close]").click();
    await expect(page.locator("[data-w4a-capline] [data-attention]")).toHaveCount(0);
    await page.locator("[data-demo-next]").click();
    await expect(clock(page)).toHaveAttribute("data-beat", "schritt-2");
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("the strip readout on the step 2 card sits on a dark plate the figures can be read on", async ({ page }) => {
    await openBeat(page, "schritt-2");
    await sendAndFinish(page, "schritt-2");
    await openCheck(page);
    const plate = page.locator("[data-w4-readout]").first();
    await expect(async () => {
      await connect(page, "zertifiziert", 4);
      await expect(plate).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    const alpha = await plate.evaluate((element) => {
      const match = getComputedStyle(element).backgroundColor.match(/rgba?\(([^)]+)\)/);
      const parts = match ? match[1]!.split(/[ ,/]+/).filter(Boolean) : [];
      return parts.length > 3 ? Number(parts[3]) : 1;
    });
    expect(alpha, "the readout plate is nearly opaque").toBeGreaterThan(0.8);
  });
});
