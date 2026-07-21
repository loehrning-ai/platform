import { test, expect, type Page } from "@playwright/test";

/**
 * Data Engineering Fundamentals golden path (plan 011 stage 14): landing ->
 * chapter -> certificate -> QR verify, in one spec. Mirrors
 * route-codex.spec.ts / route-data-infrastructure.spec.ts's established
 * pattern, with deliberate differences specific to this course's real
 * architecture:
 *   - no separate "kurs" hub route: the landing page itself
 *     (src/app/kurse/open-source/data-engineering-fundamentals/page.tsx) IS
 *     the chapter grid — there is no nested `/kurs` route at all (plan 011
 *     stage 10 Done Criteria, and stage 14's coursePath fix).
 *   - no checkpoint/quiz leg: grepping the pinned source's chapter files for
 *     a quiz component returns nothing (config.ts's own comment). This
 *     course's completion criterion is literally "all 12 chapters visited"
 *     (MarkChapterVisited, plan 011 stage 11) — so the "checkpoint" leg
 *     below asserts that mounting a chapter route marks it completed in the
 *     unified progress store, not a quiz-answer interaction.
 *   - the certificate/QR-verify seeds "all 12 chapters completed" with
 *     m: "completion", s: null, exactly like codex/data-infrastructure's
 *     own no-quiz "completion" eligibility path.
 */

const LANDING = "/kurse/open-source/data-engineering-fundamentals";
const CHAPTER_ROUTE = "/kurse/open-source/data-engineering-fundamentals/home";
const CERT_ROUTE = "/kurse/open-source/data-engineering-fundamentals/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/data-engineering-fundamentals/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";
const DEF_CHAPTER_IDS = [
  "home",
  "fund",
  "ingest",
  "stream",
  "store",
  "comp",
  "orch",
  "qual",
  "disc",
  "serve",
  "gov",
  "cap",
] as const;

/** A minimal unified-store payload with all 12 chapters completed. */
function allChaptersCompletedDefState() {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    DEF_CHAPTER_IDS.map((id) => [
      id,
      { sectionsRead: [], quizScore: null, quizTotal: null, completed: true, exercisesCompleted: {} },
    ]),
  );
  return {
    schemaVersion: 3,
    courses: {
      "data-engineering-fundamentals": {
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
  c: "data-engineering-fundamentals";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test.describe("Data Engineering Fundamentals golden path", () => {
  test("landing: renders and its chapter grid links directly into the first chapter", async ({
    page,
  }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const chapterLink = page.locator(`a[href="${CHAPTER_ROUTE}"]`).first();
    await expect(chapterLink).toBeVisible();
    await chapterLink.click();
    await expect(page).toHaveURL(new RegExp(`${CHAPTER_ROUTE}$`));
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("chapter: visiting a chapter route marks it completed in the unified progress store", async ({
    page,
  }) => {
    const res = await page.goto(CHAPTER_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);

    // MarkChapterVisited's mount effect (plan 011 stage 11) — no quiz
    // interaction exists for this course, the route visit itself is the
    // completion signal.
    await expect
      .poll(async () =>
        page.evaluate((key) => {
          const raw = window.localStorage.getItem(key);
          if (!raw) return false;
          const parsed = JSON.parse(raw) as {
            courses?: Record<string, { lessons?: Record<string, { completed?: boolean }> }>;
          };
          return (
            parsed.courses?.["data-engineering-fundamentals"]?.lessons?.["home"]?.completed ===
            true
          );
        }, UNIFIED_KEY),
      )
      .toBe(true);
  });

  test("certificate: all 12 chapters completed unlocks the public certificate surface", async ({
    page,
  }) => {
    await seedProgress(page, allChaptersCompletedDefState());
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
      c: "data-engineering-fundamentals",
      v: 1,
    });
    await page.goto(`${VERIFY_ROUTE}#${hash}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("Completion path: all lessons finished")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Data Engineering Fundamentals/ })).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
