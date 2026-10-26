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
  { slug: "audit-vorbereitung-mit-ki", ready: "#cover" },
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

/**
 * Workshop 06 keeps rotfaden's own engine (scripts/workshops/sync-deck-keys.mjs, DECK_KEYS_EQUIVALENT): the
 * five contract keys behave as everywhere else. It binds more on top (ArrowDown, PageDown and Space forward,
 * ArrowUp, PageUp back), so only End and the digits are checked as unbound here.
 */
test("angebote-mit-ki-vergleichen deck keeps the five contract keys", async ({ page }) => {
  const scene = () => page.evaluate(() => document.querySelector(".slide[data-active]")?.getAttribute("data-id") ?? "");
  await page.goto("/workshops/angebote-mit-ki-vergleichen/slides.html");
  await expect(page.locator('.slide[data-id="cover"]')).toHaveAttribute("data-active", "");

  for (const key of ["End", "5", "0"]) {
    await page.keyboard.press(key);
    await expect.poll(scene, key).toBe("cover");
  }
  const second = await pressUntilLeavesScene(page, scene, "cover");
  await page.keyboard.press("ArrowLeft");
  await expect.poll(scene, "ArrowLeft goes back").toBe("cover");

  await pressUntilLeavesScene(page, scene, "cover");
  await page.keyboard.press("r");
  await expect.poll(scene, "bare r resets").toBe("cover");
  await pressUntilLeavesScene(page, scene, "cover");
  await page.keyboard.press("Shift+R");
  await expect.poll(scene, "Shift+R resets").toBe("cover");

  await page.keyboard.press("p");
  await expect(page.locator("body")).toHaveClass(/\bpresenting\b/);
  await page.keyboard.press("P");
  await expect(page.locator("body")).not.toHaveClass(/\bpresenting\b/);

  // Escape leaves an appendix and returns to the scene it was opened from.
  await pressUntilLeavesScene(page, scene, "cover");
  expect(await scene()).toBe(second);
  await page.evaluate(() => {
    location.hash = "#kostenzeilen/0";
  });
  await expect.poll(scene, "the appendix opens").toBe("kostenzeilen");
  await page.keyboard.press("Escape");
  await expect.poll(scene, "Escape returns").toBe(second);

  await page.keyboard.press("r");
  await expect.poll(scene).toBe("cover");
  const keys = await storageKeys(page);
  expect(keys.filter((key) => /^(foldline-deck|deck-stage):/.test(key))).toEqual([]);
});

async function pressUntilLeavesScene(page: Page, scene: () => Promise<string>, start: string): Promise<string> {
  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press("ArrowRight");
    const now = await scene();
    if (now !== start) return now;
  }
  throw new Error(`ArrowRight never left ${start}`);
}
