import { expect, type Page, test } from "@playwright/test";

/**
 * Workshop 04 deck, both editions: every ArrowRight press walks the main slides step by step and
 * never enters the appendix, ArrowLeft walks back, r and Shift+R return to #cover/0, unbound keys
 * do nothing, modified r stays the browser's, P opens the presenter, Escape leaves an appendix
 * page for the slide it came from, a reload keeps the position the hash names, and the phone note
 * links only to a page on this site.
 */

const SLUG = "esg-berichte-mit-ki";
const EDITIONS = [
  { lang: "de", deck: `/workshops/${SLUG}/slides.html`, presenter: `/workshops/${SLUG}/presenter.html`, demo: `/demos/${SLUG}` },
  { lang: "en", deck: `/workshops/${SLUG}/en/slides.html`, presenter: `/workshops/${SLUG}/en/presenter.html`, demo: `/en/demos/${SLUG}` },
] as const;

test.use({ contextOptions: { reducedMotion: "reduce" } });

const hash = (page: Page) => page.evaluate(() => decodeURIComponent(location.hash));
const expectAt = (page: Page, where: string, why: string) => expect.poll(() => hash(page), why).toBe(where);
/** The position the stage shows. WebKit refuses history writes after about 100 quick presses, so a
 * long walk reads the slide and step from the DOM; the stage rewrites the hash once it is allowed. */
const shown = (page: Page) =>
  page.evaluate(() => {
    const slide = document.querySelector<HTMLElement>("deck-stage > section[data-deck-active]");
    return slide ? `#${slide.id}/${slide.dataset.stepCurrent}` : "";
  });
const expectShown = (page: Page, where: string, why: string) => expect.poll(() => shown(page), why).toBe(where);

/** Opens a deck URL; each edition keeps its own deck id, so the two never share storage or channels. */
async function open(page: Page, url: string) {
  await page.goto(url);
  const target = new URL(url, "http://deck").hash.slice(1).split("/")[0] || "cover";
  await expect(page.locator(`#${target}`)).toHaveAttribute("data-deck-active", "");
  const deckId = url.includes("/en/") ? `${SLUG}:en` : SLUG;
  await expect(page.locator("html")).toHaveAttribute("data-deck-id", deckId);
}

/** Every main position in order: #slide/0 .. #slide/last for each main slide. */
const mainPositions = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('deck-stage > section.slide[data-kind="main"]')).flatMap((slide) =>
      Array.from({ length: Number(slide.dataset.stepTotal) + 1 }, (_, step) => `#${slide.id}/${step}`),
    ),
  );

for (const edition of EDITIONS) {
  test.describe(`${SLUG} deck (${edition.lang})`, () => {
    test("the live/sample label leaves every presenter step readable", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const id of ["projekt", "schritt-1", "schritt-2", "schritt-3", "register", "nachreichung"]) {
        await open(page, `${edition.deck}#${id}/0`);
        await page.evaluate(() => document.fonts.ready);
        await expect.poll(() => page.locator(`#${id} .hd--live`).evaluate((header) => {
          const step = header.querySelector(".tsteps > li:last-child")!.getBoundingClientRect();
          const label = header.querySelector(".hd__now")!.getBoundingClientRect();
          return label.left - step.right;
        }), `${id}: space between the steps and the live/sample label`).toBeGreaterThanOrEqual(12);
      }
    });

    test("arrow keys walk every step of the main slides and never reach the appendix", async ({ page }) => {
      test.setTimeout(120_000);
      await open(page, edition.deck);
      expect(await page.evaluate(() => typeof (window as unknown as { DeckKeys?: unknown }).DeckKeys)).toBe("object");
      const positions = await mainPositions(page);
      expect(positions.filter((position) => position.endsWith("/0"))).toHaveLength(18);
      await expectAt(page, positions[0], "starts on the cover");

      for (const position of positions.slice(1)) {
        await page.keyboard.press("ArrowRight");
        await expectShown(page, position, `forward to ${position}`);
      }
      await page.keyboard.press("ArrowRight");
      await expectShown(page, positions.at(-1)!, "the last main step is the end");

      for (const position of [...positions].reverse().slice(1)) {
        await page.keyboard.press("ArrowLeft");
        await expectShown(page, position, `back to ${position}`);
      }
    });

    test("r and Shift+R return to the cover; other keys and modified r do nothing", async ({ page }) => {
      await open(page, `${edition.deck}#register/2`);
      await expectAt(page, "#register/2", "deep link");
      await expect(page.locator("#register")).toHaveAttribute("data-deck-active", "");

      for (const key of ["Space", "PageDown", "End", "Home", "5", "0", "Enter"]) {
        await page.keyboard.press(key);
        await expectAt(page, "#register/2", `${key} is unbound`);
      }
      const prevented = await page.evaluate(() =>
        [{ ctrlKey: true }, { metaKey: true }, { altKey: true }].map((mods) => {
          const event = new KeyboardEvent("keydown", { key: "r", code: "KeyR", bubbles: true, cancelable: true, ...mods });
          document.dispatchEvent(event);
          return event.defaultPrevented;
        }),
      );
      expect(prevented).toEqual([false, false, false]);
      await expectAt(page, "#register/2", "modified r is the browser's");

      await page.evaluate(() => {
        const input = document.createElement("input");
        input.id = "probe";
        document.body.append(input);
      });
      await page.locator("#probe").focus();
      await page.keyboard.press("r");
      await expectAt(page, "#register/2", "r inside a form control types");
      await page.locator("#probe").evaluate((input) => input.remove());

      await page.keyboard.press("r");
      await expectAt(page, "#cover/0", "bare r resets");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => hash(page)).not.toBe("#cover/0");
      await page.keyboard.press("Shift+R");
      await expectAt(page, "#cover/0", "Shift+R resets");
    });

    test("Escape leaves an appendix page for the slide and step it came from; reload keeps the place", async ({ page }) => {
      await open(page, `${edition.deck}#schritt-1/1`);
      await expectAt(page, "#schritt-1/1", "deep link");
      await page.evaluate(() => {
        location.hash = "#anhang-begrenzung/0";
      });
      await expect(page.locator("#anhang-begrenzung")).toHaveAttribute("data-deck-active", "");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Escape");
      await expectAt(page, "#schritt-1/1", "Escape returns");
      await expect(page.locator("#schritt-1")).toHaveAttribute("data-deck-active", "");

      await page.keyboard.press("ArrowRight");
      await expectAt(page, "#schritt-1/2", "one step on");
      await page.reload();
      await expect(page.locator("#schritt-1")).toHaveAttribute("data-deck-active", "");
      await expectAt(page, "#schritt-1/2", "reload keeps the position");
    });

    test("P opens this edition's presenter view, which follows the deck", async ({ page }) => {
      await open(page, edition.deck);
      const [popup] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("p")]);
      await popup.waitForLoadState("domcontentloaded");
      expect(new URL(popup.url()).pathname).toBe(edition.presenter);
      await expect(popup.locator("#pv-conn")).toHaveAttribute("data-state", "live");
      const label = edition.lang === "de" ? "Folie" : "Slide";
      await expect(popup.locator("#pv-pos")).toContainText(`${label} 01 / 18`);
      await page.bringToFront();
      await page.keyboard.press("ArrowRight");
      await expect(popup.locator("#pv-pos")).toContainText(`${label} 02 / 18`);
      await popup.close();
    });

    test("the phone note links to this edition's demo and never to a script or another host", async ({ page }) => {
      await open(page, edition.deck);
      const link = page.locator("deck-stage .rotate a");
      const resolved = () => link.evaluate((a) => (a as HTMLAnchorElement).href);
      await expect.poll(resolved).toBe(new URL(edition.demo, page.url()).href);

      for (const hostile of ["javascript:alert(1)", "data:text/html,x", "//example.com/x", "https://example.com/x"]) {
        await page.route(`**${edition.deck}`, async (route) => {
          const response = await route.fetch();
          const body = (await response.text()).replace(/data-rotate-href="[^"]*"/, `data-rotate-href="${hostile}"`);
          await route.fulfill({ response, body });
        });
        await open(page, edition.deck);
        await expect.poll(resolved, { message: hostile }).toBe(new URL("./guide.html", page.url()).href);
        await page.unrouteAll();
      }
    });
  });
}
