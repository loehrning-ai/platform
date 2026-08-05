import { test, expect, type Page } from "@playwright/test";
import { CANONICAL_LESSON_IDS } from "../../src/lib/courses/completion";

/**
 * AI-Native Operator Course golden path: home -> module
 * -> lesson -> checkpoint -> quiz -> certificate -> QR verify, in one spec.
 * Mirrors route-claude.spec.ts/route-codex.spec.ts's established pattern,
 * with two deliberate differences reflecting this course's own structure:
 *   - module+lesson nesting (no flat lesson-id scheme): routes are
 *     /kurse/open-source/ai-native-operator/[moduleId]/[lessonNum].
 *   - the checkpoint leg exercises a reflect-box widget (this course's most
 *     common exercise kind, 23 of 30) rather than a quiz widget, since
 *     mindset/1 (the course's first lesson) has a reflect-box exercise, not
 *     an embedded per-lesson quiz — the 9 knowledge-check lessons carry the
 *     quiz widgets instead, exercised separately via the /quiz route.
 * Not yet executed in this environment as part of writing this spec — the
 * live `/qa` browser pass (this plan's own stage 13) exercises the same
 * flow directly against a running dev server instead.
 */

const LANDING = "/kurse/open-source/ai-native-operator";
const MODULE_ROUTE = "/kurse/open-source/ai-native-operator/mindset";
const LESSON_ROUTE = "/kurse/open-source/ai-native-operator/mindset/1";
const FINAL_LESSON_ROUTE =
  "/kurse/open-source/ai-native-operator/measurement/4";
const QUIZ_ROUTE = "/kurse/open-source/ai-native-operator/quiz";
const CERT_ROUTE = "/kurse/open-source/ai-native-operator/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/ai-native-operator/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";

/** A canonical lesson-state payload with an optional current-format quiz pass. */
function completedAiNativeOperatorState(
  quizPassed: boolean,
  completedLessons = CANONICAL_LESSON_IDS["ai-native-operator"].length,
) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      "ai-native-operator": {
        lessons: Object.fromEntries(
          CANONICAL_LESSON_IDS["ai-native-operator"]
            .slice(0, completedLessons)
            .map((lessonId) => [
              lessonId,
              {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            ]),
        ),
        workshopQuiz: {
          passed: quizPassed,
          score: quizPassed ? 0.9 : 0,
          completedAt: quizPassed ? now : null,
        },
        capstoneSubmitted: false,
        startedAt: now,
        lastActivity: now,
      },
    },
    xp: 50,
    checkpoints: {},
    badges: {},
    streak: { days: 1, last: now.slice(0, 10) },
    lastActivity: now,
  };
}

function passedAiNativeOperatorState() {
  return completedAiNativeOperatorState(true);
}

async function seedProgress(page: Page, value: object) {
  await page.addInitScript(
    ([key, json]) => {
      window.localStorage.setItem(key, json);
    },
    [UNIFIED_KEY, JSON.stringify(value)] as const,
  );
}

/** Encode a certificate payload exactly like generateCertificatePdf's QR does. */
function encodeCertHash(payload: {
  n: string;
  s: number;
  m: "quiz";
  d: string;
  c: "ai-native-operator";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test.describe("AI-Native Operator Course golden path", () => {
  test("home: landing renders and links into Module 01", async ({ page }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const startCta = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(startCta).toBeVisible();
  });

  test("home: incomplete learners see assessment requirements without gated links", async ({
    page,
  }) => {
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute(
      "data-assessment-state",
      "locked",
    );
    await expect(assessment.getByRole("status")).toContainText(
      "Complete all 39 lessons",
    );
    await expect(assessment.getByText("Quiz locked")).toBeVisible();
    await expect(assessment.locator(`a[href="${QUIZ_ROUTE}"]`)).toHaveCount(0);
    await expect(assessment.locator(`a[href="${CERT_ROUTE}"]`)).toHaveCount(0);
  });

  test("final lesson: continuation cannot bypass an uncompleted final lesson", async ({
    page,
  }) => {
    await seedProgress(
      page,
      completedAiNativeOperatorState(false, 38),
    );
    await page.goto(FINAL_LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('html[data-hydrated="true"]').waitFor();

    await page
      .getByRole("link", { name: "Continue to final assessment" })
      .click();

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute(
      "data-assessment-state",
      "locked",
    );
    await expect(assessment.getByRole("status")).toContainText(
      "1 lesson remaining",
    );
    await expect(assessment.locator(`a[href="${QUIZ_ROUTE}"]`)).toHaveCount(0);
    await expect(assessment.locator(`a[href="${CERT_ROUTE}"]`)).toHaveCount(0);
  });

  test("final lesson: the continuation reaches the anchored assessment and quiz", async ({
    page,
  }) => {
    await seedProgress(page, completedAiNativeOperatorState(false));
    await page.goto(FINAL_LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('html[data-hydrated="true"]').waitFor();

    const continueToAssessment = page.getByRole("link", {
      name: "Continue to final assessment",
    });
    await expect(continueToAssessment).toHaveAttribute(
      "href",
      `${LANDING}#final-assessment`,
    );
    await continueToAssessment.click();
    await expect(page).toHaveURL(
      new RegExp(`${LANDING}#final-assessment$`),
    );

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute(
      "data-assessment-state",
      "ready",
    );
    const startQuiz = assessment.getByRole("link", {
      name: "Start workshop quiz",
    });
    await expect(startQuiz).toHaveAttribute("href", QUIZ_ROUTE);
    await startQuiz.click();
    await expect(page).toHaveURL(new RegExp(`${QUIZ_ROUTE}$`));
    await expect(page.getByTestId("workshop-quiz-header")).toBeVisible();
  });

  test("home: passed learners can retake or follow the certificate link", async ({
    page,
  }) => {
    await seedProgress(page, passedAiNativeOperatorState());
    await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    await page.locator('html[data-hydrated="true"]').waitFor();

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute(
      "data-assessment-state",
      "passed",
    );
    await expect(
      assessment.getByRole("link", { name: "Retake quiz" }),
    ).toHaveAttribute("href", QUIZ_ROUTE);
    const certificate = assessment.getByRole("link", {
      name: "Download Certificate of Completion",
    });
    await expect(certificate).toHaveAttribute("href", CERT_ROUTE);
    await certificate.click();
    await expect(page).toHaveURL(new RegExp(`${CERT_ROUTE}$`));
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("module: the module hub links into lesson 1", async ({ page }) => {
    const res = await page.goto(MODULE_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await page.locator('html[data-hydrated="true"]').waitFor();

    const lessonLink = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(lessonLink).toBeVisible();
    await lessonLink.click();
    await expect(page).toHaveURL(new RegExp(`${LESSON_ROUTE}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("checkpoint: typing into mindset/1's reflect-box exercise awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await page.locator('html[data-hydrated="true"]').waitFor();

    // mindset/1's exercise (modules/m01-mindset.ts): a reflect-box widget
    // with the source's own prompt text.
    await expect(
      page.getByText("List three tasks you did this week", { exact: false }),
    ).toBeVisible();

    // The draft only persists once Auth identity resolves: until then the
    // owner namespace is "unknown" and writes are discarded by design, which
    // also resets the textarea. Retry the entry until it sticks so the
    // checkpoint assertion below measures the widget, not that race.
    const reflectBox = page.getByRole("textbox", { name: "Reflect" });
    await expect(async () => {
      await reflectBox.fill("Drafted the weekly status update by hand.");
      await expect(reflectBox).toHaveValue(
        "Drafted the weekly status update by hand.",
        { timeout: 2_000 },
      );
    }).toPass({ timeout: 15_000 });

    const widgetFrame = page.locator(
      '[data-widget-kind="reflect-box"] [data-widget-frame]',
    );
    await expect(widgetFrame).toHaveAttribute("data-done", "1", {
      timeout: 10_000,
    });
    await expect
      .poll(
        () =>
          page.evaluate((key) => {
            const raw = window.localStorage.getItem(key);
            if (!raw) return false;
            const parsed = JSON.parse(raw) as {
              checkpoints?: Record<string, boolean>;
            };
            return parsed.checkpoints?.["mindset/1::exercise"] === true;
          }, UNIFIED_KEY),
        { timeout: 10_000 },
      )
      .toBe(true);
  });

  test("quiz: direct access stays locked until every lesson is complete", async ({ page }) => {
    const res = await page.goto(QUIZ_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Complete every lesson first" }),
    ).toBeVisible();
  });

  test("certificate: completed lessons plus a passed quiz unlock the surface", async ({
    page,
  }) => {
    await seedProgress(page, passedAiNativeOperatorState());
    const res = await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("QR verify: a real certificate payload round-trips through the verification page", async ({
    page,
  }) => {
    const hash = encodeCertHash({
      n: "Ada Lovelace",
      s: 91,
      m: "quiz",
      d: "2026-07-21T10:00:00.000Z",
      c: "ai-native-operator",
      v: 1,
    });
    await page.goto(`${VERIFY_ROUTE}#${hash}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByRole("heading", { name: /The AI-Native Operator/ })).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
