import { test, expect, type Page } from "@playwright/test";

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

const LANDING = "/kurse/open-source/claude";
const COURSE_PATH = "/kurse/open-source/claude/kurs";
const LESSON_ROUTE = "/kurse/open-source/claude/kurs/mental-model";
const QUIZ_ROUTE = "/kurse/open-source/claude/kurs/quiz";
const CERT_ROUTE = "/kurse/open-source/claude/kurs/zertifikat";
const VERIFY_ROUTE = "/kurse/open-source/claude/verifizierung";

const UNIFIED_KEY = "loehrning-progress-v2";

/** A minimal unified-store payload with claude's workshop quiz passed. */
function passedClaudeState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 3,
    courses: {
      claude: {
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

  test("checkpoint: answering the lesson's first quiz widget correctly awards a checkpoint", async ({
    page,
  }) => {
    const res = await page.goto(LESSON_ROUTE, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);

    // mental-model's "q1" quiz widget (lib/claude-course/lessons/mental-model.ts):
    // option index 2 is the correct answer ("Claude invents a plausible answer
    // that sounds right but isn't grounded."), and CLAUDE_QUIZ_COPY's
    // correctLabel is the English "Correct." (widget-copy.ts).
    await expect(
      page.getByText(
        "You ask Claude, \"which of our microservices has the highest p99 latency?\"",
        { exact: false },
      ),
    ).toBeVisible();

    await page
      .getByText(
        "Claude invents a plausible answer that sounds right but isn't grounded.",
        { exact: false },
      )
      .click();

    await expect(page.getByText("Correct.")).toBeVisible();
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
    await page.goto(`${VERIFY_ROUTE}#${hash}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("QR data read", { exact: true })).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Claude Course/ })).toBeVisible();
    await expect(page.getByText("Certificate code unreadable")).toHaveCount(0);
  });
});
