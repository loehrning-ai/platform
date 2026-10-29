import { expect, test, type Page } from "@playwright/test";

/**
 * W05 "Die Lückenliste" on the v4 stage: the intro fits a small phone, the
 * board's rows are tap-sized and keep name and stamp, the four tests leave
 * two files that hold, the bench shows why R7 is a gap, the Claude window
 * replays a recorded take with the page's quote marks on its answer, and
 * the take-home fills a gap request. Keys:
 * ArrowLeft and ArrowRight walk the path, Escape closes a sheet, r and
 * Shift+R restart but keep the visitor's own files.
 */
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
const next = (page: Page) => page.locator("[data-demo-next]").first();

/**
 * The board's rows: each at least 44px tall with its name visible, and the
 * last one reachable above the dock by scrolling the stage (never the page).
 */
const boardRows = (page: Page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll<HTMLElement>(".w05-request")];
    const scroller = document.querySelector<HTMLElement>(".w05-data");
    const scrollY = window.scrollY;
    rows.at(-1)?.closest<HTMLElement>(".w05-row")?.scrollIntoView({ block: "nearest" });
    const last = rows.at(-1)?.getBoundingClientRect().bottom ?? 999;
    const dock = document.querySelector(".demo4-dock")?.getBoundingClientRect().top ?? 0;
    const named = rows.filter((row) => (row.querySelector(".w05-request-name")?.getBoundingClientRect().width ?? 0) > 20).length;
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, scrollY);
    return { count: rows.length, smallest: Math.min(...rows.map((row) => row.getBoundingClientRect().height)), named, lastAboveDock: last <= dock + 1 };
  });

/** File names on the board that do not fit their box. */
const cutFileNames = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".w05-file")].filter((element) => element.offsetParent && element.scrollWidth > element.clientWidth + 1).map((element) => element.textContent),
  );

/** Next until the clock shows the beat: a press during a beat's opening motion only finishes the motion. */
async function advanceTo(page: Page, id: string, press: () => Promise<void> = () => next(page).click()) {
  await expect(async () => {
    await press();
    await expect(beat(page)).toHaveAttribute("data-beat", id, { timeout: 700 });
  }).toPass({ timeout: 10_000 });
}

async function closeSheet(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
}

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    test(`${locale}: the guided path at 390 x 664`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize(PHONE);
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });
      const intro = page.locator("[data-demo-intro-body]");
      await expect(intro).toContainText("Vardar Works");
      await expect(intro).toContainText("Tannwald");
      await expect(intro).toContainText(locale === "de" ? "Im Workshop bediene ich Claude live" : "In the workshop I run Claude live");

      // The intro card and both buttons fit the first screen; the page has not scrolled.
      const card = await page.locator("[data-demo-intro]").boundingBox();
      const fold = await page.evaluate(() => {
        const bar = document.querySelector("[data-mobile-tab-bar]");
        return Math.min(bar ? bar.getBoundingClientRect().top : window.innerHeight, window.innerHeight);
      });
      expect((card?.y ?? 999) + (card?.height ?? 0), "intro card above the tab bar").toBeLessThanOrEqual(fold + 0.5);
      for (const selector of ["[data-demo-start]", "[data-demo-explore]"]) {
        const box = await page.locator(selector).boundingBox();
        expect((box?.y ?? 999) + (box?.height ?? 0), selector).toBeLessThanOrEqual(600);
      }
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      // Scene 1: eight requests, each linked to a file with a matching name, all above the dock.
      await page.locator("[data-demo-start]").click();
      await expect(beat(page)).toHaveAttribute("data-beat", "ordner");
      await expect(page.locator("[data-w05-row]")).toHaveCount(8);
      expect(await boardRows(page)).toEqual({ count: 8, smallest: expect.any(Number), named: 8, lastAboveDock: true });
      expect((await boardRows(page)).smallest).toBeGreaterThanOrEqual(44);
      expect(await cutFileNames(page)).toEqual([]);
      await page.locator("[role=slider]").first().focus();
      await page.keyboard.press("ArrowRight");
      await page.locator('[data-w05-commit="keep"]').click();
      await expect(page.locator("[data-w05-lead]")).toHaveCount(0);

      // Scene 2: the four tests leave two of eight; a stamped row keeps its name.
      await advanceTo(page, "pruefungen");
      for (const check of ["quote", "date", "scope", "approval"]) await page.locator(`[data-w05-switch="${check}"]`).click();
      await expect(page.locator("[data-w05-legend]")).toContainText(locale === "de" ? "2 von 8" : "2 of 8");
      expect((await boardRows(page)).named).toBe(8);
      // The dock's own button names the next step and opens R1, the one request that holds and still is a problem.
      await expect(page.locator("[data-w05-next-r1]")).toHaveText(locale === "de" ? "Weiter: R1 ansehen" : "Next: look at R1");
      await page.locator("[data-w05-next-r1]").click();
      await expect(page.locator('[data-w05-evidence="R1"]')).toBeVisible();
      await closeSheet(page);
      await expect(page.locator("[data-w05-next-r1]")).toHaveCount(0);

      // Scene 3: the backup report on the bench; reading its lines lights the ring, quote fails.
      await advanceTo(page, "r7");
      await page.locator('[data-w05-card="backup-report_2026-10.txt"]').click();
      await page.locator('[data-w05-target="R7"]').click();
      await expect(page.locator("[data-w05-doc]")).toBeVisible();
      await page.locator("[data-w05-readall]").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator('[data-w05-ring="quote"]')).toHaveAttribute("data-state", "fail", { timeout: 5_000 });
      for (const check of ["date", "scope", "approval"]) await expect(page.locator(`[data-w05-ring="${check}"]`)).toHaveAttribute("data-state", "pass", { timeout: 5_000 });
      // With the report read, the dock offers the four tests as rules first.
      await page.locator("[data-w05-next-rules]").click();
      await expect(page.locator("[data-w05-rule-sheet]")).toBeVisible();
      await closeSheet(page);

      // Scene 4, then scene 5: the Claude window on the stage, labelled a depiction with the take's date and model.
      await advanceTo(page, "ordner-eigen");
      await expect(page.locator("[data-w05-drop]")).toBeVisible();
      await advanceTo(page, "claude");
      const stage = page.locator('[data-demo-stage] [data-w05-probe="recorded"]');
      // The default take is the whole folder without the skill: the harder case, with the skill one switch away.
      await expect(stage).toHaveAttribute("data-w05-take", locale === "de" ? "de-alle-without-5" : "en-alle-without-1");
      const claudeWindow = stage.locator("[data-w05-window]");
      await expect(claudeWindow).toContainText(locale === "de" ? "26.10.2026" : "26 October 2026");
      await expect(claudeWindow).toContainText("Claude Opus 5.5");
      await expect(claudeWindow).toContainText(locale === "de" ? "Darstellung" : "Depiction");
      // At phone width both choices and the lookup buttons share one row, leaving the answer more room.
      const controlTops = await page.locator(".w05-claude-dock > *").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
      expect(Math.max(...controlTops) - Math.min(...controlTops)).toBeLessThan(8);
      await expect(stage.locator("[data-w05-send]")).toHaveAccessibleName(locale === "de" ? "Aufzeichnung abspielen" : "Play the recording");
      // The composer's one button sends the prompt, then stops the stream: the whole answer with the page's marks drawn on it.
      await stage.locator("[data-w05-send]").click();
      await expect(stage.locator("[data-w05-send]")).toHaveAttribute("data-state", "stop");
      await stage.locator("[data-w05-send]").click();
      await expect(stage).toHaveAttribute("data-w05-done", "");
      // The English take quotes the files in the answer itself, so its found quotes are drawn there; the German take quotes them in its produced file.
      if (locale === "en") await expect.poll(() => page.evaluate(() => (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.has("w05-found") ?? false)).toBe(true);
      await page.locator("[data-w05-marks-open]").click();
      await expect(page.locator('[data-w05-mark="found"]').first()).toBeVisible();
      await page.locator("[data-w05-mark-open]").first().click();
      await expect(page.locator("[data-w05-doc]")).toBeVisible();
      await closeSheet(page);
      // Under the window, the mistake hunt: a wrong rule says so, the right one solves the card.
      const hunt = page.locator("[data-w05-hunt]");
      await expect(hunt).toHaveAttribute("data-w05-hunt", "0");
      await hunt.locator('[data-w05-hunt-card="7"] [data-w05-hunt-rule="4"]').click();
      await expect(hunt.locator('[data-w05-hunt-card="7"] [data-w05-hunt-rule="4"]')).toHaveAttribute("data-verdict", "wrong");
      await hunt.locator('[data-w05-hunt-card="7"] [data-w05-hunt-rule="7"]').click();
      await expect(hunt.locator('[data-w05-hunt-card="7"] [data-w05-hunt-rule="7"]')).toHaveAttribute("data-verdict", "right");
      await expect(hunt).toHaveAttribute("data-w05-hunt", "1");

      // Scene 6: the managing director's draft first. Each of its four sentences is struck with the kit's evidence, then the honest reply appears.
      await advanceTo(page, "mitnehmen");
      await expect(page.locator("[data-w05-claim]")).toHaveCount(4);
      await expect(page.locator("[data-w05-reply]")).toHaveCount(0);
      await page.locator('[data-w05-claim="1"]').click();
      await expect(page.locator('[data-w05-claim="1"]')).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("[data-w05-claim-evidence]").first()).toContainText("training-records");
      await page.locator("[data-w05-draft-all]").click();
      await expect(page.locator("[data-w05-reply]")).toBeVisible();
      await expect(page.locator("[data-w05-reply]")).toContainText("Dear");
      // Then one gap request per weak or missing item; a tap fills the mail.
      await expect(page.locator("[data-w05-gap]")).toHaveCount(6);
      await page.locator('[data-w05-gap="R7"]').click();
      await expect(page.locator('[data-w05-mail="R7"]')).toContainText("R7");
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("de: arrows walk the path, Escape closes a sheet, r and Shift+R restart but keep the own list", async ({ page }) => {
    // A phone width: there a tapped request opens in a sheet (a wide screen shows it beside the board).
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator("[data-demo-start]").click();
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner");
    // A request opens in a sheet; Escape closes the sheet and leaves the path where it was.
    await page.locator('[data-w05-row="R5"] .w05-request').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await closeSheet(page);
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const right = () => page.keyboard.press("ArrowRight");
    for (const id of ["pruefungen", "r7", "ordner-eigen"]) await advanceTo(page, id, right);
    await page.keyboard.press("ArrowLeft");
    await expect(beat(page)).toHaveAttribute("data-beat", "r7");
    await advanceTo(page, "ordner-eigen", right);

    await page.locator("[data-w05-paste-open]").click();
    await page.locator("[data-w05-paste]").fill("Backup-Konzept.docx\t02.04.2023\nSchulung_Teilnahme_2026.xlsx\t03.03.2026");
    // A key typed into a form field never restarts.
    await page.locator("[data-w05-paste]").press("r");
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner-eigen");
    await page.locator("[data-w05-paste-read]").click();
    await expect(page.locator("[data-w05-own]")).toBeVisible();

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("r");
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    for (const id of ["pruefungen", "r7", "ordner-eigen"]) await advanceTo(page, id, right);
    await expect(page.locator("[data-w05-own]")).toBeVisible();

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Shift+R");
    await expect(beat(page)).toHaveAttribute("data-beat", "ordner");
  });

  test("de: an old date in the pasted list caps the backup row once the Stichtag is set", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/demos/${SLUG}?beat=ordner-eigen`, { waitUntil: "networkidle" });
    await page.locator("[data-w05-paste-open]").click();
    await page.locator("[data-w05-paste]").fill("Backup-Konzept.docx\t02.04.2023");
    await page.locator("[data-w05-paste-read]").click();
    const card = page.locator('[data-w05-own-card="Backup-Konzept.docx"]');
    await expect(card).toBeVisible();
    await page.locator("[data-w05-stichtag]").fill("2026-12-10");
    await expect(card).toContainText("2023");
    await expect(page.locator('[data-w05-own-card="Backup-Konzept.docx"] [data-state="fail"]')).not.toHaveCount(0);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("de: on a wide screen a tapped request opens beside the board, and a switch shows the row it broke", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/demos/${SLUG}?beat=pruefungen`, { waitUntil: "networkidle" });
    const panel = page.locator("[data-w05-panel]");
    await expect(panel).toBeVisible();
    await page.locator('[data-w05-switch="approval"]').click();
    await expect(panel).toHaveAttribute("data-w05-panel", "R8");
    await page.locator('[data-w05-row="R3"] .w05-request').click();
    await expect(panel).toHaveAttribute("data-w05-panel", "R3");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });

  test("en: free play puts any file against any request", async ({ page }) => {
    await page.goto(`/en/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator("[data-demo-explore]").click();
    await page.locator('[data-w05-item="R5"]').click();
    await expect(page.locator('[data-w05-target="R5"]')).toBeVisible();
    await page.locator('[data-w05-card="training-records_2026.csv"]').click();
    await page.locator('[data-w05-target="R5"]').click();
    await expect(page.locator('[data-w05-checklist="training-records_2026.csv"]')).toBeVisible();
    await page.locator("[data-w05-putback]").click();
    await expect(page.locator("[data-w05-hand]")).toBeVisible();
  });
});
