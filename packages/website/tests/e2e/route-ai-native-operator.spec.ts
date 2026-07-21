import { test, expect, type Page } from "@playwright/test";

/**
 * AI-Native Operator Course golden path (plan 013 stage 13): home -> module
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
const QUIZ_ROUTE = "/kurse/open-source/ai-native-operator/quiz";
const CERT_ROUTE = "/kurse/open-source/ai-native-operator/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/ai-native-operator/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";

/** A minimal unified-store payload with ai-native-operator's workshop quiz passed. */
function passedAiNativeOperatorState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      "ai-native-operator": {
        lessons: {},
        workshopQuiz: { passed: true, score: 90, completedAt: now },
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

  test("module: the module hub links into lesson 1", async ({ page }) => {
    const res = await page.goto(MODULE_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

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

    // mindset/1's exercise (modules/m01-mindset.ts): a reflect-box widget
    // with the source's own prompt text.
    await expect(
      page.getByText("List three tasks you did this week", { exact: false }),
    ).toBeVisible();

    await page.getByRole("textbox").fill("Drafted the weekly status update by hand.");

    await expect(page.getByText("+10 XP")).toBeVisible();
  });

  test("quiz: the workshop quiz route renders without login", async ({ page }) => {
    const res = await page.goto(QUIZ_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("certificate: a locally-passed quiz unlocks the public certificate surface", async ({
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
