import { expect, type Page, test } from "@playwright/test";

/**
 * The shared deck key contract (scripts/workshops/deck-keys.js): ArrowRight,
 * ArrowLeft, r or Shift+R back to the cover, P presenter, Escape out of an
 * appendix. Space, PageDown, End and the digits do nothing. Storage and the
 * presenter channel are named per deck id.
 */

const activeSlide = (page: Page) =>
  page.evaluate(() => document.querySelector("[data-deck-active]")?.getAttribute("id") ?? String(Array.from(document.querySelectorAll("deck-stage > section")).findIndex((slide) => slide.hasAttribute("data-deck-active"))));

async function pressUntilLeaves(page: Page, start: string): Promise<string> {
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press("ArrowRight");
    const now = await activeSlide(page);
    if (now !== start) return now;
  }
  throw new Error(`ArrowRight never left ${start}`);
}

async function expectUnboundKeysIgnored(page: Page, at: string) {
  for (const key of ["Space", "PageDown", "End", "5", "0"]) {
    await page.keyboard.press(key);
    await expect.poll(() => activeSlide(page), key).toBe(at);
  }
}

const storageKeys = (page: Page) => page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);

for (const deck of [
  { slug: "datenbereitschaft-fuer-ki", ready: "#cover" },
  { slug: "geschaeftsberichte-mit-ki-lesen", ready: "deck-stage > section:first-of-type" },
]) {
  test(`${deck.slug} deck follows the shared key contract`, async ({ page }) => {
    await page.goto(`/workshops/${deck.slug}/slides.html`);
    await expect(page.locator(deck.ready)).toHaveAttribute("data-deck-active", "");
    await expect(page.locator("html")).toHaveAttribute("data-deck-id", deck.slug);
    expect(await page.evaluate(() => typeof (window as unknown as { DeckKeys?: unknown }).DeckKeys)).toBe("object");

    const cover = await activeSlide(page);
    await expectUnboundKeysIgnored(page, cover);
    const second = await pressUntilLeaves(page, cover);
    await expectUnboundKeysIgnored(page, second);

    await page.keyboard.press("r");
    await expect.poll(() => activeSlide(page), "bare r resets").toBe(cover);
    await pressUntilLeaves(page, cover);
    await page.keyboard.press("Shift+R");
    await expect.poll(() => activeSlide(page), "Shift+R resets").toBe(cover);

    const keys = await storageKeys(page);
    expect(keys.filter((key) => /^(foldline-deck|deck-stage):/.test(key))).toEqual([]);
    expect(keys.some((key) => key.startsWith(`deck:${deck.slug}:`))).toBe(true);
  });
}
