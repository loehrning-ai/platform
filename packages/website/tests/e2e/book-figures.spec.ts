import { expect, test, type Page } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * The data book "Von außen gesehen": its figures, on the real built pages.
 * Covers what a reader sees and does: the figures render as finished charts,
 * the C4 story steps work from the keyboard, reduced motion shows the finished
 * figures, nothing scrolls sideways at 390px, focus rings are one width, and
 * the cover number is on the first screen. Assertions target structure and
 * stable strings, never prose.
 */

const BOOK = "/buecher/ki-landschaft";
const CHAPTERS = [
  "01_eisberg",
  "02_sagen_zeigen",
  "03_zweimal_gemessen",
  "04_branche_land",
  "05_reden_einstellen",
  "06_eu_ki_verordnung",
  "07_pilot",
  "08_methodik",
] as const;

async function hydrated(page: Page): Promise<void> {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
}

test.describe("data book cover", () => {
  test("the headline number and its dots are on the first screen of a laptop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BOOK, { waitUntil: "load" });
    const hero = page.locator("[data-book-hero]");
    await expect(hero.getByText("3,8 %")).toBeVisible();
    const box = await hero.locator(".bk-hero-number").boundingBox();
    expect(box, "hero number box").not.toBeNull();
    expect(box!.y + box!.height, "number must end above the fold (800px)").toBeLessThan(800);
    // 3,8 is three whole dots and one dot at 80 percent, said as "knapp 4", never four full dots.
    await expect(hero.locator("circle.bk-dot--marked:not(.bk-dot--part)")).toHaveCount(3);
    await expect(hero.locator("circle.bk-dot--part")).toHaveCount(1);
    await expect(hero).toContainText("knapp 4");
    await expect(page.getByText("Vorläufig")).toHaveCount(0);
  });
});

test.describe("data book figures", () => {
  test("every chapter renders its figures as finished charts without a provisional banner or console error", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors = collectBrowserErrors(page);
    for (const chapter of CHAPTERS) {
      const url = `${BOOK}/${chapter}`;
      const res = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(res?.status(), url).toBe(200);
      const figures = page.locator("figure.bf, figure.bf-figure");
      const count = await figures.count();
      for (let i = 0; i < count; i++) {
        const figure = figures.nth(i);
        // The server markup already holds the finished chart: an svg with a title.
        await expect(figure.locator("svg title").first(), `${url} figure ${i}`).toBeAttached();
      }
      await expect(page.getByText("Vorläufige Daten"), url).toHaveCount(0);
    }
    const noise = meaningfulBrowserErrors(errors);
    expect(noise, `console errors\n${formatBrowserErrors(noise)}`).toEqual([]);
  });

  test("C4 steps work from the keyboard: Tab to a step button, Enter selects it", async ({ page }) => {
    // Under 700px of height the pinned stage gives way to stacked steps by design, so keep the height.
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 900 });
    await page.goto(`${BOOK}/03_zweimal_gemessen`, { waitUntil: "load" });
    await hydrated(page);
    const story = page.locator('figure[data-figure-id="c4"]');
    await expect(story.locator(".bf-wf")).toHaveAttribute("data-step", "0");
    const third = story.getByRole("button", { name: /^Schritt 3:/ });
    await third.focus();
    await page.keyboard.press("Enter");
    await expect(story.locator(".bf-wf")).toHaveAttribute("data-step", "2");
    await expect(third).toHaveAttribute("aria-pressed", "true");
    await expect(story.locator(".bf-wf-count")).toContainText("Schritt 3 von 4");
    // Space works too, and the other steps are reachable in order.
    const fourth = story.getByRole("button", { name: /^Schritt 4:/ });
    await fourth.focus();
    await page.keyboard.press("Space");
    await expect(story.locator(".bf-wf")).toHaveAttribute("data-step", "3");
  });

  test("the waffle switches between the narrow and the broad reading with the keyboard", async ({ page }) => {
    await page.goto(`${BOOK}/02_sagen_zeigen`, { waitUntil: "load" });
    await hydrated(page);
    const figure = page.locator('figure.bf[data-bf-id="c3"]');
    const filled = figure.locator("svg circle[data-group][fill='#b73a15']");
    await figure.getByRole("button", { name: "Weite Lesart" }).focus();
    await page.keyboard.press("Enter");
    await expect(filled).toHaveCount(64);
    await figure.getByRole("button", { name: "Enge Lesart" }).focus();
    await page.keyboard.press("Enter");
    await expect(filled).toHaveCount(25);
  });

  test("reduced motion shows every figure finished and still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const chapter of ["02_sagen_zeigen", "03_zweimal_gemessen", "04_branche_land", "05_reden_einstellen"]) {
      await page.goto(`${BOOK}/${chapter}`, { waitUntil: "load" });
      await hydrated(page);
      // The C4 story shows one state per step by design (stacked steps, last one finished): checked below.
      const svgs = page.locator("figure.bf svg[data-progress]");
      const n = await svgs.count();
      for (let i = 0; i < n; i++) {
        await expect(svgs.nth(i), `${chapter} svg ${i}`).toHaveAttribute("data-progress", "1");
      }
      // Nothing is left half-transparent: no element of a figure stays below full opacity.
      const faded = await page.evaluate(() =>
        Array.from(document.querySelectorAll("figure.bf svg [opacity]"))
          .filter((el) => Number(el.getAttribute("opacity")) < 1)
          .map((el) => el.tagName),
      );
      expect(faded, `${chapter}: faded marks under reduced motion`).toEqual([]);
      if (chapter === "03_zweimal_gemessen") {
        // Stacked steps: every step card carries its chart, and the last one is the finished figure.
        const steps = page.locator('figure[data-figure-id="c4"] .bf-wf-static svg');
        await expect(steps).toHaveCount(4);
        await expect(steps.nth(3)).toHaveAttribute("data-progress", "1");
      }
    }
  });

  test("no figure and no table scrolls the page sideways at 390px", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const chapter of CHAPTERS) {
      await page.goto(`${BOOK}/${chapter}`, { waitUntil: "load" });
      await hydrated(page);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `${chapter}: scrollWidth ${scrollWidth} > ${innerWidth}`).toBeLessThanOrEqual(innerWidth + 1);
      const leaking = await page.evaluate(() =>
        Array.from(document.querySelectorAll("figure")).filter((f) => f.getBoundingClientRect().right > window.innerWidth + 1).length,
      );
      expect(leaking, `${chapter}: figures wider than the screen`).toBe(0);
    }
  });

  test("buttons in the figures share one focus ring width", async ({ page }) => {
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 900 });
    const widths = new Set<string>();
    for (const [chapter, selector] of [
      ["03_zweimal_gemessen", 'figure[data-figure-id="c4"] .bf-wf-nav .bf-chip'],
      ["04_branche_land", 'figure.bf[data-bf-id="c6"] .bf-btn'],
      ["01_eisberg", 'figure[data-figure-id="c1"] .bf-chip'],
    ] as const) {
      await page.goto(`${BOOK}/${chapter}`, { waitUntil: "load" });
      await hydrated(page);
      const button = page.locator(selector).first();
      await button.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(button).toBeFocused();
      widths.add(await button.evaluate((el) => getComputedStyle(el).outlineWidth));
    }
    expect([...widths], "one outline width for every figure button").toEqual(["2px"]);
  });

  test("a long row label is broken over two lines, never cut with an ellipsis", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BOOK}/04_branche_land`, { waitUntil: "load" });
    const labels = await page.locator('figure.bf[data-bf-id="c6"] svg text').allTextContents();
    expect(labels.some((t) => t.includes("Fondsmanagement")), "long label is present").toBe(true);
    expect(labels.filter((t) => t.endsWith("…")), "labels cut with an ellipsis").toEqual([]);
  });
});
