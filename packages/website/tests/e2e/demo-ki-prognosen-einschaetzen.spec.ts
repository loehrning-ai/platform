import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { KIT_CSV } from "../../src/lib/demo-cases/ki-prognosen-einschaetzen/kit-series";

/**
 * "Die Fehlerliste" (workshop 01) on the v3 shell: the bet gates the first
 * beat, every number on screen is the kit's (loesungen.md), the own file is
 * checked in the tab with no request, R and Shift+R reset the bets but never
 * the owner, keys typed into a field stay in the field, and the downloads
 * carry the visitor's own words. Reduced motion shows each end frame at once,
 * so the assertions never wait for an animation.
 */
const PATH = "/demos/ki-prognosen-einschaetzen";
const NUR_IST = readFileSync(
  fileURLToPath(
    new URL("../../src/lib/demo-cases/ki-prognosen-einschaetzen/__fixtures__/linsensuppe-nur-ist.csv", import.meta.url),
  ),
  "utf8",
);

async function open(page: Page, query = "") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${PATH}${query}`, { waitUntil: "networkidle" });
  await expect(page.locator("[data-demo-stage]")).toBeVisible();
}

const caption = (page: Page) => page.locator("[data-demo-caption]");
const beat = (page: Page) => page.locator("[data-fl-beat]");

test.describe("Die Fehlerliste", () => {
  test("the bet gates beat 1, then the baseline shows the kit's numbers", async ({ page }) => {
    await open(page);
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "schaetzen");
    await expect(page.locator('[data-fl-card="tool"]')).toContainText("94,2 %");
    await page.locator("body").press("ArrowRight");
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "schaetzen");
    await page.locator('[data-fl-guess="85"]').click();
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "messlatte");
    await expect(caption(page)).toHaveText("21 % kleinere Fehler. Näher dran in 30 von 50 Wochen.");
    const notes = page.locator('[data-fl-notes="messlatte"]');
    await expect(notes).toContainText("Deine Schätzung: um 85 %. Gerechnet: 92,6 %.");
    await expect(notes).toContainText("1,6 Prozentpunkte");
    await expect(notes).toContainText("Ø Fehler Prognose 33,3 Gläser, „wie letzte Woche“ 42,2 Gläser");
    await expect(page.locator("[data-fl-tally]")).toContainText("33,3");
    await expect(page.locator("[data-fl-pin]")).toContainText("Regel 167 daneben, Prognose 34");
  });

  test("the range waits for a tip and counts 36 of 50", async ({ page }) => {
    await open(page, "?beat=spanne");
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "spanne");
    await expect(caption(page)).toContainText("Die Spanne soll 80 % der Wochen fassen.");
    await page.locator('[data-fl-tip="fewer"]').click();
    await expect(caption(page)).toHaveText("36 von 50 Wochen in der Spanne. Versprochen waren 40.");
    const notes = page.locator('[data-fl-notes="spanne"]');
    await expect(notes).toContainText("Vor dem 07.04. 9/12, ab dem 07.04. 27/38. 11 der 14 Fehltreffer");
    await expect(notes).toContainText("11 %");
  });

  test("the costs pick 748, the canteen chip 729", async ({ page }) => {
    await open(page, "?beat=planzahl");
    await expect(caption(page)).toHaveText("Plane 748, nicht 729.");
    await expect(page.locator("[data-fl-plan]")).toHaveText("748");
    const ledger = page.locator("[data-fl-ledger]");
    for (const value of ["2.052 €", "1.105 €", "1.023 €"]) await expect(ledger).toContainText(value);
    await expect(page.locator('[data-fl-notes="planzahl"]')).toContainText(
      "In 5 der letzten 26 Wochen hätte 748 nicht gereicht, in 19",
    );
    await page.locator('[data-fl-preset="ohne"]').click();
    await expect(caption(page)).toHaveText("Planzahl 729: bei diesen Kosten die Prognose selbst.");
    await expect(ledger).toContainText("3.270 €");
    await page.locator('[data-fl-cost="left"]').fill("0,40");
    await expect(caption(page)).toHaveText("Plane 748, nicht 729.");
  });

  test("the rule frees 37 weeks, names the owner and hands out the filled rule", async ({ page }) => {
    await open(page, "?beat=regel");
    await expect(caption(page)).toHaveText("37 Wochen frei, 15 Wochen entscheidet eine Person.");
    const notes = page.locator('[data-fl-notes="regel"]');
    await expect(notes).toContainText("03.02.: Daten vollständig rot.");
    await expect(notes).toContainText("21.04. bis 21.07.");
    await expect(notes).toContainText("Die Regel schlägt 2 Wochen nach");
    await expect(page.locator("[data-fl-plan-line]")).toHaveText(
      "Woche ab 29.12.: alle vier Lampen grün. Planzahl 748 frei.",
    );
    await expect(page.locator("[data-fl-verdict]")).toHaveAttribute("data-fl-verdict", "free");

    // Keys typed into the owner field stay there: no restart, no beat change.
    const owner = page.locator("[data-fl-owner]");
    await owner.fill("");
    await owner.pressSequentially("Leitung Disposition r");
    await owner.press("ArrowLeft");
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "regel");
    await expect(owner).toHaveValue("Leitung Disposition r");
    await owner.fill("Leitung Disposition");

    await page.locator("[data-fl-strip]").fill("15");
    await expect(page.locator("[data-fl-verdict]")).toHaveAttribute("data-fl-verdict", "person");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("[data-fl-download-rule]").click(),
    ]);
    expect(download.suggestedFilename()).toBe("pruefregel-linsensuppe-500-ml.md");
    const text = readFileSync((await download.path()) as string, "utf8");
    expect(text).toContain("Leitung Disposition");
    expect(text).toContain("748");
    expect(text).toContain("Linsensuppe 500 ml");
  });

  test("r and Shift+R go back to beat 1 and clear the bet, the owner stays", async ({ page }) => {
    await open(page);
    await page.locator('[data-fl-guess="75"]').click();
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "messlatte");
    await page.locator("body").press("r");
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "schaetzen");
    await expect(page.locator('[data-fl-guess="75"]')).toHaveAttribute("aria-pressed", "false");

    const marks = page.locator("[data-beat-rail]:visible [data-beat-mark]");
    await marks.nth(4).click();
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "regel");
    const owner = page.locator("[data-fl-owner]");
    await owner.fill("Schichtleitung");
    // Out of the field first: inside it, R is a letter (the test above).
    await owner.blur();
    await page.keyboard.press("Shift+R");
    await expect(beat(page)).toHaveAttribute("data-fl-beat", "schaetzen");
    await marks.nth(4).click();
    await expect(page.locator("[data-fl-owner]")).toHaveValue("Schichtleitung");
  });

  test("checks an own file in the tab: rules only without a forecast, too few forecast weeks, one problem per line", async ({
    page,
  }) => {
    await open(page, "?beat=meine-daten");
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));

    const paste = page.locator("[data-fl-paste]");
    const check = page.locator("[data-fl-check]");
    const result = page.locator("[data-fl-own-result]");
    await paste.fill(NUR_IST);
    await check.click();
    await expect(result).toContainText("Ohne gespeicherte alte Prognosen gibt es keine Prüfung 1.");
    await expect(result).toContainText("„wie Vorjahreswoche“, mittlerer Fehler 40,0");

    const lines = KIT_CSV.trim().split("\n");
    await paste.fill([lines[0], ...lines.slice(-20)].join("\n"));
    await check.click();
    await expect(result).toContainText("Spanne und Lampen brauchen 33 Wochen mit gespeicherter Prognose. Du hast 19.");

    await paste.fill("woche;ist\nOkt 25;12");
    await check.click();
    await expect(page.locator("[data-fl-problem]")).toHaveText(
      "Zeile 2: „Okt 25“ ist kein Datum. Erlaubt: 2025-10-27, 27.10.2025, KW 44/2025.",
    );

    await paste.fill(KIT_CSV);
    await page.locator("[data-fl-own-short]").fill("1,50");
    await page.locator("[data-fl-own-left]").fill("0,40");
    await check.click();
    await expect(page.locator('[data-fl-own-line="plan"]')).toContainText("Planzahl 748");
    await expect(page.locator('[data-fl-own-line="rule"]')).toContainText("37 von 52 Wochen frei");
    expect(requests, "the own file never leaves the tab").toEqual([]);
  });

  test("serves the skill, both kit editions and the rule template", async ({ request }) => {
    for (const path of [
      "/skills/prognose-pruefen.zip",
      "/workshops/ki-prognosen-einschaetzen/prognose-pruefen.zip",
      "/workshops/ki-prognosen-einschaetzen/forecast-check.zip",
      "/vorlagen/pruefregel.md",
      "/vorlagen/release-rule.en.md",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });

  test("speaks English on /en with the same numbers", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/en${PATH}?beat=planzahl`, { waitUntil: "networkidle" });
    await expect(caption(page)).toHaveText("Plan 748, not 729.");
    await expect(page.locator("[data-fl-ledger]")).toContainText("€2,052");
  });
});
