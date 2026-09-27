import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Workshop 03 interactive demo (static page under public/). The page must show its
// final state on load: every number is in the HTML, nothing waits for a click.
const DEMO = "/workshops/datenbereitschaft-fuer-ki/demo.html";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test.describe(`workshop 03 demo at ${viewport.width}px`, () => {
    test.use({ viewport });

    test("shows the final numbers on load, takes a vote and logs no errors", async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(DEMO);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ending MRR, asked twice");
      await expect(page.locator("h1")).toHaveCount(1);

      // Wrong answer, the database check and the right answer are all present without interaction.
      const wrong = page.locator("#wrong");
      await expect(wrong.locator('[data-v="g01.bad.v0"]')).toHaveText("−€19,960");
      await expect(page.locator("#again")).toContainText("€334,675");
      await expect(page.locator("#failed")).toContainText("Right answer to a different question.");
      await expect(page.locator("#failed")).toContainText("€32,380");
      await expect(page.locator("#again").getByText("Values match")).toBeVisible();

      // The vote comes before the check in reading order.
      const voteTop = await page.locator("#vote").evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
      const checkTop = await page.locator("#failed").evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
      expect(voteTop).toBeLessThan(checkTop);

      await page.getByRole("radio", { name: "Ask for a check first" }).check();
      await expect(page.locator("#vote-status")).toContainText("Ask for a check first");
      await expect(page.locator("#vote-echo")).toContainText("Ask for a check first");

      // No brutalist leftovers and no horizontal page scroll.
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        hidden: [...document.querySelectorAll("main section, main header")].filter(
          (node) => Number(getComputedStyle(node).opacity) < 1,
        ).length,
      }));
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.hidden).toBe(0);

      // On phones the material strip is two rows: brand + back link, then the materials rail.
      if (viewport.width <= 600) {
        const strip = await page.locator(".wf-strip").evaluate((node) => node.getBoundingClientRect().height);
        expect(strip).toBeLessThanOrEqual(96);
        await expect(page.getByRole("link", { name: "Workshop-Seite auf Deutsch" })).toBeVisible();

        // The rail lists the site's materials with short names (as the Workshop 04 strip does); it may
        // scroll, but the current tab sits fully inside it, clear of the 32px edge fades.
        const rail = await page.locator(".wf-mats").evaluate((node) => {
          const box = node.getBoundingClientRect();
          const current = node.querySelector("[aria-current=page]")!.getBoundingClientRect();
          return {
            text: (node as HTMLElement).innerText.replace(/\s+/g, " ").trim(),
            clearLeft: current.left - box.left,
            clearRight: box.right - current.right,
          };
        });
        expect(rail.text).toBe("01 Deck 02 Demo 03 Kit 04 Guide 05 Lab 06 Builder");
        expect(rail.clearLeft).toBeGreaterThanOrEqual(0);
        expect(rail.clearRight).toBeGreaterThanOrEqual(32);
        await expect(page.getByRole("link", { name: "Interactive demo" })).toBeHidden();

        // The route is one row of numbered 44px stations; each keeps its step name as its accessible name.
        const route = page.locator("#route a");
        await expect(route).toHaveCount(6);
        await expect(page.getByRole("link", { name: "Wrong answer, 2 min" })).toBeVisible();
        const stations = await route.evaluateAll((links) =>
          links.map((link) => {
            const box = link.getBoundingClientRect();
            return { top: Math.round(box.top), width: box.width, height: box.height };
          }),
        );
        expect(new Set(stations.map((station) => station.top)).size).toBe(1);
        for (const station of stations) {
          expect(station.width).toBeGreaterThanOrEqual(44);
          expect(station.height).toBeGreaterThanOrEqual(44);
        }

        // The question card starts inside the first screen (fully visible at 390).
        const card = await page.locator("#wrong .qcard").evaluate((node) => {
          const box = node.getBoundingClientRect();
          return { top: box.top + window.scrollY, bottom: box.bottom + window.scrollY };
        });
        expect(card.top).toBeLessThan(viewport.height);
        if (viewport.width >= 390) expect(card.bottom).toBeLessThanOrEqual(viewport.height);
      }

      await page.locator("#hood > summary").click();
      await expect(page.locator("#hood-body")).toContainText("mrr_summary_monthly");

      expect(errors).toEqual([]);
    });
  });
}

test("the demo passes axe on load", async ({ page }) => {
  await page.goto(DEMO);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
});

test("the replay button honours reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(DEMO);
  await expect(page.locator("#replay")).toBeHidden();
  await expect(page.locator('#wrong [data-v="g01.bad.v2"]')).toHaveText("€42,565");
});
