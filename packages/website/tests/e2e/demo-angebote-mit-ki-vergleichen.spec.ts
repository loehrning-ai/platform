import { expect, test, type Page } from "@playwright/test";
import { expectGlassBudget } from "./fixtures/glass";

/**
 * W06 "Die Vergleichsbasis" on a phone: the guess commits before the reveal, the cost lines turn the
 * order from B, C, A to C, A, B, the paper index flips first place to A at +7 %, every total and caption fits
 * a 320 px phone for every guess and stop, a line one offer lacks stays open (never 0) and is listed under
 * the stage, a restart keeps the visitor's own lines, and the take-home fills the basis.
 */
const SLUG = "angebote-mit-ki-vergleichen";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/reduced motion/i.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The offers top to bottom as the chart shows them. */
const order = (page: Page) =>
  page.locator("[data-av-chart] [data-option]").evaluateAll((rows) =>
    rows
      .map((row) => ({ name: (row.getAttribute("data-option") ?? "").slice(0, 1), top: row.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map((row) => row.name)
      .join(""),
  );

test.describe(`/demos/${SLUG}`, () => {
  for (const [prefix, locale] of [["", "de"], ["/en", "en"]] as const) {
    test(`${locale}: guess B, the lines turn the order to C, A, B, at 390 x 664`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(`${prefix}/demos/${SLUG}`, { waitUntil: "networkidle" });

      const lever = await page.locator("[data-demo-lever]").boundingBox();
      expect((lever?.y ?? 0) + (lever?.height ?? 0)).toBeLessThanOrEqual(664 + 0.5);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      // Before the guess: goods order, no winner, no totals.
      await expect.poll(() => order(page)).toBe("BCA");
      await expect(page.locator("[data-av-chart] [data-win]")).toHaveCount(0);

      await page.locator('[data-bet^="B"]').click();
      await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "kipp");
      await expect(page.locator('[data-av-chart] [data-option^="C"][data-win]')).toHaveCount(1, { timeout: 12_000 });
      await expect.poll(() => order(page)).toBe("CAB");
      const total = locale === "de" ? "24.910 €" : "€24,910";
      await expect(page.locator('[data-av-chart] [data-option^="C"] [data-av-total]')).toHaveText(total);
      // The sources list every line of the selected offer with its place in the document.
      await page.locator('[data-av-chart] [data-option^="B"] button').click();
      await expect(page.locator("[data-av-sources]")).toHaveAttribute("data-av-sources", /^B /);
      await expect(page.locator("[data-av-sources] li")).toHaveCount(6);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expectGlassBudget(page, `${prefix}/demos/${SLUG} after the reveal`);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  for (const width of [320, 390]) {
    test(`de: at ${width} x 664 every guess and every paper stop keeps the totals inside the stage and the caption whole`, async ({ page }) => {
      await page.setViewportSize({ width, height: 664 });
      const fit = () =>
        page.evaluate(() => {
          const stage = document.querySelector("[data-demo-stage]")!.getBoundingClientRect();
          const out = [...document.querySelectorAll("[data-av-chart] [data-option] :is(.av-row-value, .av-chip)")]
            .map((element) => ({ text: element.textContent, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.right > stage.right + 0.5 || rect.left < stage.left - 0.5)
            .map(({ text }) => text);
          const caption = document.querySelector("[data-demo-caption]")!;
          return { out, clamped: caption.scrollHeight > caption.clientHeight + 1, caption: caption.textContent };
        });
      for (const bet of ["A", "B", "C"]) {
        await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
        await page.locator(`[data-bet^="${bet}"]`).click();
        await expect(page.locator('[data-av-chart] [data-option^="C"][data-win]')).toHaveCount(1, { timeout: 12_000 });
        expect(await fit(), `kipp, guess ${bet}`).toMatchObject({ out: [], clamped: false });
        // A right guess carries one chip, not two.
        await expect(page.locator(`[data-av-chart] [data-option^="${bet}"] .av-chip`)).toHaveCount(1);
        await page.locator("[data-beat-rail]:visible [data-beat-mark]").nth(3).click();
        await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "papier");
        for (let stop = 0; stop < 5; stop += 1) {
          await page.locator(".av-stop").nth(stop).click();
          await expect(page.locator(".av-stop input").nth(stop)).toBeChecked();
          expect(await fit(), `papier, guess ${bet}, stop ${stop}`).toMatchObject({ out: [], clamped: false });
        }
        await expect(page.locator("[data-demo-caption]")).toContainText("Entscheidet: Fracht");
        expect(await overflow(page)).toBeLessThanOrEqual(0);
      }
    });
  }

  test("de: the paper index hands first place to A between +5 % and +7 % (the kit: 6,97 %)", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=papier`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "papier");
    await expect(page.locator('[data-av-chart] [data-option^="C"][data-win]')).toHaveCount(1);
    await page.locator(".av-stop").nth(3).click();
    await expect(page.locator('[data-av-chart] [data-option^="A"][data-win]')).toHaveCount(1);
    await page.locator(".av-stop").nth(2).click();
    await expect(page.locator('[data-av-chart] [data-option^="C"][data-win]')).toHaveCount(1);
  });

  test("de: a missing line stays open, r keeps the visitor's lines, only the clear button drops them", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=deins`, { waitUntil: "networkidle" });
    // Before the visitor's lines, the stage shows the kit's numbers and names the kit's file.
    await expect(page.locator(".av-file")).toHaveText("kostenzeilen.csv");
    const field = page.locator("[data-av-own] textarea");
    await field.fill("angebot,zeile,betrag,je\nX,Ware,1000,jährlich\nX,Fracht,100,jährlich\nY,Ware,900,jährlich\nZ,Ware,950,jährlich");
    await page.getByRole("button", { name: "Rechnen" }).click();
    // Y and Z have no freight line: their totals are open, not 900, and nobody wins.
    await expect(page.locator('[data-av-chart] [data-option="Y"] [data-av-total]')).toHaveText("offen");
    await expect(page.locator("[data-av-chart] [data-win]")).toHaveCount(0);
    await expect(page.locator(".av-file")).toHaveCount(0);
    await expect(page.locator("[data-demo-caption]")).toHaveText("Y nennt keine Zeile Fracht. Sie bleibt offen.");
    await expect(page.locator("[data-av-open] li")).toHaveText(["Y: Fracht", "Z: Fracht"]);

    // A key typed into the field never restarts.
    await field.press("r");
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "deins");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("r");
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "tipp");
    await page.goto(`/demos/${SLUG}?beat=deins`, { waitUntil: "networkidle" });
    await page.locator("[data-av-own] textarea").fill("");
    await page.getByRole("button", { name: "Zweiten Fall einsetzen" }).click();
    await expect(page.locator('[data-av-chart] [data-option="X Kassel"][data-win]')).toHaveCount(1);
    await page.keyboard.press("Shift+R");
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "tipp");
    await page.locator("[data-beat-rail]:visible [data-beat-mark]").nth(4).click();
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "deins");
    await expect(page.locator("[data-av-own] textarea")).toHaveValue(/X Kassel/);
    await page.getByRole("button", { name: "Eigene Eingaben löschen" }).click();
    await expect(page.locator("[data-av-own] textarea")).toHaveValue("");
  });

  test("de: the take-home fills the basis from the stage", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=mitnehmen`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-demo-clock]")).toHaveAttribute("data-beat", "mitnehmen");
    const download = page.waitForEvent("download");
    // The filled basis is the beat's lever and has its own name; the blank template keeps vergleichsbasis.md.
    await page.locator("[data-demo-lever]").getByRole("button", { name: "Gefüllte Basis laden" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("vergleichsbasis-mit-zahlen.md");
    const text = await (await file.createReadStream()).toArray();
    const body = Buffer.concat(text as Buffer[]).toString("utf8");
    expect(body).toContain("24.910 €");
    expect(body).not.toMatch(/\{\{\w+\}\}/);
  });
});
