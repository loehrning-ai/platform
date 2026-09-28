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
 * only where the destination is the point, so a copy refresh elsewhere stays
 * green.
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

/** Open the phone menu sheet; a click before hydration is a silent no-op. */
async function openSheet(page: Page, name = "Hauptnavigation") {
  const toggle = page.locator('button[aria-controls="mobile-menu"]');
  const dialog = page.getByRole("dialog", { name });
  await expect(async () => {
    if (!(await dialog.isVisible())) await toggle.click();
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await settleFontsAndFrame(page);
  return dialog;
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
            border: Number.parseFloat(getComputedStyle(bar).borderTopWidth),
            shadow: getComputedStyle(bar).boxShadow,
          };
        },
        [TAB_BAR, TAB_ROW] as const,
      );
      expect(band, "tab bar and row have layout boxes").not.toBeNull();
      if (!band) return;

      // The row is the band `--tabbar-h` names, and the document reserves the
      // row. The hairline is an inset shadow drawn inside that band, so the
      // bar is exactly the row and covers no pixel the page did not reserve.
      expect(Math.round(band.rowHeight), `tab row height @${width}px`).toBe(
        TAB_BAR_HEIGHT,
      );
      expect(band.border, `no border adds to the band @${width}px`).toBe(0);
      expect(band.shadow, `the hairline is drawn inside @${width}px`).toMatch(
        /inset/,
      );
      expect(
        Math.round(band.barHeight),
        `tab bar height @${width}px is exactly the row`,
      ).toBe(TAB_BAR_HEIGHT);
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
      page.locator(`${TAB_BAR} [data-mobile-tab="lernen"]`),
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

  test("sends a signed-out visitor to the public Praxis surface in both locales", async ({
    page,
  }) => {
    await openHome(page, 390);
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="praxis"]`),
    ).toHaveAttribute("href", "/workshops");

    await page.goto("/en", { waitUntil: "domcontentloaded" });
    const englishBar = page.getByRole("navigation", {
      name: "Quick navigation",
    });
    await expect(englishBar).toHaveCount(1);
    await expect(
      page.locator(`${TAB_BAR} [data-mobile-tab="praxis"]`),
    ).toHaveAttribute("href", "/en/workshops");

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
      page.locator(`${TAB_BAR} [data-mobile-tab="lernen"]`),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("mobile shell: the tab of the current section", () => {
  // The Lernen and Praxis tabs are the header's Lernen and Praxis groups:
  // courses, the diagnostic and the books under Lernen; workshops, applied
  // examples and open source under Praxis. The first document is what a phone
  // paints, so the state is read before any client navigation, and exactly
  // one tab may carry it.
  const SECTION_ROUTES = [
    ["/demos", "praxis"],
    ["/demos/excel", "praxis"],
    ["/workshops", "praxis"],
    ["/open-source", "praxis"],
    ["/ki-fuehrerschein", "lernen"],
    ["/eu-ai-act-kurs", "lernen"],
    ["/buecher", "lernen"],
    ["/en/demos", "praxis"],
  ] as const;

  for (const [path, tab] of SECTION_ROUTES) {
    test(`${path} marks the ${tab} tab and only that one`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: "domcontentloaded" });

      await expect(
        page.locator(`${TAB_BAR} [data-active="true"]`),
      ).toHaveCount(1);
      await expect(
        page.locator(`${TAB_BAR} [data-mobile-tab="${tab}"]`),
      ).toHaveAttribute("aria-current", "page");
      // The desktop header marks the same group for the same page.
      await expect(
        page.locator(`[data-nav-dropdown="${tab}"] > button`),
      ).toHaveAttribute("aria-current", "true");
    });
  }
});

test.describe("mobile shell: the menu sheet", () => {
  for (const [width, height] of [
    [320, 568],
    [375, 667],
  ] as const) {
    test(`@${width}x${height}: the whole menu fits above the tab bar and closes where it opened`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await settleFontsAndFrame(page);

      const toggle = page.locator('button[aria-controls="mobile-menu"]');
      const opener = await rectOf(page, 'button[aria-controls="mobile-menu"]');
      const dialog = page.getByRole("dialog", { name: "Hauptnavigation" });
      // A click before hydration is a silent no-op; retry until it opens.
      await expect(async () => {
        if (!(await dialog.isVisible())) await toggle.click();
        await expect(dialog).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 15_000 });
      await settleFontsAndFrame(page);

      const sheet = await page.evaluate((barSelector) => {
        const menu = document.getElementById("mobile-menu");
        const bar = document.querySelector(barSelector);
        if (!menu || !bar) return null;
        const scrollers = [menu, ...menu.querySelectorAll("*")].filter(
          (element) =>
            element.scrollHeight > element.clientHeight + 1 &&
            /(auto|scroll)/.test(getComputedStyle(element).overflowY),
        );
        return {
          bottom: menu.getBoundingClientRect().bottom,
          barTop: bar.getBoundingClientRect().top,
          scrolling: scrollers.length,
          languageSwitches: menu.querySelectorAll("[data-language-switch]")
            .length,
        };
      }, TAB_BAR);
      expect(sheet).not.toBeNull();
      if (!sheet) return;
      expect(
        sheet.bottom,
        "the sheet ends above the tab bar",
      ).toBeLessThanOrEqual(sheet.barTop + 1);
      expect(sheet.scrolling, "no scrolling inside the sheet").toBe(0);
      expect(sheet.languageSwitches, "DE/EN is not repeated").toBe(0);

      // The close button sits on the menu button's own 44px square.
      const close = await rectOf(
        page,
        '#mobile-menu button[aria-label="Menü schließen"]',
      );
      expect(Math.round(close.x)).toBe(Math.round(opener.x));
      expect(Math.round(close.y)).toBe(Math.round(opener.y));
      expect(close.width).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(close.height).toBeGreaterThanOrEqual(MIN_TARGET);

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });
  }

  test("@844x390 landscape: the groups stand side by side and nothing scrolls inside", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);
    const dialog = await openSheet(page);

    const sheet = await page.evaluate((barSelector) => {
      const menu = document.getElementById("mobile-menu");
      const bar = document.querySelector(barSelector);
      if (!menu || !bar) return null;
      const scrollers = [menu, ...menu.querySelectorAll("*")].filter(
        (element) =>
          element.scrollHeight > element.clientHeight + 1 &&
          /(auto|scroll)/.test(getComputedStyle(element).overflowY),
      );
      const lastLink = Array.from(menu.querySelectorAll("section a")).at(-1);
      const tops = Array.from(menu.querySelectorAll("section")).map(
        (section) => Math.round(section.getBoundingClientRect().top),
      );
      return {
        bottom: menu.getBoundingClientRect().bottom,
        barTop: bar.getBoundingClientRect().top,
        scrolling: scrollers.length,
        lastLinkBottom: lastLink?.getBoundingClientRect().bottom ?? Infinity,
        sectionTops: tops,
      };
    }, TAB_BAR);
    expect(sheet).not.toBeNull();
    if (!sheet) return;
    expect(sheet.scrolling, "no scrolling inside the sheet").toBe(0);
    expect(sheet.bottom).toBeLessThanOrEqual(sheet.barTop + 1);
    expect(sheet.lastLinkBottom).toBeLessThanOrEqual(sheet.bottom);
    // Three columns that start on one line.
    expect(new Set(sheet.sectionTops).size).toBe(1);
    await expect(dialog.getByRole("link", { name: "Open Source" })).toBeInViewport();
  });

  test("@390: a tap on the scrim over the tab bar closes the menu and navigates nowhere", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);
    const dialog = await openSheet(page);

    // The bar stays visible behind the modal but inert, and its row fades.
    const behind = await page.evaluate((tabSelector) => {
      const tab = document.querySelector(tabSelector);
      const row = tab?.closest("[data-mobile-tab-row]");
      if (!tab || !row) return null;
      const box = tab.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      return {
        hitIsScrim: Boolean(hit?.closest("[data-mobile-menu-scrim]")),
        opacity: Number(getComputedStyle(row).opacity),
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      };
    }, `${TAB_BAR} [data-mobile-tab="konto"]`);
    expect(behind).not.toBeNull();
    if (!behind) return;
    expect(behind.hitIsScrim).toBe(true);
    // The row fades behind the modal; the transition may still be running.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number(
            getComputedStyle(
              document.querySelector("[data-mobile-tab-row]") as Element,
            ).opacity,
          ),
        ),
      )
      .toBeLessThan(1);

    await page.mouse.click(behind.x, behind.y);
    await expect(dialog).toBeHidden();
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("@320: the bar shows the whole wordmark and one language link", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);

    const wordmark = page.locator("[data-nav-header-row] [data-logo-wordmark]");
    await expect(wordmark).toBeVisible();
    const language = page.locator(
      '[data-nav-header-row] [data-language-switch="compact"] a',
    );
    await expect(language).toBeVisible();
    await expect(language).toHaveText("EN");
    await expect(language).toHaveAttribute("href", "/en");
    const wordmarkBox = await rectOf(
      page,
      "[data-nav-header-row] [data-logo-wordmark]",
    );
    const languageBox = await rectOf(
      page,
      '[data-nav-header-row] [data-language-switch="compact"] a',
    );
    expect(languageBox.width).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(languageBox.height).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(wordmarkBox.x + wordmarkBox.width).toBeLessThanOrEqual(
      languageBox.x,
    );

    // The sheet's header repeats the bar with a quiet sign-in link, and the
    // wordmark still clears it.
    await openSheet(page);
    const sheetWordmark = await rectOf(
      page,
      "[data-mobile-menu-header] [data-logo-wordmark]",
    );
    const login = await rectOf(page, '[data-mobile-menu-header] [data-auth-status="quiet"]');
    expect(sheetWordmark.x + sheetWordmark.width).toBeLessThanOrEqual(login.x);
    expect(login.height).toBeGreaterThanOrEqual(MIN_TARGET);
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(width).toBe(320);
  });
});

test.describe("mobile shell: the compact footer", () => {
  test("@390: the closed footer stays under 300px and opens under 600px", async ({
    page,
  }) => {
    await openHome(page, 390);

    const heights = await page.evaluate(() => {
      const footer = document.querySelector("footer");
      const disclosure = footer?.querySelector("details");
      if (!footer || !disclosure) return null;
      const closed = footer.getBoundingClientRect().height;
      disclosure.open = true;
      const open = footer.getBoundingClientRect().height;
      disclosure.open = false;
      return { closed, open, width: document.documentElement.scrollWidth };
    });
    expect(heights).not.toBeNull();
    if (!heights) return;
    expect(heights.closed).toBeLessThanOrEqual(240);
    expect(heights.open).toBeLessThanOrEqual(580);
    expect(heights.width).toBe(390);
  });

  test("@320: the phone caption is one line", async ({ page }) => {
    await openHome(page, 320);

    const caption = await page.evaluate(() => {
      const copyright = document.querySelector(
        '[data-testid="footer-copyright"]',
      );
      const row = copyright?.parentElement;
      if (!copyright || !row) return null;
      return {
        rowHeight: row.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(row).lineHeight),
        paddingTop: Number.parseFloat(getComputedStyle(row).paddingTop),
      };
    });
    expect(caption).not.toBeNull();
    if (!caption) return;
    expect(caption.rowHeight - caption.paddingTop).toBeLessThanOrEqual(
      caption.lineHeight + 1,
    );
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
        };
      },
      [TAB_BAR, TAB_ROW] as const,
    );

    // The document reserves the row, and the bar is exactly the row: its
    // hairline is drawn inside the band, so it covers no pixel of the page.
    expect(
      Math.round(Number.parseFloat(reserved.body)),
      "the document reserves exactly the band the tab row covers",
    ).toBe(Math.round(reserved.row));
    expect(
      Math.round(reserved.bar),
      "and the bar itself is exactly that band",
    ).toBe(Math.round(reserved.row));
  });
});

test.describe("mobile shell: device insets on iPhone 13", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("pads the bar with the bottom inset without shrinking the tab row", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleFontsAndFrame(page);

    // Portrait emulation reports no inset, so the bar is the tab row; its
    // hairline is drawn inside the row (borderTopWidth reads 0).
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
