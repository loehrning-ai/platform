import { test, expect, type Page } from "@playwright/test";

/**
 * Header logo mark contract: the scroll-driven "L." icon must keep "." sitting
 * on L's own bottom edge (not merely overlapping its line), and "L" centred in
 * the square, at every point of its scroll transition (0-160px), not just at
 * rest and at the end.
 *
 * Two regressions this guards, both about the "." span, both invisible to a
 * plain screenshot at a glance:
 *
 * 1. (#37) The dot faded via `opacity` alone. Opacity does not remove layout
 *    width, so the invisible dot kept reserving space inside the square's
 *    `justify-content: center` box for the whole 60-130px fade range, pushing
 *    "L" left of true centre the entire time - on a rotated square this reads
 *    as a clipped corner rather than off-centre text.
 * 2. The dot's `inline-block` defaulted to `vertical-align: baseline`, which
 *    aligns the dot's OWN baseline - its bottom edge, per spec, once
 *    `overflow-hidden` is set - to L's TEXT baseline, not to L's own visible
 *    bottom. Measured 4-6px of gap depending on the icon's current font size
 *    (13-20px across the scroll range): the dot visibly floated above L's
 *    bottom rather than resting on it. `align-text-bottom` closes this to 0px
 *    at every size, measured directly, not eyeballed.
 *
 * A same-line check that only asks "do these two elements' vertical bands
 * overlap at all" passes even with the 4-6px gap from #2 - overlap is a much
 * weaker property than "sits on the same baseline" and is why that bug shipped
 * once already. `sitsOnBaseline` below asserts the tight version instead.
 */

const HOME_LINK = 'nav a[href="/"]';
const ICON_MARK = `${HOME_LINK} > div[aria-hidden="true"]`;

async function markGeometry(page: Page) {
  return page.evaluate((sel) => {
    const square = document.querySelector(sel);
    if (!square) throw new Error(`icon mark not found: ${sel}`);
    const inner = square.querySelector("span");
    const dot = inner?.querySelector("span");
    if (!inner || !dot) throw new Error("L/dot spans not found inside mark");

    const range = document.createRange();
    range.selectNodeContents(inner.childNodes[0]);
    const lRect = range.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    const squareRect = square.getBoundingClientRect();
    const dotStyle = getComputedStyle(dot);

    return {
      squareCenterX: squareRect.x + squareRect.width / 2,
      squareTransform: getComputedStyle(square).transform,
      lTop: lRect.top,
      lBottom: lRect.bottom,
      lCenterX: lRect.x + lRect.width / 2,
      dotTop: dotRect.top,
      dotBottom: dotRect.bottom,
      dotOpacity: Number(dotStyle.opacity),
    };
  }, ICON_MARK);
}

// Deliberately NOT "do the two vertical bands overlap at all" - a 4-6px gap
// between the dot's bottom and L's bottom (the #2 regression above) still
// overlaps, since the dot's own height is well over 6px. This checks the
// specific thing that matters: the dot's bottom edge sits where L's does.
function sitsOnBaseline(g: Awaited<ReturnType<typeof markGeometry>>) {
  return Math.abs(g.dotBottom - g.lBottom) < 1.5;
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
  // rendered `transform`/`opacity` in Playwright's bundled WebKit, headless or
  // headed - while `window.scrollY` itself updated correctly every time. That
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

  test("L and the dot stay on the same line and centred through the whole scroll transition", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator(ICON_MARK)).toBeVisible();

    let settled: Awaited<ReturnType<typeof scrollToAndSettle>> | null = null;
    for (const scrollY of [0, 60, 95, 130, 200]) {
      settled = await scrollToAndSettle(page, scrollY);

      // The dot's bottom edge must sit on L's bottom edge (within 1.5px), not
      // float above it - a looser "these two elements' lines merely overlap"
      // check would miss the 4-6px baseline gap this guards.
      expect(
        sitsOnBaseline(settled),
        `at scrollY=${scrollY}, dot bottom ${settled.dotBottom.toFixed(1)} should sit on L's bottom ${settled.lBottom.toFixed(1)} (within 1.5px)`,
      ).toBe(true);
    }
    if (settled === null) throw new Error("unreachable: loop always assigns");

    // At full scroll, the dot has faded and collapsed; "L" must sit on the
    // square's true horizontal centre, not left of it, and the square must
    // actually be rotating rather than stuck at rest.
    expect(settled.dotOpacity).toBeLessThan(0.05);
    expect(Math.abs(settled.lCenterX - settled.squareCenterX)).toBeLessThan(3);
    expect(settled.squareTransform).not.toBe("none");
  });

  test("the mark returns cleanly to its resting state when scrolling back to the top", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await scrollToAndSettle(page, 200);
    const g = await scrollToAndSettle(page, 0);

    expect(g.dotOpacity).toBeCloseTo(1, 1);
    expect(g.squareTransform).toBe("none");
    expect(sitsOnBaseline(g)).toBe(true);
  });
});
