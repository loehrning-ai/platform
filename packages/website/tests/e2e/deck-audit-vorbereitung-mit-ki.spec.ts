import { expect, type Page, test } from "@playwright/test";

/**
 * Workshop 05 deck, both editions: every press from the cover to the last
 * build step, the key contract (r and Shift+R back to the cover, P opens the
 * presenter, Escape and ArrowLeft leave an appendix, repeats and unbound keys
 * do nothing), the presenter channel, the preview frame that binds no keys,
 * reduced motion and the glass budget.
 */

const SLUG = "audit-vorbereitung-mit-ki";
const EDITIONS = [
  { lang: "de", file: "slides.html" },
  { lang: "en", file: "slides.en.html" },
] as const;

type DeckState = { index: number; id: string; step: number; steps: number; tallies: Record<string, string[]>; timers: number };
type DeckWindow = { DECK: { state: () => DeckState; goto: (index: number) => void; slides: Element[] } };

const state = (page: Page) => page.evaluate(() => (window as unknown as DeckWindow).DECK.state());
const plan = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll("deck-stage > section")).map((slide) => ({
      id: slide.id,
      steps: Number(slide.getAttribute("data-steps")),
      main: slide.getAttribute("data-kind") === "main",
    })),
  );

async function open(page: Page, file: string) {
  await page.goto(`/workshops/${SLUG}/${file}`);
  await expect(page.locator("#cover")).toHaveAttribute("data-deck-active", "");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

for (const edition of EDITIONS) {
  test.describe(`W05 deck ${edition.lang}`, () => {
    test("every press walks the main slides in order, then stops", async ({ page }) => {
      await open(page, edition.file);
      const slides = (await plan(page)).filter((slide) => slide.main);
      expect(slides).toHaveLength(11);
      const expected: Array<[string, number]> = [];
      slides.forEach((slide, i) => {
        for (let step = i === 0 ? 1 : 0; step <= slide.steps; step += 1) expected.push([slide.id, step]);
      });
      for (const [id, step] of expected) {
        await page.keyboard.press("ArrowRight");
        const now = await state(page);
        expect([now.id, now.step], `press to ${id}/${step}`).toEqual([id, step]);
        await expect(page).toHaveURL(new RegExp(`#${id}/${step}$`));
      }
      await page.keyboard.press("ArrowRight");
      expect((await state(page)).id, "ArrowRight never enters the appendix").toBe("result");
    });

    test("ArrowLeft enters the previous slide at its last step", async ({ page }) => {
      await open(page, edition.file);
      await page.keyboard.press("ArrowRight");
      for (let press = 0; press < 3; press += 1) await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      expect(await state(page)).toMatchObject({ id: "draft", step: 0 });
      await page.keyboard.press("ArrowLeft");
      expect(await state(page)).toMatchObject({ id: "request", step: 3 });
    });

    for (const key of ["r", "Shift+R"]) {
      test(`${key} goes back to the cover and clears votes and timers`, async ({ page }) => {
        await open(page, edition.file);
        for (let press = 0; press < 4; press += 1) await page.keyboard.press("ArrowRight");
        expect(await state(page)).toMatchObject({ id: "request", step: 3 });
        await page.locator('#request [data-vote="estimate"] [data-value="3"]').click();
        await page.locator('#request [data-vote="estimate"] [data-value="5"]').click();
        await page.evaluate(() => (window as unknown as DeckWindow).DECK.goto(5));
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
        await page.locator("#mission-1 [data-timer-toggle]").click();
        const before = await state(page);
        expect(before.tallies.estimate).toEqual(["3", "5"]);
        expect(before.timers).toBeGreaterThan(0);
        await page.locator("body").focus();
        await page.keyboard.press(key);
        const after = await state(page);
        expect(after).toMatchObject({ id: "cover", step: 0, tallies: {}, timers: 0 });
        await expect(page.locator("#request .vote-total")).toHaveText(await page.locator("#request .vote-total").getAttribute("data-none") ?? "");
      });
    }

    test("unbound keys, modifier combos and repeats do nothing", async ({ page }) => {
      await open(page, edition.file);
      await page.keyboard.press("ArrowRight");
      const at = await state(page);
      for (const key of ["Space", "PageDown", "End", "Home", "5", "0", "Enter", "Control+ArrowRight", "Meta+r", "Alt+p", "Escape"]) {
        await page.keyboard.press(key);
        expect(await state(page), key).toMatchObject({ id: at.id, step: at.step });
      }
      await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", repeat: true, bubbles: true })));
      expect(await state(page), "auto-repeat").toMatchObject({ id: at.id, step: at.step });
    });

    test("P opens the presenter for this edition on every slide", async ({ page, context }) => {
      await open(page, edition.file);
      const slides = await plan(page);
      for (let index = 0; index < slides.length; index += 1) {
        await page.evaluate((i) => (window as unknown as DeckWindow).DECK.goto(i), index);
        const [popup] = await Promise.all([context.waitForEvent("page"), page.keyboard.press("p")]);
        await popup.waitForLoadState();
        expect(popup.url(), slides[index].id).toContain(`presenter.html?deck=${encodeURIComponent(edition.file)}`);
        await popup.close();
      }
    });

    test("an appendix opens from slide 11 and Escape or ArrowLeft returns there", async ({ page }) => {
      await open(page, edition.file);
      const slides = await plan(page);
      const result = slides.findIndex((slide) => slide.id === "result");
      await page.evaluate((i) => (window as unknown as DeckWindow).DECK.goto(i), result);
      await page.locator('#result [data-goto="a2"]').click();
      expect((await state(page)).id).toBe("a2");
      await page.keyboard.press("ArrowRight");
      expect((await state(page)).id, "ArrowRight inside the appendix").toBe("a3");
      await page.keyboard.press("ArrowLeft");
      expect((await state(page)).id, "ArrowLeft inside the appendix").toBe("a2");
      await page.keyboard.press("Escape");
      expect((await state(page)).id, "Escape").toBe("result");
      await page.locator('#result [data-goto="a1"]').click();
      await page.keyboard.press("ArrowLeft");
      expect((await state(page)).id, "ArrowLeft from the first appendix slide").toBe("result");
      await page.locator('#result [data-goto="a1"]').click();
      await page.locator('#a1 [data-action="leave-appendix"]').click();
      expect((await state(page)).id).toBe("result");
    });

    test("the presenter drives the deck; its preview frame binds no keys", async ({ page, context }) => {
      await open(page, edition.file);
      const presenter = await context.newPage();
      await presenter.goto(`/workshops/${SLUG}/presenter.html?deck=${encodeURIComponent(edition.file)}`);
      await expect(presenter.locator("html")).toHaveAttribute("lang", edition.lang);
      await expect(presenter.locator("#pv-pos")).toHaveText(/01 \/ 11/);
      await presenter.locator("#pv-forward").click();
      await expect.poll(() => state(page).then((s) => s.id)).toBe("request");
      await presenter.keyboard.press("ArrowRight");
      await expect.poll(() => state(page).then((s) => s.step)).toBe(1);
      await expect(presenter.locator("#pv-note")).not.toBeEmpty();

      const frame = presenter.frameLocator("#pv-next-frame");
      await expect(frame.locator("html")).toHaveAttribute("data-deck-preview", "");
      const preview = presenter.frames().find((f) => f.url().includes("preview=1"));
      expect(preview, "preview frame").toBeTruthy();
      const previewBefore = await preview!.evaluate(() => (window as unknown as DeckWindow).DECK.state());
      await preview!.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true })));
      await preview!.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
      expect(await preview!.evaluate(() => (window as unknown as DeckWindow).DECK.state())).toMatchObject({ index: previewBefore.index, step: previewBefore.step });
      expect(await state(page)).toMatchObject({ id: "request", step: 1 });
      await presenter.close();
    });

    test("glass stays on floating chrome, at most two visible", async ({ page }) => {
      await open(page, edition.file);
      const glass = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".glass")).filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => el.className),
      );
      expect(glass.length).toBeLessThanOrEqual(2);
      expect(await page.locator("deck-stage .glass").count()).toBe(0);
    });
  });
}

test("reduced motion lands every press on its final frame", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await open(page, "slides.html");
  for (let press = 0; press < 3; press += 1) await page.keyboard.press("ArrowRight");
  const progress = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#request [data-from="1"]')).map((el) => getComputedStyle(el).getPropertyValue("--p").trim()).map(Number),
  );
  expect(progress.length).toBeGreaterThan(0);
  expect(new Set(progress)).toEqual(new Set([1]));
  await context.close();
});

test("phone portrait: the rotate note offers the demo and the page never scrolls sideways", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await open(page, "slides.html");
  await expect(page.locator("[data-rotate]")).toBeVisible();
  await expect(page.locator("[data-rotate] a")).toHaveAttribute("href", `/demos/${SLUG}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.locator("[data-rotate-close]").click();
  await expect(page.locator("[data-rotate]")).toBeHidden();
  await context.close();
});
