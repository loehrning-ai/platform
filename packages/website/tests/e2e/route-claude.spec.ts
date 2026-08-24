import { test, expect, type Page } from "@playwright/test";
import { CANONICAL_LESSON_IDS } from "../../src/lib/courses/completion";

/**
 * Claude Course golden path: home -> lesson -> checkpoint
 * -> quiz -> certificate -> QR verify, in one spec. Mirrors the established
 * per-course patterns rather than inventing new ones:
 *   - landing/reader smoke: route-ki-fuehrerschein.spec.ts
 *   - quiz/certificate-gate seeding: courses.spec.ts's passedAiNativeState()
 *   - QR verify round trip: cert-verification.spec.ts (claude is also a row
 *     in that file's table-driven COURSES list; this spec additionally walks
 *     the full narrative in one place)
 * Not yet executed in this environment (no Playwright browser install / dev
 * server run as part of this change) — added so CI picks it up going forward.
 */

const LANDING = "/en/kurse/open-source/claude";
const COURSE_PATH = "/en/kurse/open-source/claude/kurs";
const LESSON_ROUTE = "/en/kurse/open-source/claude/kurs/mental-model";
const QUIZ_ROUTE = "/en/kurse/open-source/claude/kurs/quiz";
const CERT_ROUTE = "/en/kurse/open-source/claude/kurs/zertifikat";
const VERIFY_ROUTE = "/en/kurse/open-source/claude/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";

/** A complete unified-store payload with an optional current-format quiz pass. */
function completedClaudeState(quizPassed: boolean) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      claude: {
        lessons: Object.fromEntries(
          CANONICAL_LESSON_IDS.claude.map((lessonId) => [
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

function passedClaudeState() {
  return completedClaudeState(true);
}

async function seedProgress(page: Page, value: object) {
  await page.addInitScript(
    ([key, json]) => {
      window.localStorage.setItem(key, json);
    },
    [UNIFIED_KEY, JSON.stringify(value)] as const,
  );
}

async function continueLocally(page: Page) {
  const button = page.getByRole("button", {
    name: /^(?:Lokal weiterlernen|Continue locally)$/,
  });
  const gateAppeared = await button
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (gateAppeared) {
    await button.click({ timeout: 5_000 }).catch(async (error: unknown) => {
      if (await button.isVisible().catch(() => false)) throw error;
    });
  }
}

async function openLessonReference(page: Page) {
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  await continueLocally(page);
  await expect(page.locator("[data-learning-owner-panel]")).toBeHidden({
    timeout: 15_000,
  });
  const reference = page.locator("details[data-lesson-reference]");
  await expect(reference).toHaveCount(1);
  await expect(reference).toBeVisible();
  await expect(reference).toHaveJSProperty("open", false);
  await reference.locator(":scope > summary").click();
  await expect(reference).toHaveJSProperty("open", true);
}

/** Encode a certificate payload exactly like generateCertificatePdf's QR does. */
function encodeCertHash(payload: {
  n: string;
  s: number;
  m: "quiz";
  d: string;
  c: "claude";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test.describe("Claude Course golden path", () => {
  test("home: landing renders and links into the course hub", async ({
    page,
  }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const startCta = page
      .getByRole("link", { name: /Start|Weitermachen|Kurs/i })
      .first();
    await expect(startCta).toBeVisible();
  });

  test("lesson: the course hub links into the mental-model lesson reader", async ({
    page,
  }) => {
    const res = await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const lessonLink = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(lessonLink).toBeVisible();
    await lessonLink.click();
    await expect(page).toHaveURL(new RegExp(`${LESSON_ROUTE}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("course hub: incomplete learners see requirements without dead-end assessment links", async ({
    page,
  }) => {
    const res = await page.goto(COURSE_PATH, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "locked");
    await expect(assessment.getByText("Quiz locked")).toBeVisible();
    await expect(assessment.getByRole("status")).toContainText(
      "Complete all 12 lessons",
    );
    await expect(assessment.locator(`a[href="${QUIZ_ROUTE}"]`)).toHaveCount(0);
    await expect(assessment.locator(`a[href="${CERT_ROUTE}"]`)).toHaveCount(0);
  });

  test("course hub: completed learners can follow the assessment link into the quiz", async ({
    page,
  }) => {
    await seedProgress(page, completedClaudeState(false));
    await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "ready");
    const startQuiz = assessment.getByRole("link", {
      name: "Start workshop quiz",
    });
    await expect(startQuiz).toHaveAttribute("href", QUIZ_ROUTE);
    await startQuiz.click();
    await expect(page).toHaveURL(new RegExp(`${QUIZ_ROUTE}$`));
    await expect(page.getByTestId("workshop-quiz-header")).toBeVisible();
  });

  test("course hub: passed learners can retake or follow the certificate link", async ({
    page,
  }) => {
    await seedProgress(page, passedClaudeState());
    await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });

    const assessment = page.locator("#final-assessment");
    await expect(assessment).toHaveAttribute("data-assessment-state", "passed");
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

  test("checkpoint: answering the lesson's first quiz widget correctly awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await openLessonReference(page);

    // mental-model's first quick check keeps the stable `mental-model::q1`
    // checkpoint identity even when its reviewed answer copy changes.
    const firstQuestion = page
      .getByRole("radiogroup", { name: "Answer options" })
      .first();
    const correctAnswer = firstQuestion.getByRole("radio", {
      name: /Any specific service claim is ungrounded; request or supply telemetry before accepting an answer\./,
    });
    await expect(correctAnswer).toBeVisible();
    await correctAnswer.click();

    await expect(correctAnswer).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Correct.", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect
      .poll(() =>
        page.evaluate((storageKey) => {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) return false;
          const state = JSON.parse(raw) as {
            checkpoints?: Record<string, boolean>;
          };
          return state.checkpoints?.["mental-model::q1"] === true;
        }, UNIFIED_KEY),
      )
      .toBe(true);
  });

  test("quiz: direct access stays locked until every lesson is complete", async ({
    page,
  }) => {
    const res = await page.goto(QUIZ_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Complete every lesson first" }),
    ).toBeVisible();
  });

  test("quiz: fixed controls stay below the nav and answer feedback manages focus", async ({
    page,
  }) => {
    await seedProgress(page, passedClaudeState());
    const res = await page.goto(QUIZ_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);

    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const quizHeader = page.getByTestId("workshop-quiz-header");
    await expect(nav).toBeVisible();
    await expect(quizHeader).toBeVisible({ timeout: 10_000 });

    const [navBox, quizHeaderBox] = await Promise.all([
      nav.boundingBox(),
      quizHeader.boundingBox(),
    ]);
    expect(navBox).not.toBeNull();
    expect(quizHeaderBox).not.toBeNull();
    expect(quizHeaderBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height);
    await expect(page.getByRole("timer")).toHaveAccessibleName(
      /^Time remaining:/,
    );
    await expect(
      page.getByRole("progressbar", { name: "Question 1 of 19" }),
    ).toBeVisible();

    const controlsAreTopmost = await quizHeader.evaluate((header) =>
      Array.from(
        header.querySelectorAll<HTMLElement>("a, [role='timer']"),
      ).every((control) => {
        const rect = control.getBoundingClientRect();
        const topmost = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return topmost === control || control.contains(topmost);
      }),
    );
    expect(controlsAreTopmost).toBe(true);

    const options = page.getByRole("radio");
    await expect(options.first()).toBeVisible({ timeout: 10_000 });
    await options.first().click();

    await expect(
      page.getByRole("radio", { name: /Correct answer\./ }),
    ).toHaveCount(1);
    await expect(page.getByRole("status")).toHaveText(
      /^(Correct|Not correct)\./,
    );
    const nextButton = page.getByRole("button", {
      name: "Next",
      exact: true,
    });
    await expect(nextButton).toBeFocused();

    const questionHeading = page.locator("h2[id^='workshop-quiz-question-']");
    const firstQuestion = await questionHeading.textContent();
    expect(firstQuestion).not.toBeNull();
    await nextButton.click();
    await expect(questionHeading).not.toHaveText(firstQuestion!);
    await expect(questionHeading).toBeFocused();
    await expect(page.getByRole("status")).toBeEmpty();
  });

  test("certificate: completed lessons plus a passed quiz unlock the surface", async ({
    page,
  }) => {
    await seedProgress(page, passedClaudeState());
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
      s: 92,
      m: "quiz",
      d: "2026-07-01T10:00:00.000Z",
      c: "claude",
      v: 1,
    });
    await page.goto(`${VERIFY_ROUTE}#${hash}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Claude Course/ }),
    ).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
