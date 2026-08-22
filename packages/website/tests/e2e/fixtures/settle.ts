import type { Page } from "@playwright/test";

/**
 * Neither signal a layout settle depends on is guaranteed to arrive.
 *
 * `document.fonts.ready` stays pending on a font that never resolves, and
 * `requestAnimationFrame` does not fire *at all* on a backgrounded or occluded
 * page — the normal state of a CI shard that has lost the foreground. An
 * unraced `await` therefore parks the whole test inside one `page.evaluate`
 * until its budget runs out, so a spec that finishes in ten seconds locally
 * reports a 300s timeout on CI with no other symptom.
 *
 * Every wait below races its signal against a timer. The call is capped from
 * the driver side as well, because a renderer that has stopped running timers
 * cannot rescue itself from the inside: bounding only the in-page waits was
 * measured to be insufficient.
 */

/** A font that has not swapped in within this budget is not going to. */
const FONT_BUDGET_MS = 10_000;
/** Two frames at 60Hz is ~32ms; 250ms is slack for a loaded runner. */
const FRAME_BUDGET_MS = 250;
/**
 * The walk stops here regardless of how far down the page it has reached.
 * A step budget alone is not enough: when frames are starved every step costs
 * the full frame budget, so 60 steps can burn 15s on their own.
 */
const WALK_BUDGET_MS = 10_000;
/** Enough to reach the bottom of every page here, and a hard stop regardless. */
const MAX_SCROLL_STEPS = 60;
/**
 * Must exceed the in-page worst case with room to spare, or the driver cap
 * fires on a page that is merely slow rather than stuck. Worst case is the
 * font budget plus the walk budget plus a final frame; this is roughly double.
 */
const DRIVER_BUDGET_MS = 45_000;

/**
 * Wait for the webfont to settle and for layout to be painted, so geometry
 * measured afterwards reflects the final face rather than the fallback's wider
 * metrics.
 */
export async function settleFontsAndFrame(page: Page): Promise<void> {
  await capped(
    page.evaluate(
      async ([fontBudget, frameBudget]) => {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, fontBudget)),
        ]);
        await new Promise<void>((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          requestAnimationFrame(() => requestAnimationFrame(done));
          setTimeout(done, frameBudget);
        });
      },
      [FONT_BUDGET_MS, FRAME_BUDGET_MS] as const,
    ),
    "settleFontsAndFrame",
  );
}

/**
 * Walk the whole document once so lazy content mounts and images start
 * loading, then return to the top. Six specs carried a private copy of this,
 * differing only in the step factor and their formatting; all six shared the
 * unbounded waits described above.
 *
 * The walk is bounded as well as the waits: lazy content can extend
 * `scrollHeight` while the loop consumes it, so the exit condition alone is
 * not a guarantee of termination.
 */
export async function settleWholePage(
  page: Page,
  { stepFactor = 0.75 }: { stepFactor?: number } = {},
): Promise<void> {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });

  await capped(
    page.evaluate(
      async ([factor, fontBudget, frameBudget, maxSteps, walkBudget]) => {
        const startedAt = Date.now();
        const nextFrame = () =>
          new Promise<void>((resolve) => {
            let settled = false;
            const done = () => {
              if (settled) return;
              settled = true;
              resolve();
            };
            requestAnimationFrame(() => requestAnimationFrame(done));
            setTimeout(done, frameBudget);
          });

        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, fontBudget)),
        ]);

        const step = Math.max(320, Math.floor(window.innerHeight * factor));
        for (
          let y = 0, steps = 0;
          y < document.documentElement.scrollHeight && steps < maxSteps;
          y += step, steps++
        ) {
          // Elapsed time, not just step count: on a runner where frames are
          // starved each step costs the full frame budget, and the walk is an
          // optimisation for lazy content, not a correctness requirement.
          if (Date.now() - startedAt > walkBudget) break;
          window.scrollTo(0, y);
          await nextFrame();
        }
        window.scrollTo(0, 0);
        await nextFrame();
      },
      [
        stepFactor,
        FONT_BUDGET_MS,
        FRAME_BUDGET_MS,
        MAX_SCROLL_STEPS,
        WALK_BUDGET_MS,
      ] as const,
    ),
    "settleWholePage",
  );
}

/**
 * Run `work` under a driver-side cap so a page that has stopped executing
 * timers fails in seconds with a legible message instead of consuming the
 * whole test budget and reporting an unattributable timeout.
 */
export async function capped<T>(work: Promise<T>, label: string): Promise<T> {
  // Keep a late rejection from surfacing as an unhandled rejection once the
  // race below has already moved on.
  work.catch(() => {});
  const outcome = await Promise.race([
    work.then(() => "settled" as const),
    new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), DRIVER_BUDGET_MS),
    ),
  ]);
  if (outcome === "timeout") {
    throw new Error(
      `${label}: the page stopped settling within ${DRIVER_BUDGET_MS}ms`,
    );
  }
  return work;
}
