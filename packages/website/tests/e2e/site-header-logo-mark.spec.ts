import { test, expect, type Page } from "@playwright/test";

/**
 * Header logo mark contract: the scroll-driven icon must keep "L" centred in
 * the square at every point of its scroll transition (0-160px), not just at
 * rest and at the end, and the square must actually rotate.
 *
 * The mark previously paired "L" with a "." that faded and collapsed on
 * scroll. That pairing went through two rounds of alignment bugs - the dot's
 * `opacity`-only fade left stale layout width that pushed "L" off centre
 * (#37), and even after that fix the dot's `vertical-align: baseline`
 * default put it 4-6px above L's own bottom edge instead of resting on it.
 * The dot was dropped entirely rather than chase a third alignment fix: "L"
 * alone, centred, has no second element to misalign against.
 */

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

// The document sets `scroll-behavior: smooth`, so the two-argument
// `window.scrollTo(x, y)` form (which always defers to that CSS property)
// animates over several hundred ms instead of jumping. `behavior: "instant"`
// on the options-object form overrides the CSS and forces one synchronous
// jump. framer-motion also batches the style mutation this triggers into its
// own internal render step rather than writing it inline inside the
// scroll-event callback, so the DOM doesn't reflect the new value until (at
// least) the next animation frame - the double rAF below waits for that.
async function scrollToAndSettle(page: Page, y: number) {
  await page.evaluate((yy) => {
    window.scrollTo({ top: yy, left: 0, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, y);
  return markGeometry(page);
}

test.describe("primary navigation logo mark", () => {
  // No existing spec in this suite asserts on a `useScroll()`/`useTransform()`
  // -driven style (as opposed to an IntersectionObserver-driven `whileInView`
  // reveal, which a11y-reduced-motion.spec.ts covers and explicitly excludes
  // this same hero/nav scroll-linked motion from). Investigating this
  // project's WebKit run: neither a programmatic `scrollTo` + a manually
  // dispatched `scroll` event, nor a real `mouse.wheel` gesture on a desktop
  // (non-mobile) WebKit context, ever produced a change in this mark's
  // rendered `transform` in Playwright's bundled WebKit, headless or headed -
  // while `window.scrollY` itself updated correctly every time. That
  // implicates framer-motion's `useScroll()` reporting to Playwright's WebKit
  // specifically, not this component: every other scroll-driven nav property
  // (icon size, border, wordmark tracking) rides the same MotionValue and
  // would be equally frozen. Chromium and mobile-chromium exercise the real
  // mechanism reliably; skip here rather than assert against geometry that
  // silently never leaves its resting state.
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName === "webkit",
      "useScroll()-driven styles do not update in Playwright's WebKit build here; see comment above.",
    );
  });

  test("L stays centred in the square through the whole scroll transition", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator(ICON_MARK)).toBeVisible();

    let settled: Awaited<ReturnType<typeof scrollToAndSettle>> | null = null;
    for (const scrollY of [0, 60, 95, 130, 200]) {
      settled = await scrollToAndSettle(page, scrollY);

      expect(
        Math.abs(settled.lCenterX - settled.squareCenterX),
        `at scrollY=${scrollY}, L (centre ${settled.lCenterX.toFixed(1)}) should sit on the square's centre (${settled.squareCenterX.toFixed(1)})`,
      ).toBeLessThan(3);
    }
    if (settled === null) throw new Error("unreachable: loop always assigns");

    // The square must actually be rotating at full scroll, not stuck at rest.
    expect(settled.squareTransform).not.toBe("none");
  });

  test("the mark returns cleanly to its resting state when scrolling back to the top", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await scrollToAndSettle(page, 200);
    const g = await scrollToAndSettle(page, 0);

    expect(g.squareTransform).toBe("none");
    expect(Math.abs(g.lCenterX - g.squareCenterX)).toBeLessThan(3);
  });
});
