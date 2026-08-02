import { test, expect, type Page } from "@playwright/test";

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
 *   - no checkpoint/quiz leg: the learner explicitly marks each numbered
 *     chapter complete after reading it. The chapter leg verifies that action
 *     writes the canonical completion record; route entry alone does not.
 *   - the certificate/QR-verify seeds "all 12 numbered chapters completed"
 *     with m: "completion", s: null, exactly like codex/data-infrastructure/
 *     data-engineering-fundamentals's own no-quiz "completion" eligibility
 *     path.
 */

const LANDING = "/kurse/open-source/data-science";
const CHAPTER_ROUTE = "/kurse/open-source/data-science/fund";
const CERT_ROUTE = "/kurse/open-source/data-science/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/data-science/verifizierung";

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

/** A minimal unified-store payload with all 12 numbered chapters completed. */
function allChaptersCompletedDsState() {
  const now = new Date().toISOString();
  const lessons = Object.fromEntries(
    DS_NUMBERED_CHAPTER_IDS.map((id) => [
      id,
      { sectionsRead: [], quizScore: null, quizTotal: null, completed: true, exercisesCompleted: {} },
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
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("chapter: explicit confirmation marks it completed in the unified progress store", async ({
    page,
  }) => {
    const res = await page.goto(CHAPTER_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);

    await page
      .getByRole("button", { name: "Mark chapter complete" })
      .click();
    await expect
      .poll(async () =>
        page.evaluate((key) => {
          const raw = window.localStorage.getItem(key);
          if (!raw) return false;
          const parsed = JSON.parse(raw) as {
            courses?: Record<string, { lessons?: Record<string, { completed?: boolean }> }>;
          };
          return (
            parsed.courses?.["data-science"]?.lessons?.["fund"]?.completed === true
          );
        }, UNIFIED_KEY),
      )
      .toBe(true);
  });

  test("certificate: all 12 numbered chapters completed unlocks the public certificate surface", async ({
    page,
  }) => {
    await seedProgress(page, allChaptersCompletedDsState());
    const res = await page.goto(CERT_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
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
    await page.goto(`${VERIFY_ROUTE}#${hash}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("Completion path: all lessons finished")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Data Science Fundamentals/ })).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
