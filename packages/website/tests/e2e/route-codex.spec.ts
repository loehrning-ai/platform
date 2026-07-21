import { test, expect, type Page } from "@playwright/test";

/**
 * Codex Course golden path (plan 009 stage 8): home -> lesson -> checkpoint
 * -> certificate -> QR verify, in one spec. Mirrors route-claude.spec.ts's
 * established pattern, with two deliberate differences:
 *   - no quiz-route leg: codex has no separate gating quiz (unlike claude),
 *     it uses plan 007 stage 4's generic all-lessons-completed "completion"
 *     eligibility path instead.
 *   - the certificate/QR-verify seeds "all 12 lessons completed" rather
 *     than "workshop quiz passed", and the QR payload uses
 *     m: "completion", s: null (verification-page.tsx's decodeHash rejects
 *     any non-"quiz" mode carrying a non-null score).
 * Not yet executed in this environment as part of writing this spec — the
 * live `/qa` browser pass (this plan's own stage 10) exercises the same
 * flow directly against a running dev server instead.
 */

const LANDING = "/kurse/open-source/codex";
const COURSE_PATH = "/kurse/open-source/codex/kurs";
const LESSON_ROUTE = "/kurse/open-source/codex/kurs/L01";
const CERT_ROUTE = "/kurse/open-source/codex/kurs/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/codex/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";
const CODEX_LESSON_IDS = [
  "L01", "L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12",
] as const;

/** A minimal unified-store payload with all 12 codex lessons completed. */
function allLessonsCompletedCodexState() {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    CODEX_LESSON_IDS.map((id) => [
      id,
      { sectionsRead: [], quizScore: null, quizTotal: null, completed: true, exercisesCompleted: {} },
    ]),
  );
  return {
    schemaVersion: 3,
    courses: {
      codex: {
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
  c: "codex";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test.describe("Codex Course golden path", () => {
  test("home: landing renders and links into the course hub", async ({ page }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const startCta = page
      .getByRole("link", { name: /Start|Weitermachen|Kurs/i })
      .first();
    await expect(startCta).toBeVisible();
  });

  test("lesson: the course hub links into the L01 lesson reader", async ({ page }) => {
    const res = await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const lessonLink = page.locator(`a[href="${LESSON_ROUTE}"]`).first();
    await expect(lessonLink).toBeVisible();
    await lessonLink.click();
    await expect(page).toHaveURL(new RegExp(`${LESSON_ROUTE}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("checkpoint: answering L01's first quiz widget correctly awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);

    // L01's "q1" quiz widget (lib/codex/lessons/l01-mental-model.ts): option
    // index 1 is correct, and CODEX_QUIZ_COPY's correctLabel is "Correct."
    await expect(
      page.getByText('You open a Codex task: "refactor our auth module."', {
        exact: false,
      }),
    ).toBeVisible();

    await page
      .getByText(
        "The task was ambiguous",
        { exact: false },
      )
      .click();

    await expect(page.getByText("Correct.")).toBeVisible();
  });

  test("certificate: all 12 lessons completed unlocks the public certificate surface", async ({
    page,
  }) => {
    await seedProgress(page, allLessonsCompletedCodexState());
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
      c: "codex",
      v: 1,
    });
    await page.goto(`${VERIFY_ROUTE}#${hash}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("Completion path: all lessons finished")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Codex Course/ })).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
