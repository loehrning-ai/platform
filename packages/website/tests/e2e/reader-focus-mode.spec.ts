import { test, expect, type Page } from "@playwright/test";
import { BOOK, chapterPath, chapters } from "./fixtures/book";
import { settleFontsAndFrame } from "./fixtures/settle";

/**
 * Reader focus mode (regression coverage).
 *
 * Guards the "Reader focus mode" contract in docs/experience-system.md,
 * "Mobile Companion Shell", on the routes that actually enter it:
 *
 *   1. A reader route carries `data-reader="focus"` on the wrapper it owns
 *      inside <main>, in the server response itself, so the bottom tab bar is
 *      absent from the first paint and nothing toggles after hydration.
 *   2. The compact reader bar takes the band the tab bar leaves: fixed to the
 *      bottom edge, exactly `--tabbar-h` tall, at the tab bar's stacking level,
 *      matching the band the document reserves.
 *   3. The chapter contents are never a sheet that opens and closes: the bar
 *      holds the position and the next action, and the chapters are one visible
 *      list on the page with 44px targets. The heading sidebar of the plain
 *      reader stays hidden below lg, as responsive.spec.ts already requires.
 *   4. The lesson shell adds no sticky toolbar under the compact top bar: the
 *      reader bar is the one drawer control, so phones keep 105px of chrome.
 *   5. At desktop widths there is no reader bar; the chapter list stays visible.
 *
 * Assertions target GEOMETRY, roles and the stable `data-reader-focus-bar` /
 * `data-chapter-list` anchors. The one copy assertion is the bar's next
 * link, whose visible label is the point of the control.
 */

const CHAPTER_URL = chapterPath(chapters()[0]!.slug);
const SECOND_CHAPTER_URL = chapterPath(chapters()[1]!.slug);
/** Block ids are underscored (`BLOCK_IDS` in src/lib/course/types.ts). */
/**
 * Every block-page route sits under a gated prefix. All three are listed in
 * `GATED_COURSE_PREFIXES` in src/lib/auth/routes.ts, so a provider-free server
 * - which is what `e2e:shard:built` starts - redirects each of them to
 * `/login?reason=auth-not-configured`. `page.request.get` follows that
 * redirect, so a block URL answers 200 with the login page and every reader
 * assertion below would fail on a body that has no reader in it.
 *
 * The open-source course routes are reachable in that server and render the
 * same `LessonShell` with the same reader bar, so the shell assertions run
 * against one of those. Block-specific header flow is covered in the server
 * component test; actual protected block geometry is not proven by this tier.
 */
const LESSON_URL = "/kurse/open-source/data-infrastructure/kurs/mental-model";
const TAB_BAR = "[data-mobile-tab-bar]";
const READER_BAR = "[data-reader-focus-bar]";
const READER_BAR_ROW = "[data-reader-focus-bar-row]";
const LESSON_TOOLBAR = "[data-lesson-shell-mobile-toolbar]";
/** `--tabbar-h` in globals.css: 3.5rem. */
const TAB_BAR_HEIGHT = 56;
/** `--nav-h-compact`: the only fixed chrome above a lesson below lg. */
const COMPACT_HEADER_HEIGHT = 48;
const MIN_TARGET = 44;

async function openAt(page: Page, url: string, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settleFontsAndFrame(page);
}

/**
 * While a hero stage is in view the bar is the step control; past the last stage it is the chapter bar
 * ("Kapitel 1 von 9" and the next chapter). Scroll to the end of the chapter and wait for that state.
 */
async function toChapterBar(page: Page): Promise<void> {
  // The stage script starts when the browser is idle; the bar answers to it, so scroll only after it has taken over.
  await expect(page.locator("[data-chapter-stage]").first()).toHaveAttribute("data-mode", "scrub", { timeout: 15_000 });
  await expect(async () => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator(READER_BAR)).toHaveAttribute("data-bar-mode", "chapter", { timeout: 1_000 });
    await expect(page.locator(READER_BAR).getByRole("link")).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

async function expectTargetSize(
  locator: ReturnType<Page["locator"]>,
  label: string,
): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, `${label} has no layout box`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(MIN_TARGET);
  expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(MIN_TARGET);
}

test.describe("reader focus mode: chapter reader below lg", () => {
  test("is server rendered and swaps the tab bar for the reader bar in its band", async ({
    page,
  }) => {
    // The attribute is in the document as served, not added by a script.
    const response = await page.request.get(CHAPTER_URL);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('data-reader="focus"');

    await openAt(page, CHAPTER_URL, 390);
    await expect(page.locator('main [data-reader="focus"]')).toHaveCount(1);
    await expect(page.locator(TAB_BAR)).toBeHidden();

    const bar = page.locator(READER_BAR);
    await expect(bar).toBeVisible();

    // The bar replaces the tab bar on the bottom edge, full width, at its
    // stacking level. Its row is shorter than the tab bar (insight-focus-bar.css),
    // so the band the body reserves only has to be at least as tall as the bar.
    const geometry = await page.evaluate((barSelector) => {
      const element = document.querySelector(barSelector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        height: box.height,
        bottom: box.bottom,
        width: box.width,
        viewportHeight: window.innerHeight,
        viewportWidth: document.documentElement.clientWidth,
        bodyPaddingBottom: Number.parseFloat(
          getComputedStyle(document.body).paddingBottom,
        ),
        zIndex: getComputedStyle(element).zIndex,
      };
    }, READER_BAR);
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    expect(Math.round(geometry.width), "reader bar spans the viewport").toBe(
      geometry.viewportWidth,
    );
    expect(
      Math.round(geometry.bottom),
      "reader bar sits on the bottom edge",
    ).toBe(Math.round(geometry.viewportHeight));
    expect(
      Math.round(geometry.bodyPaddingBottom),
      "the reserved band is at least as tall as the bar, so it never covers the last lines",
    ).toBeGreaterThanOrEqual(Math.round(geometry.height));
    expect(geometry.zIndex, "the bar takes the tab bar's stacking level").toBe(
      "40",
    );
  });

  test("states the position and keeps the contents visible on the page, no sheet", async ({
    page,
  }) => {
    await openAt(page, CHAPTER_URL, 390);
    const bar = page.locator(READER_BAR);
    await toChapterBar(page);

    await expect(bar.getByText(new RegExp(`^Kapitel 1 von ${chapters().length}$`))).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Kapitelinhalt" }),
    ).toBeHidden();

    // Nothing opens and closes: no summary in the bar, no sheet anywhere.
    await expect(bar.locator("summary, details, [data-chapter-toc-sheet]")).toHaveCount(0);
    const list = page.locator("[data-chapter-list]");
    await expect(list).toBeVisible();
    const links = list.getByRole("link");
    const count = await links.count();
    expect(count, "chapters in the visible list").toBe(chapters().length);
    for (let index = 0; index < count; index += 1) {
      await links.nth(index).scrollIntoViewIfNeeded();
      await expectTargetSize(links.nth(index), `chapter list entry #${index + 1}`);
    }
  });

  test("the next action leads to the next chapter, where the bar returns", async ({
    page,
  }) => {
    await openAt(page, CHAPTER_URL, 390);
    // The reader restores its position on mount; scroll only after that effect is ready.
    await page
      .locator(`[data-book-reader-ready="${BOOK}:${chapters()[0]!.slug}"]`)
      .waitFor({ state: "attached" });
    await toChapterBar(page);
    const next = page
      .locator(READER_BAR)
      .getByRole("link", { name: /^Nächstes Kapitel/ });

    await expect(next).toBeVisible();
    await expectTargetSize(next, "next chapter action");

    await next.click();
    await expect(page).toHaveURL(new RegExp(`${SECOND_CHAPTER_URL}$`));
    await expect(page.locator(READER_BAR)).toBeVisible();
    await expect(page.locator(TAB_BAR)).toBeHidden();
  });
});

test.describe("reader focus mode: lesson shell below lg", () => {
  test("a lesson page is in focus mode with no second navigation toolbar", async ({
    page,
  }) => {
    const response = await page.request.get(LESSON_URL);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('data-reader="focus"');

    await openAt(page, LESSON_URL, 390);
    await expect(
      page.locator('[data-lesson-shell][data-reader="focus"]'),
    ).toHaveCount(1);
    await expect(page.locator(TAB_BAR)).toBeHidden();
    await expect(page.locator(LESSON_TOOLBAR)).toHaveCount(0);
    // Exactly one visible control opens the lesson drawer.
    await expect(
      page.getByRole("button", { name: "Lektionsnavigation öffnen" }),
    ).toHaveCount(1);
  });

  for (const width of [390, 768]) {
    test(`the ${width}px lesson content starts directly under the compact header`, async ({
      page,
    }, testInfo) => {
      await openAt(page, LESSON_URL, width);
      await page.evaluate(() =>
        window.scrollTo({ top: 500, behavior: "instant" }),
      );
      const geometry = await page.evaluate(() => {
        const header = document
          .querySelector("[data-nav-header-row]")
          ?.getBoundingClientRect();
        const stickies = Array.from(
          document.querySelectorAll<HTMLElement>("[data-lesson-shell] *"),
        ).filter((element) => getComputedStyle(element).position === "sticky")
          .filter((element) => element.getBoundingClientRect().height > 0)
          .map((element) => element.getBoundingClientRect().top);
        return { headerBottom: header?.bottom, stickies };
      });
      expect(Math.round(geometry.headerBottom ?? 0)).toBe(
        COMPACT_HEADER_HEIGHT,
      );
      // No sticky band inside the shell pins itself under the header.
      expect(
        geometry.stickies.filter(
          (top) => Math.abs(top - COMPACT_HEADER_HEIGHT) <= 1,
        ),
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`reader-top-${width}.png`),
      });
      await testInfo.attach(`reader-top-${width}`, {
        path: testInfo.outputPath(`reader-top-${width}.png`),
        contentType: "image/png",
      });
    });
  }

  test("fills the band it took from the tab bar, with a control that opens the lesson list", async ({
    page,
  }) => {
    // The tab bar's replacement, not just its removal: a lesson route in focus
    // mode has to carry a bar, whether or not its reader supplied a position
    // and a next step.
    const response = await page.request.get(LESSON_URL);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("data-reader-focus-bar");

    await openAt(page, LESSON_URL, 390);
    await expect(page.locator(TAB_BAR)).toBeHidden();

    const bar = page.locator(READER_BAR);
    await expect(bar).toBeVisible();

    const row = bar.locator(READER_BAR_ROW);
    const rowBox = await row.boundingBox();
    expect(rowBox, "reader bar row has no layout box").not.toBeNull();
    expect(Math.round(rowBox!.height), "reader bar row height").toBe(
      TAB_BAR_HEIGHT,
    );

    const action = bar.locator("[data-reader-focus-action]");
    await expect(action).toBeVisible();
    await expectTargetSize(action, "lesson bar action");

    await expect(bar.locator("[data-reader-focus-position]")).toContainText(
      "1 / 12",
    );
    await expect(action).toHaveText("Aufgabe öffnen");
    const navigation = bar.locator("[data-reader-focus-navigation]");
    await expectTargetSize(navigation, "lesson navigation remains available");
    await navigation.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(navigation).toBeFocused();
  });
});

test.describe("reader focus mode: desktop unchanged", () => {
  for (const width of [1024, 1280]) {
    test(`the ${width}px lesson uses desktop navigation without mobile chrome`, async ({
      page,
    }) => {
      await openAt(page, LESSON_URL, width);
      await expect(page.locator(LESSON_TOOLBAR)).toBeHidden();
      await expect(page.locator(READER_BAR)).toBeHidden();
      await expect(
        page.getByRole("complementary", { name: "Lektionsnavigation" }),
      ).toBeVisible();
    });
  }
  test("at 1280 the reader bar is absent, there is no heading sidebar and the chapter list stays visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);

    await expect(page.locator(READER_BAR)).toBeHidden();
    await expect(page.locator(TAB_BAR)).toBeHidden();
    await expect(page.getByRole("complementary", { name: "Kapitelinhalt" })).toHaveCount(0);
    await expect(page.locator("[data-chapter-list]")).toBeVisible();
  });
});
