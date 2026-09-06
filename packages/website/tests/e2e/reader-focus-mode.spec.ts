import { test, expect, type Page } from "@playwright/test";
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
 *   3. The chapter contents open as a sheet above that bar, with 44px targets,
 *      and close again once a heading is chosen. The desktop TOC landmark stays
 *      hidden below lg, as responsive.spec.ts already requires.
 *   4. The lesson shell keeps its sticky toolbar under the compact top bar and
 *      derives that offset from the shell token.
 *   5. At desktop widths nothing changes: no reader bar, the sidebar TOC.
 *
 * Assertions target GEOMETRY, roles and the stable `data-reader-focus-bar` /
 * `data-chapter-toc-sheet` anchors. The one copy assertion is the bar's next
 * link, whose visible label is the point of the control.
 */

const CHAPTER_URL = "/buecher/ki-landschaft/01_eisberg";
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
 * same `LessonShell` with the same mobile toolbar, so the shell assertions run
 * against one of those. Nothing block-specific is lost, because a block route
 * cannot be reached here at all.
 */
const LESSON_URL = "/kurse/open-source/claude/kurs/mental-model";
const TAB_BAR = "[data-mobile-tab-bar]";
const READER_BAR = "[data-reader-focus-bar]";
const READER_BAR_ROW = "[data-reader-focus-bar-row]";
const SHEET_PANEL = "[data-chapter-toc-sheet-panel]";
const LESSON_TOOLBAR = "[data-lesson-shell-mobile-toolbar]";
/** `--tabbar-h` in globals.css: 3.5rem. */
const TAB_BAR_HEIGHT = 56;
/** `--nav-h-compact` (3rem) plus the 3rem block sub-header row. */
const LESSON_TOOLBAR_TOP = 96;
const MIN_TARGET = 44;

async function openAt(page: Page, url: string, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await settleFontsAndFrame(page);
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

    const geometry = await page.evaluate(
      ([barSelector, rowSelector]) => {
        const element = document.querySelector(barSelector);
        const row = document.querySelector(rowSelector);
        if (!element || !row) return null;
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          height: box.height,
          bottom: box.bottom,
          width: box.width,
          rowHeight: row.getBoundingClientRect().height,
          hairline: Number.parseFloat(style.borderTopWidth),
          viewportHeight: window.innerHeight,
          viewportWidth: document.documentElement.clientWidth,
          bodyPaddingBottom: Number.parseFloat(
            getComputedStyle(document.body).paddingBottom,
          ),
          zIndex: style.zIndex,
        };
      },
      [READER_BAR, READER_BAR_ROW] as const,
    );
    expect(geometry).not.toBeNull();
    if (!geometry) return;

    // The row is the band; the bar adds only the device inset below it and a
    // hairline above it, exactly like the tab bar it replaces.
    expect(Math.round(geometry.rowHeight), "reader bar row height").toBe(
      TAB_BAR_HEIGHT,
    );
    expect(Math.round(geometry.width), "reader bar spans the viewport").toBe(
      geometry.viewportWidth,
    );
    expect(
      Math.round(geometry.bottom),
      "reader bar sits on the bottom edge",
    ).toBe(Math.round(geometry.viewportHeight));
    expect(
      Math.round(geometry.height - geometry.hairline),
      "the reserved band still matches the bar that fills it",
    ).toBe(Math.round(geometry.bodyPaddingBottom));
    expect(
      Math.round(geometry.bodyPaddingBottom),
      "the reserved band is --tabbar-band-h, and this emulation reports no inset",
    ).toBe(TAB_BAR_HEIGHT);
    expect(geometry.zIndex, "the bar takes the tab bar's stacking level").toBe(
      "40",
    );
  });

  test("states the position and opens the contents as a sheet above the bar", async ({
    page,
  }) => {
    await openAt(page, CHAPTER_URL, 390);
    const bar = page.locator(READER_BAR);

    await expect(bar.getByText(/^1 \/ \d+$/)).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Kapitelinhalt" }),
    ).toBeHidden();

    const summary = bar.locator("summary");
    await expect(summary).toBeVisible();
    await expectTargetSize(summary, "contents trigger");
    await expect(bar.locator(SHEET_PANEL)).toBeHidden();

    await summary.click();
    const toc = bar.getByRole("navigation", { name: "Kapitelinhalt" });
    await expect(toc).toBeVisible();

    const [panelBox, barBox] = await Promise.all([
      bar.locator(SHEET_PANEL).boundingBox(),
      bar.boundingBox(),
    ]);
    expect(panelBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    // Opens upward from the bar and stays inside the viewport.
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(barBox!.y + 1);
    expect(panelBox!.y).toBeGreaterThanOrEqual(0);

    const links = toc.getByRole("link");
    const count = await links.count();
    expect(count, "contents entries").toBeGreaterThan(1);
    for (let index = 0; index < count; index += 1) {
      await expectTargetSize(links.nth(index), `contents entry #${index + 1}`);
    }

    // Choosing a heading scrolls the page and the sheet gets out of the way.
    await links.last().click();
    await expect(toc).toBeHidden();
    await expect(summary).toBeVisible();
  });

  test("the next action leads to the next chapter, where the bar returns", async ({
    page,
  }) => {
    await openAt(page, CHAPTER_URL, 390);
    const next = page.locator(READER_BAR).getByRole("link", { name: /^Weiter/ });

    await expect(next).toBeVisible();
    await expectTargetSize(next, "next chapter action");

    await next.click();
    await expect(page).toHaveURL(
      /\/buecher\/ki-landschaft\/(?!01_eisberg)[^/?#]+$/,
    );
    await expect(page.locator(READER_BAR)).toBeVisible();
    await expect(page.locator(TAB_BAR)).toBeHidden();
  });
});

test.describe("reader focus mode: lesson shell below lg", () => {
  test("a lesson page is in focus mode and keeps its toolbar under the compact bar", async ({
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

    const toolbar = page.locator(LESSON_TOOLBAR);
    await expect(toolbar).toBeVisible();
    const offset = await toolbar.evaluate((element) => ({
      position: getComputedStyle(element).position,
      top: getComputedStyle(element).top,
    }));
    expect(offset.position).toBe("sticky");
    expect(
      Math.round(Number.parseFloat(offset.top)),
      "toolbar offset derives from --nav-h-compact plus the sub-header row",
    ).toBe(LESSON_TOOLBAR_TOP);
  });

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

    await action.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("reader focus mode: desktop unchanged", () => {
  test("at 1280 the reader bar is absent and the sidebar TOC remains", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(CHAPTER_URL, { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);

    await expect(page.locator(READER_BAR)).toBeHidden();
    await expect(page.locator(TAB_BAR)).toBeHidden();
    await expect(
      page.getByRole("complementary", { name: "Kapitelinhalt" }),
    ).toBeVisible();
  });
});
