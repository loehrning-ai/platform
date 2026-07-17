import { test, expect, type Page } from "@playwright/test";

/**
 * prefers-reduced-motion content-visibility guard (regression coverage).
 *
 * motion-provider.tsx runs `MotionConfig reducedMotion="user"`: it drops
 * transform/layout tweens but KEEPS opacity tweens and still fires whileInView
 * reveals on scroll. The performance and release hardening/021 regression is a reveal stuck at its
 * initial `opacity: 0` -> content invisible forever. These tests assert that
 * outcome, not axe rules (a11y.spec.ts already scans /, /buecher): the h1 is
 * visible immediately and, after scrolling, every opacity-animated block
 * settles to full effective opacity (read via evaluate, the only way to see
 * framer's rAF values). Excluded from the scan: the hero ([data-section="hero"],
 * scroll-linked parallax) and SVG / aria-hidden decoration (infinite loops).
 */

test.use({ contextOptions: { reducedMotion: "reduce" } });
test.describe.configure({ timeout: 60_000 });

const CHAPTER = "/buecher/ki-landschaft/03_reifegrad_ueberblick";

// Console filter mirrors route-einstieg.spec.ts: drop framework noise, keep
// only errors that signal a genuine page fault.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
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
function stuckReveals(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const eff = (node: Element | null): number => {
      let o = 1;
      while (node) {
        o *= parseFloat(getComputedStyle(node).opacity || "1");
        if (node === document.body) break;
        node = node.parentElement;
      }
      return o;
    };
    return Array.from(document.querySelectorAll<HTMLElement>('[style*="opacity"]'))
      .filter((el) => {
        if (el.closest('[data-section="hero"]')) return false; // scroll-linked
        if (el.closest("svg") || el.closest('[aria-hidden="true"]')) return false;
        const r = el.getBoundingClientRect();
        return r.width >= 2 && r.height >= 2 && eff(el) < 0.05;
      })
      .map((el) => (el.textContent || el.tagName).trim().slice(0, 60));
  });
}

/** Step the page top->bottom so every whileInView IntersectionObserver fires. */
async function fireAllReveals(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await frame();
    }
    window.scrollTo(0, document.body.scrollHeight);
    await frame();
  });
}

async function expectReducedMotionHonored(
  page: Page,
  route: string,
  headingText?: RegExp,
): Promise<void> {
  const errors = collectConsoleErrors(page);
  await page.goto(route, { waitUntil: "domcontentloaded" });

  // Guard the test itself: the context truly reports reduced motion.
  expect(
    await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    "context should honor prefers-reduced-motion: reduce",
  ).toBe(true);

  // Content visible immediately: the h1 settles to full opacity. Framer keeps
  // opacity tweens under reducedMotion="user", so this converges within the
  // fade and can never stay pinned at 0 (the regression).
  const h1 = page.getByRole("heading", { level: 1 }).first();
  await expect(h1).toBeVisible();
  if (headingText) await expect(h1).toContainText(headingText);
  await expect
    .poll(() => firstH1Opacity(page), { timeout: 6000, message: `${route}: h1 stuck below full opacity` })
    .toBeGreaterThan(0.99);

  // Below-fold whileInView reveals fire and settle -> nothing stuck invisible.
  // Under heavy machine load the Framer intersection callbacks settle slowly,
  // so fire twice and give the poll a generous window before failing (a real
  // stuck reveal stays stuck across both sweeps; a slow one clears).
  await fireAllReveals(page);
  await fireAllReveals(page);
  await expect
    .poll(() => stuckReveals(page), { timeout: 15_000, message: `${route}: opacity reveals stuck invisible` })
    .toEqual([]);

  const noise = meaningfulErrors(errors);
  expect(noise, `console errors on ${route}\n${noise.join("\n")}`).toEqual([]);
}

test.describe("reduced-motion content visibility", () => {
  test("homepage reveals all resolve to visible", async ({ page }) => {
    await expectReducedMotionHonored(page, "/", /KI/);
  });

  test("/buecher library reveals all resolve to visible", async ({ page }) => {
    await expectReducedMotionHonored(page, "/buecher");
  });

  test("book chapter reader renders fully visible", async ({ page }) => {
    await expectReducedMotionHonored(page, CHAPTER, /Selbstprüfung/);
  });
});
