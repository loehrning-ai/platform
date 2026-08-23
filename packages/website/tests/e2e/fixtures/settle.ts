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
 * Enough to reach the bottom of every page here, and a hard stop regardless.
 *
 * Deliberately NOT paired with an elapsed-time cutoff. The walk looks like an
 * optimisation for lazy content, but several specs count "Mark as read"
 * buttons, and sections auto-mark as read when scrolled into view — so how far
 * the walk gets is load-bearing. An elapsed cutoff truncated it on a slow
 * WebKit runner and left a section unvisited, which surfaced as an off-by-one
 * button count rather than as anything resembling a timing problem. Bound the
 * walk by steps and by the per-frame budget, never by total elapsed time.
 */
const MAX_SCROLL_STEPS = 60;
/**
 * Must exceed the in-page worst case with room to spare, or the driver cap
 * fires on a page that is merely slow rather than stuck. Worst case is the
 * font budget plus every step costing the full frame budget, ~25s.
 *
 * Raised to 120s because the reflow specs are the heaviest in the suite -- one
 * test walks sixteen routes end to end, and that shard runs 14-18 minutes -- and
 * the cap was firing there while the same walk finishes in seconds everywhere
 * else. This cap exists to turn an unbounded hang into a legible failure, not
 * to enforce a performance budget, and 120s still leaves headroom under the
 * 300s test timeout.
 */
const DRIVER_BUDGET_MS = 120_000;

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
    page,
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
  {
    stepFactor = 0.75,
    framesPerStep = 1,
  }: { stepFactor?: number; framesPerStep?: 1 | 2 } = {},
): Promise<void> {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });

  await cappedWithRetry(
    () => page.evaluate(
      async ([factor, fontBudget, frameBudget, maxSteps, perStep]) => {
        // Frames per scroll step is per-caller because the specs this helper
        // replaced did not agree. The locale specs waited one frame per step;
        // route-claude-responsive and route-ai-native-operator waited two, and
        // standardising them all on one was measured to break the first click
        // after the walk on WebKit (4 of 5 runs). Each call site keeps the
        // cadence it had; only the bounding is new.
        const nextFrame = (frames: 1 | 2 = 1) =>
          new Promise<void>((resolve) => {
            let settled = false;
            const done = () => {
              if (settled) return;
              settled = true;
              resolve();
            };
            if (frames === 2) {
              requestAnimationFrame(() => requestAnimationFrame(done));
            } else {
              requestAnimationFrame(done);
            }
            setTimeout(done, frameBudget);
          });

        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, fontBudget)),
        ]);

        // Publish progress as the walk runs. When this evaluate never returns
        // the driver has no idea whether it stalled on the fonts, on the first
        // frame, or two thirds of the way down a long page, and those have
        // different causes. The driver reads this back on timeout.
        const progress = {
          phase: "fonts" as string,
          steps: 0,
          y: 0,
          scrollHeight: document.documentElement.scrollHeight,
          startedAt: Date.now(),
        };
        (window as unknown as Record<string, unknown>).__settleProgress =
          progress;

        const step = Math.max(320, Math.floor(window.innerHeight * factor));
        progress.phase = "walking";
        for (
          let y = 0, steps = 0;
          y < document.documentElement.scrollHeight && steps < maxSteps;
          y += step, steps++
        ) {
          progress.steps = steps;
          progress.y = y;
          progress.scrollHeight = document.documentElement.scrollHeight;
          // Explicitly instant: the walk wants to place the viewport, not
          // animate to it, and it must not depend on whatever the page's
          // scroll-behavior happens to be.
          window.scrollTo({ top: y, left: 0, behavior: "instant" });
          await nextFrame(perStep);
        }
        progress.phase = "returning";
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        await nextFrame(2);
        progress.phase = "done";
      },
      [
        stepFactor,
        FONT_BUDGET_MS,
        FRAME_BUDGET_MS,
        MAX_SCROLL_STEPS,
        framesPerStep,
      ] as const,
    ),
    "settleWholePage",
    page,
  );
}

/**
 * Run `work` under a driver-side cap so a page that has stopped executing
 * timers fails in seconds with a legible message instead of consuming the
 * whole test budget and reporting an unattributable timeout.
 */
export async function capped<T>(
  work: Promise<T>,
  label: string,
  page?: Page,
): Promise<T> {
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
    // A wedged renderer will not answer this either, so the read is itself
    // raced. Whatever comes back says how far the walk got, which separates a
    // stall in the fonts from one two thirds of the way down a long page.
    const progress = page
      ? await Promise.race([
          page
            .evaluate(
              () =>
                (window as unknown as Record<string, unknown>)
                  .__settleProgress ?? null,
            )
            .catch(() => "unreadable"),
          // 15s, not 2s: under contention a CDP round trip on a busy page can
          // take seconds, so a short race reports 'unreadable' for a page that
          // is merely slow. That is the distinction this read exists to make.
          new Promise((resolve) => setTimeout(() => resolve("unreadable"), 15_000)),
        ])
      : "not captured";
    throw new Error(
      `${label}: the page stopped settling within ${DRIVER_BUDGET_MS}ms; ` +
        `progress=${JSON.stringify(progress)}`,
    );
  }
  return work;
}

/**
 * `capped`, retried once. A settle can lose its execution context to a late
 * client-side navigation, and a runner under memory pressure can stall a
 * renderer for tens of seconds; both recover on a second attempt against the
 * current document. A second failure is reported as what it is.
 */
export async function cappedWithRetry<T>(
  attempt: () => Promise<T>,
  label: string,
  page?: Page,
): Promise<T> {
  try {
    return await capped(attempt(), label, page);
  } catch {
    return await capped(attempt(), label, page);
  }
}
