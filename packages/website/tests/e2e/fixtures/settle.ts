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
 * Must exceed the in-page worst case with room to spare, or the cap fires on a
 * page that is merely slow rather than stuck. Worst case is the font budget
 * plus every step costing the full frame budget, ~25s.
 *
 * Was briefly raised to 120s on the theory that the heaviest specs were slow
 * rather than blocked. That is now disproven: at 120s, with the progress read
 * raced over 15s, the page still answered nothing. An idle page waiting on a
 * timer would have replied, so the main thread is genuinely not executing and
 * more budget cannot help. Back to 60s -- a stuck page should fail fast.
 */
const DRIVER_BUDGET_MS = 60_000;

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

  await capped(
    page.evaluate(
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
  budgetMs: number = DRIVER_BUDGET_MS,
): Promise<T> {
  // Keep a late rejection from surfacing as an unhandled rejection once the
  // race below has already moved on.
  work.catch(() => {});
  const outcome = await Promise.race([
    work.then(() => "settled" as const),
    new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), budgetMs),
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
      `${label}: the page stopped settling within ${budgetMs}ms; ` +
        `progress=${JSON.stringify(progress)}`,
    );
  }
  return work;
}

/**
 * Total wall-clock budget for a whole reveal sweep, spent by the DRIVER.
 *
 * Sized off the worst case the loop below can actually reach: every one of
 * MAX_REVEAL_STEPS steps finding an unrevealed element in range and paying the
 * settle, i.e. 80 x 120ms = 9.6s. Real pages are nowhere near that - the
 * reader chapter that wedged CI is 4,444px / 11 steps with nothing pending and
 * measures ~20ms, and a synthetic page with four IntersectionObserver
 * entrances over 8,284px measures 894ms. So this is a ceiling on pathology,
 * not a schedule, and it cannot truncate one of today's pages.
 *
 * `exposeAllAuditedContent` sweeps twice against ONE of these budgets, so the
 * whole helper is capped here even in the worst case, well inside its 45s test.
 */
const REVEAL_SWEEP_BUDGET_MS = 10_000;
/**
 * Driver-side pause after a step that still has an unrevealed element in
 * range, so the renderer gets a chance to produce the frame in which
 * IntersectionObserver samples it. A Node timer, deliberately: the page's own
 * timers are the thing that stops being trustworthy.
 */
const REVEAL_STEP_SETTLE_MS = 120;
/**
 * Per-call cap on one synchronous in-page scroll+probe. Nothing inside that
 * call awaits, so a healthy renderer answers in single-digit milliseconds;
 * ten seconds means the main thread is not running tasks at all.
 */
const REVEAL_CALL_BUDGET_MS = 10_000;
/**
 * 80 steps of 0.8 viewports is ~42,000px at the 390x664 mobile viewport. The
 * tallest route any caller audits is /blog/eu-ai-act-grundlagen at 22,324px
 * (43 steps), so this is close to double the real maximum. A page that ever
 * outgrows it stops the walk early rather than looping, and whatever is left
 * hidden below is reported by the caller's verification poll.
 */
const MAX_REVEAL_STEPS = 80;

export interface RevealSweepReport {
  /** Scroll steps actually taken. */
  steps: number;
  /** Steps that found an unrevealed element in range and paused for it. */
  settles: number;
  /** Document height as last reported by the page. */
  scrollHeight: number;
  /** Wall-clock cost of the sweep, driver side. */
  elapsedMs: number;
  /** True when the elapsed budget, not the document, ended the walk. */
  truncated: boolean;
}

/**
 * Walk the document top-to-bottom to fire every IntersectionObserver-backed
 * entrance, with the loop OUTSIDE the page.
 *
 * The in-page version this replaces awaited a `requestAnimationFrame` pair per
 * step with a 250ms `setTimeout` fallback, and was bounded by step count only.
 * Chromium stops servicing rAF on a backgrounded or occluded renderer and
 * clamps its timers to ~1Hz, which turns every 250ms fallback into a full
 * second: measured at 1,003ms per step, so the reader chapter's 11 waits cost
 * 11.0s per sweep and the helper's two sweeps cost 22s. On a contended CI
 * shard it was worse still - one sweep had not finished after 44.5s, which is
 * how a 45s test reported `page.evaluate: Test timeout` with no other symptom.
 * A step cap cannot fix that: the page needs ten steps and the cap was 1,000.
 *
 * So the sweep is bounded by TIME instead, and the clocks are all the
 * driver's. Every in-page call here is synchronous - it scrolls and measures,
 * it never awaits - so it cannot park on a signal the renderer has stopped
 * producing, and each one is `capped` besides, which turns a genuinely wedged
 * renderer into a legible failure in ten seconds instead of an unattributable
 * test timeout. The only waits are Node timers, which no page can throttle.
 *
 * Truncating on the elapsed budget is safe here in a way it is NOT safe in
 * `settleWholePage` (see MAX_SCROLL_STEPS): every caller of this sweep follows
 * it with a poll that FAILS if anything is still hidden, so a short sweep
 * costs a legible assertion failure, never a false pass.
 */
export async function sweepReveals(
  page: Page,
  {
    label = "sweepReveals",
    endAt = "top",
    deadline = Date.now() + REVEAL_SWEEP_BUDGET_MS,
  }: {
    label?: string;
    endAt?: "top" | "bottom";
    deadline?: number;
  } = {},
): Promise<RevealSweepReport> {
  const startedAt = Date.now();

  // Scroll to `top`, then report the document height and whether anything in
  // range is still invisible. Same predicate the callers' verification polls
  // use, so "nothing pending" means the sweep has nothing left to drive.
  const stepAt = (top: number, step: number) =>
    capped(
      page.evaluate((scrollTop: number) => {
        // Explicitly instant. `html` carries `scroll-behavior: smooth` outside
        // reduced motion, and a smooth scroll is advanced by the same frame
        // loop that stops on an occluded page - so the plain two-argument
        // scrollTo the old sweep used could leave the viewport behind.
        window.scrollTo({ top: scrollTop, left: 0, behavior: "instant" });

        const viewport = window.innerHeight;
        const effectiveOpacity = (element: Element): number => {
          let opacity = 1;
          let current: Element | null = element;
          while (current) {
            opacity *= Number.parseFloat(
              getComputedStyle(current).opacity || "1",
            );
            if (current === document.body) break;
            current = current.parentElement;
          }
          return opacity;
        };

        let pending = 0;
        const candidates = document.querySelectorAll<HTMLElement>(
          'h1,h2,h3,h4,h5,h6,p,a,button,label,li,article,section,main,[style*="opacity"]',
        );
        for (const candidate of candidates) {
          const rect = candidate.getBoundingClientRect();
          // Cheap geometry test first; the opacity walk is the expensive part.
          if (rect.width < 2 || rect.height < 2) continue;
          // One viewport above to one below: the band an entrance fires in.
          if (rect.bottom < -viewport || rect.top > viewport * 2) continue;
          if (
            candidate.closest("svg") ||
            candidate.closest('[aria-hidden="true"]') ||
            candidate.closest("[hidden]")
          ) {
            continue;
          }
          if (effectiveOpacity(candidate) < 0.05) pending += 1;
        }

        return {
          scrollHeight: document.documentElement.scrollHeight,
          pending,
        };
      }, top),
      `${label}: scroll step ${step} to y=${top}`,
      undefined,
      REVEAL_CALL_BUDGET_MS,
    );

  const first = await stepAt(0, 0);
  let scrollHeight = first.scrollHeight;
  let pending = first.pending;
  let steps = 1;
  let settles = 0;
  let truncated = false;

  // Reveals mount lazily, so the step is recomputed from the live viewport
  // exactly once, the way the in-page loop did.
  const viewportHeight = await capped(
    page.evaluate(() => window.innerHeight),
    `${label}: viewport height`,
    undefined,
    REVEAL_CALL_BUDGET_MS,
  );
  const step = Math.max(200, Math.floor(viewportHeight * 0.8));

  for (let top = step; top <= scrollHeight; top += step) {
    if (steps >= MAX_REVEAL_STEPS) break;
    if (Date.now() >= deadline) {
      truncated = true;
      break;
    }
    if (pending > 0) {
      settles += 1;
      await page.waitForTimeout(REVEAL_STEP_SETTLE_MS);
    }
    const state = await stepAt(top, steps);
    scrollHeight = state.scrollHeight;
    pending = state.pending;
    steps += 1;
  }

  if (pending > 0) {
    settles += 1;
    await page.waitForTimeout(REVEAL_STEP_SETTLE_MS);
  }
  const bottom = await stepAt(scrollHeight, steps);
  steps += 1;
  if (bottom.pending > 0) {
    settles += 1;
    await page.waitForTimeout(REVEAL_STEP_SETTLE_MS);
  }
  if (endAt === "top") {
    await stepAt(0, steps);
    steps += 1;
  }

  return {
    steps,
    settles,
    scrollHeight,
    elapsedMs: Date.now() - startedAt,
    truncated,
  };
}

/** Budget one whole reveal sweep, shared by callers that sweep more than once. */
export function revealSweepDeadline(): number {
  return Date.now() + REVEAL_SWEEP_BUDGET_MS;
}
