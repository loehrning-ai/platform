import { test, expect, type Page } from "@playwright/test";

/**
 * The brand lockup is static: the Mennige square with a paper L and the
 * wordmark "loehrning.ai" in the site face. Nothing rotates, collapses or
 * slides on scroll (the Werkzeichnung direction bans rotations and the
 * scroll-driven collapse read as "OEHRNING.AI"), and the fixed-height header
 * keeps its geometry at every scroll position.
 */

const HOME_LINK = 'nav a[href="/"]';
const ICON_MARK = `${HOME_LINK} [data-logo-mark]`;
const WORDMARK = `${HOME_LINK} [data-logo-wordmark]`;

async function lockupGeometry(page: Page) {
  return page.evaluate(
    ([markSelector, wordmarkSelector]) => {
      const square = document.querySelector(markSelector);
      if (!square) throw new Error(`icon mark not found: ${markSelector}`);
      const wordmark = document.querySelector(wordmarkSelector);
      const brandRect = square.closest("a")?.getBoundingClientRect();
      const wordmarkStyle = wordmark ? getComputedStyle(wordmark) : null;
      const header = document.querySelector("[data-nav-header-row]");

      return {
        squareTransform: getComputedStyle(square).transform,
        squareX: square.getBoundingClientRect().x,
        brandWidth: brandRect?.width ?? 0,
        headerHeight: header?.getBoundingClientRect().height ?? 0,
        wordmarkText: wordmark?.textContent ?? "",
        wordmarkVisible: Boolean(
          wordmark && wordmark.getBoundingClientRect().width > 0,
        ),
        wordmarkTransform: wordmarkStyle?.transform ?? "none",
        wordmarkWeight: wordmarkStyle?.fontWeight ?? "",
        wordmarkFamily: wordmarkStyle?.fontFamily ?? "",
        wordmarkTransformText: wordmarkStyle?.textTransform ?? "",
        wordmarkTracking: wordmarkStyle
          ? Number.parseFloat(wordmarkStyle.letterSpacing) /
            Number.parseFloat(wordmarkStyle.fontSize)
          : 0,
      };
    },
    [ICON_MARK, WORDMARK] as const,
  );
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
  return lockupGeometry(page);
}

test.describe("primary navigation brand lockup", () => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`stays static while the page scrolls (reduced motion: ${reducedMotion})`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(ICON_MARK)).toBeVisible();

      const initial = await scrollToAndSettle(page, 0);
      for (const scrollY of [60, 130, 200, 0]) {
        const settled = await scrollToAndSettle(page, scrollY);
        expect(settled.squareTransform, `square at scrollY=${scrollY}`).toBe(
          "none",
        );
        expect(
          settled.wordmarkTransform,
          `wordmark at scrollY=${scrollY}`,
        ).toBe("none");
        expect(
          Math.abs(settled.brandWidth - initial.brandWidth),
          `brand width at scrollY=${scrollY}`,
        ).toBeLessThan(0.5);
        expect(Math.abs(settled.squareX - initial.squareX)).toBeLessThan(0.5);
        expect(settled.headerHeight).toBe(initial.headerHeight);
        expect(settled.wordmarkText).toBe(initial.wordmarkText);
      }
    });
  }

  test("sets the wordmark in the site face, 700, sentence case", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 360,
      "Below 360px the compact bar shows the square alone.",
    );
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const lockup = await lockupGeometry(page);

    expect(lockup.wordmarkVisible).toBe(true);
    expect(lockup.wordmarkText).toBe("loehrning.ai");
    expect(lockup.wordmarkTransformText).toBe("none");
    expect(Number(lockup.wordmarkWeight)).toBe(700);
    expect(lockup.wordmarkFamily).not.toMatch(/Arial Black/i);
    // Headline tracking never below -0.015em.
    expect(lockup.wordmarkTracking).toBeGreaterThanOrEqual(-0.0151);
  });
});
