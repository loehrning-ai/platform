import { test, expect, type Page } from "@playwright/test";
import { COMPLETION_EVIDENCE_CUTOVER_CHECKPOINT_KEY } from "@/lib/progress/types";

/**
 * Data Science Fundamentals golden path: landing ->
 * chapter -> certificate -> QR verify, in one spec. Mirrors
 * route-data-engineering-fundamentals.spec.ts's established pattern, with
 * deliberate differences specific to this course's real architecture:
 *   - the landing route (src/app/kurse/open-source/data-science/page.tsx)
 *     IS the ported Overview chapter itself (Hero + FlowingPipeline +
 *     curriculum grid), not a from-scratch marketing splash and not a
 *     grid of real chapter routes' links. The ported curriculum controls
 *     and "Begin" CTA use semantic anchors for real course routes, so this
 *     spec verifies navigation through the public link contract.
 *   - "home" is never a [chapterSlug] route entry (Done Criteria: no home
 *     route collision) — the first real chapter route is "/fund".
 *   - no quiz leg: each numbered chapter ends in an ephemeral transfer prompt.
 *     Only a meaningful response records the versioned completion checkpoint;
 *     route entry and raw post-cutover completion bits do not count. Historical
 *     pre-cutover completions retain compatibility evidence through migration.
 *   - the certificate/QR-verify seed includes all 12 current evidence
 *     checkpoints with m: "completion" and s: null.
 */

const LANDING = "/en/kurse/open-source/data-science";
const CHAPTER_ROUTE = "/en/kurse/open-source/data-science/fund";
const CERT_ROUTE = "/en/kurse/open-source/data-science/zertifikat";
const VERIFY_ROUTE = "/en/kurse/open-source/data-science/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";
const DS_NUMBERED_CHAPTER_IDS = [
  "fund",
  "explore",
  "clean",
  "feature",
  "model",
  "eval",
  "interp",
  "exp",
  "causal",
  "peek",
  "deploy",
  "cap",
] as const;

const EVIDENCE_CHECKPOINT_ID = "lesson-proof-v1:data-science";

/** A minimal unified-store payload with all 12 evidence checkpoints. */
function allChaptersCompletedDsState() {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    DS_NUMBERED_CHAPTER_IDS.map((id) => [
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
      "data-science": {
        lessons,
        workshopQuiz: { passed: false, score: 0, completedAt: null },
        capstoneSubmitted: false,
        startedAt: now,
        lastActivity: now,
      },
    },
    xp: 50,
    checkpoints: Object.fromEntries(
      DS_NUMBERED_CHAPTER_IDS.map((id) => [
        `${id}::${EVIDENCE_CHECKPOINT_ID}`,
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
  const reference = page.locator("details[data-lesson-reference]");
  await expect(reference).toHaveCount(1);
  await reference.locator("summary").click();
  await expect(reference).toHaveAttribute("open", "");
}

async function isFundChapterEvidenceStored(
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
        parsed.courses?.["data-science"]?.lessons?.fund?.completed === true &&
        parsed.checkpoints?.[checkpointKey] === true &&
        !raw.includes(ephemeralDecision)
      );
    },
    {
      key: UNIFIED_KEY,
      checkpointKey: `fund::${EVIDENCE_CHECKPOINT_ID}`,
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
  c: "data-science";
  v: number;
}): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test.describe("Data Science Fundamentals golden path", () => {
  test("landing: renders the Overview and its Begin CTA navigates into the first chapter", async ({
    page,
  }) => {
    const res = await page.goto(LANDING, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const beginLink = page.getByRole("link", { name: /Begin/ }).first();
    await expect(beginLink).toBeVisible();
    await beginLink.click();
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
    const localChoice = page.getByRole("button", { name: "Continue locally" });
    const ownerChoiceVisible = await localChoice.isVisible().catch(() => false);

    if (ownerChoiceVisible) {
      const ownerHint = page.getByText(
        "Choose account or local progress above first.",
      );
      await expect
        .poll(async () => {
          const gateVisible = await localChoice
            .isVisible()
            .catch(() => false);
          if (!gateVisible) return true;
          return (
            (await decisionInput.isDisabled().catch(() => false)) &&
            (await save.isDisabled().catch(() => false)) &&
            (await ownerHint.isVisible().catch(() => false))
          );
        })
        .toBe(true);
      await continueLocally(page);
      await expect(page.locator("[data-learning-owner-panel]")).toBeHidden({
        timeout: 15_000,
      });
    }

    await expect(decisionInput).toBeEnabled();
    await expect(save).toBeDisabled();
    await decisionInput.fill("blah blah blah blah");
    await expect(save).toBeDisabled();

    const decision = "I will challenge this metric with a counterexample";
    await decisionInput.fill(decision);
    await expect(save).toBeEnabled();
    await save.click();
    await expect
      .poll(() => isFundChapterEvidenceStored(page, decision))
      .toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
      .waitFor({ state: "attached" });
    await continueLocally(page);
    await openLessonReference(page);
    await expect(page.getByText("Navigation checkpoint saved")).toBeVisible();
    await expect(
      page.getByText(/not a mastery assessment or credential/i),
    ).toBeVisible();
  });

  test("certificate: raw post-cutover completion flags do not unlock the record", async ({
    page,
  }) => {
    const postCutover = allChaptersCompletedDsState();
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

  test("certificate: all 12 numbered chapters completed unlocks the public certificate surface", async ({
    page,
  }) => {
    await seedProgress(page, allChaptersCompletedDsState());
    const res = await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await continueLocally(page);
    await expect(page.locator("h1").first()).toBeVisible();

    const name = page.getByRole("textbox", { name: "Full name" });
    await page
      .getByRole("button", { name: "Download Certificate of Completion" })
      .click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAttribute("aria-describedby", "error-name");
    const nameError = page.locator("#error-name");
    await expect(nameError).toBeVisible();
    await expect(nameError).toHaveAttribute("role", "alert");
  });

  test("QR verify: a real completion-mode certificate payload round-trips through the verification page", async ({
    page,
  }) => {
    const hash = encodeCertHash({
      n: "Ada Lovelace",
      s: null,
      m: "completion",
      d: "2026-07-01T10:00:00.000Z",
      c: "data-science",
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
      page.getByRole("heading", { name: /Data Science Fundamentals/ }),
    ).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
