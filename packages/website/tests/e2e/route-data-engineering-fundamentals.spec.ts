import { test, expect, type Page } from "@playwright/test";
import { COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY } from "@/lib/progress/types";

/**
 * Data Engineering Fundamentals golden path: landing ->
 * chapter -> certificate -> QR verify, in one spec. Mirrors
 * route-codex.spec.ts / route-data-infrastructure.spec.ts's established
 * pattern, with deliberate differences specific to this course's real
 * architecture:
 *   - no separate "kurs" hub route: the landing page itself
 *     (src/app/kurse/open-source/data-engineering-fundamentals/page.tsx) IS
 * the chapter grid — there is no nested `/kurs` route at all (
 *     stage 10 Done Criteria, and stage 14's coursePath fix).
 *   - no quiz leg: each chapter ends in an ephemeral transfer prompt. Only a
 *     meaningful response records the versioned completion checkpoint; route
 *     entry and raw post-cutover completion bits do not count. Historical
 *     pre-cutover completions retain compatibility evidence through migration.
 *   - the certificate/QR-verify seed includes all 12 current evidence
 *     checkpoints with m: "completion" and s: null.
 */

const LANDING = "/en/kurse/open-source/data-engineering-fundamentals";
const CHAPTER_ROUTE =
  "/en/kurse/open-source/data-engineering-fundamentals/home";
const CERT_ROUTE =
  "/en/kurse/open-source/data-engineering-fundamentals/zertifikat";
const VERIFY_ROUTE =
  "/en/kurse/open-source/data-engineering-fundamentals/verifizierung";

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
const EVIDENCE_CHECKPOINT_ID = "lesson-proof-v1:data-engineering-fundamentals";

/** A minimal unified-store payload with all 12 evidence checkpoints. */
function allChaptersCompletedDefState() {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    DEF_CHAPTER_IDS.map((id) => [
      id,
      {
        sectionsRead: [],
        quizScore: null,
        quizTotal: null,
        completed: true,
        exercisesCompleted: {},
      },
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
    checkpoints: Object.fromEntries(
      DEF_CHAPTER_IDS.map((id) => [`${id}::${EVIDENCE_CHECKPOINT_ID}`, true]),
    ),
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

async function continueLocally(page: Page) {
  const button = page.getByRole("button", { name: "Continue locally" });
  const gateAppeared = await button
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (gateAppeared) {
    await button.click({ timeout: 5_000 }).catch(async (error: unknown) => {
      // Ownership resolution can remove the optional gate between the
      // visibility probe and the click. Only that resolved state is success.
      if (await button.isVisible().catch(() => false)) throw error;
    });
    await expect(button).toBeHidden();
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
  await reference.locator("summary").click();
  await expect(reference).toHaveAttribute("open", "");
}

async function isHomeChapterEvidenceStored(
  page: Page,
  decision: string,
): Promise<boolean> {
  return page.evaluate(
    ({ key, checkpointKey, ephemeralDecision }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as {
        courses?: Record<
          string,
          { lessons?: Record<string, { completed?: boolean }> }
        >;
        checkpoints?: Record<string, boolean>;
      };
      return (
        parsed.courses?.["data-engineering-fundamentals"]?.lessons?.home
          ?.completed === true &&
        parsed.checkpoints?.[checkpointKey] === true &&
        !raw.includes(ephemeralDecision)
      );
    },
    {
      key: UNIFIED_KEY,
      checkpointKey: `home::${EVIDENCE_CHECKPOINT_ID}`,
      ephemeralDecision: decision,
    },
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
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("chapter: meaningful transfer evidence records the versioned checkpoint without storing prose", async ({
    page,
  }) => {
    const res = await page.goto(CHAPTER_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await openLessonReference(page);

    const decisionInput = page.getByRole("textbox", {
      name: "Decision or revision",
    });
    const save = page.getByRole("button", { name: "Save checkpoint" });
    await expect(save).toBeDisabled();
    await decisionInput.fill("blah blah blah blah");
    await expect(save).toBeDisabled();

    const decision = "I will test the late-data boundary before release";
    await decisionInput.fill(decision);
    await expect(save).toBeEnabled();
    await save.click();
    await expect
      .poll(() => isHomeChapterEvidenceStored(page, decision), {
        timeout: 10_000,
      })
      .toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await openLessonReference(page);
    await expect(page.getByText("Navigation checkpoint saved")).toBeVisible();
    await expect(
      page.getByText(/not a mastery assessment or credential/i),
    ).toBeVisible();
  });

  test("certificate: raw post-cutover completion flags do not unlock the record", async ({
    page,
  }) => {
    const postCutover = allChaptersCompletedDefState();
    postCutover.checkpoints = {
      [COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY]: true,
    };
    await seedProgress(page, postCutover);
    await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    await continueLocally(page);
    await expect(page).toHaveURL(new RegExp(`${LANDING}$`), {
      timeout: 15_000,
    });
  });

  test("certificate: all 12 chapters completed unlocks the public certificate surface", async ({
    page,
  }) => {
    await seedProgress(page, allChaptersCompletedDefState());
    const res = await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await continueLocally(page);
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
    await page.goto(`${VERIFY_ROUTE}#${hash}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(
      page.getByText("Completion path: all lessons finished"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Data Engineering Fundamentals/ }),
    ).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
