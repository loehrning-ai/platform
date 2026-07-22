import { test, expect, type Page } from "@playwright/test";

/**
 * Data Infrastructure golden path: home -> lesson ->
 * checkpoint -> certificate -> QR verify, in one spec. Mirrors
 * route-codex.spec.ts's established pattern: no quiz-route leg (this course
 * has no separate gating quiz either, it uses 's generic
 * all-lessons-completed "completion" eligibility path), and the
 * certificate/QR-verify seeds "all 12 lessons completed" with
 * m: "completion", s: null.
 *
 * Lesson ids are the course's own bare source slugs ("mental-model", not a
 * "di-" prefix — that prefix only namespaces the checkpoint-ledger lessonId
 * passed into useCheckpoint, not routing/section-tracking, see
 * lib/data-infrastructure/types.ts's checkpointLessonId()).
 */

const LANDING = "/kurse/open-source/data-infrastructure";
const COURSE_PATH = "/kurse/open-source/data-infrastructure/kurs";
const LESSON_ROUTE = "/kurse/open-source/data-infrastructure/kurs/mental-model";
const CERT_ROUTE = "/kurse/open-source/data-infrastructure/kurs/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/data-infrastructure/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";
const DATA_INFRA_LESSON_IDS = [
  "mental-model",
  "cap-pacelc",
  "modeling",
  "storage-formats",
  "lakehouse",
  "partitioning",
  "batch-elt",
  "streaming",
  "cdc-lambda-kappa",
  "idempotency",
  "sla-quality",
  "interview-playbook",
] as const;

/** A minimal unified-store payload with all 12 data-infrastructure lessons completed. */
function allLessonsCompletedDataInfraState() {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    DATA_INFRA_LESSON_IDS.map((id) => [
      id,
      { sectionsRead: [], quizScore: null, quizTotal: null, completed: true, exercisesCompleted: {} },
    ]),
  );
  return {
    schemaVersion: 3,
    courses: {
      "data-infrastructure": {
        lessons,
        workshopQuiz: { passed: false, score: 0, completedAt: null },
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
  s: null;
  m: "completion";
  d: string;
  c: "data-infrastructure";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test.describe("Data Infrastructure golden path", () => {
  test("home: landing renders and links into the course hub", async ({ page }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const startCta = page.getByRole("link", { name: /start|lesson 01/i }).first();
    await expect(startCta).toBeVisible();
  });

  test("lesson: the course hub links into the mental-model lesson reader", async ({ page }) => {
    const res = await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const lessonLink = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(lessonLink).toBeVisible();
    await lessonLink.click();
    await expect(page).toHaveURL(new RegExp(`${LESSON_ROUTE}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("checkpoint: answering mental-model's first quiz widget correctly awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);

    // mental-model's "q1" quiz widget (lib/data-infrastructure/lessons/
    // mental-model.ts): option index 1 is correct, and
    // DATA_INFRA_QUIZ_COPY's correctLabel is "Correct."
    await expect(
      page.getByText("If we lost everything except one of the six layers", { exact: false }),
    ).toBeVisible();

    await page
      .getByText("The log — it's the ordered record of everything that happened.", { exact: false })
      .click();

    await expect(page.getByText("Correct.")).toBeVisible();
  });

  test("certificate: all 12 lessons completed unlocks the public certificate surface", async ({
    page,
  }) => {
    await seedProgress(page, allLessonsCompletedDataInfraState());
    const res = await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("QR verify: a real completion-mode certificate payload round-trips through the verification page", async ({
    page,
  }) => {
    const hash = encodeCertHash({
      n: "Ada Lovelace",
      s: null,
      m: "completion",
      d: "2026-07-01T10:00:00.000Z",
      c: "data-infrastructure",
      v: 1,
    });
    await page.goto(`${VERIFY_ROUTE}#${hash}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("Completion path: all lessons finished")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Data Infrastructure/ })).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
