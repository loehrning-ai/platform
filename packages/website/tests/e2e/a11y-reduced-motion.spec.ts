import { test, expect, type Page } from "@playwright/test";
import { isKnownBenignConsoleNoise } from "./fixtures/console-noise";
import { revealSweepDeadline, sweepReveals } from "./fixtures/settle";

/**
 * prefers-reduced-motion content-visibility guard (regression coverage).
 *
 * The homepage renders every below-fold reveal in its final visual state on
 * the server, so content visibility never depends on IntersectionObserver.
 * Other routes may still use whileInView. These tests assert the user-visible
 * outcome, not axe rules (a11y.spec.ts already scans /, /buecher): the h1 is
 * visible immediately, homepage content is visible before any scroll, and
 * nothing remains transparent after a full-page sweep. Excluded from the scan:
 * the hero ([data-section="hero"], scroll-linked parallax) and SVG /
 * aria-hidden decoration (infinite loops).
 */

test.use({ contextOptions: { reducedMotion: "reduce" } });
test.describe.configure({ timeout: 60_000 });

const CHAPTER = "/buecher/ki-landschaft/03_reifegrad_ueberblick";
const HOMEPAGE_STATIC_REVEAL_ROOTS =
  '[data-testid="kurse-section"], [data-testid="ressourcen-section"], [data-testid="platform-principles"]';

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[], browserName: string): string[] {
  return errors.filter(
    (error) => !isKnownBenignConsoleNoise(error, browserName),
  );
}

/** Effective opacity of the first `h1`: product of its own + ancestor opacity. */
function firstH1Opacity(page: Page): Promise<number> {
  return page.evaluate(() => {
    let node: Element | null = document.querySelector("h1");
    if (!node) return -1;
    let o = 1;
    while (node) {
      o *= parseFloat(getComputedStyle(node).opacity || "1");
      if (node === document.body) break;
      node = node.parentElement;
    }
    return o;
  });
}

/** Rendered, non-hero, non-decorative opacity elements stuck near-invisible. */
function stuckReveals(page: Page, rootSelector?: string): Promise<string[]> {
  return page.evaluate((selector) => {
    const eff = (node: Element | null): number => {
      let o = 1;
      while (node) {
        o *= parseFloat(getComputedStyle(node).opacity || "1");
        if (node === document.body) break;
        node = node.parentElement;
      }
      return o;
    };
    const roots = selector
      ? Array.from(document.querySelectorAll<HTMLElement>(selector))
      : [];
    const candidates = selector
      ? roots.flatMap((root) => [
          root,
          ...Array.from(root.querySelectorAll<HTMLElement>("*")),
        ])
      : Array.from(
          document.querySelectorAll<HTMLElement>('[style*="opacity"]'),
        );
    return candidates
      .filter((el) => {
        if (el.closest('[data-section="hero"]')) return false; // scroll-linked
        if (el.closest("svg") || el.closest('[aria-hidden="true"]'))
          return false;
        const r = el.getBoundingClientRect();
        return r.width >= 2 && r.height >= 2 && eff(el) < 0.05;
      })
      .map((el) => (el.textContent || el.tagName).trim().slice(0, 60));
  }, rootSelector);
}

/**
 * Step the page top->bottom so every whileInView IntersectionObserver fires.
 *
 * The walk lives in the driver, not in the page: this spec's own copy awaited
 * a `requestAnimationFrame` pair per step, which a backgrounded or occluded
 * Chromium never services, and its fallback timer is clamped to ~1Hz there. It
 * also had no step cap at all. Measured on the chapter route: 11.0s per call
 * under that clamp, against 0.36s on a page that is painting - and this spec
 * calls it twice, which is how it reported `page.evaluate: Test timeout of
 * 60000ms exceeded` at this line. sweepReveals bounds the whole thing with
 * Node timers.
 */
async function fireAllReveals(page: Page, deadline: number): Promise<void> {
  await sweepReveals(page, {
    label: "fireAllReveals",
    // Preserved from the in-page version: it left the viewport at the bottom.
    endAt: "bottom",
    deadline,
  });
}

async function expectReducedMotionHonored(
  page: Page,
  route: string,
  browserName: string,
  headingText?: RegExp,
  expectVisibleBeforeScroll = false,
): Promise<void> {
  const errors = collectConsoleErrors(page);
  await page.goto(route, { waitUntil: "domcontentloaded" });

  // Guard the test itself: the context truly reports reduced motion.
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    "context should honor prefers-reduced-motion: reduce",
  ).toBe(true);

  if (expectVisibleBeforeScroll) {
    const staticRoots = page.locator(HOMEPAGE_STATIC_REVEAL_ROOTS);
    expect(
      await staticRoots.count(),
      `${route}: expected all static homepage reveal sections`,
    ).toBe(3);
    for (let index = 0; index < 3; index += 1) {
      const root = staticRoots.nth(index);
      await expect(
        root,
        `${route}: static homepage section ${index} must occupy visible layout`,
      ).toBeVisible();
      await expect(
        root.getByRole("heading").first(),
        `${route}: static homepage section ${index} heading must be visible`,
      ).toBeVisible();
      const visibilityBlockers = await root.evaluate((element) => {
        const blockers: string[] = [];
        const candidates = [
          element,
          ...Array.from(
            element.querySelectorAll<HTMLElement>(
              "h1, h2, h3, h4, p, a, button, li",
            ),
          ).filter((candidate) => candidate.textContent?.trim()),
        ];

        for (const candidate of candidates) {
          if (
            candidate.closest("svg") ||
            candidate.closest('[aria-hidden="true"]')
          ) {
            continue;
          }

          const rect = candidate.getBoundingClientRect();
          if (
            candidate.getClientRects().length === 0 ||
            rect.width < 2 ||
            rect.height < 2
          ) {
            blockers.push(`${candidate.tagName}: no visible geometry`);
          }

          let node: Element | null = candidate;
          while (node) {
            const style = getComputedStyle(node);
            if (style.display === "none") {
              blockers.push(`${candidate.tagName}: display=none`);
            }
            if (
              style.visibility === "hidden" ||
              style.visibility === "collapse"
            ) {
              blockers.push(
                `${candidate.tagName}: visibility=${style.visibility}`,
              );
            }
            if (style.contentVisibility === "hidden") {
              blockers.push(`${candidate.tagName}: content-visibility=hidden`);
            }
            if (style.clipPath !== "none" && style.clipPath !== "inset(0px)") {
              blockers.push(
                `${candidate.tagName}: clip-path=${style.clipPath}`,
              );
            }
            for (const match of style.filter.matchAll(
              /opacity\(\s*([\d.]+)\s*(%)?\s*\)/g,
            )) {
              const value = Number(match[1]) / (match[2] ? 100 : 1);
              if (Number.isFinite(value) && value < 0.05) {
                blockers.push(`${candidate.tagName}: filter-opacity=${value}`);
              }
            }
            if (node === document.body) break;
            node = node.parentElement;
          }
        }

        return [...new Set(blockers)];
      });
      expect(
        visibilityBlockers,
        `${route}: static homepage section ${index} content must be visibly rendered`,
      ).toEqual([]);
    }
    expect(
      await stuckReveals(page, HOMEPAGE_STATIC_REVEAL_ROOTS),
      `${route}: static homepage content hidden before any scroll`,
    ).toEqual([]);
  }

  // Content visible immediately: the h1 settles to full opacity. Framer keeps
  // opacity tweens under reducedMotion="user", so this converges within the
  // fade and can never stay pinned at 0 (the regression).
  const h1 = page.getByRole("heading", { level: 1 }).first();
  await expect(h1).toBeVisible();
  if (headingText) await expect(h1).toContainText(headingText);
  await expect
    .poll(() => firstH1Opacity(page), {
      timeout: 6000,
      message: `${route}: h1 stuck below full opacity`,
    })
    .toBeGreaterThan(0.99);

  // Below-fold whileInView reveals fire and settle -> nothing stuck invisible.
  // Under heavy machine load the Framer intersection callbacks settle slowly,
  // so fire twice and give the poll a generous window before failing (a real
  // stuck reveal stays stuck across both sweeps; a slow one clears).
  const revealDeadline = revealSweepDeadline();
  await fireAllReveals(page, revealDeadline);
  await fireAllReveals(page, revealDeadline);
  await expect
    .poll(() => stuckReveals(page), {
      timeout: 15_000,
      message: `${route}: opacity reveals stuck invisible`,
    })
    .toEqual([]);

  const noise = meaningfulErrors(errors, browserName);
  expect(noise, `console errors on ${route}\n${noise.join("\n")}`).toEqual([]);
}

test.describe("reduced-motion content visibility", () => {
  test("homepage reveals all resolve to visible", async ({
    page,
    browserName,
  }) => {
    await expectReducedMotionHonored(page, "/", browserName, /KI/, true);
  });

  test("/buecher library reveals all resolve to visible", async ({
    page,
    browserName,
  }) => {
    await expectReducedMotionHonored(page, "/buecher", browserName);
  });

  test("book chapter reader renders fully visible", async ({
    page,
    browserName,
  }) => {
    await expectReducedMotionHonored(
      page,
      CHAPTER,
      browserName,
      /Selbstprüfung/,
    );
  });
});
