import { test, expect, type Page, type Locator } from "@playwright/test";
import { QUESTIONS } from "../../src/lib/ki-check/questions";
import { computeResult } from "../../src/lib/ki-check/scoring";
import { recommend } from "../../src/lib/ki-check/recommend";
import type { Answer } from "../../src/lib/ki-check/types";

/**
 * /standortbestimmung - the KI-Check self-assessment (regression coverage).
 * The single live self-assessment surface (/ki-transformation-check 301-redirects
 * here). Covers smoke + console gate, the ten-question wizard, and mobile reflow.
 * Questions, option text and the expected recommendation are derived from the
 * ki-check lib (the source of truth), so a copy edit updates the assertions while
 * a broken quiz-to-course wiring still fails.
 */

const ROUTE = "/standortbestimmung";

/** First-option answers drive a deterministic run (all score 1 -> foundation). */
const ANSWERS: Answer[] = QUESTIONS.map((q) => ({
  questionId: q.id,
  dimensionId: q.dimensionId,
  score: q.options[0].score,
}));

/** Collect real (non-noise) console + page errors from load onward. */
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
      !/Cannot update a component/i.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

/**
 * Pick the first option, then advance. Wrapped in a retry: an SSR control is
 * actionable before React attaches its handlers (wide hydration window under
 * load), so a first click can be a no-op. Re-selecting the same option is
 * idempotent and the loop stops as soon as the current question leaves.
 */
async function answerAndAdvance(
  option: Locator,
  advance: Locator,
  confirm: () => Promise<unknown>,
): Promise<void> {
  await expect(async () => {
    await option.click();
    await advance.click();
    await confirm();
  }).toPass({ timeout: 30_000 });
}

test.describe("/standortbestimmung", () => {
  test("smoke: loads 200 with an h1 and the first question, no console error", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `status for ${ROUTE}`).toBe(200);
    expect(page.url(), "must not redirect to login").not.toContain("/login");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The client wizard mounted: first question heading + live progress counter.
    await expect(
      page.getByRole("heading", { name: QUESTIONS[0].text }),
    ).toBeVisible();
    await expect(
      page.getByText(`Frage 1 von ${QUESTIONS.length}`),
    ).toBeVisible();

    expect(meaningfulErrors(errors), `console errors on ${ROUTE}`).toEqual([]);
  });

  test("interaction: answering every question reveals the recommended course", async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // Walk the wizard; assert it advances exactly one question per answer.
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const heading = page.getByRole("heading", { name: q.text });
      await expect(heading).toBeVisible();
      await expect(
        page.getByText(`Frage ${i + 1} von ${QUESTIONS.length}`),
      ).toBeVisible();

      const option = page.getByRole("button", {
        name: q.options[0].text,
        exact: true,
      });
      const isLast = i === QUESTIONS.length - 1;
      const advance = page.getByRole("button", {
        name: isLast ? "Zum Ergebnis" : "Weiter",
        exact: true,
      });
      // Confirm the answer landed by waiting for THIS question to leave.
      await answerAndAdvance(option, advance, () =>
        expect(heading).toBeHidden({ timeout: 3_000 }),
      );
    }

    // Result screen carries the course the pure recommender picks for ANSWERS.
    const expected = recommend(computeResult(ANSWERS));
    const main = page.getByRole("main");

    await expect(
      main.getByRole("heading", { level: 3, name: expected.courseTitle }),
    ).toBeVisible();

    const cta = main.getByRole("link", { name: "Kurs starten" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", expected.startHref);

    // Reset returns to question 1 (proves the control is wired, not decorative).
    const reset = main.getByRole("button", { name: "Check nochmal starten" });
    const firstQuestion = page.getByRole("heading", { name: QUESTIONS[0].text });
    await expect(async () => {
      await reset.click();
      await expect(firstQuestion).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await expect(
      page.getByText(`Frage 1 von ${QUESTIONS.length}`),
    ).toBeVisible();
  });

  test("mobile: no horizontal overflow at 390px with the wizard visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: QUESTIONS[0].options[0].text,
        exact: true,
      }),
    ).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: (document.scrollingElement ?? document.documentElement)
        .scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
