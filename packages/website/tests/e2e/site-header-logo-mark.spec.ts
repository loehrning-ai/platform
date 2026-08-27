import { test, expect, type Page } from "@playwright/test";

/**
 * The fixed-height header keeps its geometry while the brand lockup repeats
 * the earlier scroll transition: the square rotates, the duplicate wordmark L
 * collapses, and the remaining letters close toward the mark.
 */

const HOME_LINK = 'nav a[href="/"]';
const ICON_MARK = `${HOME_LINK} [data-logo-mark]`;
const LEADING_L = `${HOME_LINK} [data-logo-wordmark-leading-l]`;
const WORDMARK_REMAINDER = `${HOME_LINK} [data-logo-wordmark-remainder]`;

async function markGeometry(page: Page) {
  return page.evaluate((sel) => {
    const square = document.querySelector(sel);
    if (!square) throw new Error(`icon mark not found: ${sel}`);
    const inner = square.querySelector("span");
    if (!inner) throw new Error("L span not found inside mark");

    const leadingL = document.querySelector<HTMLElement>(
      "[data-logo-wordmark-leading-l]",
    );
    const remainder = document.querySelector<HTMLElement>(
      "[data-logo-wordmark-remainder]",
    );
    if (!leadingL || !remainder) throw new Error("wordmark pieces not found");

    const range = document.createRange();
    range.selectNodeContents(inner.childNodes[0]);
    const lRect = range.getBoundingClientRect();
    const squareRect = square.getBoundingClientRect();
    const brandRect = square.closest("a")?.getBoundingClientRect();

    return {
      squareCenterX: squareRect.x + squareRect.width / 2,
      squareRight: squareRect.right,
      squareTransform: getComputedStyle(square).transform,
      lCenterX: lRect.x + lRect.width / 2,
      leadingLOpacity: Number.parseFloat(getComputedStyle(leadingL).opacity),
      leadingLVisualWidth: leadingL.getBoundingClientRect().width,
      leadingLLayoutWidth: leadingL.offsetWidth,
      remainderX: remainder.getBoundingClientRect().x,
      brandWidth: brandRect?.width ?? 0,
    };
  }, ICON_MARK);
}

async function scrollToAndSettle(page: Page, y: number) {
  await page.evaluate((yy) => {
    window.scrollTo({ top: yy, left: 0, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      requestAnimationFrame(() => requestAnimationFrame(done));
      setTimeout(done, 250);
    });
  }, y);
  return markGeometry(page);
}

test.describe("primary navigation logo mark", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName === "webkit",
      "Playwright WebKit does not update Framer useScroll values reliably.",
    );
  });

  test("the square rotates and the duplicate L merges away without changing header geometry", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The duplicate wordmark L is intentionally hidden below the desktop breakpoint.",
    );
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator(ICON_MARK)).toBeVisible();

    const initialHeaderHeight = await page
      .locator("[data-nav-header-row]")
      .evaluate((element) => element.getBoundingClientRect().height);
    const initial = await scrollToAndSettle(page, 0);
    let settled = initial;

    for (const scrollY of [0, 60, 95, 130, 200]) {
      settled = await scrollToAndSettle(page, scrollY);

      expect(
        Math.abs(settled.lCenterX - settled.squareCenterX),
        `at scrollY=${scrollY}, L (centre ${settled.lCenterX.toFixed(1)}) should sit on the square's centre (${settled.squareCenterX.toFixed(1)})`,
      ).toBeLessThan(3);
      await expect(page.locator("[data-nav-header-row]")).toHaveCSS(
        "height",
        `${initialHeaderHeight}px`,
      );
    }

    expect(initial.squareTransform).toBe("none");
    expect(settled.squareTransform).not.toBe("none");
    expect(initial.leadingLOpacity).toBeGreaterThan(0.95);
    expect(settled.leadingLOpacity).toBeLessThan(0.05);
    expect(initial.leadingLVisualWidth).toBeGreaterThan(10);
    expect(settled.leadingLVisualWidth).toBeLessThan(1);
    expect(settled.leadingLLayoutWidth).toBe(initial.leadingLLayoutWidth);
    expect(Math.abs(settled.brandWidth - initial.brandWidth)).toBeLessThan(0.5);
    expect(settled.remainderX - settled.squareRight).toBeLessThan(
      initial.remainderX - initial.squareRight,
    );
  });

  test("the lockup returns to its full resting state at the top", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The duplicate wordmark L is intentionally hidden below the desktop breakpoint.",
    );
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await scrollToAndSettle(page, 200);
    const settled = await scrollToAndSettle(page, 0);

    expect(settled.squareTransform).toBe("none");
    expect(settled.leadingLOpacity).toBeGreaterThan(0.95);
    expect(settled.leadingLVisualWidth).toBeGreaterThan(10);
  });

  test("reduced motion keeps the complete current lockup static", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator(ICON_MARK)).toBeVisible();
    await expect(page.locator(LEADING_L)).toBeAttached();
    await expect(page.locator(WORDMARK_REMAINDER)).toBeAttached();

    const initial = await scrollToAndSettle(page, 0);
    const settled = await scrollToAndSettle(page, 200);

    expect(initial.squareTransform).toBe("none");
    expect(settled.squareTransform).toBe("none");
    expect(settled.leadingLOpacity).toBeGreaterThan(0.95);
    expect(
      Math.abs(settled.leadingLVisualWidth - initial.leadingLVisualWidth),
    ).toBeLessThan(0.5);
  });
});
