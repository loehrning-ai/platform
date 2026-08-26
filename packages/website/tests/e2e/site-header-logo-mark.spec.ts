import { test, expect, type Page } from "@playwright/test";

/** Header geometry stays fixed while scrolling so sticky offsets never drift. */

const HOME_LINK = 'nav a[href="/"]';
const ICON_MARK = `${HOME_LINK} > div[aria-hidden="true"]`;

async function markGeometry(page: Page) {
  return page.evaluate((sel) => {
    const square = document.querySelector(sel);
    if (!square) throw new Error(`icon mark not found: ${sel}`);
    const inner = square.querySelector("span");
    if (!inner) throw new Error("L span not found inside mark");

    const range = document.createRange();
    range.selectNodeContents(inner.childNodes[0]);
    const lRect = range.getBoundingClientRect();
    const squareRect = square.getBoundingClientRect();

    return {
      squareCenterX: squareRect.x + squareRect.width / 2,
      squareTransform: getComputedStyle(square).transform,
      lCenterX: lRect.x + lRect.width / 2,
    };
  }, ICON_MARK);
}

async function scrollToAndSettle(page: Page, y: number) {
  await page.evaluate((yy) => {
    window.scrollTo({ top: yy, left: 0, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
  }, y);
  return markGeometry(page);
}

test.describe("primary navigation logo mark", () => {
  test("L and header geometry stay fixed and centred while scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator(ICON_MARK)).toBeVisible();

    const initialHeaderHeight = await page
      .locator("[data-nav-header-row]")
      .evaluate((element) => element.getBoundingClientRect().height);
    let settled: Awaited<ReturnType<typeof scrollToAndSettle>> | null = null;
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
      expect(settled.squareTransform).toBe("none");
    }
  });
});
