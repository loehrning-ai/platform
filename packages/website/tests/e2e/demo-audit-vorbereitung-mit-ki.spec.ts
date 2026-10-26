import { expect, test, type Page } from "@playwright/test";

/**
 * W05 "Die Lückenliste" on the v4 stage: the intro fits a small phone, the
 * board keeps R1 to R8 above the dock, the four checks leave two files that
 * hold, the bench shows why R7 is a gap, the probe checks a recorded Claude
 * answer against the files, and the take-home fills a gap request. Keys:
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

/** The lowest row of the board against the top of the dock, in viewport pixels. */
const rowsAboveDock = (page: Page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll(".w05-row")].map((row) => row.getBoundingClientRect().bottom);
    const dock = document.querySelector(".demo4-dock")?.getBoundingClientRect().top ?? 0;
    return { count: rows.length, lowest: Math.max(...rows), dock };
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

      // The intro card and both buttons fit the first screen; the page has not scrolled.
      const card = await page.locator("[data-demo-intro]").boundingBox();
      expect(card?.height ?? 999).toBeLessThanOrEqual(460);
      for (const selector of ["[data-demo-start]", "[data-demo-explore]"]) {
        const box = await page.locator(selector).boundingBox();
        expect((box?.y ?? 999) + (box?.height ?? 0), selector).toBeLessThanOrEqual(600);
      }
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      // Scene 1: eight requests, each linked to a file with a matching name, all above the dock.
      await page.locator("[data-demo-start]").click();
      await expect(beat(page)).toHaveAttribute("data-beat", "ordner");
      await expect(page.locator("[data-w05-row]")).toHaveCount(8);
      const fit = await rowsAboveDock(page);
      expect(fit.lowest).toBeLessThanOrEqual(fit.dock);
      expect(await cutFileNames(page)).toEqual([]);
      await page.locator("[role=slider]").first().focus();
      await page.keyboard.press("ArrowRight");
      await page.locator('[data-w05-commit="keep"]').click();
      await expect(page.locator("[data-w05-lead]")).toHaveCount(0);

      // Scene 2: the four checks leave two of eight, and the rows stay above the dock.
      await advanceTo(page, "pruefungen");
      for (const check of ["quote", "date", "scope", "approval"]) await page.locator(`[data-w05-switch="${check}"]`).click();
      await expect(page.locator("[data-w05-legend]")).toContainText(locale === "de" ? "2 von 8" : "2 of 8");
      const checked = await rowsAboveDock(page);
      expect(checked.lowest).toBeLessThanOrEqual(checked.dock);
      // The first Next opens R1, the one request that holds and still is a problem.
      await next(page).click();
      await expect(page.locator('[data-w05-evidence="R1"]')).toBeVisible();
      await closeSheet(page);

      // Scene 3: the backup report on the bench; reading its lines lights the ring, quote fails.
      await advanceTo(page, "r7");
      await page.locator('[data-w05-card="backup-report_2026-10.txt"]').click();
      await page.locator('[data-w05-target="R7"]').click();
      await expect(page.locator("[data-w05-doc]")).toBeVisible();
      await page.locator("[data-w05-readall]").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator('[data-w05-ring="quote"]')).toHaveAttribute("data-state", "fail", { timeout: 5_000 });
      for (const check of ["date", "scope", "approval"]) await expect(page.locator(`[data-w05-ring="${check}"]`)).toHaveAttribute("data-state", "pass", { timeout: 5_000 });
      // With the report read, Next first shows the four checks as rules.
      await next(page).click();
      await expect(page.locator("[data-w05-rule-sheet]")).toBeVisible();
      await closeSheet(page);

      // Scene 4, then scene 5: the recorded take is labelled with its date and model, and its quotes are found.
      await advanceTo(page, "ordner-eigen");
      await expect(page.locator("[data-w05-drop]")).toBeVisible();
      await advanceTo(page, "claude");
      const probe = page.locator("[data-w05-probe]");
      await expect(probe).toHaveAttribute("data-w05-take", `${locale}-r7-with-1`);
      await expect(probe).toContainText(locale === "de" ? "26.10.2026" : "26 October 2026");
      await expect(probe).toContainText("Claude Opus 5.5");
      expect(await page.locator('[data-w05-mark="found"]').count()).toBeGreaterThan(0);

      // Scene 6: one gap request per weak or missing item; a tap fills the mail.
      await advanceTo(page, "mitnehmen");
      await expect(page.locator("[data-w05-gap]")).toHaveCount(6);
      await page.locator('[data-w05-gap="R7"]').click();
      await expect(page.locator('[data-w05-mail="R7"]')).toContainText("R7");
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("de: arrows walk the path, Escape closes a sheet, r and Shift+R restart but keep the own list", async ({ page }) => {
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
