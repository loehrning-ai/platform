import { expect, test } from "@playwright/test";

const cases = [
  {
    locale: "de",
    path: "/workshops/datenbereitschaft-fuer-ki",
    loading: "Die Auswahl wird freigeschaltet, sobald JavaScript geladen ist.",
    noScript: "Diese Übung benötigt JavaScript.",
    validation: "Wähle eine Entscheidung aus, bevor du das Ergebnis prüfst.",
  },
  {
    locale: "en",
    path: "/en/workshops/datenbereitschaft-fuer-ki",
    loading: "The choices unlock once JavaScript has loaded.",
    noScript: "JavaScript is required for this exercise.",
    validation: "Select one decision before checking the result.",
  },
] as const;

test.describe("workshop form hydration safety", () => {
  for (const scenario of cases) {
    test(`${scenario.locale}: blocks early submission, then preserves the keyboard journey`, async ({ page }) => {
      let releaseScripts = () => {};
      const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve; });
      let heldScripts = 0;
      let guardNavigations = false;
      const blockedTransmissions: string[] = [];
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const carriesAnswers = [...url.searchParams.keys()].some((key) => /^workshop-(decision|evidence)-/.test(key))
          || /workshop-(decision|evidence)-/.test(request.postData() ?? "");
        // Catch the regression before a native GET/POST can leave the browser.
        if (carriesAnswers || (guardNavigations && request.isNavigationRequest() && request.frame() === page.mainFrame())) {
          blockedTransmissions.push(request.method());
          await route.abort("blockedbyclient");
          return;
        }
        if (request.resourceType() === "script" && url.pathname.startsWith("/_next/")) {
          heldScripts += 1;
          await scriptsReady;
        }
        await route.continue();
      });

      try {
        // DOMContentLoaded waits for the held scripts; inspect the streamed SSR instead.
        await page.goto(scenario.path, { waitUntil: "commit" });
        const lab = page.locator("[data-workshop-decision-lab]");
        await expect(lab).toBeVisible();
        await expect.poll(() => heldScripts).toBeGreaterThan(0);
        await expect(lab).toContainText(scenario.loading);
        await expect(lab.locator("form")).toHaveAttribute("aria-busy", "true");
        const radios = lab.getByRole("radio");
        await expect(radios).toHaveCount(6);
        for (const radio of await radios.all()) await expect(radio).toBeDisabled();
        const submit = lab.locator('button[type="submit"]');
        await expect(submit).toBeDisabled();
        guardNavigations = true;
        const initialUrl = page.url();

        // A locator click auto-waits for the associated disabled input. Use a
        // real pointer click to prove the browser itself keeps the label inert.
        const label = lab.locator("label").first();
        await label.scrollIntoViewIfNeeded();
        const box = await label.boundingBox();
        expect(box).not.toBeNull();
        await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        await radios.first().evaluate((radio) => { (radio as HTMLInputElement).click(); (radio as HTMLInputElement).focus(); });
        await submit.evaluate((button) => (button as HTMLButtonElement).click());
        await page.keyboard.press("Enter");
        await expect(lab.getByRole("radio", { checked: true })).toHaveCount(0);
        await expect(page).toHaveURL(initialUrl);
        expect(blockedTransmissions).toEqual([]);

        releaseScripts();
        await expect(submit).toBeEnabled();
        await expect(lab.locator("form")).toHaveAttribute("aria-busy", "false");
        await expect(lab).not.toContainText(scenario.loading);
        await submit.focus();
        await page.keyboard.press("Enter");
        await expect(lab.getByRole("alert")).toHaveText(scenario.validation);
        await expect(radios.first()).toBeFocused();
        await radios.first().check();
        await lab.locator("fieldset").nth(1).getByRole("radio").first().check();
        await submit.focus();
        await page.keyboard.press("Enter");
        await expect(lab.getByRole("status")).not.toBeEmpty();
        const reset = lab.locator('button[type="reset"]');
        await expect(reset).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(radios.first()).toBeFocused();
        await expect(lab.getByRole("radio", { checked: true })).toHaveCount(0);
        await expect(lab.getByRole("status")).toBeEmpty();
        await expect(page).toHaveURL(initialUrl);
        expect(blockedTransmissions).toEqual([]);
        expect(errors).toEqual([]);
      } finally {
        releaseScripts();
        await page.unrouteAll({ behavior: "wait" });
      }
    });

  }

  test.describe("without JavaScript", () => {
    // Keep each project's real desktop/mobile context while disabling scripts.
    test.use({ javaScriptEnabled: false });
    for (const scenario of cases) {
      test(`${scenario.locale}: explains the disabled exercise`, async ({ page }) => {
        await page.goto(scenario.path);
        const lab = page.locator("[data-workshop-decision-lab]");
        await expect(lab).toContainText(scenario.noScript);
        await expect(lab.locator('button[type="submit"]')).toBeDisabled();
        await expect(lab.getByRole("radio")).toHaveCount(6);
        for (const radio of await lab.getByRole("radio").all()) await expect(radio).toBeDisabled();
        await expect(page.locator('a[href$="/guide.html"]').first()).toBeVisible();
      });
    }
  });
});
