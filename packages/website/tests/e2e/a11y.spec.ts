/**
 * Public-route accessibility checks: axe WCAG 2.2 AA, 320px reflow, and
 * keyboard focus visibility. Authenticated behavior has a separate fixture.
 * WCAG 2.4.11 is covered by keyboard traversal because axe cannot detect it.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/buecher",
  "/ueber-mich",
  "/ueber-die-plattform",
  "/open-source",
  "/feedback",
  "/demos",
  "/blog",
  "/blog/eu-ai-act-grundlagen",
  "/ai-native",
  "/ki-fuehrerschein",
  "/eu-ai-act-kurs",
  "/ki-und-gesellschaft",
  "/kurse",
  "/ai-native/verifizierung",
  "/impressum",
  "/datenschutz",
];

/**
 * Wait until Framer Motion entrance animations have settled before sampling
 * axe. Mid-fade opacity blends token colours toward the backdrop and reports
 * false color-contrast violations. document.getAnimations() does NOT see
 * framer's rAF-driven tweens, and a single opacity snapshot races hydration
 * (everything still at the SSR'd opacity:0 looks "settled" right before the
 * tweens start). So: after `load`, require three consecutive samples (300ms
 * apart) that are identical and contain no fractional opacity. Elements that
 * stay at 0 (below the fold, whileInView not fired) are skipped by axe —
 * the same content a user cannot see either.
 */
async function settleMotion(page: import("@playwright/test").Page) {
  const sample = () =>
    page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[style*="opacity"]'),
      )
        .map((el) => getComputedStyle(el).opacity)
        .join("|"),
    );
  // 25s: under a fully-parallel local run, hydration (which starts the
  // entrance tweens) alone can take >12s on the heavy routes.
  const deadline = Date.now() + 25_000;
  let prev = "__none__";
  let stable = 0;
  while (Date.now() < deadline) {
    const cur = await sample();
    const fractional = cur
      .split("|")
      .some((o) => {
        const n = parseFloat(o);
        return Number.isFinite(n) && n > 0 && n < 1;
      });
    if (!fractional && cur === prev) {
      stable += 1;
      if (stable >= 2) return; // 3 identical fraction-free samples total
    } else {
      stable = 0;
    }
    prev = cur;
    await page.waitForTimeout(300);
  }
  // Deadline hit: proceed anyway — axe failing loudly beats hanging forever.
}

// ---------------------------------------------------------------------------
// 8a: Axe scans with wcag22aa tag
// ---------------------------------------------------------------------------

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious or critical axe violations`, async ({ page }) => {
    test.setTimeout(90_000); // settleMotion (25s worst) + polled axe scans (20s budget)
    // Audit the reduced-motion variant: perpetual loops (e.g. the /ai-native
    // hero typewriter demo) render their static state, so every pixel axe
    // samples is a settled colour a real user reads. Transform entrances go
    // instant; the remaining opacity tweens are handled by settleMotion().
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "load" });
    await settleMotion(page);

    // Poll the scan to its SETTLED verdict: on slow CI runners axe can
    // sample mid-opacity-fade (framer's reducedMotion config exempts
    // transforms, not opacity tweens), producing contrast flakes whose
    // flagged selectors differ run-to-run. A real contrast bug persists at
    // final state and still fails every retry; a fade flake clears.
    const scanOnce = async () => {
      const results = await new AxeBuilder({ page })
        // 8a: Added wcag22aa tag (accessibility hardening).
        // Note: WCAG 2.4.11 (Focus Not Obscured) is not automatable by axe;
        // it is covered by the keyboard-tab traversal test below ().
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      return results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
    };

    let blocking = await scanOnce();
    const deadline = Date.now() + 20_000;
    while (blocking.length > 0 && Date.now() < deadline) {
      await page.waitForTimeout(1_500);
      blocking = await scanOnce();
    }

    if (blocking.length > 0) {
      console.log(`A11Y violations on ${route}:`);
      for (const v of blocking) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    ${node.target.join(", ")}`);
        }
      }
    }

    expect(blocking, `axe found ${blocking.length} serious/critical violations on ${route}`).toEqual([]);
  });
}

// ---------------------------------------------------------------------------
// Single h1 assertions
// ---------------------------------------------------------------------------

for (const route of ROUTES) {
  test(`a11y: ${route} has exactly one h1`, async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto(route, { waitUntil: "domcontentloaded" });
    // Poll to the SETTLED count: pages with a Suspense-fallback h1 can briefly
    // show fallback + hydrated heading during the swap;
    // assistive tech navigates the settled DOM, which is what we assert.
    await expect
      .poll(async () => page.locator("h1").count(), {
        message: `${route} should settle at exactly one h1`,
        timeout: 10_000,
      })
      .toBe(1);
  });
}

// ---------------------------------------------------------------------------
// 8c: Keyboard-tab focus-not-obscured test (WCAG 2.4.11)
// ---------------------------------------------------------------------------

const KEYBOARD_ROUTES = ["/", "/kurse"] as const;

for (const route of KEYBOARD_ROUTES) {
  test(`a11y: ${route} focused elements not obscured by sticky nav (WCAG 2.4.11)`, async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await page.goto(route, { waitUntil: "load" });

    // Measure the sticky nav height
    const navHeight = await page.evaluate(() => {
      const nav = document.querySelector("nav");
      return nav ? nav.getBoundingClientRect().height : 0;
    });

    // Tab through the first 15 interactive elements and check each is visible
    // below the nav bar. Skip elements that are off-screen (below fold).
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluateHandle(() => document.activeElement);
      const focusedElement = focused.asElement();
      const bbox = await focusedElement?.boundingBox();
      const focusMeta = await focusedElement?.evaluate((el) => {
        const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;
        return {
          inNav: Boolean(el.closest("nav")),
          isSkipLink: href === "#main-content" || /Zum Inhalt/i.test(el.textContent ?? ""),
        };
      });

      if (!bbox) {
        await focused.dispose();
        continue; // off-screen or non-visual element
      }
      if (focusMeta?.inNav || focusMeta?.isSkipLink) {
        await focused.dispose();
        continue;
      }

      // Check element top is not obscured by nav (allow 5px tolerance)
      // An element scrolled into view by the browser after Tab should be >= navHeight
      const isObscured = bbox.y < navHeight - 5;
      expect(
        isObscured,
        `On ${route}: focused element at y=${Math.round(bbox.y)}px is obscured by nav (height=${Math.round(navHeight)}px). WCAG 2.4.11.`,
      ).toBe(false);

      await focused.dispose();
    }
  });
}

// ---------------------------------------------------------------------------
// 8f: Overflow test at 320px (WCAG 1.4.10 Reflow)
// ---------------------------------------------------------------------------

const REFLOW_ROUTES_A11Y = ["/", "/kurse", "/ki-fuehrerschein", "/impressum"] as const;

for (const route of REFLOW_ROUTES_A11Y) {
  test(`a11y: ${route} no horizontal overflow at 320px (WCAG 1.4.10)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(
      scrollWidth,
      `${route}: scrollWidth ${scrollWidth} exceeds 320px at 320px viewport`,
    ).toBeLessThanOrEqual(320);
  });
}
