import { test, expect, type Page } from "@playwright/test";
import {
  CANONICAL_SECTION_IDS,
  lessonCompletionEvidenceCheckpointId,
} from "../../src/lib/courses/completion";
import { checkpointKey } from "../../src/lib/progress/types";
import { settleFontsAndFrame } from "./fixtures/settle";

/**
 * Codex Course golden path: home -> lesson -> checkpoint
 * -> certificate -> QR verify, in one spec. Mirrors route-claude.spec.ts's
 * established pattern, with two deliberate differences:
 *   - no quiz-route leg: codex has no separate gating quiz (unlike claude),
 * it uses 's generic all-lessons-completed "completion"
 *     eligibility path instead.
 *   - the certificate/QR-verify seeds "all 12 lessons completed" rather
 *     than "workshop quiz passed", and the QR payload uses
 *     m: "completion", s: null (verification-page.tsx's decodeHash rejects
 *     any non-"quiz" mode carrying a non-null score).
 * Not yet executed in this environment as part of writing this spec — the
 * live `/qa` browser pass (this plan's own stage 10) exercises the same
 * flow directly against a running dev server instead.
 */

const LANDING = "/en/kurse/open-source/codex";
const COURSE_PATH = "/en/kurse/open-source/codex/kurs";
const LESSON_ROUTE = "/en/kurse/open-source/codex/kurs/L01";
const FINAL_LESSON_ROUTE = "/en/kurse/open-source/codex/kurs/L12";
const CERT_ROUTE = "/en/kurse/open-source/codex/kurs/zertifikat";
const VERIFY_ROUTE = "/en/kurse/open-source/codex/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";
const CODEX_LESSON_IDS = [
  "L01",
  "L02",
  "L03",
  "L04",
  "L05",
  "L06",
  "L07",
  "L08",
  "L09",
  "L10",
  "L11",
  "L12",
] as const;

const MOBILE_REFLOW_LESSON_IDS = [
  "L03",
  "L04",
  "L06",
  "L07",
  "L08",
  "L12",
] as const;

/** A minimal unified-store payload with selected Codex lessons evidence-backed. */
function completedCodexState(
  completedLessonIds: readonly string[] = CODEX_LESSON_IDS,
) {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    completedLessonIds.map((id) => [
      id,
      {
        sectionsRead: [...CANONICAL_SECTION_IDS.codex[id]],
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
      codex: {
        lessons,
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: now,
        lastActivity: now,
      },
    },
    xp: 50,
    checkpoints: Object.fromEntries(
      completedLessonIds.map((id) => [
        checkpointKey(id, lessonCompletionEvidenceCheckpointId("codex")),
        true,
      ]),
    ),
    badges: {},
    streak: { days: 1, last: now.slice(0, 10) },
    lastActivity: now,
  };
}

async function seedProgress(page: Page, value: object) {
  await page.addInitScript(
    ([key, json]) => {
      // Init scripts run before every document navigation. Seed only the
      // initially empty context so later full-page navigation verifies the
      // progress written by the application instead of replacing it.
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, json);
      }
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

  test("lesson: the course hub links into the L01 lesson reader", async ({
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

  test("checkpoint: answering L01's first quiz widget correctly awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await openLessonReference(page);

    // L01's "q1" quiz widget (lib/codex/lessons/l01-mental-model.ts): option
    // index 1 is correct, and CODEX_QUIZ_COPY's correctLabel is "Correct."
    const correctAnswer = page.getByRole("radio", {
      name: /The task was ambiguous, "refactor auth" spans a huge scope/,
    });
    await expect(correctAnswer).toBeVisible();
    await correctAnswer.click();

    await expect(correctAnswer).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Correct.", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("completion: finishing lesson 12 exposes both certificate pathways and reaches the guarded surface", async ({
    page,
  }) => {
    await seedProgress(
      page,
      completedCodexState(CODEX_LESSON_IDS.slice(0, -1)),
    );
    const res = await page.goto(FINAL_LESSON_ROUTE, {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });
    await openLessonReference(page);

    const uncheckedSections = page.getByRole("button", {
      name: "Confirm section reviewed",
      exact: true,
    });
    const sectionCount = await uncheckedSections.count();
    expect(sectionCount).toBeGreaterThan(0);
    for (let remaining = sectionCount; remaining > 0; remaining -= 1) {
      await uncheckedSections.first().click();
      await expect(uncheckedSections).toHaveCount(remaining - 1);
    }
    await page
      .getByRole("textbox", { name: "Decision or revision" })
      .fill("I will test this change in practice.");
    const saveCheckpoint = page.getByRole("button", {
      name: "Save checkpoint",
    });
    await expect(saveCheckpoint).toBeEnabled();
    await saveCheckpoint.click();
    await expect(
      page.getByText("Navigation checkpoint saved", { exact: true }),
    ).toBeVisible();

    const finalLessonCertificate = page.getByRole("link", {
      // Copy lock updated: English UI copy names completion documents "certificate of participation".
      name: "Open Certificate of Participation",
    });
    await expect(finalLessonCertificate).toHaveAttribute("href", CERT_ROUTE);
    await finalLessonCertificate.click();
    await expect(page).toHaveURL(new RegExp(`${CERT_ROUTE}$`));
    await expect(page.locator("h1").first()).toBeVisible();

    await page.goto(COURSE_PATH, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", {
        name: "Open Certificate of Participation",
      }),
    ).toHaveAttribute("href", CERT_ROUTE);
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
    await page.goto(`${VERIFY_ROUTE}#${hash}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(
      page.getByText("Completion path: all lessons finished"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Codex Course/ }),
    ).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});

test.describe("Codex Course 320px reflow", () => {
  test.use({ viewport: { width: 320, height: 900 } });

  test("wide lesson widgets stay contained without clipping essential content", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const lessonId of MOBILE_REFLOW_LESSON_IDS) {
      await test.step(lessonId, async () => {
        const response = await page.goto(`${COURSE_PATH}/${lessonId}`, {
          waitUntil: "load",
        });
        expect(response?.status()).toBe(200);
        await page
          .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
          .waitFor({ state: "attached" });
        await settleFontsAndFrame(page);
        await openLessonReference(page);

        const geometry = await page.evaluate(() => {
          const viewportTolerance = 1;
          const viewportRight = window.innerWidth + viewportTolerance;
          const uncontained = Array.from(
            document.body.querySelectorAll<HTMLElement>("*"),
          )
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              if (
                style.display === "none" ||
                style.visibility === "hidden" ||
                rect.width <= 0 ||
                rect.height <= 0 ||
                (rect.left >= -viewportTolerance && rect.right <= viewportRight)
              ) {
                return false;
              }

              for (
                let ancestor = element.parentElement;
                ancestor && ancestor !== document.body;
                ancestor = ancestor.parentElement
              ) {
                const ancestorRect = ancestor.getBoundingClientRect();
                const overflowX = getComputedStyle(ancestor).overflowX;
                const isContainedScroller =
                  (overflowX === "auto" || overflowX === "scroll") &&
                  ancestor.scrollWidth >
                    ancestor.clientWidth + viewportTolerance &&
                  ancestorRect.left >= -viewportTolerance &&
                  ancestorRect.right <= viewportRight;
                if (isContainedScroller) return false;
              }

              return true;
            })
            .slice(0, 10)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName.toLowerCase(),
                text:
                  element.textContent
                    ?.trim()
                    .replace(/\s+/g, " ")
                    .slice(0, 80) ?? "",
                left: Math.round(rect.left),
                right: Math.round(rect.right),
              };
            });

          return {
            bodyScrollWidth: document.body.scrollWidth,
            innerWidth: window.innerWidth,
            uncontained,
          };
        });

        expect(
          geometry.bodyScrollWidth,
          `${lessonId}: body scroll width ${geometry.bodyScrollWidth}px exceeds ${geometry.innerWidth}px`,
        ).toBeLessThanOrEqual(geometry.innerWidth + 1);
        expect(
          geometry.uncontained,
          `${lessonId}: elements escape the viewport without an explicit horizontal scroller`,
        ).toEqual([]);
      });
    }
  });
});
