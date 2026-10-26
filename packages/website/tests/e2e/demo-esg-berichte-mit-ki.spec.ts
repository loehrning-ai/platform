import { expect, test, type Page } from "@playwright/test";

/**
 * W04 "Nachweisprobe" on the v3 shell: the first screen, the certificate
 * bet, the four beats of the kit, the visitor's own sentence and the keys.
 * The shared shell checks (fold, rail, glass) live in demo-v3-shell.spec.ts.
 */
const SLUG = "esg-berichte-mit-ki";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const stage = (page: Page) => page.locator("[data-demo-stage]");
const caption = (page: Page) => page.locator("[data-demo-caption]");
const clock = (page: Page) => page.locator("[data-demo-clock]");

test.describe(`/demos/${SLUG}`, () => {
  test("first screen: the sentence, the certificate and both calls above the fold at 390 x 664", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await expect(stage(page).locator(".nw-sentence")).toHaveText("Zertifizierte Bio-Weinberge");
    await expect(stage(page)).toContainText("Gültig bis: 31.08.2026");
    const fold = await page.evaluate(() => {
      const bar = document.querySelector("[data-mobile-tab-bar]");
      return Math.min(bar ? bar.getBoundingClientRect().top : window.innerHeight, window.innerHeight);
    });
    for (const bet of ["yes", "no"]) {
      const box = await page.locator(`[data-bet="${bet}"]`).boundingBox();
      expect(box, bet).not.toBeNull();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(fold + 0.5);
    }
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
  });

  test("the call, then the probe: Darf so nicht raus, 46 Tage, 12 von 40 ha", async ({ page }) => {
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator('[data-bet="yes"]').click();
    await expect(clock(page)).toHaveAttribute("data-beat", "probe");
    await expect(caption(page)).toContainText("Darf so nicht raus", { timeout: 6000 });
    await expect(stage(page)).toContainText("46 Tage abgelaufen");
    await expect(stage(page)).toContainText("12 von 40 ha");
    await expect(page.locator("[data-bet-line]")).toContainText("Das Zertifikat liegt bei");
  });

  test("r resets the beats but never the own sentence; Ctrl+R and r in a field are left alone", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=deine-saetze`, { waitUntil: "networkidle" });
    await expect(clock(page)).toHaveAttribute("data-beat", "deine-saetze");
    const field = page.getByLabel("Satz", { exact: true });
    await field.fill("Unser Strom 2025: 412 MWh");
    await field.press("r");
    await expect(field).toHaveValue("Unser Strom 2025: 412 MWhr");
    await expect(clock(page)).toHaveAttribute("data-beat", "deine-saetze");
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent("keydown", { key: "r", ctrlKey: true, bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(false);
    await field.blur();
    await page.keyboard.press("r");
    await expect(clock(page)).toHaveAttribute("data-beat", "satz");
    await expect(page.locator('[data-bet][aria-pressed="true"]')).toHaveCount(0);
    // The form waits for its own beat, and keeps what the visitor typed.
    await expect(page.locator("[data-own-sentences]")).toBeHidden();
    await expect(field).toHaveValue("Unser Strom 2025: 412 MWhr");
  });

  test("the own beat's stage shows a worked example until the visitor checks a sentence", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=deine-saetze`, { waitUntil: "networkidle" });
    const preview = stage(page).locator("[data-own-preview]");
    await expect(preview).toHaveAttribute("data-own-preview", "example");
    await expect(preview).toContainText("Unser Strom 2025: 412 MWh");
    await expect(preview.locator(".nw-check")).toHaveCount(4);
    await expect(preview).toContainText("LÜCKE");
    await page.getByLabel("Satz", { exact: true }).fill("Unser Strom 2025: 300 MWh");
    await page.locator("[data-own-sentences]").getByRole("button", { name: "Prüfen" }).click();
    await page.getByRole("button", { name: "Zur Liste" }).click();
    await expect(preview).toHaveAttribute("data-own-preview", "latest");
    await expect(preview).toContainText("Unser Strom 2025: 300 MWh");
  });

  test("three sentences, the folder and the late invoice", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=drei-saetze`, { waitUntil: "networkidle" });
    const next = page.locator("[data-demo-next]");
    for (const [index, bet] of (["yes", "yes", "no"] as const).entries()) {
      // One way forward: "Weiter" waits for each verdict, then moves to the next sentence.
      await expect(next).toHaveCount(0);
      await page.locator(`[data-bet="${bet}"]`).click();
      if (index === 1) await expect(stage(page).locator('[data-ban="4c"]')).toContainText("VERBOTSLISTE 4c", { timeout: 6000 });
      if (index < 2) {
        await next.click({ timeout: 6000 });
        await expect(clock(page)).toHaveAttribute("data-beat", "drei-saetze");
      }
    }
    await expect(page.getByRole("button", { name: "Nächster Satz" })).toHaveCount(0);
    await expect(page.locator("[data-tally]")).toContainText("Du hättest 2 von 3 Sätzen so rausgeschickt");
    await expect(page.locator("[data-tally]")).toContainText("Den belegten Satz hättest du zurückgehalten.");

    await page.goto(`/demos/${SLUG}?beat=ordner`, { waitUntil: "networkidle" });
    await expect(next).toHaveCount(0);
    await page.getByRole("button", { name: "Eins mehr" }).click();
    await page.locator("[data-step-action]").click();
    await expect(page.locator('[data-doc="septemberInvoice"]')).toContainText("Q1, Q2, C5, F2, F3, B3", { timeout: 9000 });
    await expect(page.locator("[data-folder-result]")).toHaveText("9 von 21 BELEGT");
    await expect(stage(page)).toContainText("strom_2025.csv");
    await expect(page.locator('[data-row="Q1"] [data-cite]')).toHaveText(
      "strom_2025.csv Z. 3 bis 14 · strom_zusammenfassung_entwurf.txt Z. 5",
    );
    await expect(next).toBeVisible();

    await page.goto(`/demos/${SLUG}?beat=rechnung`, { waitUntil: "networkidle" });
    await expect(stage(page)).toContainText("RECHNUNG EL-25-09");
    await page.locator("[data-step-action]").click();
    await expect(caption(page)).toContainText("2 ändern ihren Status", { timeout: 11000 });
    await expect(stage(page).locator("[data-flipped]")).toHaveCount(2);
    await expect(page.locator("[data-cascade-total]")).toHaveText("320,9 MWh");
  });

  test("own sentence: a climate neutral label claim on offsets is cut under 4c, the register downloads", async ({ page }) => {
    await page.goto(`/demos/${SLUG}?beat=deine-saetze`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Zu deinen Sätzen" }).click();
    await expect(page.locator("[data-own-sentences]")).toBeInViewport();
    await page.getByLabel("Satz", { exact: true }).fill("Unser Wein ist klimaneutral");
    await page.getByRole("radio", { name: "Etikett, Verpackung oder Regal" }).check();
    await page.getByLabel("Was belegt ihn?").selectOption("offset");
    const gate = page.locator("fieldset", { hasText: "Stützt sich der Satz auf gekaufte Kompensation" });
    await gate.getByRole("radio", { name: "Ja", exact: true }).check();
    await page.locator("[data-own-sentences]").getByRole("button", { name: "Prüfen" }).click();
    const result = page.locator("[data-own-result]");
    await expect(result.locator("[data-own-decision]")).toHaveText("Streichen");
    await expect(result).toContainText("Nr. 4c");
    await page.getByRole("button", { name: "Zur Liste" }).click();
    const download = page.waitForEvent("download");
    await page.locator("[data-own-download]").click();
    expect((await download).suggestedFilename()).toBe("nachweisregister.csv");
  });

  test("reduced motion shows the end frame at once, and nothing leaves the page", async ({ page, baseURL }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const origin = new URL(baseURL ?? "http://localhost").origin;
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (/^(data|blob):/.test(url.protocol)) return;
      if (url.origin !== origin) foreign.push(url.href);
    });
    await page.goto(`/demos/${SLUG}`, { waitUntil: "networkidle" });
    await page.locator('[data-bet="yes"]').click();
    await expect(caption(page)).toContainText("Darf so nicht raus", { timeout: 1000 });
    expect(foreign).toEqual([]);
  });

  test("English: COVERED, WEAK, GAP and no German status word", async ({ page }) => {
    await page.goto(`/en/demos/${SLUG}?beat=regel`, { waitUntil: "networkidle" });
    await expect(stage(page)).toContainText("COVERED");
    await expect(stage(page)).toContainText("WEAK");
    await expect(stage(page)).toContainText("GAP");
    const text = await page.locator("[data-esg-demo]").innerText();
    for (const word of ["BELEGT", "SCHWACH", "LÜCKE"]) expect(text).not.toContain(word);
  });
});
