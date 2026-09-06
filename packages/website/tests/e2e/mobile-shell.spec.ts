import { test, expect, type Page } from "@playwright/test";
import { settleFontsAndFrame } from "./fixtures/settle";
import {
  collectBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * Mobile companion shell: bottom tab bar (regression coverage).
 *
 * Guards the shell contract in docs/experience-system.md, "Mobile Companion
 * Shell", for the one surface that is new below `lg`:
 *
 *   1. Present below 1024px, absent from 1024px upwards. The boundary is stock
 *      Tailwind `lg` (64rem) with no override in globals.css, so 1024 itself is
 *      already the desktop side.
 *   2. It never covers the skip link or the global scroll-progress thread, and
 *      the skip link keeps stacking above it.
 *   3. Every tab clears the 44x44px product target floor, down to the narrowest
 *      supported viewport.
 *   4. The device inset is applied as padding, so the tab row keeps its full
 *      `--tabbar-h` height above the home indicator, and the band reserved at
 *      the end of the document matches the band the bar actually covers.
 *   5. Reader focus mode removes it, in both documented forms of the attribute.
 *
 * Assertions target GEOMETRY, roles, accessible names and the stable
 * `data-mobile-tab-bar` / `data-mobile-tab` anchors. Tab labels are asserted
 * only where the destination is the point (Werkzeuge changes target with the
 * session), so a copy refresh elsewhere stays green.
 *
 * Two notes on method. Insets: Playwright's iPhone 13 emulation reports
 * `env(safe-area-inset-*)` as zero, exactly like a phone held in portrait with
 * no home indicator, so asserting a non-zero inset would assert the emulator
 * rather than the product. The spec instead drives the shell's own
 * `--safe-area-bottom` token in the page and proves the whole chain reacts,
 * which is the wiring a notched device exercises. Focus mode: this spec drives
 * the attribute from the page so it pins the CSS contract in isolation, at both
 * documented positions. The reader routes that server-render it for real (the
 * lesson shell and the chapter reader) are covered in reader-focus-mode.spec.ts.
 */

const TAB_BAR = "[data-mobile-tab-bar]";
const TAB = `${TAB_BAR} [data-mobile-tab]`;
const TAB_ROW = `${TAB_BAR} [data-mobile-tab-row]`;
const SKIP_LINK = 'a[href="#main-content"]';
/** The always-painted 1px track of the single global progress thread. */
const SCROLL_THREAD = "[data-scroll-progress] > div";
const MIN_TARGET = 44;
/** `--tabbar-h` in globals.css: 3.5rem. */
const TAB_BAR_HEIGHT = 56;
/** A stand-in for a home indicator, applied through the shell's own token. */
const SIMULATED_INSET = 34;

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Read geometry inside the page. `Locator.boundingBox()` can return null under
 * the `overflow-x: clip` ancestors globals.css puts on html/body, so the
 * in-page rect is the honest signal here.
 */
async function rectOf(page: Page, selector: string): Promise<Rect> {
  const rect = await page.evaluate((target) => {
    const element = document.querySelector(target);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }, selector);
  expect(rect, `${selector} has no layout box`).not.toBeNull();
  return rect as Rect;
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

async function openHome(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settleFontsAndFrame(page);
}

test.describe("mobile shell: tab bar presence across the lg boundary", () => {
  for (const width of [320, 390, 768] as const) {
    test(`@${width}: the tab bar is fixed to the bottom edge and ${TAB_BAR_HEIGHT}px tall`, async ({
      page,
    }) => {
      await openHome(page, width);
      await expect(page.locator(TAB_BAR)).toBeVisible();

      const box = await rectOf(page, TAB_BAR);
      // The layout viewport, not window.innerWidth: a classic vertical
      // scrollbar in desktop Chromium is inside innerWidth but outside the
      // area a fixed element spans.
      const viewport = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
      }));

      const band = await page.evaluate(
        ([barSelector, rowSelector]) => {
          const bar = document.querySelector(barSelector);
          const row = document.querySelector(rowSelector);
          if (!bar || !row) return null;
          return {
            barHeight: bar.getBoundingClientRect().height,
            rowHeight: row.getBoundingClientRect().height,
            hairline: Number.parseFloat(getComputedStyle(bar).borderTopWidth),
          };
        },
        [TAB_BAR, TAB_ROW] as const,
      );
      expect(band, "tab bar and row have layout boxes").not.toBeNull();
      if (!band) return;

      // The row is the band `--tabbar-h` names, and the document reserves the
      // row. The bar adds a hairline above it, so asserting the outer box
      // against `--tabbar-h` is off by exactly that hairline. Both halves are
      // pinned here so neither the band nor the hairline can drift unseen.
      expect(Math.round(band.rowHeight), `tab row height @${width}px`).toBe(
        TAB_BAR_HEIGHT,
      );
      expect(band.hairline, `tab bar hairline @${width}px`).toBeGreaterThan(0);
      expect(
        Math.round(band.barHeight),
        `tab bar height @${width}px is the row plus its hairline`,
      ).toBe(TAB_BAR_HEIGHT + Math.round(band.hairline));
      expect(Math.round(box.width), `tab bar width @${width}px`).toBe(
        viewport.width,
      );
      expect(
        Math.round(box.y + box.height),
        `tab bar bottom edge @${width}px`,
      ).toBe(Math.round(viewport.height));
    });
  }

  for (const width of [1024, 1440] as const) {
    test(`@${width}: the tab bar is absent from the desktop layout`, async ({
      page,
    }) => {
      await openHome(page, width);

      await expect(page.locator(TAB_BAR)).toBeHidden();
    });
  }
});

test.describe("mobile shell: tab bar landmark, targets and destinations", () => {
  test("is a separately named navigation landmark with four operable tabs", async ({
    page,
  }) => {
    await openHome(page, 390);

    const bar = page.getByRole("navigation", { name: "Schnellnavigation" });
    await expect(bar).toHaveCount(1);
    await expect(bar).toHaveAttribute("data-mobile-tab-bar", "true");
    // The site navigation keeps its own name, so neither landmark can be
    // reached by the other's accessible name.
    await expect(
      page.getByRole("navigation", { name: "Hauptnavigation" }).first(),
    ).toBeVisible();

    await expect(bar.getByRole("link")).toHaveCount(4);
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="start"]`),
    ).toHaveAttribute("href", "/");
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="kurse"]`),
    ).toHaveAttribute("href", "/kurse");
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="konto"]`),
    ).toHaveAttribute("href", "/konto");
  });

  for (const width of [320, 390] as const) {
    test(`@${width}: every tab clears the 44px product target floor`, async ({
      page,
    }) => {
      await openHome(page, width);

      const boxes = await page.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector)).map(
          (element) => {
            const box = element.getBoundingClientRect();
            return {
              id: element.getAttribute("data-mobile-tab") ?? "?",
              width: box.width,
              height: box.height,
            };
          },
        );
      }, TAB);

      expect(boxes).toHaveLength(4);
      for (const box of boxes) {
        expect(
          box.width,
          `tab ${box.id} width ${Math.round(box.width)}px @${width}px`,
        ).toBeGreaterThanOrEqual(MIN_TARGET);
        expect(
          box.height,
          `tab ${box.id} height ${Math.round(box.height)}px @${width}px`,
        ).toBeGreaterThanOrEqual(MIN_TARGET);
      }
    });
  }

  test("sends a signed-out visitor to the public tools surface in both locales", async ({
    page,
  }) => {
    await openHome(page, 390);
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="werkzeuge"]`),
    ).toHaveAttribute("href", "/open-source");

    await page.goto("/en", { waitUntil: "domcontentloaded" });
    const englishBar = page.getByRole("navigation", {
      name: "Quick navigation",
    });
    await expect(englishBar).toHaveCount(1);
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="werkzeuge"]`),
    ).toHaveAttribute("href", "/en/open-source");

    const hrefs = await englishBar
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );
    expect(hrefs).toHaveLength(4);
    for (const href of hrefs) {
      expect(href, "English tab destination stays under /en").toMatch(
        /^\/en(?:\/|#|$)/,
      );
    }
  });

  test("marks the tab of the current route and only that one", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });

    await expect(page.locator(`${TAB_BAR} [aria-current="page"]`)).toHaveCount(
      1,
    );
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="kurse"]`),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("mobile shell: the tab bar keeps out of the way", () => {
  test("never covers the focused skip link or the scroll-progress thread", async ({
    page,
  }) => {
    await openHome(page, 390);

    // Focus programmatically: WebKit does not necessarily move focus with Tab,
    // and this assertion is about geometry, not about the tab order.
    await page.locator(SKIP_LINK).focus();
    await expect(page.locator(SKIP_LINK)).toBeFocused();

    const bar = await rectOf(page, TAB_BAR);
    const skip = await rectOf(page, SKIP_LINK);
    const thread = await rectOf(page, SCROLL_THREAD);

    expect(skip.width, "the focused skip link is laid out").toBeGreaterThan(0);
    expect(thread.width, "the progress thread is laid out").toBeGreaterThan(0);
    expect(
      overlaps(bar, skip),
      "the focused skip link must stay clear of the tab bar",
    ).toBe(false);
    expect(
      overlaps(bar, thread),
      "the global scroll-progress thread must stay clear of the tab bar",
    ).toBe(false);

    // Stacking order from the shell contract: skip link above the tab bar.
    const layers = await page.evaluate(
      ([barSelector, skipSelector]) => {
        const read = (selector: string) => {
          const element = document.querySelector(selector);
          return element
            ? Number(getComputedStyle(element).zIndex)
            : Number.NaN;
        };
        return { bar: read(barSelector), skip: read(skipSelector) };
      },
      [TAB_BAR, SKIP_LINK] as const,
    );
    expect(layers.bar).toBe(40);
    expect(layers.skip).toBeGreaterThan(layers.bar);
  });

  test("reserves the band it covers at the end of the document", async ({
    page,
  }) => {
    await openHome(page, 390);

    const reserved = await page.evaluate(
      ([barSelector, rowSelector]) => {
        const bar = document.querySelector(barSelector);
        const row = document.querySelector(rowSelector);
        return {
          body: getComputedStyle(document.body).paddingBottom,
          bar: bar ? bar.getBoundingClientRect().height : Number.NaN,
          row: row ? row.getBoundingClientRect().height : Number.NaN,
          hairline: bar
            ? Number.parseFloat(getComputedStyle(bar).borderTopWidth)
            : Number.NaN,
        };
      },
      [TAB_BAR, TAB_ROW] as const,
    );

    // What has to clear the content is the row. The hairline above it is a
    // border drawn over the last pixel of the page, the same way the compact
    // top bar's is, so it is deliberately not reserved.
    expect(
      Math.round(Number.parseFloat(reserved.body)),
      "the document reserves exactly the band the tab row covers",
    ).toBe(Math.round(reserved.row));
    expect(
      Math.round(reserved.bar),
      "and the bar itself is that band plus its hairline",
    ).toBe(Math.round(reserved.row) + Math.round(reserved.hairline));
  });
});

test.describe("mobile shell: device insets on iPhone 13", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("pads the bar with the bottom inset without shrinking the tab row", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);

    // Portrait emulation reports no inset, so the bar is the tab row plus the
    // hairline it draws above it.
    const withoutInset = await page.evaluate(
      ([barSelector, rowSelector]) => {
        const bar = document.querySelector(barSelector);
        const row = document.querySelector(rowSelector);
        if (!bar || !row) return null;
        return {
          paddingBottom: getComputedStyle(bar).paddingBottom,
          height: bar.getBoundingClientRect().height,
          rowHeight: row.getBoundingClientRect().height,
          hairline: Number.parseFloat(getComputedStyle(bar).borderTopWidth),
        };
      },
      [TAB_BAR, TAB_ROW] as const,
    );
    expect(withoutInset).not.toBeNull();
    if (!withoutInset) return;
    expect(withoutInset.paddingBottom).toBe("0px");
    expect(Math.round(withoutInset.rowHeight)).toBe(TAB_BAR_HEIGHT);
    expect(Math.round(withoutInset.height)).toBe(
      TAB_BAR_HEIGHT + Math.round(withoutInset.hairline),
    );

    // Drive the shell's own inset token, the way a notched device does.
    await page.addStyleTag({
      content: `:root{--safe-area-bottom:${SIMULATED_INSET}px}`,
    });
    await settleFontsAndFrame(page);

    const withInset = await page.evaluate(
      ([barSelector, rowSelector, tabSelector]) => {
        const bar = document.querySelector(barSelector);
        const row = document.querySelector(rowSelector);
        const tabs = Array.from(document.querySelectorAll(tabSelector));
        if (!bar || !row || tabs.length === 0) return null;
        return {
          paddingBottom: getComputedStyle(bar).paddingBottom,
          barHeight: bar.getBoundingClientRect().height,
          rowHeight: row.getBoundingClientRect().height,
          rowBottom: row.getBoundingClientRect().bottom,
          bodyPaddingBottom: getComputedStyle(document.body).paddingBottom,
          minTabHeight: Math.min(
            ...tabs.map((tab) => tab.getBoundingClientRect().height),
          ),
          viewportHeight: window.innerHeight,
        };
      },
      [TAB_BAR, TAB_ROW, TAB] as const,
    );
    expect(withInset).not.toBeNull();
    if (!withInset) return;

    expect(withInset.paddingBottom).toBe(`${SIMULATED_INSET}px`);
    expect(
      Math.round(withInset.barHeight),
      "the bar grows by the inset instead of eating into the tab row",
    ).toBe(
      TAB_BAR_HEIGHT +
        SIMULATED_INSET +
        Math.round(withoutInset.hairline),
    );
    expect(Math.round(withInset.rowHeight)).toBe(TAB_BAR_HEIGHT);
    expect(
      withInset.minTabHeight,
      "targets keep the product floor above the inset",
    ).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(
      Math.round(withInset.viewportHeight - withInset.rowBottom),
      "the tab row sits the full inset above the display edge",
    ).toBe(SIMULATED_INSET);
    expect(
      Math.round(Number.parseFloat(withInset.bodyPaddingBottom)),
      "the reserved band grows with the inset too",
    ).toBe(TAB_BAR_HEIGHT + SIMULATED_INSET);
  });
});

test.describe("mobile shell: reader focus mode", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("removes the tab bar for both documented forms of the attribute", async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // This test mutates server-owned markup. Wait until React has claimed it,
    // or hydration recovery can remove the synthetic marker being asserted.
    await expect(
      page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]'),
    ).toBeAttached();
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(page.locator(TAB_BAR)).toBeVisible();

    // Form one: the root element carries the attribute.
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-reader", "focus");
    });
    await expect(page.locator(TAB_BAR)).toBeHidden();

    await page.evaluate(() => {
      document.documentElement.removeAttribute("data-reader");
    });
    await expect(page.locator(TAB_BAR)).toBeVisible();

    // Form two: a reader route marks the wrapper it owns inside <main>.
    await main.evaluate((element) => {
      const marker = document.createElement("div");
      marker.setAttribute("data-reader", "focus");
      marker.setAttribute("data-test-reader-marker", "true");
      element.appendChild(marker);
    });
    const marker = main.locator('[data-test-reader-marker="true"]');
    await expect(marker).toBeAttached();
    await expect(page.locator(TAB_BAR)).toBeHidden();
    await expect(marker).toBeAttached();

    await marker.evaluate((element) => element.remove());
    await expect(marker).toHaveCount(0);
    await expect(page.locator(TAB_BAR)).toBeVisible();
    expect(meaningfulBrowserErrors(errors)).toEqual([]);
  });
});
